// Paper cut-out characters: construction-paper look, simple shapes, bold outlines, bright flat colours.
// Original characters (not copies of any show). Lives in the 3D world as a flat card with a real shadow.
//
//   const p = new Paper(look, { scale })   scale = metres per "unit" (1 = adult ~1.25 m tall)
//   p.set({ pose: 'stand'|'sit'|'ride', mood, talk, look:[dx,dy], blink, sweat,
//           armL/armR: [deg, len] (stand: 0 = down, 90 = sideways, 180 = up),
//           hands: [[dx,dy],[dx,dy]] metres from the hip (sit/ride: far hand, near hand), holdR/holdL prop })
//   p.at(x, y, z)  stand: feet point;  sit/ride: HIP point (put it on the seat)
//   p.face(cam)    only turns 'stand' cards; seated cards keep the vehicle's side orientation (set p.group.rotation.y)
import * as THREE from 'three';

const INK = '#141018';
const PX = 400;                 // canvas px per metre
const CW = 1024, CH = 1024, AX = 512, AY = 640;   // anchor (feet for stand / hip for seated) in the canvas
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

let grain = null;
function grainPattern(g) {
  if (!grain) { const c = document.createElement('canvas'); c.width = c.height = 256; const k = c.getContext('2d'); const d = k.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = 128 + (rnd(i * 0.37) - 0.5) * 70 + (rnd(Math.floor(i / 3) * 1.3) - 0.5) * 30; d.data.set([v, v, v, 38], i * 4); } k.putImageData(d, 0, 0); grain = c; }
  return g.createPattern(grain, 'repeat');
}
function paperFill(g, path, col) {
  g.fillStyle = col; g.fill(path);
  g.save(); g.clip(path); g.globalCompositeOperation = 'multiply'; g.fillStyle = grainPattern(g); g.fillRect(0, 0, CW, CH); g.restore();
  g.strokeStyle = INK; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke(path);
}
const P = () => new Path2D();
const ell = (x, y, rx, ry, rot = 0) => { const p = P(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
const poly = (pts) => { const p = P(); p.moveTo(...pts[0]); pts.slice(1).forEach((q) => p.lineTo(...q)); p.closePath(); return p; };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + ((1 << 24) + (f((n >> 16) & 255) << 16) + (f((n >> 8) & 255) << 8) + f(n & 255)).toString(16).slice(1); };

function mitten(g, x, y, col, ang = 0) {
  g.save(); g.translate(x, y); g.rotate(ang);
  paperFill(g, ell(0, 0, 22, 19), col);
  paperFill(g, ell(-14, -14, 9, 11, -0.6), col);
  g.restore();
}
function limb(g, pts, w, col) {
  // a thick paper strip along the points, drawn as outline + fill
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const path = P(); path.moveTo(...pts[0]); pts.slice(1).forEach((q) => path.lineTo(...q));
  g.strokeStyle = INK; g.lineWidth = w + 14; g.stroke(path);
  g.strokeStyle = col; g.lineWidth = w; g.stroke(path);
  g.restore();
}
function ik(x0, y0, tx, ty, l1, l2, bend = 1) {
  let dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy); const maxd = (l1 + l2) * 0.98; if (d > maxd) { const k = maxd / d; tx = x0 + dx * k; ty = y0 + dy * k; dx *= k; dy *= k; d = maxd; }
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), base = Math.atan2(dy, dx), ang = base + bend * a;
  return [[x0 + Math.cos(ang) * l1, y0 + Math.sin(ang) * l1], [tx, ty]];
}
function arm2(g, x0, y0, tx, ty, l, col, w = 26, bend = 1) { const [e, h] = ik(x0, y0, tx, ty, l, l, bend); limb(g, [[x0, y0], e, h], w, col); return h; }
function shoe(g, x, y, dir = 1) { paperFill(g, ell(x + dir * 10, y - 10, 30, 15), '#1E1C22'); }

