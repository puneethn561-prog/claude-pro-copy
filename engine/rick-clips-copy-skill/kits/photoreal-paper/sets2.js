// Photoreal set test: HDRI photo worlds + PBR vehicles + 2D toon people.
import * as THREE from 'three';
import { makeEngine, camera } from './core/engine.js';
import { PROPS } from './core/toon.js';
import { Paper } from './core/paper.js';
import * as R from './core/real.js';

await document.fonts.load('900 40px Inter');
const PW = +(new URLSearchParams(location.search).get('w') || 540), PH = Math.round(PW * 16 / 9);
const GL = document.getElementById('gl'); GL.width = PW; GL.height = PH;
const E = makeEngine(GL, { w: PW, h: PH, samples: 0 });
E.renderer.toneMapping = THREE.ACESFilmicToneMapping;
const cam = camera(36); const OUT = (window.OUT = []); const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const INK = '#1E1E24';
const LOOK = { exposure: 1.25, bloom: 0.08, bloomThreshold: 0.95, aperture: 0.0012, maxblur: 0.008, vignette: 0.28, grain: 0.012, sat: 1.04, warm: 0.02 };
function snap(scene, from, at, look = {}, focus, fov = 36, people = []) {
  cam.fov = fov; cam.updateProjectionMatrix(); cam.position.copy(from); cam.lookAt(at); people.forEach((p) => p.face(cam));
  E.render(scene, cam, { ...LOOK, ...look, focus: focus ?? from.distanceTo(at) }); OUT.push(GL.toDataURL('image/jpeg', 0.92));
}
const CAST = {
  leo: { shirt: '#2E8B57', pants: '#3A3F55', skin: '#E0A77A', hat: 'cap', hatCol: '#E03C28', scarf: '#F2C230', mustache: 1, hair: '#3A2418', mitten: '#F2C230' },
  max: { shirt: '#8A4FD8', pants: '#2F3A66', skin: '#F6D3B3', hat: 'beanie', hatCol: '#2F7BE0', hatBand: '#F2C230', blush: 1, mitten: '#E03C28' },
  rider: { shirt: '#F05A28', pants: '#2B2B33', skin: '#9A603C', hat: 'helmet', hatCol: '#E03C28', mitten: '#2B2B33' },
  w1: { shirt: '#2F7BE0', pants: '#3A3F55', skin: '#E0A77A', hair: '#5A3A22', tie: '#E03C28', mitten: '#F6D3B3' },
  w2: { shirt: '#E0457B', pants: '#3A2A44', skin: '#8A5534', hair: '#1E1414', blush: 1, mitten: '#F2C230' },
};
const person = (k, size = 0.95) => new Paper({ ...CAST[k], size });
const wheelHands = (map) => map ? [[0.62, 0.36], [0.3, 0.2]] : [[0.62, 0.36], [0.6, 0.3]];
PROPS.paperMap = (g, x, y) => { g.save(); g.translate(x, y - 70); g.rotate(-0.06); g.strokeStyle = INK; g.lineWidth = 5;
  [[-120, '#E6D5AE'], [-40, '#DCC9A0'], [40, '#E6D5AE']].forEach(([dx, c]) => { g.fillStyle = c; g.beginPath(); g.rect(dx, -70, 80, 140); g.fill(); g.stroke(); });
  g.strokeStyle = '#C8452E'; g.lineWidth = 6; g.beginPath(); g.moveTo(-110, 40); g.lineTo(-30, -10); g.lineTo(30, 20); g.lineTo(110, -40); g.stroke();
  g.strokeStyle = '#3C6FB6'; g.lineWidth = 4; g.beginPath(); g.moveTo(-100, -50); g.quadraticCurveTo(0, 0, 100, 50); g.stroke(); g.restore(); };
PROPS.phoneBlank = (g, x, y) => { g.save(); g.translate(x, y - 70); g.rotate(0.12); g.fillStyle = '#23232B'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-34, -64, 68, 128, 12); g.fill(); g.stroke();
  g.fillStyle = '#8E949C'; g.fillRect(-28, -54, 56, 108); g.fillStyle = '#2F7BE0'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.strokeStyle = '#E6E9EE'; g.lineWidth = 3; g.stroke(); g.restore(); };

