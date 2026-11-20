/**
 * SISTEMA SOLAR — o sistema solar 3D da seção Projetos (cada planeta é um projeto).
 *   1. Carregador de modelos 3D
 *   2. Materiais especiais
 *   3. Configuração
 *   4. Planeta ↔ projeto
 *   5. Câmera do sistema solar
 *   6. Órbitas holográficas
 *   7. Planetas
 *   8. Cliques e destaque nos planetas
 *   9. O sistema solar (junta as partes acima)
 *   10. Painel ORBITAL HUD
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { models, urlState } from './principal.js';
import { projects, planetProjects, ProjectDossier } from './projetos.js';

/* ===== 1. CARREGADOR DE MODELOS 3D ===== */

/** Um único carregador para o site todo. Lê GLBs comprimidos com meshopt (npm run models:compress). */
const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const loader = gltfLoader;
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
    return loader.loadAsync(url, (e) => e.lengthComputable && onProgress?.(e.loaded / e.total));
  })();
  p.catch(() => cache.delete(url));
  cache.set(url, p);
  return p;
}

/* ===== 2. MATERIAIS ESPECIAIS (SHADERS) ===== */

const PLANAR_VERT = /* glsl */ `varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const RING_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uTime, uOpacity, uTicks, uDash, uSpeed, uInner, uOuter, uPulse, uRim;
varying vec2 vP;
void main(){
  float r = length(vP);
  float a = atan(vP.y, vP.x) / 6.28318 + uTime * uSpeed;
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
  float dash = uDash > 0.5 ? step(0.5, fract(a * uDash)) : 1.0;
  float rim = (smoothstep(0.85, 1.0, t) + smoothstep(0.15, 0.0, t)) * uRim;
  float tick = uTicks > 0.5 ? step(0.88, fract(a * uTicks)) * step(t, 0.55) : 0.0;
  float wave = uPulse * pow(max(0.0, sin(t * 8.0 - uTime * 2.5)), 8.0) * (1.0 - t * 0.7);
  float v = clamp(rim * (0.35 + 0.65 * dash) + tick * 0.9 + wave, 0.0, 1.0);
  gl_FragColor = vec4(uColor * 2.2, v * uOpacity);
}`;

const GRID_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uStep, uOpacity, uRadius;
varying vec2 vP;
float gridLine(float s){ vec2 q = vP / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y), 1.0); }
void main(){
  float r = length(vP) / uRadius;
  float fade = 1.0 - smoothstep(0.25, 1.0, r);
  float v = gridLine(uStep) * 0.35 + gridLine(uStep * 5.0) * 0.65;
  gl_FragColor = vec4(uColor * 1.5, v * fade * uOpacity);
}`;

const base = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide };

/** Anel holográfico planar (geometria no plano XY; rotacione a malha). */
function createRingMaterial(o) {
  const { color = 0x19d4ff, inner, outer, opacity = 0.8, ticks = 0, dash = 0, speed = 0, pulse = 0, rim = 1 } = o;
  return new THREE.ShaderMaterial({
    ...base,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uOpacity: { value: opacity },
      uTicks: { value: ticks }, uDash: { value: dash }, uSpeed: { value: speed },
      uInner: { value: inner }, uOuter: { value: outer }, uPulse: { value: pulse }, uRim: { value: rim },
    },
    vertexShader: PLANAR_VERT, fragmentShader: RING_FRAG,
  });
}

function createGridMaterial({ color = 0x19d4ff, radius, step = 1, opacity = 0.18 }) {
  return new THREE.ShaderMaterial({
    ...base,
    uniforms: { uColor: { value: new THREE.Color(color) }, uStep: { value: step }, uOpacity: { value: opacity }, uRadius: { value: radius } },
    vertexShader: PLANAR_VERT, fragmentShader: GRID_FRAG,
  });
}

/** Atmosfera / halo Fresnel (use numa esfera levemente maior que o corpo). */
function createFresnelMaterial({ color, power = 3, intensity = 1 }) {
  return new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uIntensity: { value: intensity } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uPower, uIntensity; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
        gl_FragColor = vec4(uColor * uIntensity, clamp(f * uIntensity, 0.0, 1.0)); }`,
  });
}

