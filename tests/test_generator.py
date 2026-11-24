import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'generator'))
import vg


def test_offline_script_is_valid():
    S = vg.offline_script('What if the Moon disappeared?')
    assert vg.validate_script(S) == []
    S = vg.finalize_script(S, 'x')
    assert S['voice'] == 'am_fenrir' and S['speed'] == 1.0


def test_validate_catches_question_hook_and_length():
    S = {'title': 't', 'lines': [{'text': 'Have you ever wondered?'}] * 3}
    probs = vg.validate_script(S)
    assert any('question' in p for p in probs) and any('lines' in p for p in probs)


def test_clean_plan_coerces_bad_values_and_fills_missing_lines():
    S = vg.offline_script('What if the Moon disappeared?')
    raw = {'cast': [{'id': 'hero', 'body': '#FFFFFF', 'hat': 'crown', 'skin': 'green'}],
           'shots': [{'line': 0, 'set': 'mars', 'camera': 'drone', 'cast': [{'who': 'hero', 'action': 'fly', 'mood': 'meh'}], 'punch_word': 'notaword',
                      'label': {'text': 'GONE', 'word': 'overnight'}}, {'line': 99}]}
    plan, warn = vg.clean_plan(raw, S)
    assert len({s['line'] for s in plan['shots']}) == len(S['lines'])
    s0 = plan['shots'][0]
    assert s0['set'] in vg.SETS and s0['camera'] in vg.CAMS and s0['cast'][0]['action'] in vg.ACTIONS
    assert s0['punch_word'] is None and s0['label']['word'] == 'overnight'
    c = plan['cast'][0]
    assert c['body'] != '#FFFFFF' and c['hat'] in vg.HATS and c['skin'] in vg.SKINS


def test_offline_plan_covers_every_line_and_uses_known_sets():
    S = vg.offline_script('Why is the sky blue?')
    plan = vg.offline_plan(S)
    assert [s['line'] for s in plan['shots']] == list(range(len(S['lines'])))
    assert all(s['set'] in vg.SETS and s['camera'] in vg.CAMS for s in plan['shots'])


def test_estimated_timing_is_monotonic(tmp_path):
    S = vg.finalize_script(vg.offline_script('What if the Moon disappeared?'), 'x')
    (tmp_path / 'script.json').write_text(json.dumps(S))
    subprocess.run([sys.executable, str(ROOT / 'engine/rick-clips-copy-skill/faceless-shorts/scripts/estimate.py'), str(tmp_path)], check=True)
    L = json.loads((tmp_path / 'data/lines.json').read_text()); W = json.loads((tmp_path / 'data/words.json').read_text())
    starts = [l['start'] for l in L['lines']]
    assert starts == sorted(starts) and L['duration'] > starts[-1]
    assert all(w['e'] >= w['s'] for w in W) and len(W) == sum(len(l['text'].split()) for l in S['lines'])
    assert 25 < L['duration'] < 70


def test_director_template_has_plan_slot():
    assert '__PLAN__' in (ROOT / 'generator/director.js').read_text()
