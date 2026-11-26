/**
 * SISTEMA SOLAR — o sistema solar 3D da seção Projetos (cada planeta é um projeto).
 *   1. Carregador de modelos 3D (usado também pelo universo: naves e elfo)
 *   2. Planetas (cor, órbita e projeto de cada um)
 *   3. Cena 3D procedural (sol, órbitas, planetas, retícula)
 *   4. Painel do projeto (gaveta lateral)
 *   5. Montagem da seção (cartões, cliques, endereço ?projeto=)
 *
 * Leve de propósito: nada de GLB, nada de pós-processamento. Renderizador próprio dentro da moldura,
 * que só desenha enquanto a seção está na tela e a aba está visível.
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { urlState } from './principal.js';
import { projects, planetProjects } from './projetos.js';

/* ===== 1. CARREGADOR DE MODELOS 3D ===== */

const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map(); // url -> Promise<gltf>  (cada GLB é baixado uma única vez)

/** O servidor de desenvolvimento devolve HTML para arquivos inexistentes */
async function probe(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!r.ok) return false;
    return !(r.headers.get('content-type') || '').toLowerCase().includes('text/html');
  } catch { return false; }
}

/** Carrega um GLB (com cache). Falhas NÃO ficam em cache, então "tentar novamente" funciona. */
function loadGLB(url, onProgress) {
  if (cache.has(url)) return cache.get(url);
  const p = (async () => {
    if (!(await probe(url))) throw new Error(`GLB ausente: ${url}`);
    return gltfLoader.loadAsync(url, (e) => e.lengthComputable && onProgress?.(e.loaded / e.total));
  })();
  p.catch(() => cache.delete(url));
  cache.set(url, p);
  return p;
}

/* ===== 2. PLANETAS ===== */

/** Ordem = órbita (de dentro para fora). O projeto de cada planeta fica em js/projetos.js (planetProjects). */
const PLANETS = [
  { id: 'golden-bronze', color: '#d4af37', orbit: 8.5, speed: 0.22 },
  { id: 'crystal-cyan', color: '#19d4ff', orbit: 12.0, speed: 0.17 },
  { id: 'deep-ocean', color: '#2a6bff', orbit: 15.5, speed: 0.13 },
  { id: 'emerald-green', color: '#10b981', orbit: 19.5, speed: 0.10 },
  { id: 'magma-volcanic', color: '#f97316', orbit: 24.0, speed: 0.075 },
  { id: 'mystical-purple', color: '#a855f7', orbit: 28.5, speed: 0.055 },
];
const OVERVIEW = { x: 0, y: 36, z: 44 };
const FEATURE_ICONS = ['bolt', 'hub', 'memory', 'shield', 'insights', 'extension', 'layers', 'auto_awesome'];

const projectFor = (planetId) => projects[planetProjects[planetId]] ?? null;
const planetForProject = (key) => Object.keys(planetProjects).find((p) => planetProjects[p] === key) ?? null;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion');

/* ===== 3. CENA 3D ===== */

class SolarScene {
  constructor(container, { onPick } = {}) {
    this.container = container;
    this.onPick = onPick;
    this.selected = null;
    this.visible = false;
    this._raf = 0;

    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 400);
    this.camera.position.set(OVERVIEW.x, OVERVIEW.y, OVERVIEW.z);
    this.lookAt = new THREE.Vector3();
    this.camera.lookAt(this.lookAt);