// 1 · door open, Leo sitting in the driver's seat
{
  const W = await R.photoWorld(E, 'crosswalk', { camHeight: 1.7, rotY: 0.6 });
  const car = R.sedan(); car.rotation.y = 0.0; W.scene.add(car); car.door.rotation.y = 1.05;
  const fill = new THREE.PointLight('#FFE6C8', 2.2, 3.5, 2); fill.position.set(0.1, 1.3, -0.9); W.scene.add(fill);
  const leo = person('leo', 0.72); leo.set({ pose: 'sit', mood: 'smug', hands: wheelHands(1), holdR: PROPS.paperMap });
  car.updateMatrixWorld(); const p = new THREE.Vector3(-0.12, 0.7, -0.42); car.localToWorld(p); leo.at(p.x, p.y, p.z); leo.group.rotation.y = car.rotation.y; W.scene.add(leo.group);
  snap(W.scene, V3(-0.6, 1.05, -4.6), V3(0.1, 0.95, -0.4), {}, 4.2, 40, [leo]);
}
// 2 · taxi in the street, people on phones
{
  const W = await R.photoWorld(E, 'crosswalk', { camHeight: 1.7, rotY: 0.6, box: 12 });
  const car = R.sedan(); car.rotation.y = 0.5; car.position.set(0, 0, -1); W.scene.add(car);
  const ppl = [['w1', 1.3, 2.6, 'shock', { armR: [168, 1.1, 8], look: [0.3, -1] }], ['w2', -0.85, 2.9, 'worried', { armR: [20, 1, 120], armL: [16, 1, 110], look: [0, 1] }], ['max', 0.1, 3.4, 'worried', { armR: [24, 1, 115], look: [0.2, 1], talk: 0.4 }]].map(([k, x, z, mood, extra]) => { const q = person(k); q.at(x, 0, z); q.set({ mood, holdR: PROPS.phoneBlank, sweat: 1, ...extra }); W.scene.add(q.group); return q; });
  snap(W.scene, V3(0.4, 1.6, 9.0), V3(0.1, 1.0, 0), {}, 6.0, 42, ppl);
}
// 3 · delivery rider sitting on the scooter
{
  const W = await R.photoWorld(E, 'canary_wharf', { camHeight: 1.7, rotY: 0.0 });
  const s = R.scooter(); s.rotation.y = 0.45; W.scene.add(s); s.updateMatrixWorld(); const sp = new THREE.Vector3(-0.15, 0.8, 0.2); s.localToWorld(sp);
  const rd = person('rider', 0.8); rd.set({ pose: 'ride', mood: 'dizzy', sweat: 1, lean: 26, shin: 0.45, hands: [[0.65, 0.32], [0.65, 0.32]] }); rd.at(sp.x, sp.y, sp.z); rd.group.rotation.y = s.rotation.y; W.scene.add(rd.group);
  snap(W.scene, V3(0.9, 1.2, 3.8), V3(-0.1, 0.8, 0), {}, 3.8, 40, [rd]);
}
// 4 · sunset finale: Max knocking on the taxi window, Leo smug inside
{
  const W = await R.photoWorld(E, 'cedar_bridge_sunset_1', { camHeight: 3.2, radius: 120, rotY: 2.2, sunI: 1.6, sunCol: '#FFC48A' });
  const car = R.sedan(); W.scene.add(car);
  const fill = new THREE.PointLight('#FFD0A0', 1.6, 3, 2); fill.position.set(0.1, 1.3, -0.5); W.scene.add(fill);
  const leo = person('leo', 0.72); leo.set({ pose: 'sit', mood: 'smug', hands: wheelHands(1), holdR: PROPS.paperMap }); car.door.rotation.y = 0.0; car.updateMatrixWorld(); const p = new THREE.Vector3(-0.12, 0.7, -0.42); car.localToWorld(p); leo.at(p.x, p.y, p.z); W.scene.add(leo.group);
  const max = person('max'); max.at(-0.55, 0, -1.12); max.set({ pose: 'side', mood: 'worried', sweat: 1, talk: 0.6, hands: [[0.25, 0.62], [0.5, 1.05]], holdL: PROPS.phoneBlank }); max.group.rotation.y = 0; W.scene.add(max.group);
  snap(W.scene, V3(-0.3, 1.05, -7.4), V3(-0.3, 1.1, -0.9), {}, 6.3, 29, [leo, max]);
}
// 5 · GPS satellite over Earth
{
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#020308'); R.starfield(scene);
  const sunL = new THREE.DirectionalLight('#FFF4E6', 2.6); sunL.position.set(-15, 30, 30); scene.add(sunL); scene.add(new THREE.AmbientLight('#2A3450', 0.25));
  const pm = new THREE.PMREMGenerator(E.renderer); scene.environment = pm.fromScene(new THREE.Scene()).texture;
  const H = await R.loadHDR('canary_wharf'); scene.environment = pm.fromEquirectangular(H.tex).texture; scene.environmentIntensity = 0.25;
  const e = R.earth(30); await R.whenLoaded(); e.position.set(0, -38, -30); e.rotation.set(-0.45, 2.45, 0); scene.add(e);
  const s = R.gpsSatellite(); s.position.set(0, 2.2, 0); s.rotation.set(0.25, -0.6, 0.12); s.scale.setScalar(0.55); scene.add(s);
  snap(scene, V3(2.6, 3.6, 9.5), V3(0, 0.6, 0), { aperture: 0, exposure: 0.9, bloom: 0.12, bloomThreshold: 0.9, vignette: 0.35 }, 9, 40);
}
// 6 · Earth from orbit with a constellation of satellites
{
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#020308'); R.starfield(scene);
  const sunL = new THREE.DirectionalLight('#FFF4E6', 2.6); sunL.position.set(-20, 10, 25); scene.add(sunL); scene.add(new THREE.AmbientLight('#2A3450', 0.2));
  const H = await R.loadHDR('canary_wharf'); const pm = new THREE.PMREMGenerator(E.renderer); scene.environment = pm.fromEquirectangular(H.tex).texture; scene.environmentIntensity = 0.2;
  const e = R.earth(10); await R.whenLoaded(); e.rotation.set(0.4, 2.6, 0); scene.add(e);
  [[6, 9, 8], [-9, 6, 7], [10, -4, 6], [-4, -9, 9]].forEach(([x, y, z], i) => { const s = R.gpsSatellite(); s.position.set(x, y, z); s.scale.setScalar(0.32); s.lookAt(0, 0, 0); s.rotateX(-Math.PI / 2); scene.add(s); });
  snap(scene, V3(0, 1, 34), V3(0, 0, 0), { aperture: 0, exposure: 0.9, bloom: 0.12, bloomThreshold: 0.9 }, 34, 42);
}
window.DONE = true;
