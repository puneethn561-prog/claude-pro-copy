// THE TOWN WHERE YOU'RE NOT ALLOWED TO DIE (Tall Tale 3D). 15 lines, ~45 s.
import * as THREE from 'three';
import { ctx, clamp, lerp, seg, eo, eio, eob } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import { camera } from './core/engine.js';
import * as WD from './core/world.js';
import * as PR from './core/props.js';
import { Toon, PROPS } from './core/toon.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const mix = (a, b, k) => a.clone().lerp(b, k);
const talk = (t, on = 1) => (on ? 0.25 + 0.75 * Math.abs(Math.sin(t * 13)) * (0.6 + 0.4 * Math.sin(t * 5.3)) : 0);
const blink = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);
const INK = '#1F1C33';
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = WD.mat;
const box = (w, h, d, m, x = 0, y = 0, z = 0, p) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; if (p) p.add(b); return b; };
const cyl = (r1, r2, h, m, x, y, z, p, s = 16) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, s), m); c.position.set(x, y, z); c.castShadow = c.receiveShadow = true; if (p) p.add(c); return c; };

// custom hand props
PROPS.planeTicket = (g, x, y) => { g.save(); g.translate(x + 10, y - 44); g.rotate(-0.15); g.fillStyle = '#F4F6F8'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-80, -42, 160, 84, 8); g.fill(); g.stroke();
  g.fillStyle = '#C8283A'; g.fillRect(-80, -42, 160, 24); g.fillStyle = '#FFF'; g.font = '900 18px Inter'; g.textAlign = 'center'; g.fillText('BOARDING PASS', 0, -24);
  g.fillStyle = INK; g.font = '900 26px Inter'; g.fillText('LYR → OSL', 0, 12); g.fillStyle = '#C8283A'; g.font = '900 16px Inter'; g.fillText('ONE WAY', 0, 34); g.restore(); };
PROPS.vial = (g, x, y) => { g.save(); g.translate(x, y - 60); g.shadowColor = '#FF3B3B'; g.shadowBlur = 40; g.fillStyle = 'rgba(255,70,70,0.9)'; g.beginPath(); g.roundRect(-18, -20, 36, 80, [4, 4, 18, 18]); g.fill(); g.shadowBlur = 0;
  g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-20, -50, 40, 112, [4, 4, 20, 20]); g.stroke(); g.fillStyle = '#7A8A99'; g.fillRect(-24, -64, 48, 18); g.strokeRect(-24, -64, 48, 18);
  g.fillStyle = '#FFE0E0'; [[-6, 10], [8, 30], [-4, 44]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 5, 0, 7); g.fill(); }); g.restore(); };

const LOOK = {
  olaf: { body: '#3C6FB6', hat: 'beanie', hatCol: '#D8343F', neck: 'scarf', neckCol: '#F2C230', extra: ['mustache', 'blush'] },
  doc: { body: '#F2F4F7', hat: 'bun', hatCol: '#7A4A2E', neck: 'collar', neckCol: '#5FA39A', extra: ['glasses'] },
  sci: { body: '#E8EEF2', hat: 'cap', hatCol: '#5FA39A', neck: 'collar', extra: ['glasses'] },
  sci2: { body: '#E8EEF2', hat: 'visor', hatCol: '#3C6FB6', neck: 'tie', neckCol: '#C8283A' },
};
const person = (k, o) => new Toon({ ...LOOK[k], extra: [...(LOOK[k].extra || [])] }, o);

// ── arctic pieces ─────────────────────────────────────────────────────
const snowTex = (rep) => WD.T.dirt('#D3DDE8', rep, false);
function snowGround(scene, size = 300) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(size, size, 60, 60), mat({ map: snowTex([size / 5, size / 5]), roughness: 0.95 }));
  const p = g.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const r = Math.hypot(x, y); if (r > 30) p.setZ(i, Math.sin(x * 0.07) * 1.2 + Math.cos(y * 0.05) * 1.4); }
  g.geometry.computeVertexNormals(); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g); return g;
}
function mountains(scene, z = -110) {
  const rock = mat({ color: '#6E7686', roughness: 0.9 }), snow = mat({ color: '#E2EAF2', roughness: 0.8 });
  [[-90, z, 40, 34], [-40, z - 15, 34, 42], [10, z - 5, 46, 38], [62, z - 12, 38, 44], [110, z, 44, 30], [-130, z + 10, 36, 26]].forEach(([x, zz, r, h], i) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), rock); m.position.set(x, h / 2 - 2, zz); m.rotation.y = rnd(i) * 3; scene.add(m);
    const c = new THREE.Mesh(new THREE.ConeGeometry(r * 0.56, h * 0.56, 7), snow); c.position.set(x, h - h * 0.28 - 2 + 0.3, zz); c.rotation.y = m.rotation.y; scene.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 1.05, 4, 7), snow); b.position.set(x, 0, zz); scene.add(b);
  });
}
function polarSet(E, { dusk = false } = {}) {
  const scene = new THREE.Scene();
  WD.sky(scene, dusk ? { top: '#2E3A7A', horizon: '#F7A98B' } : { top: '#5C86CF', horizon: '#F6DCCF' });
  scene.fog = new THREE.Fog(dusk ? '#B08FAA' : '#C9D6E4', 60, 260);
  const sun = WD.sunlight(scene, E, { col: dusk ? '#FFB48A' : '#FFE6CC', i: 1.8, pos: [-9, 7, 6], box: 18, sky: '#AFC4DE', ground: '#8E9BAD', hemi: 0.75 });
  WD.clouds(scene, [[-40, 24, -120, 18], [30, 30, -130, 22], [80, 20, -100, 14], [-90, 28, -100, 16]], dusk ? '#FFC3B0' : '#FFFFFF');
  snowGround(scene); mountains(scene);
  // falling snow
  const n = 2500, pos = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) { const x = (rnd(i) - 0.5) * 40, y = rnd(i * 3.1) * 12, z = -rnd(i * 7.3) * 50 + 8; base.push([x, y, z]); pos.set([x, y, z], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const flakes = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#FFFFFF', size: 0.05, transparent: true, opacity: 0.9, fog: false }));
  scene.add(flakes);
  const snowfall = (t) => { for (let i = 0; i < n; i++) { const [x, y, z] = base[i]; pos[i * 3] = x + Math.sin(t * 0.8 + i) * 0.3; pos[i * 3 + 1] = ((y - t * 0.9) % 12 + 12) % 12; pos[i * 3 + 2] = z; } geo.attributes.position.needsUpdate = true; };
  return { scene, sun, snowfall, flakes };
}
function coffin() {
  const g = new THREE.Group(), w = mat({ map: WD.T.planks('#5A3A26', [0.5, 1]), color: '#7A5236' });
  box(0.7, 0.42, 2.0, w, 0, 0.21, 0, g); box(0.76, 0.08, 2.06, mat({ color: '#4A2E1E' }), 0, 0.46, 0, g);
  box(0.08, 0.02, 0.5, mat({ color: '#C9A13B', metalness: 0.6, roughness: 0.3 }), 0, 0.51, 0, g); box(0.3, 0.02, 0.08, mat({ color: '#C9A13B', metalness: 0.6, roughness: 0.3 }), 0, 0.51, -0.08, g);
  return g;
}
function cross(h = 1.2, plaque = null) {
  const g = new THREE.Group(), m = mat({ color: '#F7F7F2' });
  box(0.1, h, 0.08, m, 0, h / 2, 0, g); box(0.62, 0.1, 0.08, m, 0, h * 0.72, 0, g);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat({ map: snowTex([1, 1]) })); mound.scale.set(0.7, 0.25, 1.6); mound.position.set(0, 0, 0.9); mound.receiveShadow = true; g.add(mound);
  if (plaque) { const s = WD.signBoard(plaque, { w: 0.5, h: 0.2, bg: '#2A2638', fg: '#F2E6CF', font: 'Inter' }); s.position.set(0, h * 0.5, 0.06); g.add(s); }
  return g;
}