/** Atmosfera iluminada pelo Sol: borda Fresnel forte no lado do dia, quase apagada no lado da noite */
function createAtmosphereMaterial({ color, power = 2.6, intensity = 1 }) {
  return new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uIntensity: { value: intensity }, uSunPos: { value: new THREE.Vector3() } },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vP;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor, uSunPos; uniform float uPower, uIntensity; varying vec3 vN; varying vec3 vP;
      void main(){
        vec3 n = normalize(vN), v = normalize(cameraPosition - vP), l = normalize(uSunPos - vP);
        float f = pow(1.0 - abs(dot(n, v)), uPower);
        float day = smoothstep(-0.35, 0.6, dot(n, l));
        float a = f * uIntensity * (0.16 + 0.84 * day);
        gl_FragColor = vec4(uColor * (0.7 + 0.6 * day) * uIntensity, clamp(a, 0.0, 1.0));
      }`,
  });
}

/** Linha de órbita com rastro: brilho forte logo atrás do planeta, que se apaga ao longo da volta. */
function createOrbitTrailMaterial({ color, trail, base = 0.3, gain = 0.9 }) {
  return new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(color) }, uTrail: { value: new THREE.Color(trail) }, uHead: { value: 0 }, uBase: { value: base }, uGain: { value: gain } },
    vertexShader: /* glsl */ `attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor, uTrail; uniform float uHead, uBase, uGain; varying float vT;
      void main(){
        float d = fract(uHead - vT);
        float tr = pow(1.0 - d, 6.0);
        gl_FragColor = vec4(mix(uColor, uTrail * 1.7, tr), uBase + tr * uGain);
      }`,
  });
}

/* ===== 3. CONFIGURAÇÃO DO SISTEMA SOLAR ===== */

/** Toda a configuração editável fica aqui: projetos, planetas, órbitas, câmera, qualidade e cores. */

// Chave = id do planeta. Edite livremente (images: ['url'] ou [{src, alt}]).

const projetosExemplo = { // projetos de exemplo (os reais ficam em projetos.js)
  'golden-bronze': {
    name: 'Projeto Alfa', subtitle: 'Aplicação web full-stack',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['React', 'Node.js', 'PostgreSQL'], images: [],
    github: 'https://github.com/seu-usuario/projeto-alfa',
  },
  'crystal-cyan': {
    name: 'Projeto Beta', subtitle: 'Dashboard de dados',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['TypeScript', 'D3.js', 'Vite'], images: [],
    github: 'https://github.com/seu-usuario/projeto-beta',
  },
  'deep-ocean': {
    name: 'Projeto Gama', subtitle: 'API e automação',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['Python', 'FastAPI', 'Docker'], images: [],
    github: 'https://github.com/seu-usuario/projeto-gama',
  },
  'emerald-green': {
    name: 'Projeto Delta', subtitle: 'Aplicativo mobile',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['Flutter', 'Firebase'], images: [],
    github: 'https://github.com/seu-usuario/projeto-delta',
  },
  'magma-volcanic': {
    name: 'Projeto Épsilon', subtitle: 'Jogo / experiência 3D',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['C++', 'OpenGL'], images: [],
    github: 'https://github.com/seu-usuario/projeto-epsilon',
  },
  'mystical-purple': {
    name: 'Projeto Zeta', subtitle: 'Ferramenta de IA',
    description: 'Descreva aqui o objetivo, o desafio e o resultado do projeto.',
    technologies: ['Python', 'PyTorch'], images: [],
    github: 'https://github.com/seu-usuario/projeto-zeta',
  },
};

const solarSystemConfig = {
  modelUrl: models.solarSystem, // caminho editável em js/principal.js

  colors: { holo: 0x19d4ff, holoDeep: 0x2a6bff, background: 0x02040a },

  quality: {
    desktop: { maxPixelRatio: 2, stars: 2500, dust: 600, bloomScale: 1, msaa: 4 },
    mobile: { maxPixelRatio: 1.5, stars: 900, dust: 200, bloomScale: 0.5, msaa: 0 },
  },
  bloom: { strength: 0.85, radius: 0.55, threshold: 0.85 }, // threshold alto = só o que é muito brilhante "brilha"

  camera: {
    // overviewFit: quanto do espaço reservado a visão geral ocupa (largura / altura; menor = sistema maior)
    fov: 38, overviewElevation: 0.5, overviewAzimuth: 0.3, overviewFit: { w: 1.02, h: 0.56 },
    focusElevation: 0.28, focusDistanceFactor: 3.6, minFocusFactor: 2.2,
    idleDrift: true, transition: 1.8,
  },

  // radius = raio visual desejado (o modelo é normalizado para esse raio)
  sun: { nodeName: 'Sun_Core', radius: 3, spin: 0.05, emissiveIntensity: 1.4, glowColor: 0xffa733, lightIntensity: 2.6 },

  // orbit: a/b = semieixos (b<a = elíptica; quase circulares → o sistema fica centrado no Sol), tilt em rad
  planets: [
    { id: 'golden-bronze',   nodeName: 'Planet_GoldenBronze',   radius: 0.9,  spin: 0.6, axialTilt: 0.20, atmosphere: 0xffb347, orbit: { a: 7.5,  b: 7.4,  tilt: 0.03,  speed: 0.22,  phase: 0.5 } },
    { id: 'crystal-cyan',    nodeName: 'Planet_CrystalCyan',    radius: 0.8,  spin: 0.8, axialTilt: 0.10, atmosphere: 0x44e8ff, orbit: { a: 10.5, b: 10.35, tilt: -0.04, speed: 0.17,  phase: 2.1 } },
    { id: 'deep-ocean',      nodeName: 'Planet_DeepOcean',      radius: 1.15, spin: 0.4, axialTilt: 0.40, atmosphere: 0x3a7bff, orbit: { a: 14,   b: 13.8, tilt: 0.05,  speed: 0.13,  phase: 4.0 } },
    { id: 'emerald-green',   nodeName: 'Planet_EmeraldGreen',   radius: 1.0,  spin: 0.5, axialTilt: 0.30, atmosphere: 0x3dffa0, orbit: { a: 18,   b: 17.75, tilt: -0.03, speed: 0.10,  phase: 5.3 } },
    { id: 'magma-volcanic',  nodeName: 'Planet_MagmaVolcanic',  radius: 1.3,  spin: 0.3, axialTilt: 0.05, atmosphere: 0xff6a3a, orbit: { a: 22.5, b: 22.15, tilt: 0.04,  speed: 0.075, phase: 1.2 } },
    { id: 'mystical-purple', nodeName: 'Planet_MysticalPurple', radius: 0.95, spin: 0.7, axialTilt: 0.50, atmosphere: 0xb06bff, orbit: { a: 27,   b: 26.6, tilt: -0.05, speed: 0.055, phase: 3.2 } },
  ],

  projects: projetosExemplo,
};

/** Ponto da elipse com o Sol em um dos focos (origem). */
function orbitPoint(o, angle, out) {
  const c = Math.sqrt(Math.max(o.a * o.a - o.b * o.b, 0));
  return out.set(o.a * Math.cos(angle) - c, 0, o.b * Math.sin(angle));
}

function getMaxOrbitRadius(config) {
  return Math.max(...config.planets.map((p) => p.orbit.a + Math.sqrt(Math.max(p.orbit.a ** 2 - p.orbit.b ** 2, 0))));
}

/* ===== 4. PLANETA ↔ PROJETO ===== */

const cfgOf = (id) => solarSystemConfig.planets.find((p) => p.id === id);

/** Projeto associado a um planeta (por id ou nodeName); undefined se não houver. */
function getProjectForPlanet(planetId) {
  const cfg = cfgOf(planetId);
  const key = planetProjects[planetId] ?? (cfg && planetProjects[cfg.nodeName]);
  return key ? projects[key] : undefined;
}

/** Planeta de um projeto (chave em js/projetos.js, ex.: "skillshare"); null se o projeto não existir. */
function getPlanetForProject(projectId) {
  if (!projectId) return null;
  const hit = solarSystemConfig.planets.find((p) => {
    const key = planetProjects[p.id] ?? planetProjects[p.nodeName];
    return key === projectId || projects[key]?.id === projectId;
  });
  return hit?.id ?? null;
}

/** Chave do projeto de um planeta (para o endereço ?projeto=). */
function getProjectKeyForPlanet(planetId) {
  const cfg = cfgOf(planetId);
  return planetProjects[planetId] ?? (cfg && planetProjects[cfg.nodeName]) ?? null;
}

/** Converte as associações no formato que o painel existente já consome (config.projects[planetId]). */
function buildPanelProjects() {
  const out = {};
  for (const p of solarSystemConfig.planets) {
    const pr = getProjectForPlanet(p.id);
    if (!pr) continue;
    out[p.id] = {
      name: pr.name, subtitle: pr.subtitle, description: pr.description,
      technologies: pr.technologies ?? [], images: [], // imagens/vídeos ficam na galeria, sem duplicar no painel
      github: pr.github, demo: pr.demo,
    };
  }
  return out;
}

/** Avisos no console para associações quebradas. */
function validateAssignments() {
  const keys = new Set(solarSystemConfig.planets.flatMap((p) => [p.id, p.nodeName]));
  for (const [planet, proj] of Object.entries(planetProjects)) {
    if (!keys.has(planet)) console.warn(`[projects] Planeta "${planet}" não existe em solarSystemConfig.planets.`);
    if (!projects[proj]) console.warn(`[projects] Projeto "${proj}" (planeta "${planet}") não existe em js/projetos.js.`);
  }
}

/* ===== 5. CÂMERA DO SISTEMA SOLAR ===== */

const _fp = new THREE.Vector3();
const _off = new THREE.Vector3();
const angleDiff = (d) => Math.atan2(Math.sin(d), Math.cos(d));

/** Câmera do sistema solar: visão geral, foco no planeta, transições e deriva suave. */
class CameraController {
  constructor(camera, config, maxRadius, { reducedMotion = false, origin = null, hosted = false } = {}) {
    this.camera = camera;
    this.cfg = config.camera;
    this.maxR = maxRadius;
    this.reduced = reducedMotion;
    this.origin = origin ? origin.clone() : new THREE.Vector3();
    this.hosted = hosted;
    this.frame = null;
    this.focus = null;
    this.target = this.origin.clone();
    this.az = this.cfg.overviewAzimuth;
    this.w = 1; this.h = 1;
    this.state = { dist: 60, el: this.cfg.overviewElevation, shiftX: 0, shiftY: 0 };
    this.shift = { x: 0, y: 0 };
    this._sx = NaN; this._sy = NaN;
    this.azOffset = 0.6; // ângulo da câmera em relação à direção Sol→planeta no foco
  }

  _d(s) { return this.reduced ? 0.01 : s; }

  /** Distância que enquadra todo o sistema para a proporção atual da tela (ou da área reservada */
  overviewDistance() {
    return overviewDistanceFor(this.cfg, this.maxR, this.camera.aspect, this.frame);
  }

  overviewElevation() { return overviewElevationFor(this.cfg, this.camera.aspect, this.frame); }

  setViewport(w, h) {
    this.w = Math.max(w, 1); this.h = Math.max(h, 1);
    this.camera.aspect = this.w / this.h;
    this._sx = NaN; // força reaplicar view offset/projeção
    if (!this.focus && !gsap.isTweening(this.state)) { this.state.dist = this.overviewDistance(); this.state.el = this.overviewElevation(); }
  }

  /** Modo hospedado: área da tela onde o sistema deve caber (recalcula a visão geral). */
  setFrame(frame) {
    this.frame = frame;
    if (!this.focus && !gsap.isTweening(this.state)) { this.state.dist = this.overviewDistance(); this.state.el = this.overviewElevation(); }
  }

  intro() {
    const d = this.overviewDistance();
    if (this.reduced || this.hosted) { this.state.dist = d; return; } // hospedado: a viagem até o sistema é a introdução
    this.state.dist = d * 1.8; this.state.el = 1.0;
    gsap.to(this.state, { dist: d, el: this.overviewElevation(), duration: 3, ease: 'power3.out' });
  }

  overview(instant = false) {
    this.focus = null;
    const to = { dist: this.overviewDistance(), el: this.overviewElevation(), shiftX: 0, shiftY: 0 };
    if (instant) { gsap.killTweensOf(this.state); Object.assign(this.state, to); this.target.copy(this.origin); this.az = this.cfg.overviewAzimuth; return; }
    gsap.to(this.state, { ...to, duration: this._d(this.cfg.transition), ease: 'power3.inOut', overwrite: true });
  }

  /** Foco em um planeta. */
  focusOn(planet, { shiftX = 0, shiftY = 0, screen = null, duration } = {}) {
    this.focus = planet;
    const r = planet.cfg.radius;
    // com o dossiê, a câmera fica do outro lado: o Sol sai de trás dos painéis (fundo escuro = texto legível)
    this.azOffset = screen ? -0.6 : 0.6;
    let dist;
    if (screen && screen.size > 0) {
      const tanV = Math.tan(THREE.MathUtils.degToRad(this.cfg.fov / 2));
      dist = Math.max(r / ((screen.size / this.h) * tanV), r * this.cfg.minFocusFactor);
      // o deslocamento total é estado + área reservada (frame); compensa o do frame para acertar o ponto pedido
      shiftX = -(screen.x - this.w / 2) / this.w - (this.frame?.shiftX ?? 0);
      shiftY = -(screen.y - this.h / 2) / this.h - (this.frame?.shiftY ?? 0);
    } else {
      // hospedado: o planeta ocupa a mesma fração da ÁREA do sistema que ocupava no painel original (não da tela toda)
      const k = this.frame ? 1.22 / this.frame.hFrac : 1;
      dist = Math.max(r * this.cfg.focusDistanceFactor, r * this.cfg.minFocusFactor + 0.5) * k;
    }
    gsap.to(this.state, { dist, el: this.cfg.focusElevation, shiftX, shiftY, duration: this._d(duration ?? this.cfg.transition), ease: 'power3.inOut', overwrite: true });
  }

  update(dt, time) {
    const s = this.state, cam = this.camera;
    let desiredAz = this.cfg.overviewAzimuth;
    if (this.focus) {
      this.focus.positioner.getWorldPosition(_fp);
      desiredAz = Math.atan2(-(_fp.x - this.origin.x), -(_fp.z - this.origin.z)) + this.azOffset; // câmera do lado do Sol → hemisfério iluminado
    } else {
      _fp.copy(this.origin);
      if (this.cfg.idleDrift && !this.reduced) desiredAz += Math.sin(time * 0.15) * 0.15;
    }
    this.target.lerp(_fp, 1 - Math.exp(-dt * 4));
    this.az += angleDiff(desiredAz - this.az) * (1 - Math.exp(-dt * 2.5));

    const ce = Math.cos(s.el);
    _off.set(Math.sin(this.az) * ce, Math.sin(s.el), Math.cos(this.az) * ce).multiplyScalar(s.dist);
    cam.position.copy(this.target).add(_off);

    if (this.focus) { // nunca atravessar o planeta (nem durante a transição)
      const minD = this.focus.cfg.radius * this.cfg.minFocusFactor;
      _off.copy(cam.position).sub(_fp);
      if (_off.length() < minD) cam.position.copy(_fp).add(_off.setLength(minD));
    }
    cam.lookAt(this.target);

    // deslocamento da projeção (abre espaço para o painel / centraliza na área reservada)
    const fx = this.frame?.shiftX ?? 0, fy = this.frame?.shiftY ?? 0;
    this.shift.x = s.shiftX + fx; this.shift.y = s.shiftY + fy;
    if (this.hosted) return; // o diretor do universo aplica o deslocamento na câmera real
    if (s.shiftX !== this._sx || s.shiftY !== this._sy) {
      this._sx = s.shiftX; this._sy = s.shiftY;
      if (Math.abs(s.shiftX) + Math.abs(s.shiftY) < 1e-4) cam.clearViewOffset();
      else cam.setViewOffset(this.w, this.h, this.w * s.shiftX, this.h * s.shiftY, this.w, this.h);
    }
  }

  dispose() { gsap.killTweensOf(this.state); }
}

/** Distância da visão geral. Sem `frame`: fórmula original (demo isolada). Com `frame`: cabe na área reservada. */
function overviewDistanceFor(cfg, maxR, aspect, frame) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(cfg.fov / 2));
  const tanH = tanV * aspect;
  if (!frame) return Math.max(maxR * 1.3 / tanH, maxR * 0.85 / tanV) * 1.05;
  const fit = cfg.overviewFit ?? { w: 0.8, h: 0.48 };
  // área estreita (celular em pé): vista mais de cima
  const portrait = (aspect * frame.wFrac) / frame.hFrac < 1;
  const fw = portrait ? fit.w * 0.86 : fit.w, fh = portrait ? fit.h * 1.5 : fit.h;
  return Math.max(maxR * fw / (tanH * frame.wFrac), maxR * fh / (tanV * frame.hFrac));
}

/** Inclinação da visão geral: mais de cima em áreas estreitas (o sistema ocupa mais altura no celular). */
function overviewElevationFor(cfg, aspect, frame) {
  if (frame && (aspect * frame.wFrac) / frame.hFrac < 1) return Math.max(cfg.overviewElevation, 0.95);
  return cfg.overviewElevation;
}

/** Pose da visão geral (sem deriva) — usada pelo caminho de viagem para chegar exatamente onde o sistema começa. */
function overviewPose(cfg, maxR, aspect, frame, origin, out = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }) {
  const dist = overviewDistanceFor(cfg, maxR, aspect, frame), el = overviewElevationFor(cfg, aspect, frame), az = cfg.overviewAzimuth;
  const ce = Math.cos(el);
  out.position.set(Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce).multiplyScalar(dist).add(origin);
  const m = new THREE.Matrix4().lookAt(out.position, origin, new THREE.Vector3(0, 1, 0));
  out.quaternion.setFromRotationMatrix(m);
  return out;
}

/* ===== 6. ÓRBITAS HOLOGRÁFICAS ===== */

const POINT_VERT = /* glsl */ `attribute float aSeed; attribute float aAlpha;
uniform float uTime, uPx, uSize, uAtten, uTwinkle; varying float vA;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 60.0));
  vA = aAlpha * tw;
  float att = mix(1.0, 40.0 / max(-mv.z, 1.0), uAtten);
  gl_PointSize = max(1.0, uSize * uPx * (0.4 + aSeed) * att * (0.5 + 0.5 * aAlpha));
  gl_Position = projectionMatrix * mv;
}`;
const POINT_FRAG = /* glsl */ `uniform vec3 uColor; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(uColor * 2.0, a); }`;

const PULSES = 3, TRAIL = 16;
const _v = new THREE.Vector3();

class HolographicOrbits {
  constructor(config, quality) {
    this.config = config;
    this.group = new THREE.Group();
    this.group.name = 'HolographicOrbits';
    this.maxR = getMaxOrbitRadius(config);
    this.orbits = new Map();
    this._timeMats = [];
    this._pxMats = [];
    const holo = config.colors.holo;
    // Estilo opcional (config.orbitStyle).
    const st = (this.style = { lineColor: holo, lineOpacity: 0.5, pulseColor: 0x66f0ff, pulseSize: 5, discs: true, radials: true, grid: true, trail: false, pulses: true, ...config.orbitStyle });

    this._buildOrbits(st);
    if (st.discs === 'refined') this._buildRefinedDiscs(holo, config.sun.radius);
    else if (st.discs) this._buildDiscs(holo, config.sun.radius);
    if (st.radials) this._buildRadials(holo, config.sun.radius);
    if (st.grid) this._buildGrid(holo);

    this.dust = this._points(this._dustData(quality.dust), { color: holo, size: 3, atten: 1, twinkle: 0.6 });
    this.stars = this._points(this._starData(quality.stars), { color: 0xaad4ff, size: 2.2, atten: 0, twinkle: 0.5 });
    this.group.add(this.dust, this.stars);
  }

  _material(mat) { this._timeMats.push(mat); return mat; }

  _buildOrbits(st) {
    const seg = 256;
    for (const cfg of this.config.planets) {
      const o = cfg.orbit;
      const g = new THREE.Group();
      g.rotation.x = o.tilt || 0;
      const pts = [];
      for (let i = 0; i < seg; i++) pts.push(orbitPoint(o, (i / seg) * Math.PI * 2, new THREE.Vector3()));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      let mat;
      if (st.trail) {
        geo.setAttribute('aT', new THREE.BufferAttribute(Float32Array.from({ length: seg }, (_, i) => i / seg), 1));
        mat = createOrbitTrailMaterial({ color: st.lineColor, trail: cfg.atmosphere ?? st.pulseColor, base: st.lineOpacity, gain: 0.85 });
      } else mat = new THREE.LineBasicMaterial({ color: st.lineColor, transparent: true, opacity: st.lineOpacity, blending: THREE.AdditiveBlending, depthWrite: false });
      g.add(new THREE.LineLoop(geo, mat));
      if (!st.pulses) { this.group.add(g); this.orbits.set(cfg.id, { cfg, line: mat, pulse: null, pos: null }); continue; }

      const pos = new Float32Array(PULSES * TRAIL * 3);
      const alpha = new Float32Array(PULSES * TRAIL);
      for (let j = 0; j < PULSES; j++) for (let k = 0; k < TRAIL; k++) alpha[j * TRAIL + k] = (1 - k / TRAIL) ** 2;
      const pulse = this._points({ pos, alpha, seed: new Float32Array(pos.length / 3).fill(0.9) }, { color: st.pulseColor, size: st.pulseSize, atten: 1, twinkle: 0 });
      g.add(pulse);
      this.group.add(g);
      this.orbits.set(cfg.id, { cfg, line: mat, pulse, pos });
    }
  }

  _buildDiscs(holo, sunR) {
    const R = this.maxR;
    const add = (inner, outer, o) => {
      const mat = this._material(createRingMaterial({ color: holo, inner, outer, ...o }));
      const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160, 1), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.y = o.y ?? 0;
      m.renderOrder = 1;
      this.group.add(m);
    };
    add(R * 1.12, R * 1.22, { opacity: 0.9, ticks: 180, dash: 90, speed: 0.01 });          // régua astronômica externa
    add(R * 1.03, R * 1.06, { opacity: 0.6, dash: 36, speed: -0.02 });
    add(sunR * 1.7, sunR * 1.85, { opacity: 0.9, ticks: 72, dash: 0, speed: 0.04 });        // anéis em torno do Sol
    add(sunR * 2.3, sunR * 2.4, { opacity: 0.8, dash: 14, speed: -0.03 });
    add(sunR * 1.3, R * 1.1, { opacity: 0.13, rim: 0, pulse: 1, y: -0.01 });                // onda de energia
  }

  /** Versão discreta: régua astronômica externa */
  _buildRefinedDiscs(holo, sunR) {
    const R = this.maxR;
    const add = (inner, outer, o) => {
      const mat = this._material(createRingMaterial({ color: holo, inner, outer, ...o }));
      const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 192, 1), mat);
      m.rotation.x = -Math.PI / 2; m.position.y = o.y ?? 0; m.renderOrder = 1;
      this.group.add(m);
    };
    add(sunR * 1.75, sunR * 1.82, { opacity: 0.4, ticks: 96, dash: 0, speed: 0.03, rim: 0.7 });
    add(sunR * 2.25, sunR * 2.28, { opacity: 0.3, dash: 24, speed: -0.025 });
  }

  /** Rastro: posição (0…1) de cada planeta na sua órbita. */
  syncHeads(planets) {
    if (!this.style.trail) return;
    for (const p of planets) { const o = this.orbits.get(p.id); if (o) o.line.uniforms.uHead.value = (((p.angle / (Math.PI * 2)) % 1) + 1) % 1; }
  }

  _buildRadials(holo, sunR) {
    const mk = (n, r0, r1, step, opacity) => {
      const p = [];
      for (let i = 0; i < n; i += step) {
        const a = (i / n) * Math.PI * 2;
        p.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1);
      }
      const g = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: holo, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.group.add(l);
    };
    mk(24, sunR * 1.9, this.maxR * 1.1, 1, 0.14);
    mk(4, sunR * 1.9, this.maxR * 1.28, 1, 0.45);
  }

  _buildGrid(holo) {
    const R = this.maxR * 1.25;
    const mat = createGridMaterial({ color: holo, radius: R, step: 1, opacity: 0.2 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 2, R * 2), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = -0.05;
    this.group.add(m);
  }

  _starData(n) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n), alpha = new Float32Array(n).fill(1);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 140 + Math.random() * 120;
      pos.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
      seed[i] = Math.random();
    }
    return { pos, seed, alpha };
  }

  _dustData(n) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n), alpha = new Float32Array(n).fill(0.7);
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(Math.random()) * this.maxR * 1.25, a = Math.random() * Math.PI * 2;
      pos.set([Math.cos(a) * r, (Math.random() - 0.5) * 6, Math.sin(a) * r], i * 3);
      seed[i] = Math.random();
    }
    return { pos, seed, alpha };
  }

  _points({ pos, seed, alpha }, { color, size, atten, twinkle }) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uPx: { value: 1 }, uSize: { value: size }, uAtten: { value: atten }, uTwinkle: { value: twinkle } },
      vertexShader: POINT_VERT, fragmentShader: POINT_FRAG,
    });
    this._timeMats.push(m); this._pxMats.push(m);
    const p = new THREE.Points(g, m);
    p.frustumCulled = false;
    return p;
  }

  setPixelRatio(px) { for (const m of this._pxMats) m.uniforms.uPx.value = px; }

  /** Realça a órbita do planeta selecionado (null = todas normais). */
  setActive(id) {
    const base = this.style.lineOpacity; // padrão 0.5 → 0.5 / 0.95 / 0.22, como no original
    for (const [pid, o] of this.orbits) {
      const k = id == null ? 1 : pid === id ? 1.9 : 0.44;
      if (o.line.uniforms) { o.line.uniforms.uBase.value = Math.min(1, base * k); o.line.uniforms.uGain.value = id == null ? 0.85 : pid === id ? 1 : 0.35; }
      else o.line.opacity = Math.min(1, base * k);
    }
  }

  update(dt, time, motion = 1) {
    for (const m of this._timeMats) m.uniforms.uTime.value = time;
    this.dust.rotation.y += dt * 0.01 * motion;
    for (const { cfg, pulse, pos } of this.orbits.values()) {
      if (!pulse) continue;
      const o = cfg.orbit, speed = 4 / o.a, step = 0.9 / o.a;
      for (let j = 0; j < PULSES; j++) {
        const head = time * speed * (0.8 + j * 0.2) + (j * Math.PI * 2) / PULSES + (o.phase || 0);
        for (let k = 0; k < TRAIL; k++) {
          orbitPoint(o, head - k * step, _v);
          pos.set([_v.x, _v.y, _v.z], (j * TRAIL + k) * 3);
        }
      }
      pulse.geometry.attributes.position.needsUpdate = true;
    }
  }
}

/* ===== 7. PLANETAS ===== */

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _sun = new THREE.Vector3();

/** Texturas do brilho do Sol, desenhadas uma vez em canvas (sem arquivos extras). */
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,236,190,1)'); r.addColorStop(0.18, 'rgba(255,196,110,.55)'); r.addColorStop(0.42, 'rgba(255,140,60,.16)');
  r.addColorStop(0.7, 'rgba(255,110,40,.04)'); r.addColorStop(1, 'rgba(255,100,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function coronaTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); g.translate(256, 256); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 140; i++) {
    const a = Math.random() * Math.PI * 2, len = 120 + Math.random() * 130, w = 0.6 + Math.random() * 1.8;
    const grd = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    grd.addColorStop(0.32, 'rgba(255,200,120,0)'); grd.addColorStop(0.45, `rgba(255,190,110,${0.12 + Math.random() * 0.16})`); grd.addColorStop(1, 'rgba(255,150,60,0)');
    g.strokeStyle = grd; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Carrega o GLB e cria, para cada controlador, a hierarquia */
class PlanetManager {
  constructor(config, { onWarn } = {}) {
    this.config = config;
    this.onWarn = onWarn;
    this.warnings = [];
    this.group = new THREE.Group();
    this.group.name = 'SolarSystemRoot';
    this.planets = [];
    this.byId = new Map();
    this.sun = null;
    this._sphere = new THREE.SphereGeometry(1, 48, 32);
    this._proxy = new THREE.SphereGeometry(1, 16, 12);
    this._hidden = new THREE.MeshBasicMaterial({ visible: false });
  }

  _warn(msg, err) {
    console.warn(`[SolarSystem] ${msg}`, err ?? '');
    this.warnings.push(msg);
    this.onWarn?.(this.warnings.slice());
  }

  async load(url, onProgress) {
    let root = null;
    try {
      const gltf = await gltfLoader.loadAsync(url, (e) => e.lengthComputable && onProgress?.(e.loaded / e.total));
      root = gltf.scene;
      root.updateMatrixWorld(true);
    } catch (err) {
      this._warn(`Não foi possível carregar o GLB (${url}). Exibindo planetas placeholder.`, err);
    }
    this._buildSun(root);
    for (const cfg of this.config.planets) this._buildPlanet(cfg, root);
  }

  /** Localiza o controlador, "assa" a transformação mundial nele e mede o centro/tamanho. */
  _acquire(nodeName, root, radius, color) {
    const node = root?.getObjectByName(nodeName);
    if (node) {
      node.updateWorldMatrix(true, false);
      node.matrixWorld.decompose(node.position, node.quaternion, node.scale);
      node.removeFromParent();
      node.updateMatrixWorld(true);
      const box = _box.setFromObject(node);
      if (!box.isEmpty()) {
        box.getSize(_size);
        return { object: node, center: box.getCenter(new THREE.Vector3()), scale: (2 * radius) / Math.max(_size.x, _size.y, _size.z, 1e-6), placeholder: false };
      }
      this._warn(`"${nodeName}" não contém geometria. Usando placeholder.`);
    } else if (root) {
      this._warn(`Objeto "${nodeName}" não encontrado no GLB. Usando placeholder.`);
    }
    const mesh = new THREE.Mesh(this._sphere, new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.12 }));
    mesh.name = `Placeholder_${nodeName}`;
    return { object: mesh, center: new THREE.Vector3(), scale: radius, placeholder: true };
  }

  _buildSun(root) {
    const c = this.config.sun;
    const a = this._acquire(c.nodeName, root, c.radius, c.glowColor);
    const group = new THREE.Group(); group.name = 'Sun';
    const spin = new THREE.Group(); spin.scale.setScalar(a.scale);
    const centerer = new THREE.Group(); centerer.position.copy(a.center).negate();
    centerer.add(a.object); spin.add(centerer); group.add(spin);

    // Brilho próprio usando a textura original (HDR > threshold do bloom)
    a.object.traverse((m) => {
      if (!m.isMesh) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        if (!mat.isMeshStandardMaterial) continue;
        mat.emissiveMap = mat.map || null;
        mat.emissive.set(mat.map ? 0xffffff : c.glowColor);
        mat.emissiveIntensity = c.emissiveIntensity;
        mat.needsUpdate = true;
      }
    });

    // borda luminosa justa (a antiga casca larga formava um disco marrom em volta do Sol) + brilho e coroa em sprites
    const shells = [[1.08, 2.6, 1.15]].map(([s, power, intensity]) => {
      const mesh = new THREE.Mesh(this._sphere, createFresnelMaterial({ color: c.glowColor, power, intensity }));
      mesh.scale.setScalar(c.radius * s);
      group.add(mesh);
      return { mesh, base: intensity };
    });
    const sprite = (map, scale, opacity) => {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.scale.setScalar(c.radius * scale); group.add(m); return m;
    };
    const glow = sprite(glowTexture(), 4.4, 0.7);
    const corona = sprite(coronaTexture(), 4.2, 0.5);
    const light = new THREE.PointLight(0xfff1d6, c.lightIntensity, 0, 0);
    group.add(light);
    this.group.add(group);
    this.sun = { group, spin, shells, light, glow, corona };
  }

  _buildPlanet(cfg, root) {
    const a = this._acquire(cfg.nodeName, root, cfg.radius, cfg.atmosphere);
    const pivot = new THREE.Group(); pivot.name = `Orbit_${cfg.id}`; pivot.rotation.x = cfg.orbit.tilt || 0;
    const positioner = new THREE.Group(); positioner.name = `Position_${cfg.id}`;
    const spin = new THREE.Group(); spin.name = `Spin_${cfg.id}`;
    spin.rotation.order = 'ZYX'; spin.rotation.z = cfg.axialTilt || 0; spin.scale.setScalar(a.scale);
    const centerer = new THREE.Group(); centerer.position.copy(a.center).negate();
    centerer.add(a.object); spin.add(centerer); positioner.add(spin); pivot.add(positioner); this.group.add(pivot);

    // atmosfera iluminada pelo Sol (crescente luminoso no lado do dia)
    const atmosphere = new THREE.Mesh(this._sphere, createAtmosphereMaterial({ color: cfg.atmosphere, power: 2.4, intensity: 0.95 }));
    atmosphere.scale.setScalar(cfg.radius * 1.1);
    positioner.add(atmosphere);
    // marcador holográfico no plano da órbita (cor do planeta), girando devagar
    const markerMat = createRingMaterial({ color: cfg.atmosphere, inner: 1, outer: 1.035, opacity: 0.3, dash: 40, speed: 0.05 });
    const marker = new THREE.Mesh(this._markerGeo ??= new THREE.RingGeometry(1, 1.035, 96, 1), markerMat);
    marker.rotation.x = -Math.PI / 2; marker.scale.setScalar(cfg.radius * 1.75); marker.renderOrder = 2;
    positioner.add(marker);

    // Proxy esférico invisível: raycast barato e preciso (não testa milhares de triângulos)
    const proxy = new THREE.Mesh(this._proxy, this._hidden);
    proxy.scale.setScalar(cfg.radius * 1.1);
    proxy.visible = false;
    proxy.userData.planetId = cfg.id;
    positioner.add(proxy);

    const entry = { id: cfg.id, cfg, pivot, positioner, spin, atmosphere, marker, proxy, angle: cfg.orbit.phase || 0, glow: 0, hoverTarget: 0, placeholder: a.placeholder };
    orbitPoint(cfg.orbit, entry.angle, positioner.position);
    this.planets.push(entry);
    this.byId.set(cfg.id, entry);
  }

  getPickables() { return this.planets.map((p) => p.proxy); }

  update(dt, time, motion = 1) {
    if (this.sun) {
      const s = this.sun;
      s.spin.rotation.y += dt * this.config.sun.spin * motion;
      const f = 1 + 0.08 * Math.sin(time * 1.7) + 0.04 * Math.sin(time * 3.1);
      for (const sh of s.shells) sh.mesh.material.uniforms.uIntensity.value = sh.base * f;
      s.light.intensity = this.config.sun.lightIntensity * (0.97 + 0.03 * f);
      // com um projeto aberto o Sol fica mais discreto (os painéis ficam na frente dele)
      this._dim = (this._dim ?? 0) + ((this.dim ? 1 : 0) - (this._dim ?? 0)) * (1 - Math.exp(-dt * 3));
      const k = 1 - 0.65 * this._dim;
      s.glow.material.opacity = (0.66 + 0.06 * f) * k;
      s.corona.material.rotation += dt * 0.012 * motion;
      s.corona.material.opacity = (0.46 + 0.08 * Math.sin(time * 0.9)) * k;
      for (const sh of s.shells) sh.mesh.material.uniforms.uIntensity.value *= 0.6 + 0.4 * k;
    }
    this.group.getWorldPosition(_sun); // o Sol fica na origem do sistema
    const k = 1 - Math.exp(-dt * 10);
    for (const p of this.planets) {
      p.angle += dt * p.cfg.orbit.speed * motion;
      orbitPoint(p.cfg.orbit, p.angle, p.positioner.position);
      p.spin.rotation.y += dt * p.cfg.spin * motion;
      p.glow += (p.hoverTarget - p.glow) * k;
      p.atmosphere.material.uniforms.uIntensity.value = 0.95 + p.glow * 1.6;
      p.atmosphere.material.uniforms.uSunPos.value.copy(_sun);
      p.marker.material.uniforms.uTime.value = time;
      p.marker.material.uniforms.uOpacity.value = 0.26 + p.glow * 0.6;
    }
  }
}

/* ===== 8. CLIQUES E DESTAQUE NOS PLANETAS ===== */

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
// (_v: vetor auxiliar, declarado na parte 6)
const _u = new THREE.Vector3();

class ProjectInteraction {
  constructor({ root, canvas, viewEl = null, camera, planets, cameraCtrl, orbits, config, reducedMotion, onSelect, onReset, externalPanel = false, focusOptions = null, planetTags = false }) {
    // canvas: onde chegam ponteiro/toque · viewEl: o que a câmera desenha (modo hospedado: canvas do universo
    Object.assign(this, { root, canvas, viewEl: viewEl ?? canvas, camera, planets, cameraCtrl, orbits, config, reduced: reducedMotion, onSelect, onReset, externalPanel, focusOptions, planetTags });
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.pointer = null; this.down = null; this._dirty = false;
    this.hovered = null; this.selected = null;
    this._mats = []; this._geos = [];
    this._buildUI();
    this._buildRings();
    this._bind();
  }

  _project(id) { return this.config.projects[id] ?? { name: id, description: '', technologies: [], images: [] }; }

  // ---------- UI ----------
  _buildUI() {
    this.ui = el('div', 'ss-ui');
    this.label = el('div', 'ss-label'); this.label.setAttribute('aria-hidden', 'true');
    this.nav = el('nav', 'ss-nav'); this.nav.setAttribute('aria-label', 'Projetos');
    this.buttons = new Map();
    for (const p of this.planets.planets) {
      const b = el('button', 'ss-nav__btn', this._project(p.id).name);
      b.type = 'button';
      b.addEventListener('click', () => this.select(p.id));
      this.nav.append(b); this.buttons.set(p.id, b);
    }
    this.panel = el('aside', 'ss-panel');
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'false');
    this.panel.setAttribute('aria-hidden', 'true');
    this.ui.append(this.label, this.nav, ...(this.externalPanel ? [] : [this.panel]));
    // etiquetas fixas (número da órbita + nome do projeto) junto de cada planeta na visão geral
    this.tags = new Map();
    if (this.planetTags) {
      this.tagLayer = el('div', 'ss-tags'); this.tagLayer.setAttribute('aria-hidden', 'true');
      this.planets.planets.forEach((p, i) => {
        const t = el('div', 'ss-tag');
        t.style.setProperty('--acc', '#' + new THREE.Color(p.cfg.atmosphere ?? 0x35d6f5).getHexString());
        t.append(el('span', 'ss-tag__idx', String(i + 1).padStart(2, '0')), el('span', 'ss-tag__name', this._project(p.id).name));
        this.tagLayer.append(t); this.tags.set(p.id, t);
      });
      this.ui.prepend(this.tagLayer);
    }
    this.root.append(this.ui);
  }

  _fillPanel(id) {
    if (this.externalPanel) return;
    const pr = this._project(id);
    const idx = this.planets.planets.findIndex((p) => p.id === id) + 1;
    this.panel.setAttribute('aria-label', `Projeto ${pr.name}`);
    const back = el('button', 'ss-btn', '← Voltar ao sistema solar');
    back.type = 'button';
    back.addEventListener('click', () => this.reset());
    this.backBtn = back;

    const chips = el('ul', 'ss-chips');
    for (const t of pr.technologies ?? []) chips.append(el('li', 'ss-chip', t));

    const gallery = el('div', 'ss-gallery');
    for (const img of pr.images ?? []) {
      const src = typeof img === 'string' ? img : img.src;
      const i = el('img'); i.src = src; i.alt = (typeof img === 'object' && img.alt) || `Imagem do projeto ${pr.name}`; i.loading = 'lazy';
      gallery.append(i);
    }

    const links = el('div', 'ss-links');
    const link = (href, text) => {
      if (!href) return;
      const a = el('a', 'ss-btn ss-btn--primary', text);
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      links.append(a);
    };
    link(pr.github, 'Ver no GitHub ↗');
    link(pr.demo, 'Demo ao vivo ↗');

    this.panel.replaceChildren(
      el('div', 'ss-kicker', `PROJETO ${String(idx).padStart(2, '0')}`),
      el('h2', 'ss-title', pr.name),
      ...(pr.subtitle ? [el('div', 'ss-subtitle', pr.subtitle)] : []),
      el('p', 'ss-desc', pr.description),
      chips,
      ...(gallery.children.length ? [gallery] : []),
      links, back,
    );
  }

  _showPanel() {
    if (this.externalPanel) return;
    this.panel.setAttribute('aria-hidden', 'false');
    const mobile = this.root.clientWidth < 720;
    gsap.killTweensOf(this.panel);
    gsap.fromTo(this.panel, { autoAlpha: 0, x: mobile ? 0 : 40, y: mobile ? 40 : 0 }, { autoAlpha: 1, x: 0, y: 0, duration: this.reduced ? 0.01 : 0.6, ease: 'power3.out', delay: this.reduced ? 0 : 0.5 });
  }

  _hidePanel() {
    if (this.externalPanel) return;
    this.panel.setAttribute('aria-hidden', 'true');
    gsap.killTweensOf(this.panel);
    gsap.to(this.panel, { autoAlpha: 0, duration: this.reduced ? 0.01 : 0.3 });
  }

  // ---------- Anéis de seleção ----------
  _ring(inner, outer, opts) {
    const mat = createRingMaterial({ inner, outer, ...opts });
    const geo = new THREE.RingGeometry(inner, outer, 96, 1);
    this._mats.push(mat); this._geos.push(geo);
    return new THREE.Mesh(geo, mat);
  }

  _buildRings() {
    this.hoverRing = this._ring(1, 1.05, { opacity: 0.8, dash: 48, speed: 0.08 });
    this.hoverRing.visible = false;
    this.selectGroup = new THREE.Group();
    this.selectGroup.add(this._ring(1, 1.1, { opacity: 1, ticks: 90, speed: -0.12 }));
    const outer = this._ring(1.25, 1.3, { opacity: 0.7, dash: 14, speed: 0.15 });
    this.selectGroup.add(outer);
  }

  // ---------- Eventos ----------
  _bind() {
    this._on = (t, fn, target = this.canvas) => { target.addEventListener(t, fn); (this._offs ??= []).push(() => target.removeEventListener(t, fn)); };
    this._on('pointermove', (e) => { this.pointer = { x: e.clientX, y: e.clientY }; this._dirty = true; });
    this._on('pointerleave', () => { this.pointer = null; this._setHover(null); });
    this._on('pointerdown', (e) => { this.down = { x: e.clientX, y: e.clientY }; });
    this._on('pointerup', (e) => {
      const d = this.down; this.down = null;
      if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) return;
      const hit = this._pick(e.clientX, e.clientY);
      if (hit) this.select(hit.id);
    });
    this._on('keydown', (e) => { if (e.key === 'Escape' && this.selected) this.reset(); }, document);
  }

  _pick(cx, cy) {
    const r = this.viewEl.getBoundingClientRect();
    this.ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.planets.getPickables(), false)[0];
    return hit ? this.planets.byId.get(hit.object.userData.planetId) : null;
  }

  _setHover(p) {
    if (p === this.hovered) return;
    if (this.hovered) this.hovered.hoverTarget = this.hovered === this.selected ? 0.5 : 0;
    this.hovered = p;
    this.canvas.style.cursor = p ? 'pointer' : '';
    for (const [id, t] of this.tags) t.classList.toggle('is-hover', !!p && id === p.id);
    if (p) {
      p.hoverTarget = 1;
      this.label.textContent = this.tags.size ? '' : this._project(p.id).name;
      p.positioner.add(this.hoverRing);
      this.hoverRing.scale.setScalar(p.cfg.radius * 1.4);
    }
    this.hoverRing.visible = !!p && p !== this.selected;
    this.label.classList.toggle('is-visible', !!p && !this.tags.size);
  }

  // ---------- API ----------
  select(id) {
    const p = this.planets.byId.get(id);
    if (!p || p === this.selected) return;
    if (this.selected) this.selected.hoverTarget = 0;
    this.selected = p; p.hoverTarget = 0.5; this.planets.dim = true;
    p.positioner.add(this.selectGroup);
    this.selectGroup.scale.setScalar(p.cfg.radius * 1.5);
    this.hoverRing.visible = false;
    const mobile = this.root.clientWidth < 720;
    this.cameraCtrl.focusOn(p, this.focusOptions?.(id) ?? (mobile ? { shiftY: 0.24 } : { shiftX: 0.2 }));
    this.orbits.setActive(id);
    this._fillPanel(id);
    this._showPanel();
    for (const [bid, b] of this.buttons) b.setAttribute('aria-pressed', String(bid === id));
    if (!this.externalPanel) this.backBtn?.focus({ preventScroll: true });
    this.onSelect?.(id, this._project(id));
  }

  reset() {
    if (!this.selected) return;
    const prev = this.selected;
    prev.hoverTarget = 0;
    this.selected = null; this.planets.dim = false;
    this.selectGroup.removeFromParent();
    this.cameraCtrl.overview();
    this.orbits.setActive(null);
    this._hidePanel();
    for (const b of this.buttons.values()) b.setAttribute('aria-pressed', 'false');
    if (!this.externalPanel) this.buttons.get(prev.id)?.focus({ preventScroll: true });
    this.onReset?.();
  }

  update(dt, time) {
    if (this._dirty) {
      this._dirty = false;
      if (this.pointer) this._setHover(this._pick(this.pointer.x, this.pointer.y));
    }
    for (const m of this._mats) m.uniforms.uTime.value = time;
    if (this.hovered && this.hoverRing.visible) this.hoverRing.lookAt(this.camera.position);
    if (this.selected) this.selectGroup.lookAt(this.camera.position);

    if (this.tags.size) this._placeTags();
    if (this.hovered && !this.tags.size) {
      const v = this.viewEl.getBoundingClientRect(), o = this.root.getBoundingClientRect();
      this.hovered.positioner.getWorldPosition(_v);
      _u.copy(_v).addScaledVector(this.camera.up, this.hovered.cfg.radius * 1.5).project(this.camera);
      const x = v.left - o.left + (_u.x * 0.5 + 0.5) * v.width, y = v.top - o.top + (-_u.y * 0.5 + 0.5) * v.height;
      this.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    }
  }

  /** Etiquetas acompanham os planetas (somem com um projeto aberto ou longe da seção). */
  _placeTags() {
    // hospedado: só com a câmera já no sistema (durante a viagem as posições projetadas não fazem sentido)
    const live = this.viewEl === this.canvas || this.canvas.classList.contains('is-live');
    const show = !this.selected && live;
    this.tagLayer.classList.toggle('is-on', show);
    if (!show) return;
    const v = this.viewEl.getBoundingClientRect(), o = this.root.getBoundingClientRect();
    for (const p of this.planets.planets) {
      const t = this.tags.get(p.id);
      p.positioner.getWorldPosition(_v);
      _u.copy(_v).project(this.camera);
      const behind = _u.z > 1;
      _v.addScaledVector(this.camera.up, p.cfg.radius * 1.25).project(this.camera);
      const x = v.left - o.left + (_u.x * 0.5 + 0.5) * v.width, y = v.top - o.top + (-_v.y * 0.5 + 0.5) * v.height;
      const off = behind || x < -40 || y < -40 || x > o.width + 40 || y > o.height + 40;
      t.style.visibility = off ? 'hidden' : '';
      if (!off) t.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  dispose() {
    this._offs?.forEach((off) => off());
    gsap.killTweensOf(this.panel);
    this._mats.forEach((m) => m.dispose());
    this._geos.forEach((g) => g.dispose());
    this.ui.remove();
  }
}

/* ===== 9. O SISTEMA SOLAR ===== */

const div = (cls, text) => { const d = document.createElement('div'); d.className = cls; if (text) d.textContent = text; return d; };

/** API pública */
class SolarSystem {
  constructor(container, options = {}) {
    if (!container) throw new Error('SolarSystem: container inválido.');
    this.container = container;
    const b = solarSystemConfig;
    this.config = { ...b, ...options, camera: { ...b.camera, ...options.camera }, bloom: { ...b.bloom, ...options.bloom }, colors: { ...b.colors, ...options.colors } };
    const coarse = matchMedia('(pointer: coarse)').matches || window.innerWidth < 720;
    this.q = { ...(coarse ? b.quality.mobile : b.quality.desktop), ...options.quality };
    this.options = options;
    this._mq = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced = this._mq.matches;
    this._clock = new THREE.Clock(false);
    this.time = 0; this._raf = 0; this._inView = true; this._disposed = false; this._ctxLost = false;
    this.motionScale = 1;
  }

  async init() {
    const { container, config, q } = this;
    this._hidden = [...container.children].map((c) => [c, c.hidden]);
    this._hidden.forEach(([c]) => { c.hidden = true; });
    if (this.options.host) return this._initHosted(this.options.host);
    this.root = div('ss-root');
    container.append(this.root);

    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    } catch (err) {
      console.warn('[SolarSystem] WebGL indisponível.', err);
      this._showFallback();
      return this;
    }

    const w = Math.max(this.root.clientWidth, 1), h = Math.max(this.root.clientHeight, 1);
    const pr = this._pixelRatio();
    const r = this.renderer;
    r.setPixelRatio(pr); r.setSize(w, h);
    r.domElement.className = 'ss-canvas';
    r.domElement.setAttribute('aria-hidden', 'true');
    this.root.append(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.colors.background);
    this.camera = new THREE.PerspectiveCamera(config.camera.fov, w / h, 0.1, 1200);
    this.scene.add(new THREE.AmbientLight(0x4a7bff, 0.3));

    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: q.msaa });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), config.bloom.strength, config.bloom.radius, config.bloom.threshold);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.orbits = new HolographicOrbits(config, q);
    this.scene.add(this.orbits.group);

    // Loader + avisos
    this.loader = div('ss-loader'); this.loader.setAttribute('role', 'status');
    this.loaderText = div('ss-loader__text', 'Inicializando sistema de navegação… 0%');
    this.loader.append(this.loaderText); this.root.append(this.loader);
    this.warning = div('ss-warning'); this.warning.setAttribute('role', 'status'); this.warning.hidden = true;
    this.root.append(this.warning);

    this.planets = new PlanetManager(config, { onWarn: (list) => this._showWarnings(list) });
    await this.planets.load(config.modelUrl, (p) => { this.loaderText.textContent = `Inicializando sistema de navegação… ${Math.round(p * 100)}%`; });
    if (this._disposed) return this;
    this.scene.add(this.planets.group);

    this.cameraCtrl = new CameraController(this.camera, config, getMaxOrbitRadius(config), { reducedMotion: this.reduced });
    this.interaction = new ProjectInteraction({
      root: this.root, canvas: r.domElement, camera: this.camera, planets: this.planets, cameraCtrl: this.cameraCtrl,
      orbits: this.orbits, config, reducedMotion: this.reduced, onSelect: this.options.onSelect, onReset: this.options.onReset,
      externalPanel: !!this.options.externalPanel, focusOptions: this.options.focusOptions ?? null, planetTags: !!this.options.planetTags,
    });

    this._resize();
    this.cameraCtrl.intro();
    this.loader.remove();
    this._bindLifecycle();
    this._sync();
    return this;
  }

  /** MODO HOSPEDADO — o sistema solar vive DENTRO do universo compartilhado (mesmo renderizador, mesma câmera */
  async _initHosted(host) {
    const { container, config, q } = this;
    this.hosted = true; this.host = host;
    this.root = div('ss-root ss-root--hosted');
    container.append(this.root);
    this.scene = host.scene;
    this.camera = host.camera;
    this.proxy = new THREE.PerspectiveCamera(config.camera.fov, 1, 0.1, 1200); // câmera intermediária (controlada aqui)
    this.group = new THREE.Group(); this.group.name = 'SolarSystemStation';
    this.group.position.copy(host.origin);
    this.group.visible = false; // o universo decide quando mostrar (só perto de Projetos); antes de registrar, nunca aparece
    this.scene.add(this.group);

    this.orbits = new HolographicOrbits(config, q);
    this.group.add(this.orbits.group);

    this.loader = div('ss-loader'); this.loader.setAttribute('role', 'status');
    this.loaderText = div('ss-loader__text', 'Inicializando sistema de navegação… 0%');
    this.loader.append(this.loaderText); this.root.append(this.loader);
    this.warning = div('ss-warning'); this.warning.setAttribute('role', 'status'); this.warning.hidden = true;
    this.root.append(this.warning);

    this.planets = new PlanetManager(config, { onWarn: (list) => this._showWarnings(list) });
    await this.planets.load(config.modelUrl, (p) => { this.loaderText.textContent = `Inicializando sistema de navegação… ${Math.round(p * 100)}%`; });
    if (this._disposed) return this;
    this.group.add(this.planets.group);
    // a luz do Sol ilumina só a região do sistema (some suavemente longe dele)
    if (this.planets.sun) this.planets.sun.light.distance = getMaxOrbitRadius(config) * 5;
    this.group.updateMatrixWorld(true);

    this.cameraCtrl = new CameraController(this.proxy, config, getMaxOrbitRadius(config), { reducedMotion: this.reduced, origin: host.origin, hosted: true });
    this.interaction = new ProjectInteraction({
      root: this.root, canvas: host.eventTarget, viewEl: host.canvas, camera: this.camera, planets: this.planets, cameraCtrl: this.cameraCtrl,
      orbits: this.orbits, config, reducedMotion: this.reduced, onSelect: this.options.onSelect, onReset: this.options.onReset,
      externalPanel: !!this.options.externalPanel, focusOptions: this.options.focusOptions ?? null, planetTags: !!this.options.planetTags,
    });
    this.cameraCtrl.setViewport(window.innerWidth, window.innerHeight);
    this.cameraCtrl.intro();
    this.loader.remove();
    this._onMq = (e) => { this.reduced = e.matches; this.cameraCtrl.reduced = e.matches; this.interaction.reduced = e.matches; };
    this._mq.addEventListener?.('change', this._onMq);
    host.attach(this);
    return this;
  }

  _pixelRatio() { return Math.min(window.devicePixelRatio || 1, this.q.maxPixelRatio); }

  _showWarnings(list) {
    if (!this.warning) return;
    this.warning.hidden = false;
    this.warning.textContent = `⚠ ${list.length} aviso(s): ${list[list.length - 1]} (veja o console)`;
  }

  _showFallback() {
    this.loader?.remove();
    const box = div('ss-fallback');
    const h = document.createElement('h2'); h.textContent = 'Projetos';
    const ul = document.createElement('ul');
    for (const p of this.config.planets) {
      const pr = this.config.projects[p.id]; if (!pr) continue;
      const li = document.createElement('li');
      const t = document.createElement('strong'); t.textContent = pr.name;
      const d = document.createElement('span'); d.textContent = ` — ${pr.description}`;
      li.append(t, d);
      if (pr.github) { const a = document.createElement('a'); a.href = pr.github; a.textContent = ' GitHub'; a.rel = 'noopener noreferrer'; a.target = '_blank'; li.append(a); }
      ul.append(li);
    }
    box.append(h, ul); this.root.append(box);
  }

  _bindLifecycle() {
    this._ro = new ResizeObserver(() => { if (!this._resizePending) { this._resizePending = true; requestAnimationFrame(() => { this._resizePending = false; if (!this._disposed) this._resize(); }); } });
    this._ro.observe(this.root);
    this._io = new IntersectionObserver(([e]) => { this._inView = e.isIntersecting; this._sync(); }, { threshold: 0.01 });
    this._io.observe(this.container);
    this._onVis = () => this._sync();
    this._onMq = (e) => { this.reduced = e.matches; if (this.cameraCtrl) this.cameraCtrl.reduced = e.matches; if (this.interaction) this.interaction.reduced = e.matches; };
    this._onLost = (e) => { e.preventDefault(); this._ctxLost = true; this._sync(); this._showWarnings(['Contexto WebGL perdido; aguardando restauração']); };
    this._onRestored = () => { this._ctxLost = false; this.warning.hidden = true; this._sync(); };
    document.addEventListener('visibilitychange', this._onVis);
    this._mq.addEventListener?.('change', this._onMq);
    this.renderer.domElement.addEventListener('webglcontextlost', this._onLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this._onRestored);
  }

  _resize() {
    const w = Math.max(this.root.clientWidth, 1), h = Math.max(this.root.clientHeight, 1), pr = this._pixelRatio();
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h);
    this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    this.bloom.setSize(Math.floor(w * pr * this.q.bloomScale), Math.floor(h * pr * this.q.bloomScale));
    this.orbits.setPixelRatio(pr);
    this.cameraCtrl.setViewport(w, h);
  }

  _sync() {
    const run = this._inView && !document.hidden && !this._disposed && !this._ctxLost && this.cameraCtrl;
    if (run && !this._raf) { this._clock.start(); this._raf = requestAnimationFrame(this._frame); }
    else if (!run && this._raf) { cancelAnimationFrame(this._raf); this._raf = 0; this._clock.stop(); }
  }

  _frame = () => {
    this._raf = requestAnimationFrame(this._frame);
    this.step(Math.min(this._clock.getDelta(), 0.1)); // independente de FPS
    this.composer.render();
  };

  /** Avança a animação (planetas, órbitas, câmera, interação). No modo hospedado é chamado pelo universo. */
  step(dt) {
    const motion = this.reduced ? 0 : this.motionScale;
    this.time += dt * motion;
    this.planets.update(dt, this.time, motion);
    this.orbits.syncHeads?.(this.planets.planets);
    this.orbits.update(dt, this.time, motion);
    this.cameraCtrl.update(dt, this.time);
    this.interaction.update(dt, this.time);
  }

  setMotionScale(scale) { this.motionScale = Math.min(Math.max(scale, 0), 1); }
  select(id) { this.interaction?.select(id); }
  reset() { this.interaction?.reset(); }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._ro?.disconnect(); this._io?.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this._mq.removeEventListener?.('change', this._onMq);
    this.interaction?.dispose(); this.cameraCtrl?.dispose();
    this.host?.detach?.(this);
    if (this.hosted) this.group?.removeFromParent();
    (this.hosted ? this.group : this.scene)?.traverse((o) => {
      o.geometry?.dispose();
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        for (const k in m) if (m[k]?.isTexture) m[k].dispose();
        m.dispose();
      }
    });
    this.bloom?.dispose(); this.composer?.dispose();
    if (this.renderer) {
      const c = this.renderer.domElement;
      c.removeEventListener('webglcontextlost', this._onLost); c.removeEventListener('webglcontextrestored', this._onRestored);
      this.renderer.dispose(); this.renderer.forceContextLoss(); c.remove();
    }
    this.root?.remove();
    this._hidden?.forEach(([c, hid]) => { c.hidden = hid; });
  }
}

async function createSolarSystem(container, options) {
  const s = new SolarSystem(container, options);
  await s.init();
  return s;
}

/* ===== 10. PAINEL ORBITAL HUD ===== */

/** Ajustes visuais do HUD orbital. */
const HUD_OPTIONS = {
  colors: { background: 0x050a18 },
  // órbitas com rastro luminoso atrás de cada planeta (cor do planeta)
  orbitStyle: { lineColor: 0x2f6db0, lineOpacity: 0.32, trail: true, pulses: false, discs: 'refined', radials: false, grid: false },
  quality: { stars: 110, dust: 60 },
};
/* cor de destaque de cada planeta (a mesma dos cartões de órbita) */
const ACCENTS = { 'golden-bronze': '#e9b949', 'crystal-cyan': '#27c3d6', 'deep-ocean': '#5a8dee', 'emerald-green': '#2fcf9a', 'magma-volcanic': '#f08a3c', 'mystical-purple': '#b47cf0' };
const HOSTED_QUALITY = { stars: 0, dust: 90 };

/** Liga a interface HTML (#orbital-hud) ao sistema solar 3D. */
function mountOrbitalHud(hud, { universe = null } = {}) {
  if (!hud) return null;
  const stage = hud.querySelector('[data-hud-stage]');
  const overview = hud.querySelector('[data-hud-overview]');
  const cards = [...hud.querySelectorAll('[data-planet]')];
  let system = null, io = null, started = false, disposed = false, pending = null, lastSelected = null;
  let host = universe;
  hud.classList.toggle('is-hosted', !!host);
  // o visitante está interagindo com o sistema (e não rolando para fora dele)?
  const live = () => !host || hud.classList.contains('is-live');
  let fromHistory = false; // seleção/reset vindos do Voltar/Avançar não criam nova entrada no histórico

  const setActive = (id) => cards.forEach((c) => {
    const on = c.dataset.planet === id;
    c.setAttribute('aria-pressed', String(on));
    c.classList.toggle('is-active', on);
  });

  // Nomes dos cartões vêm do cadastro de projetos (js/projetos.js)
  const names = buildPanelProjects();
  for (const c of cards) {
    const n = c.querySelector('[data-card-name]');
    if (n && names[c.dataset.planet]?.name) n.textContent = names[c.dataset.planet].name;
  }

  /* ----- dossiê do projeto (substitui a antiga galeria + painel) ----- */
  const ids = solarSystemConfig.planets.map((p) => p.id);
  const section = hud.closest('section') ?? hud;
  const dossier = new ProjectDossier(section, {
    planets: ids.map((id) => ({ id, name: names[id]?.name ?? id, accent: ACCENTS[id] })),
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-reduce-motion'),
    onClose: () => system?.reset(),
    onPick: (id) => system?.select(id),
    onStep: (dir) => {
      const cur = system?.interaction?.selected?.id; if (!cur) return;
      system.select(ids[(ids.indexOf(cur) + dir + ids.length) % ids.length]);
    },
  });
  const metaFor = (id) => {
    const cfg = solarSystemConfig.planets.find((p) => p.id === id);
    return { planetId: id, index: ids.indexOf(id) + 1, total: ids.length, accent: ACCENTS[id], orbit: cfg?.orbit, node: cfg?.nodeName, name: names[id]?.name };
  };
  /** Onde o planeta deve aparecer: dentro da janela de varredura do dossiê */
  const focusFor = (id) => {
    dossier.render(getProjectForPlanet(id), metaFor(id));
    const wasOpen = dossier.isOpen;
    if (!wasOpen) { dossier.root.hidden = false; dossier.root.style.visibility = 'hidden'; }
    dossier.layout();
    const t = dossier.scanTarget();
    if (!wasOpen) { dossier.root.style.visibility = ''; dossier.root.hidden = true; }
    if (!t) return null;
    if (system && !system.hosted) { const r = system.root.getBoundingClientRect(); t.x -= r.left; t.y -= r.top; }
    return { screen: t };
  };
  // redimensionou a janela com o projeto aberto: o planeta volta para dentro da janela de varredura
  dossier.onRelayout = () => {
    const sel = system?.interaction?.selected; if (!sel) return;
    requestAnimationFrame(() => { const o = focusFor(sel.id); if (o) system.cameraCtrl.focusOn(sel, { ...o, duration: 0.45 }); });
  };

  async function start() {
    if (started || disposed) return;
    started = true;
    io?.disconnect();
    // durante a introdução, não disputa banda/GPU com ela (o GLB começa a carregar logo depois)
    if (!pending && document.documentElement.classList.contains('is-intro')) {
      await new Promise((resolve) => {
        const mo = new MutationObserver(() => { if (!document.documentElement.classList.contains('is-intro')) { mo.disconnect(); resolve(); } });
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      });
    }
    if (disposed) return;
    validateAssignments();
    const hosted = !!host;
    try {
      system = await createSolarSystem(stage, {
        ...HUD_OPTIONS,
        quality: hosted ? HOSTED_QUALITY : HUD_OPTIONS.quality,
        ...(hosted ? { host: host.hostForSolarSystem(stage) } : {}),
        projects: { ...solarSystemConfig.projects, ...buildPanelProjects() },
        externalPanel: true,
        planetTags: true,
        focusOptions: focusFor,
        onSelect: (planetId) => {
          const wasOpen = dossier.isOpen;
          lastSelected = planetId;
          setActive(planetId); dossier.render(getProjectForPlanet(planetId), metaFor(planetId)); dossier.open(); system?.setMotionScale(0.45);
          if (!wasOpen) dossier.focus();
          if (!fromHistory) urlState.setProject(getProjectKeyForPlanet(planetId), live()); // ?projeto=<id>, entra no histórico
        },
        onReset: () => {
          const hadFocus = dossier.root.contains(document.activeElement);
          setActive(null); dossier.close(); system?.setMotionScale(1);
          if (hadFocus) cards.find((c) => c.dataset.planet === lastSelected)?.focus({ preventScroll: true }); // o foco volta ao cartão do projeto
          if (fromHistory) return;
          if (live()) urlState.setProject(null, true); // "Visão Geral" pelo visitante
          else urlState.clearProject();               // saiu de Projetos rolando: só limpa o endereço
        },
      });
    } catch (err) {
      console.error('[orbital-hud] Falha ao iniciar o sistema solar.', err);
      started = false;
      return;
    }
    if (disposed) { system.dispose(); return; }

    if (pending) { const id = pending; pending = null; system.select(id); }
  }

  for (const c of cards) {
    c.addEventListener('click', () => {
      if (system) system.select(c.dataset.planet);
      else { pending = c.dataset.planet; setActive(pending); start(); }
    });
  }
  overview?.addEventListener('click', () => { pending = null; setActive(null); system?.reset(); });

  // link direto: ?projeto=<id> abre o projeto (foco no planeta + galeria).
  const linked = urlState.project();
  if (linked) {
    const planet = getPlanetForProject(linked);
    if (planet) { pending = planet; setActive(planet); }
    else { console.warn(`[projects] Link para projeto inexistente: "${linked}". Mostrando a visão geral.`); urlState.setProject(null); }
    start();
  } else if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { rootMargin: '1200px 0px' });
    io.observe(hud);
  } else start();

  // Voltar / Avançar do navegador: abre ou fecha o projeto do endereço
  const onPop = () => {
    const planet = getPlanetForProject(urlState.project());
    fromHistory = true;
    try {
      if (planet) {
        if (document.getElementById('projetos') && !live()) host?.travel?.go('projetos');
        if (system) system.select(planet); else { pending = planet; setActive(planet); start(); }
      } else if (system?.interaction?.selected) system.reset();
    } finally { fromHistory = false; }
  };
  window.addEventListener('popstate', onPop);

  // o universo 3D falhou: o sistema solar volta a ter renderizador próprio (o site nunca fica sem Projetos)
  const onFail = () => {
    if (!host) return;
    host = null; hud.classList.remove('is-hosted');
    system?.dispose(); system = null; started = false;
    start();
  };
  window.addEventListener('universe:failed', onFail);

  const dispose = () => { disposed = true; io?.disconnect(); dossier.dispose(); system?.dispose(); window.removeEventListener('universe:failed', onFail); window.removeEventListener('popstate', onPop); };
  window.addEventListener('pagehide', dispose);
  return { dispose, get system() { return system; } };
}

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { gltfLoader, probe, loadGLB, solarSystemConfig, getMaxOrbitRadius, overviewPose, createSolarSystem, mountOrbitalHud };
