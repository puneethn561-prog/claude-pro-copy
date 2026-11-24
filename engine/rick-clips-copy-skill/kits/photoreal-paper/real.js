// Photoreal world kit for this reel: CC0 HDRI photo backgrounds (Poly Haven) with a grounded projection, shadow catcher,
// physically-based vehicles with opening doors and real interiors, NASA Earth, GPS satellite.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';
import { SHADOW } from './engine.js';

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const phys = (o = {}) => new THREE.MeshPhysicalMaterial({ roughness: 0.5, metalness: 0, ...o });
const std = (o = {}) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0, ...o });
const shadowy = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; };

// ── HDRI photo world ──
const hdrCache = {};
export async function loadHDR(name) {
  if (hdrCache[name]) return hdrCache[name];
  const t = await new RGBELoader().setDataType(THREE.FloatType).loadAsync(`assets/${name}.hdr`);
  t.mapping = THREE.EquirectangularReflectionMapping;
  // brightest pixel = the sun direction (for the shadow light)
  const { data, width: w, height: h } = t.image; let best = 0, bi = 0;
  for (let i = 0; i < data.length; i++) { const v = data[i]; data[i] = Number.isFinite(v) ? Math.min(v, 3000) : 0; } t.needsUpdate = true;
  for (let i = 0; i < w * h; i++) { const l = data[i * 4] * 0.3 + data[i * 4 + 1] * 0.59 + data[i * 4 + 2] * 0.11; if (l > best) { best = l; bi = i; } }
  const u = (bi % w) / w, v = 1 - Math.floor(bi / w) / h;
  const el = (v - 0.5) * Math.PI, az = (u - 0.5) * 2 * Math.PI;
  const sunDir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize();
  return (hdrCache[name] = { tex: t, sunDir, sunLum: best });
}
/** scene with the photo as background (ground projected), image-based light, matched sun + shadow catcher */
export async function photoWorld(E, name, { camHeight = 1.7, radius = 80, sunI = 2.2, sunCol = '#FFF1DE', envI = 1.0, box = 10, target = [0, 0, 0], rotY = 0 } = {}) {
  const H = await loadHDR(name), scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(E.renderer); const env = pm.fromEquirectangular(H.tex).texture;
  scene.environment = env; scene.environmentIntensity = envI; scene.environmentRotation = new THREE.Euler(0, rotY, 0); scene.backgroundRotation = new THREE.Euler(0, rotY, 0);
  const sky = new GroundedSkybox(H.tex, camHeight, radius, 96); sky.position.y = camHeight - 0.01; sky.rotation.y = rotY; scene.add(sky);
  const sd = H.sunDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY); if (sd.y < 0.25) sd.y = 0.25; sd.normalize();
  const sun = new THREE.DirectionalLight(sunCol, sunI); sun.position.copy(new THREE.Vector3(...target).addScaledVector(sd, 30)); sun.target.position.set(...target);
  sun.castShadow = true; sun.shadow.mapSize.set(SHADOW, SHADOW); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  Object.assign(sun.shadow.camera, { left: -box, right: box, top: box, bottom: -box, near: 1, far: 80 }); sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun, sun.target);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(radius, radius), new THREE.ShadowMaterial({ opacity: 0.55, color: '#101014' })); catcher.rotation.x = -Math.PI / 2; catcher.position.y = 0.002; catcher.receiveShadow = true; scene.add(catcher);
  return { scene, sun, sky, env, sunDir: sd };
}

// ── rounded box ──
export function rbox(w, h, d, r, m) {
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3); const s = new THREE.Shape(), x = w / 2, y = h / 2;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  const b = Math.min(r * 0.6, d * 0.3); const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 4, curveSegments: 8 });
  g.center(); g.computeVertexNormals(); const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; return mesh;
}
const smoothPath = (pts, n = 6) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'catmullrom', 0.3).getPoints(pts.length * n);