function drawHead(g, L, S, hx, hy, side) {
  // side: 0 = front, 1 = facing right (profile-ish, both eyes shifted forward)
  const rx = 128, ry = 112;
  const head = ell(hx, hy, rx, ry);
  paperFill(g, head, L.skin);
  const fx = hx + side * 46;                   // face centre
  // cheeks/blush
  if (L.blush) { g.fillStyle = 'rgba(230,90,90,0.35)'; g.beginPath(); g.ellipse(fx - 60, hy + 34, 20, 12, 0, 0, 7); g.ellipse(fx + 60, hy + 34, 20, 12, 0, 0, 7); g.fill(); }
  // eyes: two big ovals that touch
  const ex = [fx - 30, fx + 30], ey = hy - 6, blink = S.blink || 0;
  const mood = S.mood || 'neutral';
  ex.forEach((x, i) => {
    const e = ell(x, ey, 32, 38 * (1 - blink * 0.9));
    g.fillStyle = '#FFFFFF'; g.fill(e); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(e);
    if (blink < 0.6) { const [lx, ly] = S.look || [side * 0.6, 0]; let px = x + 6 * (i ? 1 : -1) * 0.3 + lx * 12, py = ey + ly * 12;
      if (mood === 'dizzy') { g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(x + Math.cos(a) * a * 1.8, ey + Math.sin(a) * a * 1.8); g.stroke(); }
      else { g.fillStyle = INK; g.beginPath(); g.arc(px, py, mood === 'shock' ? 5 : 8, 0, 7); g.fill(); } }
  });
  // brows
  const brow = { angry: [0.45, -0.45], worried: [-0.35, 0.35], smug: [0.1, -0.3], shock: [-0.1, 0.1], sly: [0.3, -0.1] }[mood];
  if (brow) { g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; ex.forEach((x, i) => { const a = brow[i]; g.beginPath(); g.moveTo(x - 24, ey - 50 - a * 18); g.lineTo(x + 24, ey - 50 + a * 18); g.stroke(); }); }
  // mustache
  if (L.mustache) { const m = P(); m.moveTo(fx - 46, hy + 50); m.quadraticCurveTo(fx - 20, hy + 26, fx, hy + 40); m.quadraticCurveTo(fx + 20, hy + 26, fx + 46, hy + 50); m.quadraticCurveTo(fx + 20, hy + 46, fx, hy + 48); m.quadraticCurveTo(fx - 20, hy + 46, fx - 46, hy + 50); paperFill(g, m, L.hair || '#3A2418'); }
  // mouth
  const my = hy + 66, talk = S.talk || 0;
  g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round';
  if (mood === 'shock' || talk > 0.3) { const m = ell(fx, my, 18 + talk * 6, 12 + (mood === 'shock' ? 18 : talk * 16)); g.fillStyle = '#5A1622'; g.fill(m); g.stroke(m); }
  else if (mood === 'happy' || mood === 'smug' || mood === 'laugh') { g.beginPath(); g.moveTo(fx - 26, my - 4); g.quadraticCurveTo(fx + (mood === 'smug' ? 10 : 0), my + 18, fx + 28, my - (mood === 'smug' ? 12 : 4)); g.stroke(); }
  else if (mood === 'worried' || mood === 'sad') { g.beginPath(); g.moveTo(fx - 22, my + 8); g.quadraticCurveTo(fx, my - 8, fx + 22, my + 8); g.stroke(); }
  else { g.beginPath(); g.moveTo(fx - 16, my); g.lineTo(fx + 16, my); g.stroke(); }
  if (S.sweat) { const d = P(); d.moveTo(hx - side * 20 - 100, hy - 70); d.quadraticCurveTo(hx - side * 20 - 86, hy - 40, hx - side * 20 - 100, hy - 32); d.quadraticCurveTo(hx - side * 20 - 114, hy - 40, hx - side * 20 - 100, hy - 70); g.fillStyle = '#9FD3F2'; g.fill(d); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(d); }
  // hat
  const hc = L.hatCol || '#C8452E';
  if (L.hat === 'cap') { const c = P(); c.moveTo(hx - rx + 4, hy - 40); c.bezierCurveTo(hx - rx + 10, hy - ry - 40, hx + rx - 10, hy - ry - 40, hx + rx - 4, hy - 40); c.closePath(); paperFill(g, c, hc);
    const b = ell(hx + side * 70 + (side ? 40 : 0), hy - 40, side ? 90 : 120, 16); paperFill(g, b, shade(hc, 0.8)); paperFill(g, ell(hx, hy - ry - 6, 14, 10), shade(hc, 0.8)); }
  else if (L.hat === 'beanie') { const c = P(); c.moveTo(hx - rx + 2, hy - 30); c.bezierCurveTo(hx - rx, hy - ry - 60, hx + rx, hy - ry - 60, hx + rx - 2, hy - 30); c.closePath(); paperFill(g, c, hc);
    paperFill(g, poly([[hx - rx - 4, hy - 52], [hx + rx + 4, hy - 52], [hx + rx + 4, hy - 22], [hx - rx - 4, hy - 22]]), L.hatBand || '#E2B33C'); paperFill(g, ell(hx, hy - ry - 30, 24, 20), L.hatBand || '#E2B33C'); }
  else if (L.hat === 'helmet') { const c = P(); c.moveTo(hx - rx - 8, hy - 10); c.bezierCurveTo(hx - rx - 8, hy - ry - 70, hx + rx + 8, hy - ry - 70, hx + rx + 8, hy - 10); c.closePath(); paperFill(g, c, hc);
    paperFill(g, poly([[hx - rx - 8, hy - 30], [hx + rx + 8, hy - 30], [hx + rx + 8, hy - 8], [hx - rx - 8, hy - 8]]), shade(hc, 0.75)); }
  else if (L.hair) { const c = P(); c.moveTo(hx - rx + 6, hy - 50); for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; c.lineTo(hx + Math.cos(a) * (rx + 4), hy - 20 + Math.sin(a) * (ry + 8 + (i % 2) * 14)); } c.closePath(); paperFill(g, c, L.hair); }
}

