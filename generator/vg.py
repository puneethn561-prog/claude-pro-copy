"""claude-pro-copy generator: the "Claude does the creative work" part, done by a free LLM (GitHub Models).

  python generator/vg.py script  <proj> "<topic>" [--offline]   -> <proj>/script.json   (prompts/script.md rules)
  python generator/vg.py shots   <proj> [--style tall-tale] [--offline] [--safe]  -> <proj>/data/plan.json + src/shots.js
  python generator/vg.py kit     <proj> <video.mp4> <outdir>    -> upload-kit folder (derick-apps autopost format)

LLM: GitHub Models (OpenAI-compatible) at https://models.github.ai/inference, token = $GITHUB_TOKEN (Actions:
permissions models: read). Model = $VG_MODEL (default openai/gpt-4.1-mini), fallback $VG_FALLBACK_MODEL.
No token / --offline -> deterministic template, so the pipeline can be tested without any LLM.
"""
import argparse, json, os, random, re, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENDPOINT = os.environ.get('VG_ENDPOINT', 'https://models.github.ai/inference/chat/completions')
MODEL = os.environ.get('VG_MODEL', 'openai/gpt-4.1-mini')
FALLBACK = os.environ.get('VG_FALLBACK_MODEL', 'openai/gpt-4o-mini')
VOICE, SPEED = os.environ.get('VG_VOICE', 'am_fenrir'), 1.0

SETS = {'street', 'street_dusk', 'meadow', 'meadow_sunset', 'meadow_night', 'beach', 'beach_sunset', 'beach_night', 'space', 'shop', 'office', 'home', 'lab', 'classroom'}
CAMS = {'wide', 'aerial', 'crane_down', 'push_in', 'close_up', 'low_angle', 'orbit', 'over_shoulder', 'track', 'pov', 'sky'}
ACTIONS = {'stand', 'walk', 'run', 'talk', 'point', 'wave', 'shrug', 'cheer', 'think', 'facepalm', 'panic', 'present', 'cross', 'jump', 'sit', 'lean'}
MOODS = {'neutral', 'smug', 'happy', 'laugh', 'shock', 'worried', 'angry', 'sad', 'sly', 'proud', 'tired', 'dizzy'}
HATS = {'none', 'cap', 'bowler', 'boater', 'beanie', 'visor', 'tophat', 'bun', 'flower', 'bow', 'mailcap'}
NECKS = {'none', 'bowtie', 'tie', 'scarf', 'collar'}
PATTERNS = {'plain', 'check', 'stripes', 'overalls', 'vest', 'apron'}
EXTRAS = {'mustache', 'glasses', 'freckles', 'blush', 'pencil', 'monocle'}
SKINS = {'light', 'medium', 'dark', 'tan'}
HOLDS = {'paper', 'book', 'sign', 'cup', 'key', 'cash', 'ticket', 'mirror', 'letters'}
HEX = re.compile(r'^#[0-9A-Fa-f]{6}$')
norm = lambda w: re.sub(r"[^a-z0-9']+", '', str(w).lower())