// ── car-paint + parts ──
export const MAT = {
  taxi: () => phys({ color: '#E8A60C', roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06 }),
  paint: (c) => phys({ color: c, roughness: 0.32, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }),
  glass: () => phys({ color: '#1A2430', roughness: 0.03, metalness: 0.2, transparent: true, opacity: 0.38, envMapIntensity: 1.4, side: THREE.DoubleSide, depthWrite: false }),
  chrome: () => std({ color: '#D6D9DE', metalness: 1, roughness: 0.12 }),
  rubber: () => std({ color: '#141416', roughness: 0.85 }),
  plastic: () => std({ color: '#1D1E22', roughness: 0.55 }),
  leather: (c = '#2B2522') => phys({ color: c, roughness: 0.55, sheen: 0.4, sheenColor: '#5A4A40' }),
};
export function wheel(r = 0.33, w = 0.22) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.TorusGeometry(r * 0.74, r * 0.27, 20, 48), MAT.rubber()); tyre.scale.z = w / (r * 0.54); g.add(tyre);
  const rimM = std({ color: '#A9AEB5', metalness: 1, roughness: 0.22 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, w * 0.8, 40), rimM); rim.rotation.x = Math.PI / 2; g.add(rim);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r * 0.5, 0.02, 40), std({ color: '#2A2C30', metalness: 0.6, roughness: 0.4 })); face.rotation.x = Math.PI / 2; face.position.z = w * 0.41; g.add(face);
  for (let i = 0; i < 5; i++) { const sp = rbox(0.06, r * 0.9, 0.04, 0.02, rimM); sp.position.z = w * 0.43; sp.rotation.z = (i / 5) * Math.PI * 2; sp.position.x = 0; g.add(sp); const p = new THREE.Group(); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.12, w * 0.9, 20), MAT.chrome()); hub.rotation.x = Math.PI / 2; g.add(hub);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 0.03, 32), std({ color: '#55575C', metalness: 0.9, roughness: 0.35 })); disc.rotation.x = Math.PI / 2; disc.position.z = w * 0.25; g.add(disc);
  return shadowy(g);
}
function stripMesh(outline, halfW, crown, mats, segs = 10) {
  // a ruled surface along the car's top outline, swept across the width with a crown and side tuck
  const pos = [], uv = [], idx = [], groups = [];
  const n = outline.length;
  for (let i = 0; i < n; i++) for (let j = 0; j <= segs; j++) {
    const u = j / segs, s = u * 2 - 1, p = outline[i];
    const tuck = (p.y > 1.05 ? 0.16 : 0.0) * Math.abs(s) ** 3;
    pos.push(p.x, p.y + crown * (1 - s * s) * (p.y > 0.9 ? 1 : 0.3), s * (halfW - tuck)); uv.push(i / (n - 1), u);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j, b = a + segs + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  // material groups per outline segment
  let start = 0, cur = mats.at(outline[0]);
  for (let i = 0; i < n - 1; i++) { const m = mats.at(outline[i], outline[i + 1]); if (m !== cur) { geo.addGroup(start * segs * 6, (i - start) * segs * 6, cur); start = i; cur = m; } }
  geo.addGroup(start * segs * 6, (n - 1 - start) * segs * 6, cur);
  geo.computeVertexNormals(); return geo;
}
/**
 * A taxi / sedan with a real hollow cabin: side panels with window openings, the front-left door on a hinge (`car.door.rotation.y`
 * opens it: 0 shut, -1.2 wide), seats, dashboard, steering wheel. Car points along +x; left side (driver) is -z.
 * Returns group with .door, .seatDriver (world pos for a seated toon's feet), .steer
 */
export function sedan({ paint = MAT.taxi(), taxiSign = true } = {}) {
  const g = new THREE.Group(), L = 4.6, HW = 0.88, glass = MAT.glass(), trim = MAT.plastic();
  const top = smoothPath([[2.32, 0.42], [2.36, 0.66], [2.28, 0.86], [2.0, 0.95], [1.4, 1.0], [0.92, 1.04], [0.55, 1.26], [0.22, 1.42], [-0.3, 1.47], [-0.9, 1.45], [-1.25, 1.3], [-1.62, 1.07], [-2.05, 1.03], [-2.3, 0.96], [-2.36, 0.7], [-2.32, 0.42]], 8);
  const isGlass = (a, b) => { const mx = b ? (a.x + b.x) / 2 : a.x, my = b ? (a.y + b.y) / 2 : a.y; return my > 1.06 && ((mx < 0.9 && mx > 0.25) || (mx < -1.0 && mx > -1.6)); };
  const geo = stripMesh(top, HW, 0.06, { at: (a, b) => (isGlass(a, b) ? 1 : 0) });
  const shell = new THREE.Mesh(geo, [paint, glass]); shell.castShadow = shell.receiveShadow = true; g.add(shell);
  // side profile shape (with wheel arches)
  const prof = (s) => {
    s.moveTo(-2.32, 0.42); [[-2.36, 0.7], [-2.3, 0.96], [-2.05, 1.03], [-1.62, 1.07], [-1.25, 1.3], [-0.9, 1.45], [-0.3, 1.47], [0.22, 1.42], [0.55, 1.26], [0.92, 1.04], [1.4, 1.0], [2.0, 0.95], [2.28, 0.86], [2.36, 0.66], [2.32, 0.42]].forEach(([x, y]) => s.lineTo(x, y));
    s.lineTo(1.86, 0.42); s.absarc(1.42, 0.36, 0.44, 0, Math.PI, false); s.lineTo(-0.98, 0.42); s.absarc(-1.42, 0.36, 0.44, 0, Math.PI, false); s.lineTo(-2.32, 0.42); return s;
  };
  const doorPoly = [[0.9, 0.46], [0.9, 1.03], [0.52, 1.25], [0.2, 1.39], [-0.3, 1.43], [-0.3, 0.46]];
  const dWin = [[0.78, 1.07], [0.5, 1.24], [0.2, 1.36], [-0.22, 1.39], [-0.22, 1.07]];
  const rWin = [[-0.38, 1.07], [-0.38, 1.4], [-0.88, 1.41], [-1.22, 1.27], [-1.5, 1.08]];
  const fWinR = [[0.82, 1.07], [0.5, 1.25], [0.2, 1.38], [-0.3, 1.41], [-0.3, 1.07]];
  const hole = (pts) => { const p = new THREE.Path(); p.moveTo(...pts[0]); pts.slice(1).forEach((q) => p.lineTo(...q)); p.closePath(); return p; };
  const sideGeo = (holes) => { const s = prof(new THREE.Shape()); holes.forEach((h) => s.holes.push(hole(h))); const e = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 16 }); return e; };
  const left = new THREE.Mesh(sideGeo([doorPoly, rWin]), paint); left.position.z = -HW - 0.02; g.add(left);
  const right = new THREE.Mesh(sideGeo([fWinR, rWin]), paint); right.position.z = HW - 0.02; g.add(right);
  const winMesh = (pts, z) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); pts.slice(1).forEach((q) => s.lineTo(...q)); const m = new THREE.Mesh(new THREE.ShapeGeometry(s), glass); m.position.z = z; return m; };
  g.add(winMesh(rWin, -HW), winMesh(rWin, HW), winMesh(fWinR, HW));
  // the door: hinge at its front edge (x 0.9)
  const hinge = new THREE.Group(); hinge.position.set(0.9, 0, -HW - 0.02); g.add(hinge);
  const ds = new THREE.Shape(); ds.moveTo(doorPoly[0][0] - 0.9, doorPoly[0][1]); doorPoly.slice(1).forEach(([x, y]) => ds.lineTo(x - 0.9 - 0.008, y - 0.004)); ds.closePath(); ds.holes.push(hole(dWin.map(([x, y]) => [x - 0.9, y])));
  const door = new THREE.Mesh(new THREE.ExtrudeGeometry(ds, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }), paint); door.position.z = -0.012; hinge.add(door);
  const dg = winMesh(dWin.map(([x, y]) => [x - 0.9, y]), 0.02); hinge.add(dg);
  const inner = rbox(1.05, 0.5, 0.03, 0.04, MAT.leather('#8A7E72')); inner.position.set(-0.6, 0.78, 0.07); hinge.add(inner);
  const handle = rbox(0.16, 0.035, 0.03, 0.012, MAT.chrome()); handle.position.set(-0.98, 0.92, -0.03); hinge.add(handle);
  g.door = hinge;
  // floor, bumpers, lights, grille, mirrors
  const floor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.06, HW * 2), std({ color: '#2A2624', roughness: 0.9 })); floor.position.set(0, 0.42, 0); g.add(floor);
  [2.36, -2.36].forEach((x, i) => { const b = rbox(0.22, 0.2, HW * 2 + 0.06, 0.08, trim); b.position.set(x, 0.5, 0); g.add(b); });
  [-0.6, 0.6].forEach((z) => { const hl = rbox(0.06, 0.12, 0.34, 0.05, phys({ color: '#E8E6DC', emissive: '#FFF2CC', emissiveIntensity: 0.25, roughness: 0.05, clearcoat: 1 })); hl.position.set(2.31, 0.78, z); g.add(hl);
    const tl = rbox(0.05, 0.11, 0.32, 0.04, phys({ color: '#8C1414', emissive: '#5A0A0A', emissiveIntensity: 0.3, roughness: 0.1, clearcoat: 1 })); tl.position.set(-2.33, 0.86, z); g.add(tl); });
  const grille = rbox(0.04, 0.12, 0.7, 0.03, trim); grille.position.set(2.34, 0.66, 0); g.add(grille);
  [-1, 1].forEach((s) => { const m = rbox(0.14, 0.1, 0.16, 0.04, paint); m.position.set(0.86, 1.08, s * (HW + 0.1)); g.add(m); });
  // interior
  const seat = (x, z) => { const s = new THREE.Group(); const c = rbox(0.5, 0.14, 0.52, 0.06, MAT.leather()); c.position.set(0, 0.62, 0); s.add(c);
    const b = rbox(0.13, 0.62, 0.5, 0.06, MAT.leather()); b.position.set(-0.26, 0.95, 0); b.rotation.z = -0.18; s.add(b); const hr = rbox(0.1, 0.16, 0.28, 0.05, MAT.leather()); hr.position.set(-0.34, 1.33, 0); s.add(hr); s.position.set(x, 0, z); g.add(s); return s; };
  seat(-0.05, -0.42); seat(-0.05, 0.42); const rear = rbox(0.5, 0.16, 1.5, 0.06, MAT.leather()); rear.position.set(-1.15, 0.62, 0); g.add(rear); const rb = rbox(0.14, 0.6, 1.5, 0.06, MAT.leather()); rb.position.set(-1.42, 0.95, 0); rb.rotation.z = -0.15; g.add(rb);
  const dash = rbox(0.5, 0.3, HW * 2 - 0.05, 0.1, trim); dash.position.set(0.85, 0.92, 0); g.add(dash);
  const steer = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 12, 40), MAT.rubber()); steer.add(ring); const hubS = rbox(0.12, 0.12, 0.06, 0.04, trim); steer.add(hubS);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10), trim); col.rotation.x = Math.PI / 2; col.position.z = -0.17; steer.add(col);
  steer.position.set(0.55, 1.02, -0.42); steer.rotation.y = Math.PI / 2; steer.rotation.x = 0; steer.rotateX(-0.35); g.add(steer); g.steer = steer;
  // wheels
  [[1.42, -HW + 0.06], [1.42, HW - 0.06], [-1.42, -HW + 0.06], [-1.42, HW - 0.06]].forEach(([x, z]) => { const w = wheel(); w.position.set(x, 0.35, z); if (z > 0) w.rotation.y = Math.PI; g.add(w); });
  if (taxiSign) { const c = document.createElement('canvas'); c.width = 256; c.height = 80; const k = c.getContext('2d'); k.fillStyle = '#F2E9D0'; k.fillRect(0, 0, 256, 80); k.fillStyle = '#1A1A1E'; k.font = '900 54px Inter'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.fillText('TAXI', 128, 44);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const sm = phys({ map: t, emissive: '#FFF0C0', emissiveMap: t, emissiveIntensity: 0.25, roughness: 0.3, clearcoat: 1 });
    const sign = rbox(0.24, 0.18, 0.66, 0.05, phys({ color: '#F2E9D0', emissive: '#FFF0C0', emissiveIntensity: 0.15, roughness: 0.3, clearcoat: 1 })); sign.position.set(-0.35, 1.6, 0); g.add(sign);
    [-1, 1].forEach((s) => { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.16), sm); tp.position.set(-0.35, 1.6, s * 0.123); if (s < 0) tp.rotation.y = Math.PI; g.add(tp); });
    const ck = document.createElement('canvas'); ck.width = 512; ck.height = 32; const q = ck.getContext('2d'); for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) { q.fillStyle = (i + j) % 2 ? '#141416' : '#EDE6D2'; q.fillRect(i * 16, j * 16, 16, 16); }
    const ct = new THREE.CanvasTexture(ck); ct.colorSpace = THREE.SRGBColorSpace; [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.07), phys({ map: ct, clearcoat: 1, roughness: 0.3 })); p.position.set(-1.25, 0.8, s * (HW + 0.035)); if (s < 0) p.rotation.y = Math.PI; g.add(p); }); }
  g.seatDriver = new THREE.Vector3(0.05, 0.45, -0.42);
  return shadowy(g);
}