function drawProp(g, fn, x, y, k = 0.55) { if (!fn) return; g.save(); g.translate(x, y); g.scale(k, k); fn(g, 0, 70); g.restore(); }

export function drawPaper(g, look, st) {
  const L = { skin: '#F2C9A0', shirt: '#3C78C8', pants: '#3A3F55', hat: 'none', ...look };
  const S = { pose: 'stand', mood: 'neutral', ...st };
  const m = PX * (L.scale || 1);                  // px per metre at this character's size
  const hipW = 0.36 * m, torsoH = 0.34 * m, legL = 0.36 * m, headR = 128;
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  const jit = (S.jitter || 0) * (rnd(S.frame || 0) - 0.5) * 0.06; // crude cut-out wobble
  g.translate(AX, AY); g.rotate(jit); g.translate(-AX, -AY);
  if (S.pose === 'stand') {
    const fy = AY, hy = fy - legL, sy = hy - torsoH;
    // legs: short paper strips
    [-1, 1].forEach((s) => { const lx = AX + s * hipW * 0.25 + (S.walk ? Math.sin((S.phase || 0) + (s > 0 ? Math.PI : 0)) * 18 : 0); limb(g, [[AX + s * hipW * 0.25, hy], [lx, fy - 14]], 34, L.pants); shoe(g, lx, fy, s); });
    // torso trapezoid (coat)
    const torso = poly([[AX - hipW * 0.42, sy], [AX + hipW * 0.42, sy], [AX + hipW * 0.56, hy + 8], [AX - hipW * 0.56, hy + 8]]); paperFill(g, torso, L.shirt);
    g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(AX, sy + 10); g.lineTo(AX, hy); g.stroke();
    [0.35, 0.6].forEach((t) => paperFill(g, ell(AX + 10, sy + torsoH * t, 6, 6), INK));
    if (L.scarf) paperFill(g, poly([[AX - hipW * 0.45, sy - 6], [AX + hipW * 0.45, sy - 6], [AX + hipW * 0.42, sy + 22], [AX - hipW * 0.42, sy + 22]]), L.scarf);
    if (L.tie) paperFill(g, poly([[AX - 10, sy + 4], [AX + 10, sy + 4], [AX + 14, sy + 70], [AX, sy + 86], [AX - 14, sy + 70]]), L.tie);
    // arms
    const arm = (s, [deg, len = 1, elb = 0], hold) => { const a = deg * Math.PI / 180, b = (deg + elb) * Math.PI / 180, l = 0.16 * m * len, x0 = AX + s * hipW * 0.44, y0 = sy + 22;
      const ex = x0 + s * Math.sin(a) * l, ey = y0 + Math.cos(a) * l, hx = ex + s * Math.sin(b) * l, hyy = ey + Math.cos(b) * l;
      limb(g, [[x0, y0], [ex, ey], [hx, hyy]], 26, L.shirt); drawProp(g, hold, hx, hyy); mitten(g, hx, hyy, L.mitten || shade(L.shirt, 0.7), s < 0 ? 0.4 : -0.4); };
    arm(-1, S.armL || [12], S.holdL); arm(1, S.armR || [12], S.holdR);
    drawHead(g, L, S, AX, sy - headR * 0.78, 0);
  } else if (S.pose === 'side') {
    // standing profile facing right; anchor = feet; hands relative to the feet (metres)
    const fy = AY, hy = fy - legL, sy = hy - torsoH, tw = hipW * 0.5, kk = PX / (L.size || 1);
    const st = S.walk ? Math.sin(S.phase || 0) * 22 : (S.stride ?? 44);
    limb(g, [[AX - 4, hy], [AX - 4 - st, fy - 14]], 34, shade(L.pants, 0.8)); shoe(g, AX - 4 - st, fy, 1);
    const [[fx1, fy1], [nx1, ny1]] = (S.hands || [[0.2, 0.5], [0.2, 0.5]]).map(([dx, dy]) => [AX + dx * kk, fy - dy * kk]);
    const AL = 0.27 * m; const fh = arm2(g, AX - 4, sy + 24, fx1, fy1, AL, shade(L.shirt, 0.72), 24, 1); mitten(g, fh[0], fh[1], shade(L.mitten || shade(L.shirt, 0.7), 0.8), 0.3); drawProp(g, S.holdL, fh[0], fh[1]);
    limb(g, [[AX + 4, hy], [AX + 4 + st, fy - 14]], 34, L.pants); shoe(g, AX + 4 + st, fy, 1);
    paperFill(g, poly([[AX - tw * 0.85, sy], [AX + tw * 0.85, sy], [AX + tw, hy + 8], [AX - tw * 1.05, hy + 8]]), L.shirt);
    drawHead(g, L, S, AX + 10, sy - headR * 0.8, 1);
    const nh = arm2(g, AX + 4, sy + 26, nx1, ny1, AL, L.shirt, 26, 1); drawProp(g, S.holdR, nh[0], nh[1]); mitten(g, nh[0], nh[1], L.mitten || shade(L.shirt, 0.7), -0.3);
  } else {
    // seated profile facing right; anchor = hip
    const ride = S.pose === 'ride', hx = AX, hy = AY;
    const lean = (S.lean ?? (ride ? 14 : 4)) * Math.PI / 180;
    const sx = hx + Math.sin(lean) * torsoH, sy = hy - Math.cos(lean) * torsoH;
    const kk = PX / (L.size || 1); const [[fhx, fhy], [nhx, nhy]] = (S.hands || [[0.45, 0.3], [0.45, 0.3]]).map(([dx, dy]) => [hx + dx * kk, hy - dy * kk]);
    // far arm (behind torso, darker)
    const AL = (ride ? 0.34 : 0.26) * m; const fh = arm2(g, sx - 6, sy + 24, fhx - 8, fhy - 4, AL, shade(L.shirt, 0.72), 24, 1); mitten(g, fh[0], fh[1], shade(L.mitten || shade(L.shirt, 0.7), 0.8), 0.3);
    // legs: thigh forward, shin down (car) / thigh forward-down, shin down-back to the footboard (ride)
    const kneeX = hx + (ride ? 0.3 : 0.38) * m, kneeY = hy + (ride ? 0.1 : 0.02) * m;
    const footX = kneeX + (ride ? -0.02 : 0.06) * m, footY = kneeY + (S.shin ?? (ride ? 0.32 : 0.36)) * m;
    limb(g, [[hx, hy - 4], [kneeX, kneeY], [footX, footY - 12]], 38, shade(L.pants, 0.8));
    limb(g, [[hx + 6, hy + 2], [kneeX + 8, kneeY + 6], [footX + 8, footY - 8]], 38, L.pants); shoe(g, footX + 12, footY, 1);
    // torso
    const tw = hipW * 0.5;
    const torso = poly([[sx - tw * 0.85, sy], [sx + tw * 0.85, sy], [hx + tw, hy + 10], [hx - tw * 1.05, hy + 10]]); paperFill(g, torso, L.shirt);
    if (L.scarf) paperFill(g, poly([[sx - tw * 0.95, sy - 6], [sx + tw * 0.95, sy - 6], [sx + tw * 0.9, sy + 22], [sx - tw * 0.9, sy + 22]]), L.scarf);
    if (L.tie) paperFill(g, poly([[sx + tw * 0.6, sy + 4], [sx + tw * 0.85, sy + 4], [sx + tw * 0.9, sy + 70], [sx + tw * 0.7, sy + 80]]), L.tie);
    // head
    drawHead(g, L, S, sx + 10, sy - headR * 0.8, 1);
    // near arm (in front)
    const nh = arm2(g, sx + 4, sy + 26, nhx, nhy, AL, L.shirt, 26, 1); drawProp(g, S.holdR, nh[0], nh[1]); mitten(g, nh[0], nh[1], L.mitten || shade(L.shirt, 0.7), -0.3);
  }
  g.restore();
}