    const coarse = matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.5));
    this.renderer.setSize(w, h);
    this.renderer.domElement.className = 'solar-canvas';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(this.renderer.domElement);

    this._build();
    this._bind();
  }

  _build() {
    const s = this.scene;
    s.add(new THREE.AmbientLight(0x0a192f, 1.2 * Math.PI));

    this.sun = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 24), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
    this.corona = new THREE.Mesh(new THREE.SphereGeometry(3.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xff7700, transparent: true, opacity: 0.35, wireframe: true }));
    s.add(this.sun, this.corona, new THREE.PointLight(0xffcc44, 2.5 * Math.PI, 90, 0));

    this.planets = PLANETS.map((cfg, i) => {
      const pts = new THREE.EllipseCurve(0, 0, cfg.orbit, cfg.orbit, 0, Math.PI * 2).getPoints(120).map((p) => new THREE.Vector3(p.x, 0, p.y));
      s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x1f2851, transparent: true, opacity: 0.7 })));

      const color = new THREE.Color(cfg.color);
      const r = 1 + i * 0.08;
      const planet = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.7, emissive: color, emissiveIntensity: 0.25 }));
      planet.add(new THREE.Mesh(new THREE.SphereGeometry(r + 0.2, 16, 12), new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.25 })));
      // área de clique maior que o planeta (dedos no celular)
      const hit = new THREE.Mesh(new THREE.SphereGeometry(r * 2.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
      planet.add(hit);
      hit.userData.planet = planet;
      planet.userData = { ...cfg, angle: (i / PLANETS.length) * Math.PI * 2 + i * 0.7, hit };
      s.add(planet);
      return planet;
    });
    this.hits = this.planets.map((p) => p.userData.hit);
    this._place(0);

    this.reticle = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.7, 32), new THREE.MeshBasicMaterial({ color: 0x19d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0 }));
    this.reticle.rotation.x = Math.PI / 2;
    s.add(this.reticle);
  }

  _bind() {
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (e) => {
      const r = this.container.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      return ray.intersectObjects(this.hits, false)[0]?.object.userData.planet ?? null;
    };
    const tip = this.container.parentElement.querySelector('[data-solar-tip]');
    this._onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = pick(e);
      this.container.style.cursor = p ? 'pointer' : 'default';
      if (!tip) return;
      if (!p) { tip.classList.remove('is-on'); return; }
      const r = this.container.getBoundingClientRect();
      tip.querySelector('[data-tip-title]').textContent = projectFor(p.userData.id)?.name ?? p.userData.id;
      tip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px)`;
      tip.classList.add('is-on');
      this.kick();
    };
    this._onLeave = () => tip?.classList.remove('is-on');
    this._onClick = (e) => { const p = pick(e); if (p) this.onPick?.(p.userData.id); };
    this.container.addEventListener('pointermove', this._onMove, { passive: true });
    this.container.addEventListener('pointerleave', this._onLeave);
    this.container.addEventListener('click', this._onClick);

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.container);
    this._io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this._sync(); }, { threshold: 0.01 });
    this._io.observe(this.container);
    this._onVis = () => this._sync();
    document.addEventListener('visibilitychange', this._onVis);
  }

  _resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    // tela estreita (celular): afasta a câmera para caber todas as órbitas
    this.camera.fov = w / h < 1 ? 62 : 45;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.kick();
  }

  _place(dt) {
    for (const p of this.planets) {
      const u = p.userData;
      u.angle += u.speed * dt * 0.45;
      p.position.set(Math.cos(u.angle) * u.orbit, 0, Math.sin(u.angle) * u.orbit);
      p.rotation.y += dt * 1.2;
    }
  }

  /** Desenha só com a seção na tela e a aba visível. */
  _sync() {
    const run = this.visible && !document.hidden;
    if (run && !this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._frame); }
    if (!run && this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; }
  }

  /** Movimento reduzido: o laço para; um quadro é desenhado quando algo muda. */
  kick() { if (!this._raf) this._render(); }

  /** Desloca a imagem (fração da largura/altura) para o planeta aparecer na área que a gaveta não cobre. */
  _render() {
    const c = this.camera, { x, y } = this.shift;
    this.camera.lookAt(this.lookAt);
    if (Math.abs(x) + Math.abs(y) < 1e-4) { if (c.view?.enabled) c.clearViewOffset(); }
    else { const w = this.container.clientWidth, h = this.container.clientHeight; c.setViewOffset(w, h, w * x, h * y, w, h); }
    this.renderer.render(this.scene, c);
  }
  shift = { x: 0, y: 0 };

  _frame = (now) => {
    const dt = Math.min((now - this._last) / 1000, 0.1);
    this._last = now;
    const calm = reducedMotion();
    if (!calm || this._tween) {
      if (!calm) {
        this._place(dt);
        this.sun.rotation.y += dt * 0.3;
        this.corona.rotation.y -= dt * 0.18;
        this.reticle.rotation.z += dt * 0.6;
      }
      if (this.selected) {
        this.reticle.position.copy(this.selected.position);
        if (!this._tween) { // acompanha o planeta selecionado na órbita
          this.lookAt.copy(this.selected.position);
          this.camera.position.copy(this.selected.position).add(this._offset);
        }
      }
      this._render();
    } else if (this._dirty) { this._dirty = false; this._render(); }
    this._raf = requestAnimationFrame(this._frame);
  };

  /** shift = quanto deslocar a imagem ({x, y} em fração do palco) para fugir da gaveta. */
  focus(planetId, shift = { x: 0, y: 0 }) {
    const p = this.planets.find((x) => x.userData.id === planetId);
    if (!p) return;
    this.selected = p;
    this._offset = this.camera.aspect < 1 ? new THREE.Vector3(3, 7, 8) : new THREE.Vector3(5, 3.6, 7);
    this._shiftTo = shift;
    this.reticle.material.opacity = 0.9;
    this.reticle.scale.setScalar(1.4);
    this._fly(p.position.clone().add(this._offset), p.position.clone());
  }

  overview() {
    this.selected = null;
    this.reticle.material.opacity = 0;
    this._shiftTo = { x: 0, y: 0 };
    this._fly(new THREE.Vector3(OVERVIEW.x, OVERVIEW.y, OVERVIEW.z), new THREE.Vector3());
  }

  _fly(pos, look) {
    this._tween?.kill();
    const fromPos = this.camera.position.clone(), fromLook = this.lookAt.clone(), o = { t: 0 };
    const fromShift = { ...this.shift }, toShift = this._shiftTo ?? { x: 0, y: 0 };
    const duration = reducedMotion() ? 0 : 1.4;
    this._tween = gsap.to(o, {
      t: 1, duration, ease: 'power2.inOut',
      onUpdate: () => {
        // o alvo pode estar andando na órbita: mira na posição atual dele
        const tgtLook = this.selected ? this.selected.position : look;
        const tgtPos = this.selected ? this._tmp.copy(this.selected.position).add(this._offset) : pos;
        this.camera.position.lerpVectors(fromPos, tgtPos, o.t);
        this.lookAt.lerpVectors(fromLook, tgtLook, o.t);
        this.shift.x = fromShift.x + (toShift.x - fromShift.x) * o.t;
        this.shift.y = fromShift.y + (toShift.y - fromShift.y) * o.t;
        this._dirty = true;
        this.kick();
      },
      onComplete: () => { this._tween = null; this._dirty = true; },
    });
  }
  _tmp = new THREE.Vector3();

  dispose() {
    cancelAnimationFrame(this._raf); this._raf = 0;
    this._tween?.kill();
    this._ro.disconnect(); this._io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this.scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

/* ===== 4. PAINEL DO PROJETO ===== */

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const icon = (name) => { const s = el('span', 'material-symbols-outlined', name); s.setAttribute('aria-hidden', 'true'); return s; };
const isVideo = (m) => m.type === 'video' || (m.type !== 'image' && m.type !== 'gif' && /\.(mp4|webm|mov)([?#]|$)/i.test(m.src));

function renderDrawer(drawer, planetId) {
  const p = projectFor(planetId), cfg = PLANETS.find((x) => x.id === planetId), idx = PLANETS.indexOf(cfg) + 1;
  drawer.style.setProperty('--planet', cfg.color);
  drawer.querySelector('[data-drawer-code]').textContent = `PROJETO ${idx} // ÓRBITA ${idx}`;
  const body = drawer.querySelector('[data-drawer-body]');
  body.replaceChildren();
  if (!p) { body.append(el('h3', 'solar-drawer__title', 'Dossiê em preparação'), el('p', 'solar-drawer__desc', 'Os detalhes deste projeto serão publicados em breve.')); return; }

  if (p.tagline) body.append(el('span', 'solar-drawer__badge', p.tagline));
  const title = el('h3', 'solar-drawer__title', p.name); title.id = 'solar-drawer-title'; title.tabIndex = -1;
  body.append(title);
  const about = p.about || p.description;
  if (about) body.append(el('p', 'solar-drawer__desc', about));

  if (p.objective) {
    const box = el('div', 'solar-drawer__box');
    box.append(el('span', 'solar-drawer__label', 'Objetivo'), el('p', null, p.objective));
    body.append(box);
  }
  if (p.features?.length) {
    body.append(el('span', 'solar-drawer__label', 'Funcionalidades'));
    const ul = el('ul', 'solar-drawer__features');
    p.features.forEach((f, i) => { const li = el('li'); li.append(icon(FEATURE_ICONS[i % FEATURE_ICONS.length]), el('span', null, f)); ul.append(li); });
    body.append(ul);
  }
  if (p.technologies?.length) {
    body.append(el('span', 'solar-drawer__label', 'Tecnologias'));
    const chips = el('div', 'solar-drawer__stack');
    p.technologies.forEach((t) => chips.append(el('span', null, t)));
    body.append(chips);
  }
  if (p.media?.length) {
    body.append(el('span', 'solar-drawer__label', 'Mídia do projeto'));
    const gal = el('div', 'solar-drawer__media');
    for (const m of p.media) {
      let node;
      if (isVideo(m)) {
        // 'metadata' + '#t=0.1': baixa só o início do vídeo e mostra o primeiro quadro como capa (sem tela preta)
        node = el('video'); node.controls = true; node.playsInline = true; node.preload = 'metadata';
        if (m.poster) node.poster = encodeURI(m.poster);
        node.src = encodeURI(m.src) + '#t=0.1';
      } else {
        node = el('img'); node.loading = 'lazy'; node.decoding = 'async'; node.src = m.src.startsWith('http') ? m.src : encodeURI(m.src);
      }
      if (m.alt) node.setAttribute(isVideo(m) ? 'aria-label' : 'alt', m.alt); else if (!isVideo(m)) node.alt = '';
      gal.append(node);
    }
    body.append(gal);
  }

  const actions = drawer.querySelector('[data-drawer-actions]');
  actions.replaceChildren();
  const link = (href, text, ic, primary) => {
    const a = el('a', primary ? 'solar-btn solar-btn--primary' : 'solar-btn'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.append(icon(ic), el('span', null, text)); actions.append(a);
  };
  if (p.demo) link(p.demo, 'Ver demonstração', 'open_in_new', true);
  link(p.github || 'https://github.com/inCarlosDaniel', p.github ? 'Ver projeto no GitHub' : 'Ver meu GitHub', 'terminal', !p.demo);
}