/** delivery scooter; points along +x. .seat = rider feet spot */
export function scooter({ body = '#1F5E8C', box = '#C0392B' } = {}) {
  const g = new THREE.Group(), paint = MAT.paint(body), trim = MAT.plastic();
  [[0.62, 0.25], [-0.6, 0.25]].forEach(([x, r]) => { const w = wheel(r, 0.13); w.position.set(x, r, 0); g.add(w); });
  const shellPts = smoothPath([[-0.85, 0.5], [-0.55, 0.62], [-0.2, 0.56], [0.15, 0.42], [0.42, 0.5], [0.55, 0.9], [0.62, 1.05]], 8);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shellPts.map((p) => new THREE.Vector3(p.x, p.y, 0))), 64, 0.075, 20), paint); g.add(tube);
  const shield = rbox(0.06, 0.62, 0.42, 0.05, paint); shield.position.set(0.5, 0.72, 0); shield.rotation.z = 0.3; g.add(shield);
  const plate = rbox(0.02, 0.12, 0.22, 0.01, std({ color: '#E8E2C8' })); plate.position.set(-0.86, 0.55, 0); g.add(plate);
  const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 14), MAT.chrome()); exh.rotation.z = Math.PI / 2 - 0.12; exh.position.set(-0.55, 0.28, 0.2); g.add(exh);
  const floorb = rbox(0.55, 0.06, 0.34, 0.03, trim); floorb.position.set(0.05, 0.36, 0); g.add(floorb);
  const seat = rbox(0.6, 0.1, 0.3, 0.05, MAT.leather('#18181A')); seat.position.set(-0.45, 0.74, 0); g.add(seat);
  const rearBody = rbox(0.8, 0.32, 0.36, 0.07, paint); rearBody.position.set(-0.5, 0.55, 0); g.add(rearBody);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 12), MAT.chrome()); fork.position.set(0.6, 0.62, 0); fork.rotation.z = 0.32; g.add(fork);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.66, 12), trim); bar.rotation.x = Math.PI / 2; bar.position.set(0.5, 1.12, 0); g.add(bar);
  [-0.33, 0.33].forEach((z) => { const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), MAT.rubber()); gr.rotation.x = Math.PI / 2; gr.position.set(0.5, 1.12, z); g.add(gr); });
  const hl = rbox(0.06, 0.1, 0.16, 0.04, phys({ color: '#E8E6DC', emissive: '#FFF2CC', emissiveIntensity: 0.3, clearcoat: 1, roughness: 0.05 })); hl.position.set(0.66, 1.0, 0); g.add(hl);
  const bx = rbox(0.46, 0.42, 0.46, 0.06, phys({ color: box, roughness: 0.45, clearcoat: 0.6 })); bx.position.set(-0.78, 1.02, 0); g.add(bx);
  const rack = rbox(0.4, 0.03, 0.36, 0.01, MAT.chrome()); rack.position.set(-0.78, 0.8, 0); g.add(rack);
  const mud = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24, Math.PI * 0.7), paint); mud.position.set(0.62, 0.25, 0); mud.rotation.z = 0.5; g.add(mud);
  g.seat = new THREE.Vector3(-0.35, 0.36, 0);
  return shadowy(g);
}

