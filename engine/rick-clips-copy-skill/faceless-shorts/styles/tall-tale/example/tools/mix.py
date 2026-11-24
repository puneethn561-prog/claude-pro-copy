"""Inside Out soundtrack: narration + soft procedural sound effects + a quiet music bed, all made here with numpy.
No samples, no AI audio, no downloads.

  python3 tools/mix.py [project=.]          → data/mix.wav (48 kHz stereo)

Reads data/cues.json (node tools/capture.mjs cues), data/narration.wav if it exists (voice.py or words.py --audio),
and script.json "music": "bed" (the procedural score, default) · "none" · "audio/your-track.mp3" (your own royalty-free
track, any format ffmpeg reads). The music ducks under the voice.

Sound rules (STYLE.md): every effect is soft and rounded, nothing above ~5 kHz, no ticks / hats / glitches / beeps.
Cue types: whoosh slide pop plop gulp boing bubbles sizzle sparkle thud slam tock zip alarm  (+ gain, dur)
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(11)
cj = json.loads((P / 'data/cues.json').read_text())
script = json.loads((P / 'script.json').read_text())
DUR = float(cj['duration'])
N = int(DUR * SR) + SR // 10


def lp(x, f, o=2): b, a = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = signal.butter(o, [f0 / (SR / 2), f1 / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def db(x): return 10 ** (x / 20)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=None):
    """attack a seconds then exponential release over the rest"""
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    rest = n - na; e[na:] = np.exp(-np.linspace(0, r or 5, rest)) if rest > 0 else 1; return e
def sweep(f0, f1, d, shape='exp'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def noise(d): return rng.standard_normal(int(d * SR))


# ---------- the effects ----------
def whoosh(d=0.38, **_):
    n = noise(d); lo, hi = lp(n, 500), lp(n, 2200)
    k = np.sin(np.pi * np.linspace(0, 1, len(n))); x = (lo * (1 - k) + hi * k) * k ** 1.5
    return x / (np.abs(x).max() + 1e-9) * 0.5
def slide(d=1.0, **_):
    n = lp(noise(d), 700); e = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2
    return n / (np.abs(n).max() + 1e-9) * e * 0.35 + sweep(260, 120, d) * e * 0.08
def pop(**_): x = sweep(560, 240, 0.11) * env(int(0.11 * SR), 0.002, 6); return lp(x, 3000) * 0.7
def plop(**_): x = sweep(700, 180, 0.14) * env(int(0.14 * SR), 0.002, 5); return lp(x, 2500) * 0.6
def gulp(**_):
    a = sweep(320, 140, 0.16) * env(int(0.16 * SR), 0.01, 4); b = sweep(240, 90, 0.2) * env(int(0.2 * SR), 0.01, 4)
    x = np.concatenate([a, np.zeros(int(0.04 * SR)), b]); return lp(x, 1800) * 0.8
def boing(**_):
    d = 0.42; t = tt(d); f = 200 * (1 + 0.6 * t / d) * (1 + 0.08 * np.sin(2 * np.pi * 18 * t))
    return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 4), 2000) * 0.55
def bubbles(d=2.0, **_):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 7)):
        st = rng.integers(0, max(1, len(x) - int(0.08 * SR))); f = rng.uniform(380, 900); b = sweep(f, f * 1.6, 0.06) * env(int(0.06 * SR), 0.003, 5)
        x[st:st + len(b)] += b * rng.uniform(0.2, 0.5)
    return lp(x, 2500) * 0.5
def sizzle(d=1.0, **_):
    n = bp(noise(d), 1800, 4500); crack = (rng.random(len(n)) < 0.002).astype(float); crack = lp(crack, 300) * 40
    e = np.minimum(1, np.linspace(0, 6, len(n))) * np.linspace(1, 0.2, len(n)); return n * (0.4 + crack) * e * 0.12
def sparkle(d=1.2, **_):
    notes = [784, 880, 1047, 1175, 1319, 1568]; x = np.zeros(int(d * SR) + SR // 2)
    for k, f in enumerate(notes):
        st = int(k * d / len(notes) * SR); n = int(0.4 * SR); t = tt(0.4)
        x[st:st + n] += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 6) * 0.22
    return lp(x, 4500)
def thud(**_):
    d = 0.35; t = tt(d); x = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * env(len(t), 0.002, 7)
    return x * 0.9 + lp(noise(d), 220) * env(len(t), 0.001, 12) * 0.3
def slam(**_):
    d = 0.5; t = tt(d); x = np.sin(2 * np.pi * (60 + 60 * np.exp(-t * 25)) * t) * env(len(t), 0.002, 6)
    return np.tanh(1.6 * (x + lp(noise(d), 1200) * env(len(t), 0.001, 10) * 0.6)) * 0.9
def tock(**_): d = 0.09; t = tt(d); return (np.sin(2 * np.pi * 420 * t) + 0.3 * np.sin(2 * np.pi * 840 * t)) * env(len(t), 0.001, 9) * 0.35
def zip_(**_):
    d = 0.32; n = bp(noise(d), 400, 3000); k = np.linspace(0, 1, len(n))
    return (n / (np.abs(n).max() + 1e-9) * 0.35 + sweep(300, 1100, d) * 0.12) * np.sin(np.pi * k) ** 1.2
def alarm(d=2.0, **_):
    x = np.zeros(int(d * SR)); one = np.sin(2 * np.pi * 150 * tt(0.22)) * env(int(0.22 * SR), 0.02, 5)
    for st in np.arange(0, d - 0.25, 0.5): i = int(st * SR); x[i:i + len(one)] += one
    return lp(x, 900) * 0.55

def inhale(d=1.0, **_):
    n = bp(noise(d), 300, 2600); k = np.linspace(0, 1, len(n)); e = np.sin(np.pi * np.minimum(1, k * 1.15)) ** 1.5 * (0.6 + 0.4 * k)
    return n / (np.abs(n).max() + 1e-9) * e * 0.5
def heartbeat(**_):
    one = lambda d, f: np.sin(2 * np.pi * f * tt(d)) * env(int(d * SR), 0.004, 7)
    x = np.concatenate([one(0.16, 58), np.zeros(int(0.09 * SR)), one(0.2, 52) * 0.75]); return lp(x, 300) * 1.0

def ding(**_):
    t = tt(1.4); x = sum(np.sin(2 * np.pi * f * t) * g for f, g in [(1318, 1), (2637, 0.35), (3951, 0.12)]) * env(len(t), 0.002, 4); return x * 0.5
def chirp(d=1.0, **_):
    x = np.zeros(int(d * SR))
    for k, st in enumerate(np.arange(0, d - 0.12, 0.17)):
        i = int(st * SR); c = sweep(3200 + (k % 3) * 300, 4400, 0.08) * env(int(0.08 * SR), 0.004, 6); x[i:i + len(c)] += c[:len(x) - i] * (0.6 + 0.4 * rng.random())
    return x * 0.4
def chug(d=2.0, **_):
    x = np.zeros(int(d * SR)); one = bp(noise(0.14), 200, 1600) * env(int(0.14 * SR), 0.005, 6)
    for k, st in enumerate(np.arange(0, d - 0.15, 0.22)): i = int(st * SR); x[i:i + len(one)] += one * (1 if k % 2 == 0 else 0.6)
    return x * 0.7
def stampit(**_):
    t = tt(0.18); x = np.sin(2 * np.pi * 95 * t) * env(len(t), 0.001, 10) + bp(noise(0.18), 1500, 5000) * env(len(t), 0.001, 14) * 0.6; return x * 0.9

FX = dict(ding=ding, chirp=chirp, chug=chug, stamp=stampit, inhale=inhale, heartbeat=heartbeat, whoosh=whoosh, slide=slide, pop=pop, plop=plop, gulp=gulp, boing=boing, bubbles=bubbles, sizzle=sizzle,
          sparkle=sparkle, thud=thud, slam=slam, tock=tock, zip=zip_, alarm=alarm)
LEVEL = dict(ding=-17, chirp=-19, chug=-20, stamp=-12, inhale=-15, heartbeat=-8, whoosh=-17, slide=-19, pop=-14, plop=-15, gulp=-11, boing=-15, bubbles=-21, sizzle=-18, sparkle=-17,
             thud=-11, slam=-9, tock=-18, zip=-14, alarm=-17)


# ---------- the music bed: soft pad + plucked arpeggio, 100 BPM, I–vi–IV–V ----------
def music_bed():
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(N)
    nb = int(np.ceil(DUR / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]; st = int(b * bar * SR); n = int(bar * SR)
        if st >= N: break
        t = tt(bar); e = np.minimum(1, t / 0.4) * np.minimum(1, (bar - t) / 0.4)
        pad = sum(np.sin(2 * np.pi * f / 2 * t) + 0.25 * np.sin(2 * np.pi * f * t) for f in ch) * e * 0.10
        x[st:st + n] += pad[:max(0, min(n, N - st))]
        for k in range(8):                                                       # eighth-note pluck arpeggio
            f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 2 else 1); ps = st + int(k * beat / 2 * SR); pn = int(0.5 * SR)
            if ps + pn >= N: continue
            pt = tt(0.5); pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.003, 7) * 0.12
            x[ps:ps + pn] += pl
    x = lp(x, 3200)
    fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_bounce():
    """light comedy: oom-pah bass + staccato plucked melody, 118 BPM, major (script.json "music": "bounce")"""
    bpm = 118; beat = 60 / bpm; x = np.zeros(N)
    prog = [(130.8, [261.6, 329.6, 392.0]), (174.6, [261.6, 349.2, 440.0]), (196.0, [246.9, 293.7, 392.0]), (130.8, [261.6, 329.6, 392.0])]
    mel = [0, 2, 1, 2, 0, 1, 2, 1]
    pl = lambda f, d, g: (np.sin(2 * np.pi * f * tt(d)) + 0.4 * np.sin(4 * np.pi * f * tt(d)) + 0.15 * np.sin(6 * np.pi * f * tt(d))) * env(int(d * SR), 0.003, 9) * g
    for k in range(int(DUR / beat) + 1):
        bass, ch = prog[(k // 8) % 4]; i = int(k * beat * SR)
        b = pl(bass if k % 2 == 0 else bass * 1.5, 0.3, 0.35) if k % 2 == 0 else pl(ch[0] / 2 * 1.5, 0.22, 0.18)
        if i + len(b) < N: x[i:i + len(b)] += b
        if k % 2 == 1:
            c = sum(pl(f, 0.16, 0.07) for f in ch)
            if i + len(c) < N: x[i:i + len(c)] += c
        f = ch[mel[k % 8]] * 2; m = pl(f, 0.18, 0.09); j = i + int(beat / 2 * SR) if k % 4 == 3 else i
        if j + len(m) < N and k % 8 not in (3, 7): x[j:j + len(m)] += m
    x = lp(x, 4200); fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_tension():
    """low drone + slow minor pulse, for mysterious / tense explainers (script.json "music": "tension")"""
    t = np.arange(N) / SR; x = np.zeros(N)
    for f, g in [(55, 0.5), (82.4, 0.3), (110, 0.2), (130.8, 0.12)]: x += np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.5) * g
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 8) ** 2
    beat = 60 / 84; ping = lambda f: (np.sin(2 * np.pi * f * tt(1.2)) + 0.3 * np.sin(4 * np.pi * f * tt(1.2))) * env(int(1.2 * SR), 0.01, 5)
    seq = [220.0, 261.6, 196.0, 174.6]
    for k in range(int(DUR / (beat * 2))):
        i = int(k * beat * 2 * SR); pg = ping(seq[(k // 2) % 4]) * 0.35
        if i + len(pg) < N: x[i:i + len(pg)] += pg
    x = lp(x, 2200); fade = np.ones(N); fo = int(1.5 * SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(0.8 * SR); fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade


# ---------- per-reel score: a NEW track every reel, matched to the reel's mood ----------
# script.json "music": {"mood": "playful|wonder|tension|epic|chill|sad", "seed": 1234}   (or "auto" / a bare mood string)
# The seed picks key, tempo, chord progression, melody, lead + bass timbre and groove, so no two reels share a track.
# Default seed = hash of the title, so every new title gets its own music even if you forget to set one.
MOODS = {
    'playful': dict(bpm=(108, 128), scale=[0, 2, 4, 5, 7, 9, 11], progs=[[0, 5, 3, 4], [0, 3, 4, 0], [0, 4, 5, 3], [0, 3, 0, 4]], leads=['pluck', 'marimba', 'whistle'], groove=['oompah', 'bounce'], bright=4200),
    'wonder':  dict(bpm=(84, 100),  scale=[0, 2, 4, 6, 7, 9, 11], progs=[[0, 4, 5, 3], [0, 3, 5, 4], [5, 3, 0, 4]], leads=['bell', 'marimba', 'pluck'], groove=['arp', 'pulse'], bright=4600),
    'tension': dict(bpm=(78, 96),   scale=[0, 2, 3, 5, 7, 8, 10], progs=[[0, 5, 6, 4], [0, 0, 5, 4], [0, 6, 5, 6]], leads=['bell', 'pluck'], groove=['pulse', 'heart'], bright=2600),
    'epic':    dict(bpm=(92, 110),  scale=[0, 2, 3, 5, 7, 8, 10], progs=[[0, 5, 2, 6], [0, 6, 5, 4], [5, 6, 0, 0]], leads=['brass', 'bell'], groove=['drums', 'pulse'], bright=3800),
    'chill':   dict(bpm=(80, 96),   scale=[0, 2, 4, 7, 9],        progs=[[0, 3, 4, 3], [0, 5, 3, 4]], leads=['marimba', 'bell', 'whistle'], groove=['bounce', 'arp'], bright=3600),
    'sad':     dict(bpm=(70, 84),   scale=[0, 2, 3, 5, 7, 8, 10], progs=[[0, 5, 2, 6], [0, 3, 5, 4]], leads=['bell', 'pluck'], groove=['arp'], bright=3000),
}

def voice_note(kind, f, d, g):
    t = tt(d); n = len(t)
    if kind == 'pluck':   x = np.sin(2*np.pi*f*t) + 0.4*np.sin(4*np.pi*f*t) + 0.15*np.sin(6*np.pi*f*t); e = env(n, 0.003, 9)
    elif kind == 'marimba': x = np.sin(2*np.pi*f*t) + 0.25*np.sin(2*np.pi*f*3.9*t)*np.exp(-t*30); e = env(n, 0.002, 11)
    elif kind == 'bell':  x = np.sin(2*np.pi*f*t) + 0.5*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*4) + 0.25*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*7); e = env(n, 0.002, 5)
    elif kind == 'whistle': x = np.sin(2*np.pi*f*t + 0.02*np.sin(2*np.pi*5.5*t)*f/50); e = np.minimum(1, t/0.03) * np.exp(-t*3)
    elif kind == 'brass': x = sum(np.sin(2*np.pi*f*k*t)/k**1.2 for k in range(1, 7)); e = np.minimum(1, t/0.05) * np.exp(-t*2.2)
    else: x = np.sin(2*np.pi*f*t); e = env(n, 0.005, 6)
    return x * e * g

def music_score(spec):
    if isinstance(spec, str): spec = {'mood': spec if spec in MOODS else 'playful'}
    mood = spec.get('mood', 'playful'); M = MOODS.get(mood, MOODS['playful'])
    import zlib; seed = int(spec.get('seed', zlib.crc32(script.get('title', 'x').encode())))
    r = np.random.default_rng(seed)
    bpm = r.uniform(*M['bpm']); beat = 60 / bpm
    root = 110 * 2 ** (r.integers(0, 12) / 12)                       # random key, A2..G#3
    sc = M['scale']; prog = M['progs'][r.integers(len(M['progs']))]
    lead = M['leads'][r.integers(len(M['leads']))]; groove = M['groove'][r.integers(len(M['groove']))]
    deg = lambda d, o=0: root * 2 ** ((sc[d % len(sc)] + 12 * (d // len(sc) + o)) / 12)
    chord = lambda c: [deg(c), deg(c + 2), deg(c + 4)]
    motif = [int(v) for v in r.integers(0, 5, 8)]; rests = set(int(v) for v in r.choice(8, 2, replace=False))
    x = np.zeros(N); bars = int(DUR / (beat * 4)) + 2
    def put(sig, t0):
        i = int(t0 * SR); n = min(len(sig), N - i)
        if n > 0 and i >= 0: x[i:i + n] += sig[:n]
    for b in range(bars):
        c = prog[b % len(prog)]; ch = chord(c); t0 = b * beat * 4
        pad = sum(voice_note('whistle' if mood != 'epic' else 'brass', f, beat * 4, 0.035) for f in ch); put(lp(pad, 2000), t0)
        for k in range(4):                                           # groove / bass
            tb = t0 + k * beat
            if groove == 'oompah': put(voice_note('pluck', ch[0] / 2 if k % 2 == 0 else ch[2] / 2, 0.28, 0.32 if k % 2 == 0 else 0.16), tb)
            elif groove == 'bounce': put(voice_note('pluck', ch[0] / 2, 0.22, 0.3), tb); put(voice_note('pluck', ch[1] / 2, 0.15, 0.12), tb + beat / 2)
            elif groove == 'arp': [put(voice_note('pluck', ch[(k * 2 + j) % 3], 0.35, 0.10), tb + j * beat / 2) for j in range(2)]
            elif groove == 'pulse': put(voice_note('sine', ch[0] / 2, beat * 0.9, 0.28), tb)
            elif groove == 'heart': (put(voice_note('sine', 55, 0.18, 0.5), tb), put(voice_note('sine', 50, 0.2, 0.35), tb + 0.22)) if k in (0, 2) else None
            elif groove == 'drums':
                put(voice_note('sine', 55 + 30 * 0, 0.3, 0.55) * np.exp(-tt(0.3) * 9), tb) if k in (0, 2) else put(bp(noise(0.15), 300, 2500) * env(int(0.15 * SR), 0.002, 9) * 0.25, tb)
                put(voice_note('pluck', ch[0] / 2, 0.3, 0.25), tb)
        for k in range(8):                                           # lead melody (motif, transposed per chord)
            if k in rests or (b % 4 == 3 and k > 4): continue
            put(voice_note(lead, deg(c + motif[k], 1), 0.45, 0.09), t0 + k * beat / 2)
    x = lp(x, M['bright']); fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    print(f'music: mood={mood} seed={seed} bpm={bpm:.0f} lead={lead} groove={groove}')
    return x / (np.abs(x).max() + 1e-9) * fade

def load_audio(f):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64); return a


mix = np.zeros((N, 2))
# voice
vf = P / 'data/narration.wav'
voice = None
if vf.exists():
    v = load_audio(vf)[:N]; voice = np.zeros((N, 2)); voice[:len(v)] = v
    rms = np.sqrt(np.mean(voice ** 2) + 1e-12); voice *= db(-19) / rms
    mix += voice
# music
mus = script.get('music', 'auto')
if mus and mus != 'none':
    if isinstance(mus, dict) or mus == 'auto' or mus in MOODS: m = music_score(mus if mus != 'auto' else {'mood': 'playful'})
    else: m = music_bed() if mus == 'bed' else music_tension() if mus == 'tension' else music_bounce() if mus == 'bounce' else None
    if m is None:
        a = load_audio(P / mus)[:N]; m = np.zeros(N); m[:len(a)] = a.mean(1); m /= np.abs(m).max() + 1e-9
    m = np.stack([m, m], 1) * db(-24 if voice is not None else -20)
    if voice is not None:                                                        # duck under the voice
        lev = np.abs(voice.mean(1)); lev = signal.lfilter([1 - 0.9995], [1, -0.9995], lev); lev /= lev.max() + 1e-9
        m *= (1 - 0.55 * np.clip(lev * 3, 0, 1))[:, None]
    mix += m
# effects
for c in cj['cues']:
    fn = FX.get(c['type'])
    if not fn: print('unknown cue type, skipped:', c['type']); continue
    x = fn(**({'d': c['dur']} if c.get('dur') else {}))
    x = lp(x, 5000) * db(LEVEL[c['type']]) * c.get('gain', 1.0) / (np.abs(x).max() + 1e-9) * 0.9
    i = int(c['t'] * SR); n = min(len(x), N - i)
    if n > 0 and i >= 0: pan = c.get('pan', 0.0); mix[i:i + n, 0] += x[:n] * (1 - max(0, pan)); mix[i:i + n, 1] += x[:n] * (1 + min(0, pan))
# master: gentle soft-clip, peak -1 dBFS
mix = np.tanh(mix * 1.2) / 1.2
mix *= db(-1) / (np.abs(mix).max() + 1e-9)
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
print(f"data/mix.wav: {DUR:.2f} s · voice: {'yes' if voice is not None else 'NO (captions-only)'} · music: {mus} · {len(cj['cues'])} cues")