# ───────────────────────────── LLM ─────────────────────────────
def llm(system, user, model=None, temperature=0.8, max_tokens=3500):
    tok = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_MODELS_TOKEN')
    if not tok: raise RuntimeError('no GITHUB_TOKEN for GitHub Models')
    last = None
    for m in [model or MODEL, FALLBACK]:
        for attempt in range(3):
            body = json.dumps({'model': m, 'temperature': temperature, 'max_tokens': max_tokens, 'response_format': {'type': 'json_object'},
                               'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}]}).encode()
            req = urllib.request.Request(ENDPOINT, body, {'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json', 'Accept': 'application/json'})
            try:
                with urllib.request.urlopen(req, timeout=180) as r: d = json.load(r)
                txt = d['choices'][0]['message']['content']
                print(f'[llm] {m} ok ({d.get("usage", {})})', file=sys.stderr)
                return parse_json(txt)
            except urllib.error.HTTPError as e:
                last = f'{m}: HTTP {e.code} {e.read()[:300]!r}'; print('[llm]', last, file=sys.stderr)
                if e.code == 429: time.sleep(min(60, 10 * (attempt + 1))); continue
                break
            except Exception as e:
                last = f'{m}: {e}'; print('[llm]', last, file=sys.stderr); time.sleep(3)
    raise RuntimeError(f'LLM failed: {last}')


def parse_json(txt):
    txt = txt.strip(); txt = re.sub(r'^```(json)?|```$', '', txt, flags=re.M).strip()
    i, j = txt.find('{'), txt.rfind('}')
    return json.loads(txt[i:j + 1])


# ───────────────────────────── script ─────────────────────────────
def validate_script(S):
    """returns list of problems (empty = ok). Mirrors the skill's hard limits."""
    p = []
    lines = S.get('lines') or []
    if not isinstance(lines, list) or not (6 <= len(lines) <= 22): p.append(f'need 6-22 lines, got {len(lines) if isinstance(lines, list) else 0}')
    words = sum(len(str(l.get('text', '')).split()) for l in lines if isinstance(l, dict))
    if not (70 <= words <= 160): p.append(f'need 70-160 words (90-130 ideal), got {words}')
    if lines and isinstance(lines[0], dict) and str(lines[0].get('text', '')).strip().endswith('?'): p.append('line 1 must be a statement (payoff first), not a question')
    for i, l in enumerate(lines):
        if not isinstance(l, dict) or not str(l.get('text', '')).strip(): p.append(f'line {i} has no text'); continue
        if len(l['text'].split()) > 26: p.append(f'line {i} too long ({len(l["text"].split())} words); split it')
        if l.get('caps') is not None and not isinstance(l.get('caps'), str): p.append(f'line {i} caps must be a string')
    if not S.get('title'): p.append('missing title')
    return p


def finalize_script(S, topic):
    S['voice'], S['speed'] = VOICE, SPEED                      # user's standing choice: am_fenrir at normal speed
    S.setdefault('lead', 0.15); S.setdefault('outro', 0.4); S.setdefault('gap', 0.2)
    m = S.get('music');
    if not isinstance(m, dict) or m.get('mood') not in {'playful', 'wonder', 'tension', 'epic', 'chill', 'sad'}: S['music'] = {'mood': 'wonder', 'seed': random.randint(1, 10 ** 6)}
    else: S['music']['seed'] = int(m.get('seed') or random.randint(1, 10 ** 6))
    S['topic'] = topic
    S.setdefault('sources', []); S['sources_note'] = 'Listed by the LLM from memory - NOT verified by a web search. Check before posting.'
    for l in S['lines']:
        l['text'] = re.sub(r'\s+', ' ', l['text']).strip()
        if l.get('caps') and len([c for c in l['caps'].split('|') if c.strip()]) < 1: l.pop('caps')
    return S


def offline_script(topic):
    t = topic.rstrip('?').strip()
    subj = re.sub(r'^(what if|what happens if|why|how)\s+', '', t, flags=re.I)
    lines = [f"Overnight, {subj}, and the whole planet noticed by breakfast.", "And Leo, a fisherman, is about to find out why it matters.",
             "He walks down to the beach at sunrise,", "but the sea looks strangely flat and quiet.", "His neighbour Max just laughs at him.",
             "Relax, it's only one night, nothing changes!", "But then the tide doesn't come back in,", "so the boats stay stuck in the sand all morning.",
             "Wait, what?", "You see, it works like a giant pulling a blanket back and forth,", "and when that pull vanishes, the oceans settle down,",
             "nights get much darker, and the days slowly change length.", "So Max stops laughing and grabs a shovel,",
             f"while Leo just looks up and says, that's why {subj} matters overnight."]
    return {'title': t.title(), 'music': {'mood': 'wonder', 'seed': random.randint(1, 10 ** 6)}, 'sources': ['offline template - no facts checked'], 'lines': [{'text': x} for x in lines]}


def cmd_script(proj, topic, offline=False):
    P = Path(proj); P.mkdir(parents=True, exist_ok=True)
    system = (ROOT / 'prompts/script.md').read_text()
    S, problems = None, []
    if not offline:
        user = f'Topic: {topic}\nWrite the script now. Return JSON only.'
        for attempt in range(3):
            try:
                S = llm(system, user if not problems else user + '\n\nYour previous draft had these problems, fix them:\n- ' + '\n- '.join(problems) + '\n\nPrevious draft:\n' + json.dumps(S)[:3000])
                problems = validate_script(S)
                if not problems: break
                print('[script] problems:', problems, file=sys.stderr)
            except Exception as e:
                print('[script] LLM error:', e, file=sys.stderr); problems = [str(e)]; S = None
    if S is None or validate_script(S):
        print('[script] using OFFLINE template (LLM unavailable or invalid)', file=sys.stderr); S = offline_script(topic)
    S = finalize_script(S, topic)
    (P / 'script.json').write_text(json.dumps(S, indent=1, ensure_ascii=False))
    print(f'script.json: {S["title"]} · {len(S["lines"])} lines · {sum(len(l["text"].split()) for l in S["lines"])} words')
    return S


# ───────────────────────────── shot plan ─────────────────────────────
def clean_plan(plan, S):
    """coerce the LLM plan into the allowed vocabulary; drop what can't be fixed. Returns (plan, warnings)."""
    warn = []; lines = S['lines']; n = len(lines)
    cast = []
    for i, c in enumerate((plan.get('cast') or [])[:4]):
        if not isinstance(c, dict) or not c.get('id'): continue
        body = c.get('body') if HEX.match(str(c.get('body', ''))) and str(c.get('body')).upper() not in ('#FFFFFF', '#FAFAFA') else ['#3C6FB6', '#D8584A', '#5FA39A', '#F2C230'][i % 4]
        cast.append({'id': re.sub(r'\W', '', str(c['id']))[:16] or f'c{i}', 'name': str(c.get('name', ''))[:20], 'body': body,
                     'hat': c.get('hat') if c.get('hat') in HATS else 'none', 'hatCol': c.get('hatCol') if HEX.match(str(c.get('hatCol', ''))) else '#3B3346',
                     'neck': c.get('neck') if c.get('neck') in NECKS else 'none', 'neckCol': c.get('neckCol') if HEX.match(str(c.get('neckCol', ''))) else '#D8343F',
                     'pattern': c.get('pattern') if c.get('pattern') in PATTERNS else 'plain', 'extra': [e for e in (c.get('extra') or []) if e in EXTRAS][:3],
                     'skin': c.get('skin') if c.get('skin') in SKINS else ['medium', 'light', 'dark', 'tan'][i % 4], 'kid': bool(c.get('kid'))})
    if not cast: cast = default_cast(); warn.append('no valid cast, used default')
    ids = {c['id'] for c in cast}
    shots = []
    for sh in plan.get('shots') or []:
        if not isinstance(sh, dict): continue
        try: li = int(sh.get('line'))
        except Exception: continue
        if not 0 <= li < n: continue
        words = {norm(w) for w in lines[li]['text'].split()}
        wordok = lambda w: w if w and any(x.startswith(norm(w)) for x in words) and norm(w) else None
        o = {'line': li, 'set': sh.get('set') if sh.get('set') in SETS else None, 'camera': sh.get('camera') if sh.get('camera') in CAMS else 'push_in'}
        if not o['set']: warn.append(f'line {li}: bad set {sh.get("set")!r}'); o['set'] = shots[-1]['set'] if shots else 'street'
        cs = []
        for c in (sh.get('cast') or [])[:3]:
            if not isinstance(c, dict) or c.get('who') not in ids: continue
            h = c.get('hold'); hk = str(h).split(':')[0] if h else None
            cs.append({'who': c['who'], 'action': c.get('action') if c.get('action') in ACTIONS else 'stand', 'mood': c.get('mood') if c.get('mood') in MOODS else 'neutral',
                       'mood_after': c.get('mood_after') if c.get('mood_after') in MOODS else None, 'talk': bool(c.get('talk')) or c.get('action') == 'talk',
                       'dir': 'left' if c.get('dir') == 'left' else 'right', 'hold': (str(h)[:24] if hk in HOLDS else None),
                       **({'x': max(-2, min(2, float(c['x'])))} if isinstance(c.get('x'), (int, float)) else {})})
        o['cast'] = cs
        o['focus'] = sh.get('focus') if sh.get('focus') in {c['who'] for c in cs} else (cs[0]['who'] if cs else None)
        o['punch_word'] = wordok(sh.get('punch_word'))
        for k in ('label', 'stamp'):
            v = sh.get(k)
            o[k] = {'text': str(v.get('text'))[:22], 'word': wordok(v.get('word'))} if isinstance(v, dict) and v.get('text') else None
        if sh.get('moon') in {'visible', 'vanish', 'gone'}: o['moon'] = sh['moon']
        if sh.get('tide') in {'low', 'normal', 'high'}: o['tide'] = sh['tide']
        shots.append(o)
    covered = {s['line'] for s in shots}
    for li in range(n):
        if li not in covered: warn.append(f'line {li}: no shot, auto-filled'); shots.append(auto_shot(li, shots, cast))
    shots.sort(key=lambda s: s['line'])
    return {'cast': cast, 'shots': shots}, warn


def default_cast():
    return [{'id': 'hero', 'name': 'Leo', 'body': '#3C6FB6', 'hat': 'cap', 'hatCol': '#D8343F', 'neck': 'scarf', 'neckCol': '#F2C230', 'pattern': 'plain', 'extra': ['blush'], 'skin': 'medium', 'kid': False},
            {'id': 'foil', 'name': 'Max', 'body': '#D8584A', 'hat': 'bowler', 'hatCol': '#3B3346', 'neck': 'tie', 'neckCol': '#2E4E8A', 'pattern': 'vest', 'extra': ['mustache'], 'skin': 'light', 'kid': False},
            {'id': 'sci', 'name': 'Dr Rao', 'body': '#2F8F7A', 'hat': 'bun', 'hatCol': '#3A2A22', 'neck': 'collar', 'neckCol': '#E2B33C', 'pattern': 'plain', 'extra': ['glasses'], 'skin': 'dark', 'kid': False}]


def auto_shot(li, shots, cast):
    prev = [s for s in shots if s['line'] < li]
    st = prev[-1]['set'] if prev else 'street'
    cams = ['push_in', 'low_angle', 'close_up', 'orbit', 'over_shoulder', 'track', 'crane_down']
    hero = cast[0]['id']; foil = cast[1]['id'] if len(cast) > 1 else hero
    return {'line': li, 'set': st, 'camera': cams[li % len(cams)], 'cast': [{'who': hero, 'action': 'talk', 'mood': 'neutral', 'mood_after': None, 'talk': True, 'dir': 'right', 'hold': None}]
            + ([{'who': foil, 'action': 'cross', 'mood': 'smug', 'mood_after': None, 'talk': False, 'dir': 'left', 'hold': None}] if li % 2 else []), 'focus': hero, 'punch_word': None, 'label': None, 'stamp': None}


def offline_plan(S):
    """a safe plan without the LLM: acts move street -> beach -> lab -> space -> meadow_sunset"""
    cast = default_cast(); n = len(S['lines']); acts = ['street', 'beach', 'lab', 'space', 'meadow_sunset']
    shots = []
    for li in range(n):
        sh = auto_shot(li, [], cast); sh['set'] = acts[min(len(acts) - 1, li * len(acts) // n)]
        if li == 0 or acts[min(len(acts) - 1, (li - 1) * len(acts) // n)] != sh['set']: sh['camera'] = 'wide'
        if sh['set'] == 'lab': sh['cast'][0]['who'] = 'sci'; sh['focus'] = 'sci'
        shots.append(sh)
    return {'cast': cast, 'shots': shots}


def cmd_shots(proj, style='tall-tale', offline=False, safe=False):
    P = Path(proj); S = json.loads((P / 'script.json').read_text())
    L = json.loads((P / 'data/lines.json').read_text()) if (P / 'data/lines.json').exists() else None
    plan, warn = None, []
    if safe or offline:
        plan = offline_plan(S)
    else:
        skill = ROOT / 'skills' / f'{style}.md'
        if not skill.exists(): print(f'[shots] no skills/{style}.md, using tall-tale', file=sys.stderr); skill = ROOT / 'skills/tall-tale.md'
        timing = '\n'.join(f'{i}: [{(L["lines"][i]["start"] if L else 0):.1f}-{(L["lines"][i]["end"] if L else 0):.1f}s] {l["text"]}' for i, l in enumerate(S['lines']))
        user = f'Title: {S["title"]}\nTopic: {S.get("topic", "")}\nScript lines (index, time, text):\n{timing}\n\nWrite the shot plan JSON now (one shot per line, 0..{len(S["lines"]) - 1}).'
        try:
            raw = llm(skill.read_text(), user, temperature=0.7, max_tokens=4000)
            plan, warn = clean_plan(raw, S)
            (P / 'data').mkdir(exist_ok=True); (P / 'data/plan_raw.json').write_text(json.dumps(raw, indent=1))
        except Exception as e:
            print('[shots] LLM plan failed, using offline plan:', e, file=sys.stderr); plan = offline_plan(S)
    if warn: print('[shots] plan warnings:\n  ' + '\n  '.join(warn), file=sys.stderr)
    (P / 'data').mkdir(exist_ok=True); (P / 'data/plan.json').write_text(json.dumps(plan, indent=1))
    tpl = (ROOT / 'generator/director.js').read_text()
    (P / 'src/shots.js').write_text(tpl.replace('__PLAN__', json.dumps(plan)))
    print(f'src/shots.js written ({len(plan["shots"])} planned shots, {"safe/offline" if (safe or offline) else "LLM"} plan)')


# ───────────────────────────── upload kit (derick-apps autopost format) ─────────────────────────────
def cmd_kit(proj, video, outdir):
    P = Path(proj); S = json.loads((P / 'script.json').read_text())
    ist = datetime.now(timezone(timedelta(hours=5, minutes=30))); day = ist.strftime('%d%b')
    slug = re.sub(r'[^A-Za-z0-9]+', '-', S['title']).strip('-')[:60]
    out = Path(outdir) / f'{slug} - Upload Package'; out.mkdir(parents=True, exist_ok=True)
    base = f'01_Reel1_{day}'
    subprocess.run(['cp', video, str(out / f'{base}_9x16_1080.mp4')], check=True)
    # cover = a frame from ~35% in, 1080x1920
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout or 10)
    cover = out / f'{base}_Cover_ig_9x16.jpg'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{dur * 0.35:.2f}', '-i', video, '-frames:v', '1', '-vf', 'scale=1080:1920', '-q:v', '2', str(cover)], check=True)
    for p in ('fb', 'yt', 'dm'): subprocess.run(['cp', str(cover), str(out / f'{base}_Cover_{p}_9x16.jpg')], check=True)
    hook = S['lines'][0]['text']
    tags = ['WhatIf', 'WhatIfLab', 'Science', 'Shorts', 'Facts', 'Animation', 'Story']
    desc = f"{hook}\n\n{S['title']} - a What If Lab story in 40 seconds.\n\nMade with AI (script, voice and animation are AI-generated).\n\n" + ' '.join('#' + t for t in tags)
    for plat in ('Instagram', 'Facebook', 'Dailymotion', 'YouTube'):
        md = (f"# {S['title']} - {plat}\n\n## Reel1 — {plat}\n**Title:** {S['title']}\n**Tags:** {', '.join(tags)}\n"
              f"**Caption:**\n```\n{desc}\n```\n**Pinned / first comment:**\n```\nWhat would YOU do? Tell us below.\n```\n"
              f"- **AI label:** ON (AI-generated script, voice and animation)\n")
        (out / f'00_Text_{plat}_titles_desc_comments.md').write_text(md)
    (out / 'metadata.json').write_text(json.dumps({'title': S['title'], 'topic': S.get('topic'), 'description': desc, 'tags': tags, 'ai_generated': True,
                                                   'voice': S['voice'], 'sources': S.get('sources'), 'sources_note': S.get('sources_note'), 'script': [l['text'] for l in S['lines']]}, indent=1, ensure_ascii=False))
    print(out)
    return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('script'); a.add_argument('proj'); a.add_argument('topic'); a.add_argument('--offline', action='store_true')
    b = sub.add_parser('shots'); b.add_argument('proj'); b.add_argument('--style', default='tall-tale'); b.add_argument('--offline', action='store_true'); b.add_argument('--safe', action='store_true')
    c = sub.add_parser('kit'); c.add_argument('proj'); c.add_argument('video'); c.add_argument('outdir')
    x = ap.parse_args()
    if x.cmd == 'script': cmd_script(x.proj, x.topic, x.offline)
    elif x.cmd == 'shots': cmd_shots(x.proj, x.style, x.offline, x.safe)
    else: cmd_kit(x.proj, x.video, x.outdir)