/** NASA Blue Marble Earth (three.js example textures) with clouds, night lights and an atmosphere rim */
export const PENDING = [];
export const whenLoaded = () => Promise.all(PENDING.splice(0));
export function earth(radius = 10) {
  const TL = new THREE.TextureLoader(), g = new THREE.Group();
  const L = { load: (u) => { let t; PENDING.push(new Promise((ok) => { t = TL.load(u, ok, undefined, ok); })); return t; } };
  const col = L.load('assets/earth_atmos_2048.jpg'); col.colorSpace = THREE.SRGBColorSpace; col.anisotropy = 8;
  const spec = L.load('assets/earth_specular_2048.jpg'), nrm = L.load('assets/earth_normal_2048.jpg'), lights = L.load('assets/earth_lights_2048.png'); lights.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshPhongMaterial({ map: col, specularMap: spec, specular: new THREE.Color('#3A4A5A'), shininess: 18, normalMap: nrm, normalScale: new THREE.Vector2(0.8, 0.8), emissiveMap: lights, emissive: new THREE.Color('#E8B060'), emissiveIntensity: 0.35 });
  const e = new THREE.Mesh(new THREE.SphereGeometry(radius, 128, 64), m); g.add(e);
  const cl = L.load('assets/earth_clouds_1024.png'); cl.colorSpace = THREE.SRGBColorSpace;
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.008, 128, 64), new THREE.MeshLambertMaterial({ map: cl, transparent: true, opacity: 0.8, depthWrite: false, color: '#D8DEE6' })); g.add(clouds);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 96, 48), new THREE.ShaderMaterial({ transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: new THREE.Color('#4A8BE0') } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2); gl_FragColor = vec4(c * f * 0.9, f * 0.85); }' }));
  g.add(atm); g.earth = e; g.clouds = clouds; return g;
}
function canvasTexture(w, h, fn, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
/** GPS-style navigation satellite: foil-wrapped bus, two long solar wings, Earth-facing antenna panel with helix elements */
export function gpsSatellite() {
  const g = new THREE.Group();
  const foilCol = canvasTexture(512, 512, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#C9952E'); gr.addColorStop(0.5, '#E0B04A'); gr.addColorStop(1, '#A87A22'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${rnd(i) > 0.5 ? '255,225,150' : '90,55,10'},${0.08 + rnd(i * 3) * 0.18})`; c.beginPath(); const x = rnd(i * 5) * w, y = rnd(i * 7) * h; c.moveTo(x, y); c.lineTo(x + (rnd(i * 9) - 0.5) * 120, y + (rnd(i * 11) - 0.5) * 120); c.lineTo(x + (rnd(i * 13) - 0.5) * 120, y + (rnd(i * 17) - 0.5) * 120); c.fill(); } });
  const foilBump = canvasTexture(512, 512, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { c.strokeStyle = rnd(i) > 0.5 ? '#B0B0B0' : '#505050'; c.lineWidth = 1 + rnd(i * 2) * 3; c.beginPath(); const x = rnd(i * 3) * w, y = rnd(i * 5) * h; c.moveTo(x, y); c.lineTo(x + (rnd(i * 7) - 0.5) * 160, y + (rnd(i * 11) - 0.5) * 160); c.stroke(); } }, false);
  const foil = phys({ map: foilCol, bumpMap: foilBump, bumpScale: 3, metalness: 1, roughness: 0.28 });
  const bus = rbox(1.6, 1.8, 1.6, 0.05, foil); g.add(bus);
  const whiteP = std({ color: '#C8CCD2', roughness: 0.5, metalness: 0.2 });
  const top = rbox(1.62, 0.06, 1.62, 0.02, whiteP); top.position.y = 0.93; g.add(top);
  const cells = canvasTexture(1024, 256, (c, w, h) => { c.fillStyle = '#0D1630'; c.fillRect(0, 0, w, h); const cw = 32, ch = 32; for (let y = 2; y < h; y += ch) for (let x = 2; x < w; x += cw) { const gr = c.createLinearGradient(x, y, x + cw, y + ch); gr.addColorStop(0, '#1E3466'); gr.addColorStop(1, '#14244A'); c.fillStyle = gr; c.fillRect(x, y, cw - 3, ch - 3); c.fillStyle = 'rgba(160,180,220,0.25)'; c.fillRect(x + cw / 2 - 1, y, 1, ch - 3); } });
  [-1, 1].forEach((s) => {
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 16), MAT.chrome()); boom.rotation.z = Math.PI / 2; boom.position.x = s * 1.4; g.add(boom);
    for (let k = 0; k < 3; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 1.5), [whiteP, whiteP, phys({ map: cells, metalness: 0.4, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }), std({ color: '#3A3E46' }), whiteP, whiteP]);
      p.position.x = s * (2.05 + k * 1.95); p.rotation.x = 0.35; g.add(p); }
  });
  // Earth-facing (-y) antenna panel with helix elements
  const ap = rbox(1.3, 0.05, 1.3, 0.02, whiteP); ap.position.y = -0.93; g.add(ap);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 0.45 : 0.28; const h = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.22, 14), std({ color: '#9AA0A8', metalness: 0.6, roughness: 0.35 })); h.position.set(Math.cos(a) * r, -1.06, Math.sin(a) * r); g.add(h); }
  const rad = canvasTexture(256, 256, (c, w, h) => { c.fillStyle = '#E4E6EA'; c.fillRect(0, 0, w, h); c.strokeStyle = '#9AA0AA'; c.lineWidth = 2; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } });
  [-1, 1].forEach((s) => { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.5), std({ map: rad, roughness: 0.35, metalness: 0.3 })); r.position.set(0, 0, s * 0.815); if (s < 0) r.rotation.y = Math.PI; g.add(r); });
  [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]].forEach(([x, z]) => { const n = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 16, 1, true), std({ color: '#5A4A3A', metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })); n.position.set(x, 0.98, z); g.add(n); });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2.8), std({ color: '#D0D3D8', metalness: 0.3, roughness: 0.35, side: THREE.DoubleSide })); dish.position.set(0.55, 0.3, 0.85); dish.rotation.x = Math.PI / 2; g.add(dish);
  return shadowy(g);
}
export function starfield(scene, n = 2500) {
  const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = rnd(i) * Math.PI * 2, ph = Math.acos(2 * rnd(i * 3.3) - 1), r = 300; p.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); const b = 0.35 + rnd(i * 7) * 0.45; c.set([b * 0.9, b * 0.95, b], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.1, vertexColors: true, sizeAttenuation: true, toneMapped: false })));
}