let shadowTex = null;
function blobTex() { if (shadowTex) return shadowTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(20,16,24,0.7)'); gr.addColorStop(1, 'rgba(20,16,24,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return (shadowTex = new THREE.CanvasTexture(c)); }

export class Paper {
  // Real paper card: white cut margin, visible card thickness (stacked edge layers), slight bend, lit by the scene, real cast shadow.
  constructor(look = {}, { res = 2, castShadow = true, thick = 0.012, margin = 0 } = {}) {
    this.look = look; this.res = res; this.margin = margin;
    this.canvas = document.createElement('canvas'); this.canvas.width = CW * res; this.canvas.height = CH * res; this.g = this.canvas.getContext('2d');
    this.tmp = document.createElement('canvas'); this.tmp.width = this.canvas.width; this.tmp.height = this.canvas.height;
    this.sil = document.createElement('canvas'); this.sil.width = this.canvas.width; this.sil.height = this.canvas.height;
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.silTex = new THREE.CanvasTexture(this.sil); this.silTex.colorSpace = THREE.SRGBColorSpace;
    const W = CW / PX, H = CH / PX;
    const bent = () => { const geo = new THREE.PlaneGeometry(W, H, 24, 1); geo.translate(W / 2 - AX / PX, H / 2 - (CH - AY) / PX, 0);
      const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i); P.setZ(i, -0.035 * x * x); } geo.computeVertexNormals(); return geo; };
    const geo = bent();
    this.mat = new THREE.MeshStandardMaterial({ map: this.tex, transparent: false, alphaTest: 0.5, side: THREE.FrontSide, roughness: 0.92, metalness: 0, envMapIntensity: 0.9, emissive: '#FFFFFF', emissiveMap: this.tex, emissiveIntensity: 0.18 });
    this.back = new THREE.MeshStandardMaterial({ map: this.tex, alphaTest: 0.5, side: THREE.BackSide, roughness: 0.92, envMapIntensity: 0.9, emissive: '#FFFFFF', emissiveMap: this.tex, emissiveIntensity: 0.18 });
    this.edge = new THREE.MeshStandardMaterial({ map: this.silTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95, color: '#B8AA92' });
    this.mesh = new THREE.Group();
    const front = new THREE.Mesh(geo, this.mat); front.castShadow = castShadow; front.receiveShadow = true;
    front.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.silTex, alphaTest: 0.5 });
    this.mesh.add(front);
    const n = 6; for (let i = 1; i <= n; i++) { const e = new THREE.Mesh(geo, i === n ? this.back : this.edge); e.position.z = -thick * i / n; e.receiveShadow = true; this.mesh.add(e); }
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: 0.45 })); this.blob.rotation.x = -Math.PI / 2; this.blob.position.y = 0.01;
    this.mesh.scale.setScalar(look.size || 1); this.blob.scale.setScalar(look.size || 1);
    this.group = new THREE.Group(); this.pivot = new THREE.Group(); this.pivot.add(this.mesh); this.group.add(this.pivot, this.blob);
    this.key = ''; this.set({});
  }
  set(st = {}) {
    const key = JSON.stringify(st, (k, v) => (typeof v === 'function' ? String(v).length : v)); if (key === this.key) return this; this.key = key; this.st = st;
    const t = this.tmp.getContext('2d'); t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, this.tmp.width, this.tmp.height); t.scale(this.res, this.res); drawPaper(t, this.look, st);
    // silhouette dilated by the cut margin (the white paper border you get from cutting with scissors)
    const sg = this.sil.getContext('2d'); sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, this.sil.width, this.sil.height);
    const r = this.margin * this.res; if (r > 0) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; sg.drawImage(this.tmp, Math.cos(a) * r, Math.sin(a) * r); }
    sg.drawImage(this.tmp, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#EAE3D6'; sg.fillRect(0, 0, this.sil.width, this.sil.height); sg.globalCompositeOperation = 'source-over';
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.canvas.width, this.canvas.height); g.drawImage(this.sil, 0, 0);
    // faint fibre speckle on the border, then the drawing
    if (this.margin > 0) { g.globalAlpha = 0.5; g.globalCompositeOperation = 'source-atop'; } for (let i = 0; i < (this.margin > 0 ? 900 : 0); i++) { g.fillStyle = rnd(i) > 0.5 ? '#D9D0C0' : '#F1ECE2'; g.fillRect(rnd(i * 3.1) * this.canvas.width, rnd(i * 7.7) * this.canvas.height, 3, 3); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.drawImage(this.tmp, 0, 0);
    this.blob.visible = ['stand', 'side'].includes(st.pose || 'stand'); this.tex.needsUpdate = true; this.silTex.needsUpdate = true; return this;
  }
  face(cam) { if ((this.st.pose || 'stand') !== 'stand') { return this; } const p = new THREE.Vector3(); this.group.getWorldPosition(p); this.pivot.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z) - this.group.rotation.y + (this.st.turn || 0); return this; }
  at(x, y, z) { this.group.position.set(x, y, z); return this; }
}
