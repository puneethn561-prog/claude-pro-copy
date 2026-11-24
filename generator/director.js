// AUTO-GENERATED shots.js (claude-pro-copy director). The LLM writes the PLAN (sets, cast, camera, stamps per line);
// this director turns it into Tall Tale 3D shots using the vendored engine (core/world.js, core/props.js, core/toon.js).
// Rules baked in from the skill + reference reels: camera never still, moves finish < 1.8 s then drift, whip + smear
// between shots, cuts every ~1.4-2.4 s (long lines are split), punch-ins on key words, real skin tones (anti-whiteout).
import * as THREE from 'three';
import { ctx, clamp, lerp, eo, eio } from './core/lib.js';
import { L, Le, Wd, T, lineWords } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS } from './core/toon.js';

const PLAN = __PLAN__;

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talkF = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = WD.mat;
const SKIN = { light: '#F3D2B5', medium: '#D9A27C', dark: '#8D5A3B', tan: '#E8B48C' };
const box = (w, h, d, m, x = 0, y = 0, z = 0, p) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (p) p.add(b); return b; };
const safeWd = (word, line) => { try { return word ? Wd(String(word), line) : null; } catch { return null; } };

// ── extra sets for what-if topics (same look: saturated, sunny, ink-outlined people) ──
function moonMesh(r = 6) {
  const tex = WD.canvasTex('moontex', 512, 256, (g, w, h) => { g.fillStyle = '#B9BCC4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(90,92,104,${0.15 + rnd(i) * 0.35})`; g.beginPath(); g.arc(rnd(i * 3) * w, rnd(i * 7) * h, 3 + rnd(i * 5) * 18, 0, 7); g.fill(); } });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), new THREE.MeshStandardMaterial({ map: tex, emissive: '#5A5E6A', emissiveIntensity: 0.25, roughness: 1 }));
}
function earthMesh(r = 6) {
  const tex = WD.canvasTex('earthtex', 1024, 512, (g, w, h) => { g.fillStyle = '#2F6FB8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { g.fillStyle = i % 4 ? '#5FA04A' : '#C9A35A'; g.beginPath(); g.ellipse(rnd(i * 3) * w, h * 0.15 + rnd(i * 5) * h * 0.7, 30 + rnd(i) * 90, 20 + rnd(i * 9) * 60, rnd(i * 2) * 3, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(235,240,245,0.7)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rnd(i * 11) * w, rnd(i * 13) * h, 40 + rnd(i) * 60, 6 + rnd(i * 3) * 10, 0, 0, 7); g.fill(); }
    g.fillStyle = '#E2E8EE'; g.fillRect(0, 0, w, 22); g.fillRect(0, h - 22, w, 22); });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
}
function stars(scene, n = 1500) {
  const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = rnd(i) * 6.283, b = Math.acos(2 * rnd(i * 1.7) - 1), r = 300; pos.set([r * Math.sin(b) * Math.cos(a), Math.abs(r * Math.cos(b)) * 0.9 + 5, r * Math.sin(b) * Math.sin(a)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: '#E8ECF4', size: 1.1, sizeAttenuation: false, fog: false })));
}
function spaceSet(E) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#070B18'); stars(scene, 2500);
  const sun = WD.sunlight(scene, E, { col: '#FFF2DC', i: 2.4, pos: [10, 8, 6], box: 10, sky: '#8090B0', ground: '#30303A', hemi: 0.5 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), mat({ map: WD.T.dirt('#9A9CA4', [12, 12], false) })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.6 + rnd(i) * 1.6, 0.12, 6, 20), mat({ color: '#83858E' })); c.rotation.x = -Math.PI / 2; c.position.set((rnd(i * 3) - 0.5) * 50, 0.02, -rnd(i * 5) * 45 + 4); scene.add(c); }
  const earth = earthMesh(9); earth.position.set(-6, 14, -70); scene.add(earth);
  return { scene, sun, earth, kind: 'space' };
}
function oceanSet(E, { night = false, sunset = false } = {}) {
  const scene = new THREE.Scene();
  WD.sky(scene, night ? { top: '#0E1838', horizon: '#3A4A7A' } : sunset ? { top: '#5B4FA8', horizon: '#FF9E6E' } : { top: '#3D8EE0', horizon: '#CBEAF8' });
  if (night) stars(scene, 1200);
  const sun = WD.sunlight(scene, E, night ? { col: '#AFC2FF', i: 1.2, pos: [-6, 10, -8], sky: '#5A6A9A', ground: '#2A2A40', hemi: 0.6 } : { col: sunset ? '#FFB27A' : '#FFF0D6', pos: [8, 12, 6], box: 14 });
  if (!night) WD.clouds(scene, [[-30, 22, -90, 14], [25, 30, -100, 18], [60, 18, -80, 11]], sunset ? '#FFB8A0' : '#FFFFFF');
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(200, 40), mat({ map: WD.T.dirt('#E2C48E', [40, 8], false) })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0, 8); sand.receiveShadow = true; scene.add(sand);
  const wg = new THREE.PlaneGeometry(400, 300, 90, 60); const water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: night ? '#1E3A6A' : '#2F86B8', roughness: 0.25, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.15, -150); scene.add(water);
  const base = Float32Array.from(wg.attributes.position.array);
  const waves = (t, tide = 0) => { const p = wg.attributes.position; for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; p.setZ(i, Math.sin(x * 0.15 + t * 1.6) * 0.18 + Math.cos(y * 0.2 + t * 1.1) * 0.22); } p.needsUpdate = true; wg.computeVertexNormals(); water.position.y = -0.15 + tide; };
  [[-9, -2], [10, 0], [-14, 3]].forEach(([x, z], i) => { const t = WD.tree(1.2, '#3F8F3A', 'cypress'); t.position.set(x, 0, z); scene.add(t); });
  const boat = new THREE.Group(); box(3, 0.6, 1.2, mat({ color: '#B5372E' }), 0, 0.3, 0, boat); box(0.08, 2.6, 0.08, mat({ color: '#6B4A36' }), 0, 1.6, 0, boat); boat.position.set(6, 0, -9); scene.add(boat);
  const moon = moonMesh(5); moon.position.set(-25, 35, -140); scene.add(moon);
  return { scene, sun, waves, moon, water, kind: 'ocean' };
}
function nightMeadow(E) {
  const M = WD.meadow(E, { sunset: false }); M.scene.children.filter((c) => c.isSprite).forEach((c) => (c.visible = false));
  const skyMesh = M.scene.children.find((c) => c.material && c.material.uniforms && c.material.uniforms.top);
  if (skyMesh) { skyMesh.material.uniforms.top.value.set('#0E1838'); skyMesh.material.uniforms.hor.value.set('#3A4A7A'); }
  stars(M.scene, 1500); M.sun.key.intensity = 1.0; M.sun.key.color.set('#AFC2FF');
  const moon = moonMesh(5); moon.position.set(-25, 35, -140); M.scene.add(moon);
  return { ...M, moon, kind: 'meadow' };
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const cam = camera(36);
  const LK = { out: { bloom: 0.08, aperture: 0.001, maxblur: 0.007, exposure: 0.92 }, room: { bloom: 0.15, aperture: 0.001, maxblur: 0.008, exposure: 0.95 }, dark: { bloom: 0.12, aperture: 0.0008, maxblur: 0.006, exposure: 1.0 } };
  const shoot = (scene, people, from, at, look, whip = 0) => {
    const fov = look.fov || 36; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    cam.position.copy(from); const tgt = at.clone();
    if (whip) { const r = new THREE.Vector3().subVectors(tgt, cam.position); r.applyAxisAngle(V3(0, 1, 0), whip); tgt.copy(cam.position).add(r); }
    cam.lookAt(tgt); people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: cam.position.distanceTo(at) });
  };
  const mv = (lt, d) => { const a = Math.min(d, 1.8); return lt < a ? 0.85 * eio(lt / a) : 0.85 + 0.15 * clamp((lt - a) / Math.max(0.01, d - a)); };
  const WHIP = 0.2;
  const whipA = (lt, dir = 1) => (lt < WHIP ? dir * 0.9 * Math.pow(1 - lt / WHIP, 2) : 0);
  const smear = (lt, dir = 1) => { const k = 1 - clamp(lt / WHIP); if (k <= 0) return; const c = ctx.canvas; ctx.save(); ctx.globalAlpha = 0.22 * k; for (let i = 1; i <= 5; i++) ctx.drawImage(c, -dir * i * 38 * k, 0); ctx.restore(); };
  const stamp = (text, sp, { y = 560, col = '#C8283A', rot = -0.14, size = 110 } = {}) => {
    if (sp <= 0) return; ctx.save(); ctx.translate(540, y); ctx.rotate(rot); const s = lerp(2.4, 1, eo(clamp(sp))); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, sp * 1.6);
    ctx.font = `900 ${size}px Inter`; let w = ctx.measureText(text).width + 80; const fit = Math.min(1, 900 / w); ctx.scale(fit, fit);
    ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-w / 2, -size * 0.75, w, size * 1.5, 22); ctx.stroke();
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 6); ctx.restore(); };
  const label = (text, x, y, a = 1, col = '#FFFFFF', size = 74) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.font = `900 ${size}px Inter`; const fit = Math.min(1, 940 / ctx.measureText(text).width); ctx.translate(x, y); ctx.scale(fit, fit); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0E1420'; ctx.strokeText(text, 0, 0); ctx.fillStyle = col; ctx.fillText(text, 0, 0); ctx.restore(); };

  // ── cast looks (validated by the generator) ──
  const LOOK = {};
  (PLAN.cast || []).forEach((c, i) => { LOOK[c.id] = { body: c.body || '#3C6FB6', hat: c.hat || 'none', hatCol: c.hatCol || '#3B3346', neck: c.neck || 'none', neckCol: c.neckCol || '#D8343F', pattern: c.pattern || 'plain', extra: [...(c.extra || [])], head: SKIN[c.skin] || Object.values(SKIN)[i % 4], hairCol: '#4A3226', kid: !!c.kid }; });

  // ── sets, built lazily, each with its own cut-outs ──
  const SETS = {};
  const stage = { street: V3(0, 0, -8), meadow: V3(0, 0, -1), room: V3(-0.4, 0, -3.4), space: V3(0, 0, 0), ocean: V3(0, 0, 4) };
  function getSet(name) {
    if (SETS[name]) return SETS[name];
    let s;
    if (name === 'street' || name === 'street_dusk') { const st = WD.mainStreet(E, { dusk: name === 'street_dusk' }); s = { ...st, kind: 'street', extrasList: st.people, look: LK.out }; s.sun.key.target.position.set(0, 0, -8); }
    else if (name === 'meadow' || name === 'meadow_sunset') { s = { ...WD.meadow(E, { sunset: name === 'meadow_sunset' }), kind: 'meadow', look: LK.out }; const h = PR.house({ wall: '#F2C9D6', roof: '#3E5FA8', door: '#D8343F' }); h.position.set(7, 0, -9); h.rotation.y = -0.4; s.scene.add(h); }
    else if (name === 'meadow_night') { s = { ...nightMeadow(E), look: LK.dark }; }
    else if (name === 'space') { s = { ...spaceSet(E), look: LK.dark }; }
    else if (name === 'beach' || name === 'beach_sunset' || name === 'beach_night') { s = { ...oceanSet(E, { night: name === 'beach_night', sunset: name === 'beach_sunset' }), look: name === 'beach_night' ? LK.dark : LK.out }; }
    else { // interiors
      const C = { shop: ['#9E2E3A', '#B8414C', '#A8693E', 'OPEN · EST 1921'], office: ['#3E5F8A', '#4A6E9C', '#8A5A36', null], home: ['#7FA36A', '#8DB078', '#A8693E', null], lab: ['#2F6B6A', '#3B7D7A', '#5A5F66', 'LAB · KEEP OUT'], classroom: ['#C9A35A', '#D8B46A', '#8A5A36', 'CLASS 4B'] }[name] || ['#3E5F8A', '#4A6E9C', '#8A5A36', null];
      const view = getSet('street'); const vc = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 800); vc.position.set(0, 2.5, 4); vc.lookAt(0, 2.4, -40);
      const it = WD.interior(E, { wall: C[0], motif: C[1], floor: C[2], signText: C[3], counterOn: name === 'shop', litter: false, view: WD.snapshot(E, view.scene, vc) });
      s = { ...it, kind: 'room', look: LK.room };
      if (name === 'office' || name === 'lab' || name === 'classroom') { const dk = PR.desk(2.0); dk.position.set(0.9, 0, -3.0); s.scene.add(dk); }
      if (name === 'classroom') { const bd = box(3.2, 1.6, 0.06, mat({ color: '#2E4A3A' }), -0.5, 2.2, -6.85, s.scene); }
    }
    s.toons = {}; s.name = name; s.C = stage[s.kind] || V3(0, 0, 0); SETS[name] = s; return s;
  }
  const toonIn = (s, id) => { if (!s.toons[id]) { const t = new Toon({ ...(LOOK[id] || { body: '#3C6FB6' }) }, { height: LOOK[id]?.kid ? 1.4 : 1.75 }); s.scene.add(t.group); s.toons[id] = t; } return s.toons[id]; };

  const PROPMAP = (h) => { if (!h) return null; const [k, arg] = String(h).split(':'); const f = PROPS[k]; if (!f) return null; if (['book', 'paper', 'sign'].includes(k)) return f(arg || k.toUpperCase()); if (k === 'cash') return f(2); return f; };
  const ARMS = { point: [[8, 6], [100, 0]], wave: null, shrug: [[60, -90], [60, -90]], cheer: [[150, 10], [150, 10]], think: [[20, 6], [40, -150]], facepalm: [[70, -140], [8, 6]], panic: [[140, 30], [140, 30]], present: [[8, 6], [70, -20]], cross: [[40, -120], [40, -120]] };

  // ── shots: one per line, long lines split in two (reference pace 1.4-2.4 s) ──
  const shotsIn = [];
  (PLAN.shots || []).forEach((sh) => { if (sh && Number.isInteger(sh.line) && T.lines[sh.line]) shotsIn.push(sh); });
  const byLine = {}; shotsIn.forEach((sh) => { (byLine[sh.line] = byLine[sh.line] || []).push(sh); });
  const CAMS = ['push_in', 'low_angle', 'orbit', 'over_shoulder', 'track', 'crane_down', 'close_up'];
  let n = 0;
  T.lines.forEach((ln, i) => {
    let list = byLine[i] && byLine[i].length ? byLine[i].slice(0, (L(i) >= 0 && (i < T.lines.length - 1 ? L(i + 1) : T.dur) - L(i) > 1.6) ? 2 : 1) : [{ line: i, set: (PLAN.shots[Math.max(0, i - 1)] || {}).set || 'street', cast: [], camera: 'push_in' }];
    const st0 = i === 0 ? 0 : L(i) - 0.06, end = i < T.lines.length - 1 ? L(i + 1) - 0.06 : T.dur;
    if (list.length === 1 && end - st0 > 2.6) { const ws = lineWords(i); const mid = ws[Math.floor(ws.length / 2)]; if (mid) list = [list[0], { ...list[0], camera: CAMS[(n + 3) % CAMS.length], _at: mid.s - 0.04, stamp: null, label: null, _second: true }]; }
    if (list.length === 2 && list[1]._at == null) { const ws = lineWords(i); const m = ws[Math.floor(ws.length / 2)]; list[1]._at = m ? m.s - 0.04 : (st0 + end) / 2; }
    list.forEach((sh, j) => { const at = j === 0 ? st0 : clamp(sh._at, st0 + 0.6, end - 0.5); makeShot(sh, at, i, n++); });
  });

  function makeShot(sh, at, li, idx) {
    const s = getSet(sh.set || 'street');
    const C = s.C.clone();
    const castIn = (sh.cast || []).slice(0, 3).filter((c) => LOOK[c.who]);
    const toons = castIn.map((c) => toonIn(s, c.who));
    const xs = castIn.length === 1 ? [0] : castIn.length === 2 ? [-0.75, 0.75] : [-1.3, 0, 1.3];
    const focusI = Math.max(0, castIn.findIndex((c) => c.who === sh.focus));
    const pw = safeWd(sh.punch_word, li), stw = sh.stamp ? safeWd(sh.stamp.word, li) : null, lbw = sh.label ? safeWd(sh.label.word, li) : null;
    const camType = sh.camera || 'push_in', whipDir = idx % 2 ? -1 : 1, useWhip = idx > 0 && !sh._second;
    const allPeople = () => [...(s.extrasList || []), ...Object.values(s.toons)];
    add({ id: 'S' + String(idx + 1).padStart(2, '0'), at, note: `${s.name} · ${camType} · ${castIn.map((c) => c.who + ':' + (c.action || 'stand')).join(', ')}`, draw(lt, d, t, blit) {
      Object.values(s.toons).forEach((tt) => (tt.group.visible = false));
      castIn.forEach((c, k) => {
        const tt = toons[k]; tt.group.visible = true; const act = c.action || 'stand';
        let x = C.x + (typeof c.x === 'number' ? clamp(c.x, -2, 2) : xs[k]), z = C.z + (k === focusI ? 0 : -0.3 * k);
        let legs = 'stand', phase = 0, armL = [8, 6], armR = [8, 6], bob = 0, lean = 0;
        if (act === 'walk' || act === 'run') { legs = act; phase = t * (act === 'run' ? 11 : 7); x += (lt - d / 2) * (act === 'run' ? 1.6 : 0.8) * (c.dir === 'left' ? -1 : 1); armL = [30 + 20 * Math.sin(phase), 10]; armR = [30 - 20 * Math.sin(phase), 10]; }
        if (act === 'jump') { legs = 'jump'; bob = -Math.abs(Math.sin(t * 6)) * 60; armL = armR = [150, 10]; }
        if (act === 'wave') armR = [150, 20 * Math.sin(t * 12)];
        if (ARMS[act]) [armL, armR] = ARMS[act];
        if (act === 'panic') { legs = 'run'; phase = t * 14; }
        if (act === 'sit') legs = 'sit';
        if (act === 'lean') lean = 8;
        const mood = c.mood_after && pw != null && t > pw ? c.mood_after : (c.mood || 'neutral');
        tt.at(x, s.kind === 'room' ? 0 : 0, z);
        tt.set({ mood, legs, phase, armL, armR, bob, lean, blink: blink(t, k), talk: c.talk ? talkF(t) : 0, sweat: mood === 'worried' || act === 'panic' ? 1 : 0, look: [0, 0], holdR: PROPMAP(c.hold), v: String(c.hold || ''), flip: c.dir === 'left' });
      });
      const F = toons[focusI] ? toons[focusI].group.position.clone() : C.clone();
      const head = F.clone().add(V3(0, 1.45, 0)), mid = C.clone().add(V3(0, 1.2, 0));
      const k = mv(lt, d); let from, look = mid, fov = 36;
      switch (camType) {
        case 'wide': case 'establishing': from = mix(C.clone().add(V3(9, 8, 15)), C.clone().add(V3(5, 4.5, 10)), k); look = C.clone().add(V3(0, 1, -3)); fov = 46; break;
        case 'aerial': from = mix(C.clone().add(V3(0, 18, 12)), C.clone().add(V3(3, 13, 8)), k); look = C.clone(); fov = 46; break;
        case 'crane_down': from = mix(C.clone().add(V3(1, 7, 9)), C.clone().add(V3(0.4, 1.8, 4.6)), k); look = mid; fov = 42; break;
        case 'low_angle': from = mix(F.clone().add(V3(-1.3, 0.35, 3.2)), F.clone().add(V3(-0.8, 0.45, 2.5)), k); look = head; break;
        case 'close_up': from = mix(F.clone().add(V3(0.45, 1.55, 2.7)), F.clone().add(V3(0.2, 1.52, 1.9)), k); look = head; break;
        case 'orbit': { const a = lerp(-0.45, 0.45, k), r = 4.6; from = mid.clone().add(V3(Math.sin(a) * r, 0.6, Math.cos(a) * r)); look = mid; break; }
        case 'over_shoulder': { const O = toons[(focusI + 1) % Math.max(1, toons.length)]; const op = O ? O.group.position.clone() : F.clone().add(V3(1, 0, 1)); from = mix(op.clone().add(V3(0.5, 1.7, 1.6)), op.clone().add(V3(0.35, 1.65, 1.2)), k); look = head; break; }
        case 'track': from = F.clone().add(V3(0.6, 1.5, 3.8 - k * 0.6)); look = head; break;
        case 'pov': from = mix(C.clone().add(V3(0, 1.6, 3)), C.clone().add(V3(0, 1.6, 0.5)), k); look = C.clone().add(V3(0, 1.4, -10)); fov = 50; break;
        case 'sky': from = C.clone().add(V3(0.5, 1.2, 5)); look = mix(V3(-12, 14, -120), V3(-20, 26, -140), k).add(V3(C.x, 0, C.z)); fov = 44; break;
        default: from = mix(C.clone().add(V3(0.7, 1.6, 5.4)), C.clone().add(V3(0.35, 1.55, 3.6)), k); look = toons.length ? head.clone().lerp(mid, 0.4) : mid; // push_in
      }
      if (pw != null && t > pw && camType !== 'wide' && camType !== 'aerial') { const p = eo(clamp((t - pw) / 0.22)); from = mix(from, head.clone().add(V3(0.1, 0.05, 1.5)), p * 0.75); look = mix(look, head, p); }
      if (s.waves) s.waves(t, sh.tide === 'high' ? 0.6 : sh.tide === 'low' ? -0.6 : 0);
      if (s.moon) { const mm = sh.moon || 'visible'; const g = mm === 'gone' ? 0 : mm === 'vanish' ? 1 - clamp(lt / Math.max(0.5, d * 0.7)) : 1; s.moon.visible = g > 0.01; s.moon.scale.setScalar(Math.max(0.01, g)); }
      if (s.earth) s.earth.rotation.y = t * 0.05;
      shoot(s.scene, allPeople(), from, look, { ...s.look, fov }, useWhip ? whipA(lt, whipDir) : 0);
      blit(); if (useWhip) smear(lt, whipDir);
      if (sh.label && sh.label.text) label(String(sh.label.text).toUpperCase().slice(0, 22), 540, 420, lbw != null ? clamp((t - lbw + 0.1) / 0.25) : clamp(lt / 0.3), sh.label.color || '#FFD43B');
      if (sh.stamp && sh.stamp.text) stamp(String(sh.stamp.text).toUpperCase().slice(0, 18), stw != null ? clamp((t - stw) / 0.2) : clamp((lt - 0.4) / 0.2), { col: sh.stamp.color || '#C8283A' });
    } });
    cue(at, 'whoosh', { gain: sh._second ? 0.35 : 0.6 });
    if (pw != null) cue(pw, 'boing', { gain: 0.4 });
    if (stw != null) cue(stw, 'stamp', { gain: 0.8 });
    if (lbw != null) cue(lbw, 'ding', { gain: 0.5 });
  }
  return { shots: S, cues: CUES };
}