export function buildShots(E) {
  const S = [], CUES = [], add = (o) => (S.push(o), o), cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.06);
  const cam = camera(36);
  const LK = { out: { bloom: 0.08, aperture: 0.001, maxblur: 0.007 }, room: { bloom: 0.3, aperture: 0.001, maxblur: 0.008 }, dark: { bloom: 0.6, aperture: 0.0008, maxblur: 0.006 } };
  const shoot = (scene, people, from, to, at, at2, k, look, focus, whip = 0) => {
    if (cam.fov !== (look.fov || 36)) { cam.fov = look.fov || 36; cam.updateProjectionMatrix(); }
    cam.position.copy(mix(from, to, k)); const tgt = at2 ? mix(at, at2, k) : at.clone();
    if (whip) { const r = new THREE.Vector3().subVectors(tgt, cam.position); r.applyAxisAngle(V3(0, 1, 0), whip); tgt.copy(cam.position).add(r); }
    cam.lookAt(tgt); people.forEach((p) => p.face(cam));
    E.render(scene, cam, { ...look, focus: focus ?? cam.position.distanceTo(at2 ? mix(at, at2, k) : at) });
  };
  // move inside ~1.8 s, then a slow drift; whip = quick yaw at the head of a shot (+ smear)
  const mv = (lt, d) => { const a = Math.min(d, 1.8); return lt < a ? 0.85 * eio(lt / a) : 0.85 + 0.15 * clamp((lt - a) / Math.max(0.01, d - a)); };
  const WHIP = 0.2;
  const whipA = (lt, dir = 1) => (lt < WHIP ? dir * 0.9 * Math.pow(1 - lt / WHIP, 2) : 0);
  const smear = (lt, dir = 1) => { const k = 1 - clamp(lt / WHIP); if (k <= 0) return; const c = ctx.canvas; ctx.save(); ctx.globalAlpha = 0.22 * k; for (let i = 1; i <= 5; i++) ctx.drawImage(c, -dir * i * 38 * k, 0); ctx.restore(); };
  const stamp = (text, sp, { y = 600, col = '#C8283A', rot = -0.14, size = 120, sub = null } = {}) => {
    if (sp <= 0) return; ctx.save(); ctx.translate(540, y); ctx.rotate(rot); const s = lerp(2.4, 1, eo(clamp(sp))); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, sp * 1.6);
    ctx.font = `900 ${size}px Inter`; const w = ctx.measureText(text).width + 80;
    ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-w / 2, -size * 0.75, w, size * 1.5, 22); ctx.stroke();
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 6);
    if (sub) { ctx.font = '900 44px Inter'; ctx.fillText(sub, 0, size * 0.75 + 46); }
    ctx.restore(); };
  const label = (text, x, y, a = 1, col = '#FFFFFF', size = 54) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.font = `900 ${size}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 10; ctx.strokeStyle = '#0E1420'; ctx.strokeText(text, x, y); ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore(); };

  // ── TOWN ─────────────────────────────────────────────────────────────
  const TW = polarSet(E);
  { const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 120), mat({ map: WD.T.dirt('#B8C2CC', [2, 16], true) })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -40); road.receiveShadow = true; TW.scene.add(road); }
  const COLS = ['#D8343F', '#F2C230', '#3C6FB6', '#5FA39A', '#E58A6A', '#7FA36A', '#B98ACF', '#E8734A', '#4FB3A9', '#C9603F'];
  const houses = [];
  for (let i = 0; i < 16; i++) {
    const s = i % 2 ? 1 : -1, z = 2 - Math.floor(i / 2) * 7.6, hosp = (s === 1 && Math.floor(i / 2) === 3);
    const h = PR.house({ wall: hosp ? '#F4F6F8' : COLS[i % COLS.length], roof: '#E9EEF4', trim: '#FFFFFF', door: hosp ? '#C8283A' : COLS[(i + 3) % COLS.length] });
    h.position.set(s * 10, 0.55, z); h.rotation.y = -s * Math.PI / 2; TW.scene.add(h); houses.push(h);
    // stilts
    for (let a = -1; a <= 1; a += 2) for (let b = -1; b <= 1; b += 2) cyl(0.12, 0.12, 0.6, mat({ color: '#4A3A30' }), s * 10 + a * 2.0, 0.28, z + b * 2.8, TW.scene, 6);
    if (hosp) { const sb = WD.signBoard('SYKEHUS · HOSPITAL', { w: 3.6, h: 0.55, bg: '#F4F6F8', fg: '#C8283A', font: 'Inter' }); sb.position.set(s * 7.6, 3.2, z); sb.rotation.y = -s * Math.PI / 2; TW.scene.add(sb);
      const rc = new THREE.Group(); box(0.25, 0.8, 0.06, mat({ color: '#C8283A' }), 0, 0, 0, rc); box(0.8, 0.25, 0.06, mat({ color: '#C8283A' }), 0, 0, 0, rc); rc.position.set(s * 7.72, 4.4, z); rc.rotation.y = -s * Math.PI / 2; TW.scene.add(rc); }
  }
  const HOSP_Z = 2 - 3 * 7.6;
  { const sg = WD.signBoard('LONGYEARBYEN', { w: 4.2, h: 0.8, bg: '#2E4E8A', fg: '#F2E6CF', font: 'Inter' }); sg.position.set(-5.4, 2.3, 4); sg.rotation.y = 0.35; TW.scene.add(sg);
    [-1.9, 1.9].forEach((dx) => { const p = cyl(0.07, 0.07, 2.4, mat({ color: '#4A3A30' }), -5.4 + dx * Math.cos(0.35), 1.2, 4 - dx * Math.sin(0.35), TW.scene, 8); });
    const bear = WD.signBoard('POLAR BEAR AREA', { w: 1.8, h: 0.45, bg: '#F2C230', fg: INK, font: 'Inter' }); bear.position.set(5.2, 1.9, 1); bear.rotation.y = -0.4; TW.scene.add(bear); cyl(0.05, 0.05, 1.8, mat({ color: '#4A3A30' }), 5.2, 0.9, 1, TW.scene, 6);
    for (let z = 0; z > -60; z -= 14) [-1, 1].forEach((s) => { const l = WD.lamp(); l.position.set(s * 4.2, 0, z); TW.scene.add(l); });
    [[2.2, -12, '#C8283A'], [-2.2, -30, '#2E4E8A']].forEach(([x, z, c]) => { const v = WD.car(c); v.position.set(x, 0, z); if (x < 0) v.rotation.y = Math.PI; TW.scene.add(v); }); }
  const crowd = WD.extras(TW.scene, [[-5.2, -6, 1], [5.0, -14, 2], [-5.4, -20, 3], [5.3, -27, 5], [-5.0, -35, 6]]);
  const twOlaf = person('olaf'); TW.scene.add(twOlaf.group);
  const twPeople = () => [...crowd, twOlaf];
  const view = (scene, from, look, people = []) => { const c = new THREE.PerspectiveCamera(42, 4 / 3, 0.1, 800); c.position.copy(from); c.lookAt(look); people.forEach((p) => p.face(c)); const t = WD.snapshot(E, scene, c); t.wrapS = THREE.RepeatWrapping; return t; };
  TW.snowfall(0);
  const townView = view(TW.scene, V3(0, 2.5, 8), V3(0, 2.4, -40), crowd);

  // ── BEDROOM ──────────────────────────────────────────────────────────
  const BR = WD.interior(E, { w: 6, depth: 5, h: 3.4, wall: '#3E5F8A', motif: '#4A6E9C', floor: '#8A5A36', ceiling: '#2A3A55', counterOn: false, litter: false, signText: null, picture: true, view: townView });
  const bed = new THREE.Group(); box(1.6, 0.35, 2.3, mat({ map: WD.T.planks('#6B3E26') }), 0, 0.18, 0, bed); box(1.5, 0.18, 2.2, mat({ color: '#F4EFE4' }), 0, 0.44, 0, bed);
  box(1.55, 0.12, 1.5, mat({ color: '#D8343F' }), 0, 0.56, 0.35, bed); box(0.9, 0.16, 0.45, mat({ color: '#FFFFFF' }), 0, 0.6, -0.8, bed); box(1.6, 1.1, 0.12, mat({ map: WD.T.planks('#6B3E26') }), 0, 0.55, -1.15, bed);
  bed.position.set(-0.6, 0, -3.3); BR.scene.add(bed);
  { const tbl = box(0.5, 0.6, 0.5, mat({ map: WD.T.planks('#7A3E24') }), 0.75, 0.3, -4.1, BR.scene); const mug = cyl(0.07, 0.07, 0.14, mat({ color: '#F2C230' }), 0.75, 0.67, -4.0, BR.scene); }
  const brOlaf = person('olaf'); BR.scene.add(brOlaf.group);

  // ── HOSPITAL ─────────────────────────────────────────────────────────
  const HS = WD.interior(E, { w: 6.4, depth: 5.5, h: 3.4, wall: '#BFE0E6', motif: '#CDE9EE', floor: '#D9D2C2', ceiling: '#E8EEF4', counterOn: false, litter: false, signText: 'SYKEHUS · HOSPITAL', picture: false, view: townView });
  const dsk = PR.desk(2.0); dsk.position.set(0.9, 0, -3.0); HS.scene.add(dsk);
  { const rc = WD.canvasTex('redcross', 256, 256, (g) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#C8283A'; g.fillRect(98, 40, 60, 176); g.fillRect(40, 98, 176, 60); });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat({ map: rc })); p.position.set(-1.9, 2.2, -5.38); HS.scene.add(p);
    const pst = PR.poster(['HELSE', '!WASH', 'YOUR HANDS'], { w: 0.9, h: 1.2 }); pst.position.set(2.2, 2.1, -5.38); HS.scene.add(pst);
    const cab = box(0.6, 1.8, 0.5, mat({ color: '#F4F6F8', metalness: 0.2, roughness: 0.4 }), -2.8, 0.9, -4.6, HS.scene);
    const plant = cyl(0.18, 0.14, 0.4, mat({ color: '#C9603F' }), 2.8, 0.2, -4.8, HS.scene); const lf = WD.tree(0.35); lf.position.set(2.8, 0.3, -4.8); HS.scene.add(lf); }
  const hsDoc = person('doc'), hsOlaf = person('olaf'); hsDoc.at(0.9, 0, -3.75); [hsDoc, hsOlaf].forEach((p) => HS.scene.add(p.group));
  const hsPeople = [hsDoc, hsOlaf];

  // ── CEMETERY ─────────────────────────────────────────────────────────
  const CM = polarSet(E, {});
  const crosses = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { const x = -5 + c * 2, z = -7 - r * 3; const cr = cross(1.0 + rnd(r * 6 + c) * 0.3); cr.position.set(x, 0, z); cr.rotation.y = (rnd(c + r * 9) - 0.5) * 0.15; cr.rotation.z = (rnd(c * 3 + r) - 0.5) * 0.08; CM.scene.add(cr); crosses.push(cr); }
  const newest = cross(1.3, '1950'); newest.position.set(2.2, 0, -3.6); CM.scene.add(newest);
  { const f = WD.fence(7, '#6B4A36'); f.position.set(-8, 0, -1.5); CM.scene.add(f); const f2 = WD.fence(7, '#6B4A36'); f2.position.set(1.6, 0, -1.5); CM.scene.add(f2); const g2 = WD.signBoard('GRAVLUND · 1918-1950', { w: 2.2, h: 0.4, bg: '#4A3A30', fg: '#F2E6CF', font: 'Inter' }); g2.position.set(-6.5, 1.3, -1.4); CM.scene.add(g2);
    const ch = new THREE.Group(); box(4, 3, 3, mat({ color: '#B5372E', map: WD.T.siding('#B5372E', [2, 2]) }), 0, 1.5, 0, ch); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3, 4), mat({ color: '#E9EEF4' })); sp.position.set(0, 4.8, 0); ch.add(sp); box(0.8, 1.6, 0.6, mat({ color: '#B5372E' }), 0, 3.6, 0, ch); ch.position.set(9, 0, -18); ch.rotation.y = -0.5; CM.scene.add(ch); }
  const coffins = [[-2.0, -5.0, 0.35, 0.15], [-4.0, -5.0, 0.5, -0.2], [3.6, -10.2, 0.4, 0.3]].map(([x, z, tilt, ry]) => { const c = coffin(); c.position.set(x, -0.25, z); c.rotation.set(tilt, ry, 0.05); CM.scene.add(c); return c; });
  const cmOlaf = person('olaf'); CM.scene.add(cmOlaf.group);
  const cmReset = (c0 = -0.35) => { CM.sun.key.intensity = 1.8; CM.sun.key.color.set('#FFE6CC'); cmOlaf.group.visible = true; coffins[0].position.y = c0; coffins[1].position.y = -0.25; coffins[1].rotation.x = 0.5; };

  // ── PERMAFROST CUTAWAY ───────────────────────────────────────────────
  const PF = { scene: new THREE.Scene() }; PF.scene.background = new THREE.Color('#0E1B2E'); PF.scene.environment = E.envMap; PF.scene.environmentIntensity = 0.4;
  { const k = new THREE.DirectionalLight('#FFFFFF', 2.6); k.position.set(4, 8, 6); k.castShadow = true; k.shadow.mapSize.set(1024, 1024); Object.assign(k.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); PF.scene.add(k, new THREE.HemisphereLight('#CFE6FF', '#1A2A40', 1.2));
    const rim = new THREE.PointLight('#7FD3FF', 18, 14, 1.5); rim.position.set(-3, 2, 3); PF.scene.add(rim); }
  const PFG = new THREE.Group(); PF.scene.add(PFG);
  box(6, 0.35, 3, mat({ map: snowTex([2, 1]) }), 0, 2.97, 0, PFG);
  box(6, 0.7, 3, mat({ map: WD.T.dirt('#7A5236', [2, 1], false) }), 0, 2.45, 0, PFG);
  const ice = box(6, 2.3, 3, new THREE.MeshPhysicalMaterial({ color: '#8FD0EC', roughness: 0.15, transmission: 0.35, transparent: true, opacity: 0.82, thickness: 1 }), 0, 0.95, 0, PFG); ice.castShadow = false;
  const pfCof = coffin(); pfCof.position.set(0, 0.55, 0); pfCof.rotation.y = Math.PI / 2; PFG.add(pfCof);
  for (let i = 0; i < 60; i++) { const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 + rnd(i) * 0.08), mat({ color: '#E8F8FF', emissive: '#9FE3FF', emissiveIntensity: 0.6 })); c.position.set((rnd(i * 2) - 0.5) * 5.6, rnd(i * 3) * 2.1 - 0.1, (rnd(i * 5) - 0.5) * 2.8); PFG.add(c); }
  [[-1.8], [1.9]].forEach(([x]) => { const c = cross(0.9); c.scale.setScalar(0.8); c.position.set(x, 3.14, -0.6); PFG.add(c); });
  const pfOlaf = person('olaf', { height: 1.2 }); pfOlaf.at(2.3, 3.14, 0.4); PFG.add(pfOlaf.group);

  // ── LAB ──────────────────────────────────────────────────────────────
  const LB = WD.interior(E, { w: 7, depth: 6, h: 3.6, wall: '#2F6B6A', motif: '#3B7D7A', floor: '#5A5F66', ceiling: '#22302F', counterOn: false, litter: false, signText: null, picture: false, view: view(CM.scene, V3(0, 2, 4), V3(0, 1.6, -20)) });
  { const core = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 16), new THREE.MeshPhysicalMaterial({ color: '#BFE8F7', roughness: 0.2, transmission: 0.3, transparent: true, opacity: 0.9 })); core.rotation.x = Math.PI / 2; core.position.set(0.5, 1.05, -2.85); LB.scene.add(core);
    const mic = new THREE.Group(); box(0.3, 0.06, 0.3, mat({ color: '#2A2A33' }), 0, 0.03, 0, mic); box(0.06, 0.5, 0.06, mat({ color: '#2A2A33' }), 0, 0.28, -0.1, mic); cyl(0.05, 0.05, 0.3, mat({ color: '#D9D2C2' }), 0, 0.5, 0, mic); mic.position.set(1.4, 0.88, -2.95); LB.scene.add(mic);
    const glow = new THREE.PointLight('#FF4A4A', 4, 3, 2); glow.position.set(0.7, 1.8, -3.0); LB.scene.add(glow); }
  const lbSci = person('sci'), lbSci2 = person('sci2'); { const dk = PR.desk(2.0); dk.position.set(0.9, 0, -3.0); LB.scene.add(dk); } lbSci.at(0.4, 0, -3.75); lbSci2.at(1.5, 0, -3.85); [lbSci, lbSci2].forEach((p) => LB.scene.add(p.group));

  // ── RUNWAY ───────────────────────────────────────────────────────────
  const RW = polarSet(E, { dusk: true });
  { const strip = new THREE.Mesh(new THREE.PlaneGeometry(200, 8), mat({ color: '#4A4F5A', roughness: 0.9 })); strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.02, -12); strip.receiveShadow = true; RW.scene.add(strip);
    for (let x = -90; x < 90; x += 6) box(3, 0.01, 0.25, mat({ color: '#F4F6F8' }), x, 0.03, -12, RW.scene);
    const tw = new THREE.Group(); box(2, 4, 2, mat({ color: '#E9EEF4' }), 0, 2, 0, tw); box(2.6, 1, 2.6, new THREE.MeshPhysicalMaterial({ color: '#7FB3D8', roughness: 0.1 }), 0, 4.5, 0, tw); box(2.8, 0.2, 2.8, mat({ color: '#C8283A' }), 0, 5.1, 0, tw); tw.position.set(-14, 0, -22); RW.scene.add(tw);
    const tsign = WD.signBoard('SVALBARD LUFTHAVN', { w: 3.4, h: 0.5, bg: '#2E4E8A', fg: '#F2E6CF', font: 'Inter' }); tsign.position.set(-6, 1.6, -5); tsign.rotation.y = 0.3; RW.scene.add(tsign); cyl(0.06, 0.06, 1.4, mat({ color: '#4A3A30' }), -6, 0.7, -5.05, RW.scene, 6); }
  const plane = new THREE.Group();
  { const wh = mat({ color: '#F4F6F8', roughness: 0.35, metalness: 0.1 }), red = mat({ color: '#C8283A', roughness: 0.4 });
    const f = cyl(1.1, 1.1, 14, wh, 0, 2.2, 0, plane, 24); f.rotation.z = Math.PI / 2;
    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), wh); nose.scale.set(1.6, 1, 1); nose.position.set(7, 2.2, 0); plane.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.4, 24), wh); tail.rotation.z = Math.PI / 2; tail.position.set(-8.7, 2.4, 0); plane.add(tail);
    box(3, 0.18, 16, wh, 0.5, 1.8, 0, plane); box(2.2, 3, 0.2, red, -8.6, 4.0, 0, plane); box(1.4, 0.14, 5, wh, -8.8, 2.6, 0, plane);
    box(14, 0.4, 2.24, red, 0, 1.6, 0, plane);
    for (let x = -5; x <= 5; x += 1) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), mat({ color: '#2B4A70' })); w.position.set(x, 2.5, 1.11); plane.add(w); }
    [[1.5, 3.2], [1.5, -3.2]].forEach(([x, z]) => { const e = cyl(0.5, 0.5, 2, mat({ color: '#9AA4B0', metalness: 0.4 }), x, 1.2, z, plane, 16); e.rotation.z = Math.PI / 2; });
    [[4, 0], [-1, 1.2], [-1, -1.2]].forEach(([x, z]) => cyl(0.3, 0.3, 0.3, mat({ color: '#1E1E24' }), x, 0.3, z, plane, 12).rotation.x = Math.PI / 2); }
  plane.position.set(2, 0, -12); RW.scene.add(plane);
  const rwOlaf = person('olaf'); RW.scene.add(rwOlaf.group);

  // ═════════════════════════ SHOTS ═════════════════════════
  // 1 · WIDE: the whole town from above, crane down toward the sign
  const wDying = Wd('dying', 0);
  add({ id: 'S01', at: 0, note: 'establishing wide: crane over the whole snowy town and mountains', draw(lt, d, t, blit) {
    const k = eio(clamp(lt / Math.min(d, 1.9))); TW.snowfall(t); twOlaf.group.visible = false;
    shoot(TW.scene, twPeople(), V3(16, 22, 26), V3(9, 12, 18), V3(0, 2, -30), V3(-2, 2, -12), k, { ...LK.out, fov: 46, aperture: 0.0004 }, 30);
    blit();
  } });
  cue(0.05, 'whoosh', { gain: 0.6 });
  // 1b · the sign, ILLEGAL? stamp on "law"
  { const st = wDying - 0.25, wl = Wd('law', 0);
    add({ id: 'S02', at: st, note: 'whip to the LONGYEARBYEN sign, slow push; ILLEGAL? stamp on "law"', draw(lt, d, t, blit) {
      TW.snowfall(t); twOlaf.group.visible = false; const k = mv(lt, d);
      shoot(TW.scene, twPeople(), V3(-1.5, 2.0, 10), V3(-2.6, 2.1, 8.2), V3(-5.4, 2.2, 4), null, k, LK.out, null, whipA(lt));
      blit(); smear(lt); stamp('DYING = ILLEGAL?', clamp((t - wl) / 0.2), { y: 560, size: 92 });
    } });
    cue(st, 'whoosh'); cue(wl, 'stamp', { gain: 0.9 }); cue(wl + 0.03, 'slam', { gain: 0.5 }); }

  // 2 · "Olaf lives in Longyearbyen," walking the snowy street
  { const st = cut(1), wm = Wd('morning', 1);
    add({ id: 'S03', at: st, note: 'Olaf strolls the snowy main street, camera tracks beside him', draw(lt, d, t, blit) {
      TW.snowfall(t); twOlaf.group.visible = true; const z = -4 - lt * 1.3; twOlaf.at(-1.2, 0, z);
      twOlaf.set({ legs: 'walk', phase: t * 7, mood: 'happy', armR: [lerp(30, 150, clamp(Math.sin(t * 3))), 10], blink: blink(t) });
      const k = mv(lt, d);
      shoot(TW.scene, twPeople(), V3(1.6, 1.5, z + 3.6), V3(1.2, 1.55, z + 2.9), V3(-1.2, 1.3, z), null, k, LK.out, null, whipA(lt));
      blit(); smear(lt);
    } });
    cue(st, 'whoosh');
    // 2b · bedroom: wakes up feeling awful
    add({ id: 'S04', at: wm - 0.1, note: 'bedroom: Olaf on the bed edge, dizzy, sweating; slow push-in', draw(lt, d, t, blit) {
      const aw = Wd('awful', 1); brOlaf.at(-0.6, 0, -2.0);
      brOlaf.set({ legs: 'sit', mood: t > aw - 0.1 ? 'dizzy' : 'tired', sweat: 1, armL: [30, -70], armR: [20, 10], lean: Math.sin(t * 3) * 6, blink: blink(t) });
      const k = mv(lt, d);
      shoot(BR.scene, [brOlaf], V3(1.4, 1.5, 0.8), V3(0.6, 1.35, -0.2), V3(-0.6, 1.0, -2.1), null, k, LK.room);
      blit();
    } });
    cue(wm - 0.1, 'whoosh', { gain: 0.5 }); cue(Wd('awful', 1), 'boing', { gain: 0.5 }); }

  // 3 · walks into the tiny hospital (whip pan in)
  { const st = cut(2);
    add({ id: 'S05', at: st, note: 'whip into the tiny hospital: Olaf shuffles in, doctor looks up', draw(lt, d, t, blit) {
      const k = mv(lt, d), x = lerp(-2.4, -0.6, clamp(lt / d)); hsOlaf.at(x, 0, -2.3);
      hsOlaf.set({ legs: 'walk', phase: t * 5, mood: 'tired', sweat: 1, lean: 6 }); hsDoc.set({ mood: 'neutral', look: [-0.6, 0], blink: blink(t) });
      shoot(HS.scene, hsPeople, V3(-1.8, 1.7, 1.6), V3(-0.6, 1.6, 1.2), V3(-1.0, 1.3, -3.0), V3(0.2, 1.3, -3.0), k, { ...LK.room, fov: 44 }, null, whipA(lt, -1));
      blit(); smear(lt, -1);
    } });
    cue(st, 'whoosh'); }
  // 4 · doctor hands him a plane ticket (punch on "ticket")
  { const st = cut(3), wt = Wd('ticket', 3);
    add({ id: 'S06', at: st, note: 'doctor slaps a BOARDING PASS on the desk; punch-in on "ticket"', draw(lt, d, t, blit) {
      hsOlaf.at(-0.3, 0, -2.2); const give = eo(clamp((t - wt + 0.35) / 0.3));
      hsDoc.set({ mood: t > wt ? 'smug' : 'neutral', armR: [lerp(20, 90, give), lerp(10, -30, give)], holdR: PROPS.planeTicket, v: 'tk', blink: blink(t) });
      hsOlaf.set({ mood: t > wt ? 'shock' : 'tired', sweat: 1 });
      const punch = eo(clamp((t - wt) / 0.22)), k = mv(lt, d);
      shoot(HS.scene, hsPeople, mix(V3(-1.6, 1.7, 1.2), V3(-1.2, 1.7, 0.6), k), mix(V3(-1.2, 1.7, 0.6), V3(0.3, 1.75, -1.3), punch), V3(0.3, 1.5, -3.2), V3(0.9, 1.6, -3.75), punch, LK.room);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(wt, 'stamp', { gain: 0.6 }); }
  // 5 · Olaf: "I'm sick, not going on holiday!"
  { const st = cut(4);
    add({ id: 'S07', at: st, note: 'Olaf close-up, angry, slow push-in while he talks', draw(lt, d, t, blit) {
      hsOlaf.at(-0.3, 0, -2.2); hsOlaf.set({ mood: 'angry', talk: talk(t), armL: [110, -40], armR: [60, -90], holdR: PROPS.planeTicket, v: 'tk2', sweat: 1 });
      hsDoc.set({ mood: 'smug' }); const k = mv(lt, d);
      shoot(HS.scene, hsPeople, V3(0.9, 1.75, -0.4), V3(0.55, 1.72, -0.9), V3(-0.3, 1.5, -2.2), null, k, LK.room, 1.6);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.4 }); }
  // 6 · doctor: "Exactly. You can't stay here."
  { const st = cut(5);
    add({ id: 'S08', at: st, note: 'reverse: doctor close-up, smug, slow push-in while she talks', draw(lt, d, t, blit) {
      hsOlaf.at(-0.3, 0, -2.2); hsDoc.set({ mood: 'smug', talk: talk(t), armL: [70, -60], blink: blink(t) }); hsOlaf.set({ mood: 'angry' });
      const k = mv(lt, d);
      shoot(HS.scene, hsPeople, V3(1.9, 1.75, -1.2), V3(1.5, 1.72, -1.9), V3(0.9, 1.55, -3.75), null, k, LK.room, 1.9);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.4 }); }

  // 7 · storms up to the cemetery
  { const st = cut(6);
    add({ id: 'S09', at: st, note: 'whip to the snowy cemetery: Olaf storms up between the crosses, wide', draw(lt, d, t, blit) { cmReset(-0.35);
      CM.snowfall(t); const z = lerp(1.5, -2.6, clamp(lt / d)); cmOlaf.at(0.2, 0, z);
      cmOlaf.set({ legs: 'walk', phase: t * 9, mood: 'angry', armL: [40, -20], armR: [40, -20], lean: 8 });
      const k = mv(lt, d);
      shoot(CM.scene, [cmOlaf], V3(2.2, 1.3, 4.5), V3(1.6, 1.8, 3.0), V3(0, 1.4, -4), V3(0.2, 1.2, z), k, { ...LK.out, fov: 44 }, null, whipA(lt));
      blit(); smear(lt);
    } });
    cue(st, 'whoosh'); }
  // 8 · the newest grave: 1950 (punch on "fifty")
  { const st = cut(7), wf = Wd('nineteen', 7);
    add({ id: 'S10', at: st, note: 'push-in on the newest cross, plaque 1950; punch on the date', draw(lt, d, t, blit) { cmReset(-0.35);
      CM.snowfall(t); cmOlaf.at(-0.9, 0, -2.8); cmOlaf.set({ mood: t > wf ? 'shock' : 'angry', look: [0.6, 0.3] });
      const punch = eo(clamp((t - wf) / 0.25)), k = mv(lt, d);
      shoot(CM.scene, [cmOlaf], mix(V3(3.4, 1.6, 0.2), V3(3.0, 1.5, -0.6), k), mix(V3(3.0, 1.5, -0.6), V3(2.25, 0.95, -1.9), punch), V3(0.6, 1.2, -3.4), V3(2.2, 0.68, -3.54), punch, LK.out, null);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(wf, 'ding'); }
  // 9 · coffins creeping up (low angle)
  { const st = cut(8), wc = Wd('creeping', 8);
    add({ id: 'S11', at: st, note: 'low angle: a coffin corner pushes up through the snow, Olaf recoils', draw(lt, d, t, blit) { cmReset(-0.35);
      CM.snowfall(t); const rise = eo(clamp((t - wc + 0.2) / 1.4)); coffins[0].position.y = lerp(-0.35, -0.05, rise);
      cmOlaf.at(-1.0, 0, -6.6); cmOlaf.set({ mood: rise > 0.3 ? 'shock' : 'worried', sweat: 1, armL: [lerp(20, 120, rise), 0], armR: [lerp(20, 120, rise), 0], lean: -rise * 8 });
      const k = mv(lt, d);
      shoot(CM.scene, [cmOlaf], V3(-3.4, 0.4, -1.6), V3(-3.0, 0.5, -2.3), V3(-2.0, 0.4, -5.0), V3(-1.2, 0.9, -6.2), k, { ...LK.out, fov: 44 }, 3.0);
      blit();
    } });
    cue(st, 'whoosh', { gain: 0.5 }); cue(wc, 'slide', { dur: 1.2, gain: 0.6 }); }
  // 10 · "So what's going on?" crash zoom
  { const st = cut(9);
    add({ id: 'S12', at: st, note: 'crash zoom on Olaf shocked face', draw(lt, d, t, blit) { cmReset(-0.05);
      CM.snowfall(t); cmOlaf.at(-0.6, 0, -3.4); cmOlaf.set({ mood: 'shock', sweat: 1, armL: [120, 0], armR: [120, 0], look: [0, -0.2] });
      const z = eo(clamp(lt / 0.35));
      shoot(CM.scene, [cmOlaf], V3(-0.4, 1.6, 0.4), V3(-0.55, 1.62, -2.2), V3(-0.6, 1.55, -3.4), null, z, LK.out, null);
      blit();
    } });
    cue(st, 'boing'); }

  // 11 · permafrost cutaway (orbit)
  { const st = cut(10), wp = Wd('permafrost', 10), wfz = Wd('freeze', 10);
    add({ id: 'S13', at: st, note: 'whip to the permafrost cutaway: snow, active layer, frozen ice with a coffin; slow orbit', draw(lt, d, t, blit) {
      pfOlaf.set({ mood: 'shock', look: [-0.4, 0.6] });
      const a = lerp(-0.5, 0.4, mv(lt, d)), r = 15; const from = V3(Math.sin(a) * r, 4.2, Math.cos(a) * r);
      shoot(PF.scene, [pfOlaf], from, from, V3(0, 1.4, 0), null, 0, LK.dark, r, whipA(lt));
      blit(); smear(lt);
      label('ACTIVE LAYER', 300, 640, clamp((t - wp) / 0.3), '#F2C9A0', 46); label('PERMAFROST', 760, 900, clamp((t - wp - 0.2) / 0.3), '#9FE3FF', 60);
      label('NO DECAY', 540, 1120, clamp((t - wfz) / 0.25), '#FFFFFF', 70);
    } });
    cue(st, 'whoosh'); cue(wp, 'ding', { gain: 0.6 }); cue(wfz, 'sparkle', { gain: 0.6 }); }

  // 12 · scientists, 1918 flu
  { const st = cut(11), wfl = Wd('flu', 11);
    add({ id: 'S14', at: st, note: 'lab: scientist lifts a glowing red vial, colleague gasps; push-in, 1918 tag', draw(lt, d, t, blit) {
      const up = eo(clamp((t - st - 0.2) / 0.6));
      lbSci.set({ mood: t > wfl ? 'shock' : 'proud', armR: [lerp(40, 130, up), lerp(-20, -10, up)], holdR: PROPS.vial, v: 'vial', blink: blink(t) });
      lbSci2.set({ mood: t > wfl ? 'shock' : 'neutral', sweat: t > wfl ? 1 : 0, look: [0, -0.4], armL: [30, -20] });
      const k = mv(lt, d);
      shoot(LB.scene, [lbSci, lbSci2], V3(-0.8, 1.7, 0.4), V3(0.1, 1.75, -1.1), V3(0.9, 1.5, -3.75), V3(0.5, 1.7, -3.75), k, { ...LK.room, bloom: 0.5 });
      blit(); label('1918 FLU', 540, 560, clamp((t - wfl + 0.1) / 0.25), '#FF6B6B', 96);
    } });
    cue(st, 'whoosh'); cue(wfl, 'alarm', { dur: 0.8, gain: 0.3 }); }

  // 13 · seasons: thaw, refreeze, coffin pushes up
  { const st = cut(12);
    add({ id: 'S15', at: st, note: 'cemetery time-lapse: light flicks summer/winter, a coffin rises', draw(lt, d, t, blit) {
      CM.snowfall(t); cmOlaf.group.visible = false; const k = clamp(lt / d), cyc = (Math.sin(lt * 9) + 1) / 2;
      CM.sun.key.intensity = lerp(1.2, 2.1, cyc); CM.sun.key.color.set(cyc > 0.5 ? '#FFE9B0' : '#CFE0FF');
      coffins[1].position.y = lerp(-0.4, 0.05, eio(k)); coffins[1].rotation.x = lerp(0.5, 0.25, k);
      shoot(CM.scene, [], V3(-6.4, 1.2, -1.6), V3(-5.9, 1.4, -2.4), V3(-4.0, 0.3, -5.0), null, mv(lt, d), LK.out, 3.2);
      blit(); label(cyc > 0.5 ? 'THAW' : 'FREEZE', 540, 620, 1, cyc > 0.5 ? '#FFD27A' : '#9FE3FF', 90);
    } });
    cue(st, 'whoosh'); cue(st + 0.2, 'slide', { dur: 3, gain: 0.5 }); }

  // 14 · "never illegal" — town wide, stamp MYTH
  { const st = cut(13), wn = Wd('never', 13);
    add({ id: 'S16', at: st, note: 'whip to the town from the hospital, pull back wide; ILLEGAL crossed out, MYTH stamped', draw(lt, d, t, blit) {
      TW.snowfall(t); CM.sun.key.intensity = 1.8; CM.sun.key.color.set('#FFE6CC'); twOlaf.group.visible = false;
      const k = mv(lt, d);
      shoot(TW.scene, twPeople(), V3(3.5, 2.2, HOSP_Z + 6), V3(2.5, 6.5, HOSP_Z + 16), V3(8, 2.6, HOSP_Z), V3(2, 2, HOSP_Z - 10), k, { ...LK.out, fov: 44 }, null, whipA(lt));
      blit(); smear(lt);
      const a = clamp((t - wn + 0.4) / 0.2);
      if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.font = '900 120px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 12; ctx.strokeStyle = '#0E1420'; ctx.strokeText('ILLEGAL', 540, 520); ctx.fillStyle = '#FFFFFF'; ctx.fillText('ILLEGAL', 540, 520);
        const x = clamp((t - wn) / 0.25); ctx.strokeStyle = '#C8283A'; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(260, 520); ctx.lineTo(lerp(260, 820, x), 520); ctx.stroke(); ctx.restore(); }
      stamp('MYTH', clamp((t - wn - 0.3) / 0.2), { y: 720, col: '#2FA36B', rot: 0.12, size: 130 });
    } });
    cue(st, 'whoosh'); cue(wn, 'zip', { gain: 0.6 }); cue(wn + 0.3, 'stamp', { gain: 0.9 }); }

  // 15 · runway ending
  { const st = cut(14), wf = Wd('fine', 14), wa = Wd('alive', 14);
    add({ id: 'S17', at: st, note: 'pink sunset runway: Olaf grabs the ticket, smug, plane behind; crane up', draw(lt, d, t, blit) {
      RW.snowfall(t); rwOlaf.at(-1.5, 0, -4);
      rwOlaf.set({ mood: t > wa - 0.2 ? 'laugh' : t > wf ? 'smug' : 'angry', talk: talk(t, t > wf), armR: [lerp(40, 140, eo(clamp((t - st) / 0.4))), -20], holdR: PROPS.planeTicket, v: 'tk3', armL: t > wa ? [150, 10] : [20, 10], blink: blink(t) });
      const k = mv(lt, d);
      shoot(RW.scene, [rwOlaf], V3(-1.6, 1.4, -1.2), V3(-0.4, 2.1, 0.6), V3(-1.5, 1.5, -4), V3(-1.2, 1.9, -5.5), k, { ...LK.out, fov: 46 }, null, whipA(lt));
      blit(); smear(lt);
    } });
    cue(st, 'whoosh'); cue(wf, 'pop', { gain: 0.6 }); cue(wa, 'sparkle', { gain: 0.6 }); }

  return { shots: S, cues: CUES };
}
