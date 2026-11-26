/**
 * ELFO 3D (seção Sobre mim)
 * Cena própria, num canvas dentro do card: luzes próprias, base holográfica girando,
 * arrastar para girar e o corpo acompanhando o cursor. Só desenha enquanto está na tela.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadGLB } from './sistema-solar.js';
import { models, elfAnimation, prefs } from './principal.js';

/* Cursor global, normalizado de -1 a 1 */
const cursor = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  cursor.x = (e.clientX / window.innerWidth) * 2 - 1;
  cursor.y = -(e.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

/** Roda `tick` a cada quadro só enquanto o elemento está visível (e a aba aberta). */
function visibilityLoop(el, tick) {
  let visible = false, raf = 0;
  const clock = new THREE.Clock();
  const loop = () => { raf = requestAnimationFrame(loop); tick(Math.min(clock.getDelta(), 0.05), clock.elapsedTime); };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { visible = true; clock.getDelta(); loop(); }
    else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '100px' });
  io.observe(el);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && visible) { clock.getDelta(); loop(); }
  });
}

function elfScene(el) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.0, 5.2);
  const fit = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(fit).observe(el);
  fit();

  // luzes: principal fria, contraluz ciano e preenchimento azulado
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xe8ecff, 1.5); key.position.set(-2, 3, 3);
  const rim = new THREE.DirectionalLight(0x5eead4, 2.4); rim.position.set(2.5, 1.5, -2.5);
  const fill = new THREE.DirectionalLight(0x8ea2ff, 0.9); fill.position.set(2, 0.5, 2);
  scene.add(key, rim, fill, new THREE.AmbientLight(0x30386a, 0.5));

  // base holográfica: disco suave, anel, anel externo fino e marcações girando
  const base = new THREE.Group();
  const ringMat = (op) => new THREE.MeshBasicMaterial({ color: 0x8ea2ff, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const r1 = new THREE.Mesh(new THREE.RingGeometry(0.78, 0.8, 96), ringMat(0.55));
  const r2 = new THREE.Mesh(new THREE.RingGeometry(0.95, 0.955, 96), ringMat(0.25));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.78, 64), ringMat(0.06));
  [r1, r2, disc].forEach((m) => { m.rotation.x = -Math.PI / 2; base.add(m); });
  const ticks = new THREE.Group();
  for (let i = 0; i < 48; i++) {
    const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.012, i % 4 ? 0.04 : 0.08), ringMat(0.5));
    const a = (i / 48) * Math.PI * 2;
    tick.position.set(Math.cos(a) * 0.88, 0, Math.sin(a) * 0.88);
    tick.rotation.set(-Math.PI / 2, 0, -a + Math.PI / 2);
    ticks.add(tick);
  }
  base.add(ticks);
  scene.add(base);

  const loading = document.createElement('div');
  loading.className = 'elf-card__loading';
  loading.textContent = 'Carregando modelo…';
  el.appendChild(loading);

  const rig = new THREE.Group();
  scene.add(rig);
  let mixer = null;
  const target = new THREE.Vector3(0, 0.95, 0);

  loadGLB(models.elfCharacter).then((gltf) => {
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material) o.material.envMapIntensity = 0.6; } });
    const box = new THREE.Box3().setFromObject(model);
    const s = 1.85 / ((box.max.y - box.min.y) || 1.75);
    model.scale.setScalar(s);
    model.position.y = -box.min.y * s;
    rig.add(model);
    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(model);
      const clip = THREE.AnimationClip.findByName(gltf.animations, elfAnimation) ?? gltf.animations[0];
      mixer.clipAction(clip).play();
    }
    loading.remove();
  }).catch((err) => { loading.textContent = 'Modelo indisponível'; console.warn('[elfo] não carregou:', err); });

  // arrastar para girar (com inércia ao soltar)
  let drag = null, spin = 0, spinVel = 0;
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, s: spin }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (drag) { const ns = drag.s + (e.clientX - drag.x) * 0.012; spinVel = ns - spin; spin = ns; } });
  const end = () => { drag = null; };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);

  const look = { x: 0, y: 0 };
  visibilityLoop(el, (dt, t) => {
    const m = prefs.reducedMotion ? 0.3 : 1;
    mixer?.update(dt * m);
    if (!drag) { spinVel *= 0.94; spin += spinVel; }
    // o corpo acompanha o cursor
    look.x += (cursor.x * 0.5 - look.x) * 0.05;
    look.y += (cursor.y * 0.15 - look.y) * 0.05;
    rig.rotation.y = spin + look.x;
    rig.rotation.x = -look.y * 0.3;
    ticks.rotation.y = t * 0.15 * m;
    r2.rotation.z = -t * 0.1 * m;
    camera.position.x = look.x * 0.4;
    camera.lookAt(target);
    renderer.render(scene, camera);
  });
}

/** Liga o elfo quando a seção Sobre se aproxima (não disputa a GPU com a introdução). */
export function mountElf(el) {
  if (!el) return;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try { elfScene(el); } catch (err) { console.warn('[elfo] 3D indisponível:', err); }
  }, { rootMargin: '600px 0px' });
  io.observe(el);
}