/* ===== 5. MONTAGEM DA SEÇÃO ===== */

function mountOrbitalHud(hud) {
  if (!hud) return null;
  const stage = hud.querySelector('[data-hud-stage]');
  const drawer = hud.querySelector('[data-solar-drawer]');
  const cards = [...hud.querySelectorAll('[data-planet]')];
  const overviewBtn = hud.querySelector('[data-hud-overview]');
  let scene = null, current = null, lastCard = null, fromHistory = false;

  // cor e nome de cada cartão vêm do cadastro (js/projetos.js)
  for (const c of cards) {
    const cfg = PLANETS.find((x) => x.id === c.dataset.planet);
    if (cfg) c.style.setProperty('--planet', cfg.color);
    const n = c.querySelector('[data-card-name]'), p = projectFor(c.dataset.planet);
    if (n && p?.name) n.textContent = p.name;
  }

  const setActive = (id) => cards.forEach((c) => { const on = c.dataset.planet === id; c.setAttribute('aria-pressed', String(on)); c.classList.toggle('is-active', on); });

  function ensureScene() {
    if (scene) return scene;
    try { scene = new SolarScene(stage, { onPick: select }); hud.classList.add('is-3d'); }
    catch (err) { console.error('[sistema-solar] WebGL indisponível; os cartões continuam funcionando.', err); hud.classList.add('no-3d'); }
    return scene;
  }

  function select(id) {
    if (!PLANETS.some((p) => p.id === id)) return;
    const wasOpen = !!current;
    current = id;
    setActive(id);
    renderDrawer(drawer, id);
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    drawer.querySelector('[data-drawer-body]').scrollTop = 0;
    overviewBtn.hidden = false;
    // a gaveta cobre a direita (PC) ou a parte de baixo (celular): o planeta vai para o centro da área livre
    // (offset* ignoram o transform da animação de entrada da gaveta)
    const sw = stage.clientWidth, sh = stage.clientHeight, bottomSheet = drawer.offsetLeft < 2 && drawer.offsetWidth >= sw - 2;
    const shift = bottomSheet
      ? { x: 0, y: Math.max(0, 0.5 - (drawer.offsetTop - stage.offsetTop) / 2 / sh) }
      : { x: drawer.offsetWidth / 2 / sw, y: 0 };
    ensureScene()?.focus(id, shift);
    if (!wasOpen) drawer.querySelector('#solar-drawer-title')?.focus({ preventScroll: true });
    if (!fromHistory) urlState.setProject(planetProjects[id] ?? null, true);
  }

  function reset() {
    if (!current) return;
    const hadFocus = drawer.contains(document.activeElement);
    lastCard = cards.find((c) => c.dataset.planet === current);
    current = null;
    setActive(null);
    drawer.classList.remove('is-open');
    drawer.querySelectorAll('video').forEach((v) => v.pause());
    setTimeout(() => { if (!current) drawer.hidden = true; }, 450);
    overviewBtn.hidden = true;
    scene?.overview();
    if (hadFocus) lastCard?.focus({ preventScroll: true });
    if (!fromHistory) urlState.setProject(null, true);
  }

  cards.forEach((c) => c.addEventListener('click', () => select(c.dataset.planet)));
  overviewBtn.addEventListener('click', reset);
  drawer.querySelector('[data-drawer-close]').addEventListener('click', reset);
  hud.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) reset(); });

  // a cena 3D só é criada perto da seção (não disputa a GPU com a introdução)
  const linked = planetForProject(urlState.project());
  if (linked) { fromHistory = true; select(linked); fromHistory = false; } // o endereço já está certo
  else if (urlState.project()) { console.warn(`[projects] Link para projeto inexistente: "${urlState.project()}".`); urlState.setProject(null); }
  if (!scene) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); ensureScene(); } }, { rootMargin: '300px 0px' });
    io.observe(hud);
  }

  // Voltar / Avançar do navegador: abre ou fecha o projeto do endereço
  window.addEventListener('popstate', () => {
    const planet = planetForProject(urlState.project());
    fromHistory = true;
    try { if (planet) select(planet); else reset(); } finally { fromHistory = false; }
  });
  window.addEventListener('pagehide', () => scene?.dispose());
  return { select, reset };
}

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { gltfLoader, probe, loadGLB, mountOrbitalHud };
