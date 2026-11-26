/**
 * UNIVERSO — o universo 3D que fica no fundo do site inteiro.
 *   1. Ajustes do universo (edite aqui)
 *   2. Zonas seguras
 *   3. Aviso de modelo ausente
 *   5. Cosmos
 *   6. Planetas de fundo
 *   7. Terminal hacker
 *   8. Nome hacker
 *   9. Introdução Big Bang
 *   10. Título de partículas
 *   11. Diretor de câmera
 *   12. Mundo
 *   13. Naves
 *   14. Modelos presos às seções
 *   15. Viagens
 *   16. O universo
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { site, sections, models, elfAnimation, bus, prefs, urlState } from './principal.js';
import { loadGLB, probe } from './sistema-solar.js';

/* ===== 1. AJUSTES DO UNIVERSO ===== */

const universe = {
  accent: 0x008cff, // azul holográfico (identidade visual)

  /** Campo de visão da câmera (graus). */
  fov: 38,

  /** INTRODUÇÃO: tempos em segundos desde o início (limite de segurança: 17 s). */
  intro: {
    enabled: true,
    maxSeconds: 16.5,     // trava de segurança (limite pedido: 17 s)
    terminal: {           // abertura hacker (fases A–D); depois o texto vira poeira
      bootEnd: 0.3,       // A: cursor piscando no escuro
      alertsAt: 1.6,      // C: alertas vermelhos
      breachAt: 2.2,      // D: SYSTEM BREACHED
      grantedAt: 2.45,    //    ACCESS GRANTED
      end: 2.8,           // E: o texto se desfaz em partículas
    },
    dustSeconds: 0.8,     // a poeira do terminal converge até o ponto de luz
    pointAt: 3.25,        // o ponto de luz acende (a poeira chegando)
    swellAt: 3.45,        // o ponto "respira" e cresce
    bangAt: 3.75,         // Big Bang: a luz se expande e o universo nasce
    planetsAt: 5.0,       // corpos celestes se condensam
    // nome hacker (js/universo.js): decodificação CD → … → CARLOS DANIEL, depois glitch + hiperespaço
    hacker: {
      enabled: false,     // false = sem a cena do nome digitado (o Big Bang vai direto para o hiperespaço)
      words: ['CD', 'CARD', 'CARLOSD', 'CARLOSDAN', 'CARLOS DANIEL'],
      startAt: 6.0,       // começa a decodificar "CD"
      perChar: 0.05,      // tempo de decodificação por letra (s)
      minDecode: 0.2,     // mínimo por palavra (s)
      pause: 0.35,        // pausa entre as palavras (s)
      exitAt: 9.8,        // falha (glitch): as letras voltam a virar símbolos
      glitchSeconds: 0.22,
      pullSeconds: 0.6,   // os símbolos são puxados pelo hiperespaço e somem
    },
    // (usados só pelo brilho de partículas atrás do título fixo, depois que a página aparece)
    monogramAt: 6.3, glideAt: 6.95, nameAt: 7.45, letterGap: 0.13, printSeconds: 0.5,
    // com o nome digitado ligado (hacker.enabled: true), use: hyperspaceAt 9.9 · pageAt 11.7 · endAt 13.0
    hyperspaceAt: 6.3,    // hiperespaço: a câmera avança e a nave chega
    pageAt: 8.1,          // a página aparece (o CARLOS DANIEL fixo surge)
    endAt: 9.4,           // fim da introdução
    cameraBack: 320,      // quanto a câmera começa atrás do Início (o hiperespaço percorre esta distância)
  },

  /** Quantidade de estrelas por nível de qualidade (volume 3D + céu distante). */
  stars: {
    high: { volume: 14000, sky: 7000, dust: 700 },
    medium: { volume: 9000, sky: 5000, dust: 450 },
    low: { volume: 5000, sky: 3000, dust: 220 },
  },

  /** Rastro das estrelas: segundos de movimento da câmera que viram rastro (0 = sem rastro). */
  starTrail: 0.07,

  /** Origem do Big Bang (no espaço, à frente da câmera do Início). */
  bangOrigin: [0, 12, -560],

  /** ESTAÇÕES — onde a câmera fica em cada seção. */
  stations: {
    inicio: { pos: [0, 0, 0], look: [0, 0.02, -1], palette: [0x0a3fb0, 0x0a8cff], glow: 1.0 },
    projetos: { pos: [120, -40, -960], look: [0.18, -0.04, -1], palette: [0x064a7a, 0x1a2a9c], glow: 0.8 },
    sobre: { pos: [-170, 40, -1820], look: [-0.28, 0.06, -1], palette: [0x4a16a0, 0x123ea8], glow: 0.9 },
    curriculo: { pos: [-40, -50, -2560], look: [0.32, -0.05, -1], palette: [0x0b2c96, 0x3c1890], glow: 0.85 },
    contato: { pos: [150, 60, -3300], look: [0.12, 0.1, -1], palette: [0x5a1490, 0x0058c0], glow: 0.95 },
  },

  /** CORPOS CELESTES distantes. */
  celestial: [
    { station: 'inicio', ndc: [0.84, 0.62], depth: 260, size: 0.17, colors: [0x0b2a5c, 0x1f6fd1, 0x7fd0ff], bands: 3.0, seed: 1.7 },
    { station: 'inicio', ndc: [-0.9, -0.62], depth: 420, size: 0.07, colors: [0x2a0f55, 0x7b3fd1, 0xd6b0ff], bands: 5.0, seed: 4.2 },
    { station: 'inicio', ndc: [-0.62, 0.8], depth: 900, size: 0.035, colors: [0x062a3a, 0x1f8fb0, 0x9ff2ff], bands: 2.5, seed: 9.4 },
    { station: 'sobre', ndc: [0.86, -0.58], depth: 300, size: 0.2, colors: [0x24104e, 0x6a3ccf, 0xc9a8ff], bands: 4.0, seed: 6.1 },
    { station: 'sobre', ndc: [-0.9, 0.55], depth: 520, size: 0.08, colors: [0x0b2238, 0x3d86c6, 0xbfe6ff], bands: 6.0, seed: 2.6, ring: true },
    { station: 'curriculo', ndc: [-0.88, 0.62], depth: 340, size: 0.13, colors: [0x08333d, 0x1c9aa6, 0xa6fff4], bands: 2.0, seed: 8.9 },
    { station: 'curriculo', ndc: [0.9, -0.62], depth: 260, size: 0.14, colors: [0x2a1240, 0x8a4fd0, 0xe2c6ff], bands: 7.0, seed: 5.5, ring: true },
    { station: 'contato', ndc: [0.82, 0.58], depth: 280, size: 0.19, colors: [0x0a2350, 0x2a7fe0, 0x9fe0ff], bands: 3.5, seed: 3.3 },
    { station: 'contato', ndc: [-0.86, -0.55], depth: 480, size: 0.08, colors: [0x3a0f3a, 0xb04fb0, 0xffc6f0], bands: 4.5, seed: 7.7 },
  ],

  mainShip: {
    maxHeightFraction: 0.34,      // altura máxima da nave em relação à altura da tela
    maxWidthFraction: 0.27,       // largura máxima da nave em relação à largura da tela
    minPx: 110,                   // abaixo disso (tela pequena demais) a nave fica de fora no Início
    cruise: { x: 0.7, y: -0.6, z: -16 }, // durante as viagens/rolagem: canto inferior direito, um pouco ao longe (bico para dentro da tela)
    // nas outras seções (página parada): patrulha o fundo numa volta lenta (elipse; x/y = centro na tela, rx/ry = raios em fração da tela,
    // z = profundidade, rz = quanto a volta avança/recua em profundidade, speed = rad/s; negativo = sentido contrário)
    patrol: { x: 0, y: 0.22, z: -45, rx: 0.72, ry: 0.05, rz: 16, speed: 0.12, phase: 0 },
    arriveSeconds: 2.0,           // duração da desaceleração ao chegar do hiperespaço
    // Orientação do modelo: para onde o "nariz" da nave aponta no arquivo GLB ('+z', '-z', '+x' ou '-x').
    noseAxis: '+z',
    viewYaw: 0.5,   // giro extra para mostrar a nave em 3/4 (radianos)
    viewPitch: 0.12,
    floatAmplitude: 0.01,         // flutuação suave quando parada
    mouseInfluence: 0.035,        // reação discreta ao mouse quando parada
  },

  secondaryShip: {
    enabled: true,
    heightFraction: 0.07,
    // volta contínua ao fundo (mesmo formato da patrulha da nave principal), no sentido contrário
    patrol: { x: 0, y: -0.2, z: -70, rx: 0.85, ry: 0.07, rz: 24, speed: -0.09, phase: Math.PI },
    noseAxis: '+z',
  },

  /** Elfo (Sobre mim): repete o aceno a cada N segundos. */
  elf: { waveEverySeconds: 9 },

  travel: {
    menuSeconds: 1.6, // duração máxima da viagem ao clicar no menu
  },
};

/** Apelido curto dos ajustes, usado no resto deste arquivo. */
const U = universe;

/* ===== 2. ZONAS SEGURAS ===== */

const PAD = 18; // folga em volta do conteúdo (px)

/** Blocos de conteúdo de uma seção. Grades e listas viram os seus itens (mais espaço livre entre eles). */
function contentRects(section, { pad = PAD } = {}) {
  if (!section) return [];
  const top = section.getBoundingClientRect().top;
  const out = [];
  const push = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    out.push({ x0: r.left - pad, y0: r.top - top - pad, x1: r.right + pad, y1: r.bottom - top + pad });
  };
  for (const el of section.querySelectorAll('[data-safe]')) push(el);
  for (const child of section.children) {
    if (child.matches('.model-slot, [data-safe-ignore]') || child.querySelector('[data-safe]')) continue;
    const cs = getComputedStyle(child);
    if (cs.position === 'absolute' || cs.position === 'fixed' || cs.visibility === 'hidden') continue;
    if (child.matches('.grid, [data-safe-items]')) [...child.children].forEach(push);
    else push(child);
  }
  return out;
}

/** Linhas de texto reais de um elemento (útil para títulos largos: a caixa do bloco é bem maior que as letras). */
function textRects(el, offsetTop = 0, pad = PAD) {
  const range = document.createRange(); range.selectNodeContents(el);
  return [...range.getClientRects()].map((r) => ({ x0: r.left - pad, y0: r.top - offsetTop - pad, x1: r.right + pad, y1: r.bottom - offsetTop + pad }));
}

/** Melhor posição livre. */
function freeSpot(rects, view, { kw = 1, kh = 1, want = null, maxS = Infinity, minS = 0, margin = 14, prefer = null } = {}) {
  const { w, h, top = 0 } = view;
  const cols = 28, rows = 18;
  let best = null;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const cx = margin + (i / cols) * (w - margin * 2), cy = top + margin + (j / rows) * (h - top - margin * 2);
      let s = Math.min(2 * (cx - margin) / kw, 2 * (w - margin - cx) / kw, 2 * (cy - top - margin) / kh, 2 * (h - margin - cy) / kh, maxS);
      for (const r of rects) {
        if (r.y1 < top || r.y0 > h) continue;
        const dx = cx < r.x0 ? r.x0 - cx : cx > r.x1 ? cx - r.x1 : 0;
        const dy = cy < r.y0 ? r.y0 - cy : cy > r.y1 ? cy - r.y1 : 0;
        s = Math.min(s, Math.max(2 * dx / kw, 2 * dy / kh));
        if (s <= minS) break;
      }
      if (s <= minS) continue;
      let score = s;
      if (want) score -= Math.hypot(cx - want.x, cy - want.y) * 0.35;
      if (prefer) score *= prefer(cx, cy);
      if (!best || score > best.score) best = { x: cx, y: cy, s, score };
    }
  }
  return best;
}

/** Círculo (px de tela) invade algum retângulo (px de tela)? */
function overlaps(cx, cy, r, rects) {
  for (const q of rects) {
    const dx = Math.max(q.x0 - cx, 0, cx - q.x1), dy = Math.max(q.y0 - cy, 0, cy - q.y1);
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/* ===== 3. AVISO DE MODELO AUSENTE ===== */

/** Indicador holográfico discreto no espaço reservado a um modelo 3D. */
const STRINGS = {
  loading: 'CARREGANDO MODELO',
  missing: 'MODELO NÃO ENCONTRADO',
  retry: 'TENTAR NOVAMENTE',
};

function createModelSlot({ title, path, parent }) {
  const el = document.createElement('div');
  el.className = 'model-slot';
  el.hidden = true;
  el.setAttribute('role', 'status');
  const t = document.createElement('span'); t.className = 'model-slot__title'; t.textContent = title;
  const msg = document.createElement('span'); msg.className = 'model-slot__msg';
  const code = document.createElement('code'); code.className = 'model-slot__path'; code.textContent = path;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'model-slot__retry'; btn.textContent = STRINGS.retry;
  el.append(t, msg, code, btn);
  parent.append(el);

  let state = 'loading', allowed = false, onRetry = null;
  const paint = () => { el.hidden = !(allowed && state !== 'ready'); };
  btn.addEventListener('click', () => onRetry?.());

  return {
    el,
    /** Só aparece depois da introdução, para não competir com ela. */
    allow(v) { allowed = v; paint(); },
    setState(s, retry) {
      state = s; onRetry = retry ?? null;
      el.dataset.state = s;
      msg.textContent = s === 'loading' ? `${STRINGS.loading}…` : s === 'missing' ? STRINGS.missing : '';
      btn.hidden = s !== 'missing';
      paint();
    },
    setProgress(p) { if (state === 'loading') msg.textContent = `${STRINGS.loading}… ${Math.round(p * 100)}%`; },
    dispose() { el.remove(); },
  };
}

/* ===== 5. COSMOS ===== */

const NOISE = /* glsl */ `
float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return v; }
float hash2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

const QUAD_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

/* ---------- 1) céu panorâmico (assado uma vez) ---------- */
const SKY_BAKE = /* glsl */ `
precision highp float; varying vec2 vUv; uniform float uSeed;
${NOISE}
void main(){
  float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.14159265;
  vec3 d = vec3(cos(lat) * sin(lon), sin(lat), -cos(lat) * cos(lon));
  vec3 n = normalize(vec3(0.42, 0.86, 0.29));           // plano da "via láctea"
  float b = dot(d, n), band = exp(-b * b / 0.05);
  vec3 q = d * 2.1 + uSeed;
  vec3 w = vec3(fbm(q * 1.2), fbm(q * 1.2 + 5.2), fbm(q * 1.2 + 9.1));
  float big = fbm(q * 1.5 + w * 1.9);
  float fil = fbm(q * 4.2 - w * 2.4 + 3.7);
  float dust = smoothstep(0.5, 0.74, fbm(q * 2.8 + w * 1.3 + 11.0));
  float R = pow(smoothstep(0.34, 0.92, big), 1.7) * (0.3 + 1.0 * band);
  float G = pow(smoothstep(0.46, 1.0, fil), 2.3) * (0.2 + 1.0 * band);
  gl_FragColor = vec4(R, G, clamp(dust * (0.25 + 0.85 * band), 0.0, 1.0), band);
}`;

const DOME_VERT = /* glsl */ `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const DOME_FRAG = /* glsl */ `
precision highp float; varying vec3 vDir;
uniform sampler2D tSky; uniform vec3 uC1, uC2, uBangDir; uniform float uK, uReveal, uFlash, uTime;
${NOISE}
void main(){
  vec3 d = normalize(vDir);
  vec2 uv = vec2(atan(d.x, -d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5);
  vec4 s = texture2D(tSky, uv);
  vec3 col = vec3(0.0015, 0.003, 0.009);
  col += uC1 * s.r * 0.26 * uK;
  col += uC2 * s.g * 0.32 * uK;
  col += mix(uC1, vec3(0.55, 0.75, 1.0), 0.5) * s.a * 0.018;
  col *= 1.0 - 0.7 * s.b;
  float ang = acos(clamp(dot(d, uBangDir), -1.0, 1.0)) / 3.14159265;   // 0 = direção do Big Bang
  col *= 1.0 - smoothstep(uReveal - 0.3, uReveal, ang);
  col += vec3(0.45, 0.7, 1.0) * uFlash * (exp(-ang * ang * 40.0) * 0.55 + exp(-ang * ang * 5.0) * 0.06);
  gl_FragColor = vec4(col, 1.0);
}`;

/* ---------- 2) nuvens 3D ---------- */
const PUFF_BAKE = /* glsl */ `
precision highp float; varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float a = fbm(vec3(p * 2.2, 1.3)); float b = fbm(vec3(p * 3.6 + a * 1.4, 7.7));
  float r = length(p) + (a - 0.5) * 0.7 + (b - 0.5) * 0.35;           // contorno irregular
  float fall = 1.0 - smoothstep(0.1, 0.95, r);
  fall *= 1.0 - smoothstep(0.8, 1.0, length(p));                       // nunca encosta na borda do quadrado
  float soft = pow(fall, 1.6) * smoothstep(0.25, 0.85, a * 0.6 + 0.4 * fall);
  float wisp = pow(fall, 1.2) * pow(smoothstep(0.42, 0.9, b), 1.6);
  gl_FragColor = vec4(soft, wisp, 0.0, 1.0);
}`;

const CLOUD_VERT = /* glsl */ `
attribute vec3 aCenter; attribute vec4 aInfo; attribute vec3 aColor; // aInfo: tamanho, rotação, alfa, tipo
uniform vec3 uBang; uniform float uRevealDist, uFade;
varying vec2 vUv; varying vec3 vColor; varying float vA, vType;
void main(){
  vec4 mv = viewMatrix * vec4(aCenter, 1.0);
  float c = cos(aInfo.y), s = sin(aInfo.y);
  vec2 corner = mat2(c, -s, s, c) * position.xy * aInfo.x;
  mv.xy += corner;
  gl_Position = projectionMatrix * mv;
  vUv = uv; vColor = aColor; vType = aInfo.w;
  float dist = -mv.z;
  float near = smoothstep(aInfo.x * 0.35, aInfo.x * 1.4, dist);             // some antes de a câmera atravessar
  float far = 1.0 - smoothstep(3400.0, 4600.0, dist);
  float born = 1.0 - smoothstep(uRevealDist - 300.0, uRevealDist, distance(aCenter, uBang));
  vA = aInfo.z * near * far * born * uFade;
}`;
const CLOUD_FRAG = /* glsl */ `
uniform sampler2D tPuff; varying vec2 vUv; varying vec3 vColor; varying float vA, vType;
void main(){
  vec4 t = texture2D(tPuff, vUv);
  float v = vType < 0.5 ? t.r : t.g;
  float a = v * vA; if (a < 0.002) discard;
  gl_FragColor = vec4(vColor * a, a);
}`;

/* ---------- 3) estrelas ---------- */
const STAR_VERT = /* glsl */ `
attribute vec3 aPos; attribute vec4 aData; // x semente, y tamanho(px), z tom, w brilho
uniform vec2 uRes; uniform vec3 uVelView, uBang;
uniform float uPx, uLayer, uExpand, uBurst, uOpacity, uTime, uTwinkle, uTrail, uMaxLen, uSizeK, uBox;
varying vec2 vLocal; varying float vLen, vS, vA; varying vec3 vCol;
vec2 toPx(vec4 c){ return (c.xy / c.w * 0.5 + 0.5) * uRes; }
void main(){
  float seed = aData.x;
  vec3 wp, pw;
  float e = 1.0;
  if (uLayer < 0.5) {                                  // volume: nasce do Big Bang
    e = clamp((uExpand - seed * 0.4) / 0.6, 0.0, 1.0); e = 1.0 - pow(1.0 - e, 3.0);
    wp = uBang + (aPos - uBang) * e;
    pw = uBang + (aPos - uBang) * max(e - 0.1 * uBurst * (1.0 - e), 0.0);
  } else if (uLayer < 1.5) {                           // céu distante: acompanha a câmera (infinito)
    wp = cameraPosition + aPos; pw = wp;
  } else {                                             // poeira próxima (caixa que se repete ao redor da câmera)
    vec3 b = vec3(uBox);
    wp = cameraPosition + mod(aPos - cameraPosition + b * 0.5, b) - b * 0.5; pw = wp;
  }
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  if (mv.z > -1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec3 prev = (viewMatrix * vec4(pw, 1.0)).xyz;
  if (uLayer < 0.5 || uLayer > 1.5) prev += uVelView * uTrail;   // rastro pela velocidade real da câmera
  prev.z = min(prev.z, -1.0);
  vec4 c0 = projectionMatrix * mv, c1 = projectionMatrix * vec4(prev, 1.0);
  vec2 p0 = toPx(c0), p1 = toPx(c1);
  vec2 dv = p1 - p0; float len = length(dv);
  if (len > uMaxLen) { dv *= uMaxLen / len; len = uMaxLen; }
  vec2 dir = len > 0.001 ? dv / len : vec2(0.0, 1.0), perp = vec2(-dir.y, dir.x);
  float dist = -mv.z;
  float att = uLayer > 0.5 && uLayer < 1.5 ? 1.0 : clamp(uSizeK / dist, 0.4, 2.4);
  float s = aData.y * uPx * att;
  float v = position.y + 0.5, u = position.x * 2.0;
  float along = mix(-s, len + s, v), across = u * s;
  vec2 px = p0 + dir * along + perp * across;
  gl_Position = vec4((px / uRes * 2.0 - 1.0) * c0.w, c0.z, c0.w);
  vLocal = vec2(across, along); vLen = len; vS = s;
  float fog = 1.0;
  if (uLayer < 0.5) fog = (1.0 - smoothstep(1500.0, 3000.0, dist)) * smoothstep(3.0, 40.0, dist);
  if (uLayer > 1.5) fog = (1.0 - smoothstep(uBox * 0.3, uBox * 0.5, dist)) * smoothstep(2.0, 10.0, dist);
  float tw = mix(1.0, 0.62 + 0.38 * sin(uTime * (0.6 + seed * 2.4) + seed * 50.0), uTwinkle);
  vA = uOpacity * fog * tw * aData.w * smoothstep(0.0, 0.25, e);
  vCol = mix(vec3(0.86, 0.93, 1.0), vec3(0.42, 0.68, 1.0), aData.z);
}`;
const STAR_FRAG = /* glsl */ `
varying vec2 vLocal; varying float vLen, vS, vA; varying vec3 vCol;
void main(){
  float dy = vLocal.y - clamp(vLocal.y, 0.0, vLen);
  float d = length(vec2(vLocal.x, dy)) / max(vS, 0.5);
  float a = pow(max(1.0 - d, 0.0), 1.7);
  a *= mix(1.0, 0.12, clamp(vLocal.y / max(vLen, 1.0), 0.0, 1.0));
  a *= mix(1.0, 0.5, clamp(vLen / 140.0, 0.0, 1.0));
  a *= vA; if (a < 0.003) discard;
  gl_FragColor = vec4(vCol, a);
}`;

/* ---------- 4) luz do Big Bang (ponto + onda de choque) ---------- */
const FLARE_FRAG = /* glsl */ `
varying vec2 vUv; uniform float uCore, uRing, uRingI; uniform vec3 uColor;
void main(){
  vec2 p = vUv * 2.0 - 1.0; float r = length(p);
  float core = exp(-r * r * 90.0) * 1.6 + exp(-r * r * 9.0) * 0.35;
  float rr = (r - uRing) / 0.018; float ring = exp(-rr * rr) * uRingI * (1.0 - smoothstep(0.85, 1.0, r));
  vec3 col = mix(uColor, vec3(1.0), clamp(core * 0.6, 0.0, 1.0)) * (core * uCore) + uColor * ring * 0.7;
  float a = max(max(col.r, col.g), col.b); if (a < 0.002) discard;
  gl_FragColor = vec4(col, 1.0);
}`;
const BILL_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz)); gl_Position = projectionMatrix * mv; }`;

const COMPOSE_FRAG = /* glsl */ `
uniform sampler2D tBg; uniform float uTime; varying vec2 vUv;
float hash2(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main(){
  vec3 c = texture2D(tBg, vUv).rgb;
  c += (hash2(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) / 255.0;  // sem "degraus" no degradê
  gl_FragColor = vec4(max(c, 0.0), 1.0);
}`;

const rnd = (a, b) => a + Math.random() * (b - a);
const col = (hex) => new THREE.Color(hex);

class Cosmos {
  /** @param world — { bang: Vector3, clusters: [{center, dir, palette, glow, spread}] } */
  constructor(renderer, world, quality) {
    this.renderer = renderer;
    this.world = world;
    this.bgScale = quality.bgScale;
    this.size = { w: 1, h: 1, px: 1 };
    const bang = world.bang;

    // ---- céu e nuvens (cena de fundo, resolução reduzida) ----
    this.bgScene = new THREE.Scene();
    this.bgRT = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType, depthBuffer: false });
    this.skyTex = this._bake(SKY_BAKE, quality.skySize, quality.skySize / 2, { uSeed: { value: 3.7 } }, true);
    this.puffTex = this._bake(PUFF_BAKE, 256, 256, {}, false);

    const bangDir = bang.clone().normalize();
    this.dome = new THREE.ShaderMaterial({
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false,
      uniforms: {
        tSky: { value: this.skyTex }, uC1: { value: col(0x0a3fb0) }, uC2: { value: col(0x0a8cff) }, uK: { value: 1 },
        uBangDir: { value: bangDir }, uReveal: { value: 1.4 }, uFlash: { value: 0 }, uTime: { value: 0 },
      },
    });
    this.domeMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), this.dome);
    this.domeMesh.frustumCulled = false; this.domeMesh.renderOrder = -10;
    this.bgScene.add(this.domeMesh);

    this.cloudMat = new THREE.ShaderMaterial({
      vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      uniforms: { tPuff: { value: this.puffTex }, uBang: { value: bang }, uRevealDist: { value: 1e6 }, uFade: { value: 1 } },
    });
    this.clouds = null;
    this.setCloudCount(quality.clouds);

    // ---- composição: o fundo entra atrás de tudo na cena principal ----
    this.group = new THREE.Group();
    this.compose = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT, fragmentShader: COMPOSE_FRAG, depthTest: false, depthWrite: false,
      uniforms: { tBg: { value: this.bgRT.texture }, uTime: { value: 0 } },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.compose);
    quad.frustumCulled = false; quad.renderOrder = -1000;
    this.group.add(quad);

    // ---- estrelas ----
    this.starMats = [0, 1, 2].map((layer) => new THREE.ShaderMaterial({
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) }, uVelView: { value: new THREE.Vector3() }, uBang: { value: bang },
        uPx: { value: 1 }, uLayer: { value: layer }, uExpand: { value: 1 }, uBurst: { value: 0 }, uOpacity: { value: 1 },
        uTime: { value: 0 }, uTwinkle: { value: layer === 2 ? 0 : 1 }, uTrail: { value: 0 }, uMaxLen: { value: 260 },
        uSizeK: { value: layer === 2 ? 40 : 320 }, uBox: { value: 180 },
      },
    }));
    this.starMeshes = [null, null, null];
    this.setStarCount(quality.stars);

    // ---- luz do Big Bang ----
    this.flareMat = new THREE.ShaderMaterial({
      vertexShader: BILL_VERT, fragmentShader: FLARE_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      uniforms: { uCore: { value: 0 }, uRing: { value: 0 }, uRingI: { value: 0 }, uColor: { value: col(0x5aa8ff) } },
    });
    this.flare = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.flareMat);
    this.flare.position.copy(bang); this.flare.scale.setScalar(60); this.flare.visible = false; this.flare.renderOrder = 10;
    this.group.add(this.flare);
    this.ringMat = new THREE.ShaderMaterial({
      vertexShader: BILL_VERT, fragmentShader: FLARE_FRAG, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      uniforms: { uCore: { value: 0 }, uRing: { value: 0.62 }, uRingI: { value: 0 }, uColor: { value: col(0x4a9cff) } },
    });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.ringMat);
    this.ring.position.copy(bang); this.ring.scale.setScalar(60); this.ring.visible = false; this.ring.renderOrder = 11;
    this.group.add(this.ring);

    // paletas por estação (para o céu)
    this._pal = world.palettes.map((p) => ({ c1: col(p[0]), c2: col(p[1]), k: p.glow ?? 1 }));
    this._c1 = new THREE.Color(); this._c2 = new THREE.Color();
  }

  /** Desenha um shader numa textura uma única vez. */
  _bake(frag, w, h, uniforms, repeat) {
    const rt = new THREE.WebGLRenderTarget(w, h, { depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    if (repeat) rt.texture.wrapS = THREE.RepeatWrapping;
    const mat = new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    const scene = new THREE.Scene(), mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false; scene.add(mesh);
    const r = this.renderer, prev = r.getRenderTarget();
    r.setRenderTarget(rt); r.render(scene, new THREE.Camera()); r.setRenderTarget(prev);
    mat.dispose(); mesh.geometry.dispose();
    (this._baked ??= []).push(rt);
    return rt.texture;
  }

  /** Nuvens de nebulosa agrupadas perto de cada estação (e algumas ao longo do caminho). */
  setCloudCount(perCluster) {
    if (this.clouds && this._perCluster === perCluster) return;
    this._perCluster = perCluster;
    if (this.clouds) { this.bgScene.remove(this.clouds); this.clouds.geometry.dispose(); }
    const cl = this.world.clusters, n = cl.length * perCluster;
    const center = new Float32Array(n * 3), info = new Float32Array(n * 4), color = new Float32Array(n * 3);
    const c = new THREE.Color(), a = new THREE.Color(), b = new THREE.Color(), v = new THREE.Vector3();
    let i = 0;
    for (const k of cl) {
      a.setHex(k.palette[0]); b.setHex(k.palette[1]);
      for (let j = 0; j < perCluster; j++, i++) {
        // forma achatada e alongada (como uma nebulosa real), não uma bola
        v.set(rnd(-1, 1) * k.spread * 1.3, rnd(-1, 1) * k.spread * 0.55, rnd(-1, 1) * k.spread * 0.8);
        v.applyAxisAngle(new THREE.Vector3(0, 0, 1), k.tilt ?? 0).add(k.center);
        center.set([v.x, v.y, v.z], i * 3);
        const type = Math.random() < 0.55 ? 0 : 1;
        info.set([rnd(0.3, 1.15) * k.spread * 1.1, rnd(0, Math.PI * 2), rnd(0.035, 0.1) * (k.glow ?? 1) * (type ? 1.6 : 1), type], i * 4);
        c.copy(a).lerp(b, Math.random()).multiplyScalar(rnd(0.75, 1.3));
        color.set([c.r, c.g, c.b], i * 3);
      }
    }
    const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
    geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(center, 3));
    geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(info, 4));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(color, 3));
    geo.instanceCount = n;
    this.clouds = new THREE.Mesh(geo, this.cloudMat);
    this.clouds.frustumCulled = false; this.clouds.renderOrder = -5;
    this.bgScene.add(this.clouds);
  }

  /** (Re)cria as 3 camadas de estrelas. { volume, sky, dust } */
  setStarCount(q) {
    if (this._starQ && this._starQ.volume === q.volume) return;
    this._starQ = q;
    const W = this.world, ex = W.exclude ?? [];
    const make = (layer, n, fill) => {
      if (this.starMeshes[layer]) { this.group.remove(this.starMeshes[layer]); this.starMeshes[layer].geometry.dispose(); }
      const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
      const pos = new Float32Array(n * 3), data = new Float32Array(n * 4), p = new THREE.Vector3();
      for (let i = 0; i < n; i++) { fill(p, data, i); pos.set([p.x, p.y, p.z], i * 3); }
      geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
      geo.setAttribute('aData', new THREE.InstancedBufferAttribute(data, 4));
      geo.instanceCount = n;
      const m = new THREE.Mesh(geo, this.starMats[layer]);
      m.frustumCulled = false; m.renderOrder = -900 + layer;
      this.group.add(m); this.starMeshes[layer] = m;
    };
    const tint = () => (Math.random() < 0.7 ? Math.random() * 0.25 : Math.random());
    // volume: caixa ao longo do caminho
    const B = W.bounds;
    make(0, q.volume, (p, d, i) => {
      for (let t = 0; t < 8; t++) {
        p.set(rnd(B.min.x, B.max.x), rnd(B.min.y, B.max.y), rnd(B.min.z, B.max.z));
        if (!ex.some((e) => p.distanceTo(e.center) < e.radius)) break;
      }
      const big = Math.random() < 0.06;
      d.set([Math.random(), big ? rnd(1.6, 2.6) : rnd(0.7, 1.5), tint(), big ? 1 : rnd(0.45, 0.95)], i * 4);
    });
    // céu distante: esfera, mais densa perto da faixa galáctica
    const n = new THREE.Vector3(0.42, 0.86, 0.29).normalize();
    make(1, q.sky, (p, d, i) => {
      p.randomDirection();
      if (Math.random() < 0.45) { p.addScaledVector(n, -p.dot(n) * rnd(0.75, 1)).normalize(); }
      p.multiplyScalar(900);
      d.set([Math.random(), rnd(0.55, 1.25), tint(), rnd(0.25, 0.85)], i * 4);
    });
    // poeira próxima
    make(2, q.dust, (p, d, i) => {
      p.set(rnd(-90, 90), rnd(-90, 90), rnd(-90, 90));
      d.set([Math.random(), rnd(0.5, 0.9), 0.6, rnd(0.18, 0.4)], i * 4);
    });
  }

  setBackgroundScale(s) { if (s !== this.bgScale) { this.bgScale = s; this.resize(this.size.w, this.size.h, this.size.px); } }

  resize(w, h, px) {
    this.size = { w, h, px };
    this.bgRT.setSize(Math.max(64, Math.round(w * px * this.bgScale)), Math.max(64, Math.round(h * px * this.bgScale)));
    for (const m of this.starMats) { m.uniforms.uRes.value.set(w * px, h * px); m.uniforms.uPx.value = px; }
  }

  /** Por quadro. { time, region (0..n-1), velView (Vector3), trail, calm } */
  update({ time, region, velView, trail, calm, camera }) {
    this.compose.uniforms.uTime.value = time;
    this.dome.uniforms.uTime.value = time;
    // cor do céu da região atual (transição gradual)
    const P = this._pal, i = Math.min(Math.floor(region), P.length - 1), j = Math.min(i + 1, P.length - 1), f = region - i;
    const t = f * f * (3 - 2 * f);
    this.dome.uniforms.uC1.value.copy(P[i].c1).lerp(P[j].c1, t);
    this.dome.uniforms.uC2.value.copy(P[i].c2).lerp(P[j].c2, t);
    this.dome.uniforms.uK.value = P[i].k + (P[j].k - P[i].k) * t;
    for (const m of this.starMats) {
      const u = m.uniforms;
      u.uTime.value = calm ? 0 : time;
      u.uTwinkle.value = calm || u.uLayer.value === 2 ? 0 : 1;
      u.uVelView.value.copy(velView);
      u.uTrail.value = calm ? 0 : trail;
    }
    this.domeMesh.position.copy(camera.position);
    if (this.flare.visible) this.flare.quaternion.copy(camera.quaternion);
    if (this.ring.visible) this.ring.quaternion.copy(camera.quaternion);
  }

  /** Desenha céu + nuvens na textura de fundo (antes do desenho principal). */
  renderBackground(renderer, camera) {
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.bgRT);
    renderer.render(this.bgScene, camera);
    renderer.setRenderTarget(prev);
  }

  /** Controles usados pela introdução. */
  get fx() {
    const s = this.starMats.map((m) => m.uniforms), d = this.dome.uniforms, f = this.flareMat.uniforms;
    return {
      reveal: d.uReveal, flash: d.uFlash, cloudReveal: this.cloudMat.uniforms.uRevealDist, cloudFade: this.cloudMat.uniforms.uFade,
      core: f.uCore, ringI: this.ringMat.uniforms.uRingI, flare: this.flare, ringMesh: this.ring,
      expand: s[0].uExpand, burst: s[0].uBurst,
      setStarOpacity: (v) => { s[0].uOpacity.value = v; s[1].uOpacity.value = v; s[2].uOpacity.value = v; },
      starOpacity: s[0].uOpacity,
    };
  }

  dispose() {
    for (const m of this.starMeshes) m?.geometry.dispose();
    this.clouds?.geometry.dispose(); this.domeMesh.geometry.dispose(); this.flare.geometry.dispose();
    this.group.traverse((o) => o.geometry?.dispose?.());
    [...this.starMats, this.dome, this.cloudMat, this.compose, this.flareMat, this.ringMat].forEach((m) => m.dispose());
    this.bgRT.dispose(); this._baked?.forEach((rt) => rt.dispose());
  }
}

/* ===== 6. PLANETAS DE FUNDO ===== */

/** CORPOS CELESTES distantes, no espaço 3D real (a câmera passa por eles durante as viagens */

const VERT = /* glsl */ `
varying vec3 vObj, vN, vView;
void main(){
  vObj = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vView = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
precision highp float;
varying vec3 vObj, vN, vView;
uniform vec3 uCol1, uCol2, uCol3, uLight;
uniform float uTime, uForm, uOpacity, uSeed, uBands;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * n3(p); p = p * 2.1 + 3.7; a *= 0.5; } return v; }
void main(){
  vec3 p = normalize(vObj);
  float dn = fbm3(p * 3.0 + uSeed * 5.0);
  float m = uForm * 1.25 - dn;                                   // frente de condensação
  if (m < 0.0) discard;
  float warp = fbm3(p * 2.0 + uSeed) * 0.6;
  float bands = sin((p.y * uBands + warp * 3.0) * 3.14159);
  float surf = fbm3(p * 3.5 + uSeed * 3.0 + vec3(0.0, uTime * 0.01, 0.0));
  vec3 base = mix(uCol1, uCol2, smoothstep(0.25, 0.75, surf * 0.7 + bands * 0.15 + 0.15));
  base = mix(base, uCol3, smoothstep(0.55, 0.9, surf) * 0.45);
  vec3 N = normalize(vN);
  float lit = smoothstep(-0.25, 0.9, dot(N, normalize(uLight)));
  float fres = pow(1.0 - max(dot(N, normalize(vView)), 0.0), 3.0);
  vec3 col = base * (0.03 + lit * 0.62);
  col += uCol3 * fres * (0.12 + 0.6 * lit);                       // atmosfera
  float edge = 1.0 - smoothstep(0.0, 0.14, m);
  col += vec3(0.45, 0.78, 1.0) * edge * 1.4;
  gl_FragColor = vec4(col, uOpacity);
}`;

/* Anel opcional (cfg.ring): faixas finas e translúcidas, discretas. */
const RING_VERT = /* glsl */ `varying float vR; varying vec3 vN; void main(){ vR = length(position.xy); vN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0)); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const RING_FRAG = /* glsl */ `
varying float vR; varying vec3 vN; uniform vec3 uCol1, uCol2, uLight; uniform float uOpacity, uForm, uIn, uOut;
void main(){
  float t = (vR - uIn) / (uOut - uIn);
  float bands = 0.55 + 0.45 * sin(t * 38.0) * sin(t * 11.0 + 1.3);
  float edge = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.86, 1.0, t));
  float gap = 1.0 - 0.75 * exp(-pow((t - 0.62) / 0.035, 2.0));     // divisão escura (como em anéis reais)
  float lit = 0.35 + 0.65 * abs(dot(normalize(vN), normalize(uLight)));
  vec3 col = mix(uCol1, uCol2, t) * lit;
  float a = bands * edge * gap * 0.5 * uOpacity * smoothstep(0.6, 1.0, uForm);
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`;

const _v = new THREE.Vector3(), _q = new THREE.Vector3();

class BackdropPlanets {
  constructor(universe) {
    this.u = universe;
    this.group = new THREE.Group();
    this.items = U.celestial.map((cfg, i) => {
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: true,
        uniforms: {
          uCol1: { value: new THREE.Color(cfg.colors[0]) }, uCol2: { value: new THREE.Color(cfg.colors[1]) }, uCol3: { value: new THREE.Color(cfg.colors[2]) },
          uLight: { value: new THREE.Vector3(0, 0, 1) }, uTime: { value: 0 }, uForm: { value: 1 }, uOpacity: { value: 0 }, uSeed: { value: cfg.seed }, uBands: { value: cfg.bands },
        },
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
      mesh.rotation.z = 0.35 + i * 0.4;
      mesh.visible = false;
      this.group.add(mesh);
      let ringMat = null;
      if (cfg.ring) {
        ringMat = new THREE.ShaderMaterial({
          vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { uCol1: mat.uniforms.uCol2, uCol2: mat.uniforms.uCol3, uLight: mat.uniforms.uLight, uOpacity: mat.uniforms.uOpacity, uForm: mat.uniforms.uForm, uIn: { value: 1.35 }, uOut: { value: 2.25 } },
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 2.25, 160, 1), ringMat);
        ring.rotation.x = Math.PI / 2 - 0.42; // visto de lado, levemente de cima
        mesh.add(ring);
      }
      // ext: quanto o corpo ocupa além do raio (o anel é mais largo que o planeta) — usado pelas zonas seguras
      return { cfg, mesh, mat, ringMat, ext: cfg.ring ? 2.3 : 1, spin: 0.012 + i * 0.006, placed: false, vis: 0, radius: 1 };
    });
  }

  /** Posiciona cada corpo no lugar livre do enquadramento da sua estação. */
  layout() {
    const u = this.u, cam = u.camera, H = window.innerHeight, W = window.innerWidth, top = u.headerH;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    for (const it of this.items) {
      const st = u.world.station(it.cfg.station);
      if (!st) { it.placed = false; continue; }
      const halfH = tanV * it.cfg.depth, halfW = halfH * (W / H);
      const want = { x: (it.cfg.ndc[0] * 0.5 + 0.5) * W, y: (-it.cfg.ndc[1] * 0.5 + 0.5) * H };
      const maxR = it.cfg.size * H / 2, e = it.ext;
      const rects = u.stationRects(it.cfg.station);
      const ship = it.cfg.station === 'inicio' ? u.main?.homeSpot : null;
      if (ship) { const { kw, kh } = u.main.foot, p = 24; rects.push({ x0: ship.x - ship.s * kw / 2 - p, x1: ship.x + ship.s * kw / 2 + p, y0: ship.y - ship.s * kh / 2 - p, y1: ship.y + ship.s * kh / 2 + p }); }
      const spot = freeSpot(rects, { w: W, h: H, top }, { kw: 2 * e, kh: 2 * Math.max(1, e * 0.5), want, maxS: maxR, minS: maxR * 0.3, margin: -maxR * 0.4 * e });
      if (ship) rects.pop();
      if (!spot) { it.placed = false; it.mesh.visible = false; continue; }
      const nx = (spot.x / W) * 2 - 1, ny = -((spot.y / H) * 2 - 1);
      _v.set(nx * halfW, ny * halfH, -it.cfg.depth).applyQuaternion(st.quaternion).add(st.position);
      it.mesh.position.copy(_v);
      it.radius = (spot.s / (H / 2)) * halfH;
      it.mesh.scale.setScalar(it.radius);
      // luz vem da origem do universo (Big Bang), um pouco de cima
      it.mat.uniforms.uLight.value.copy(u.world.bang).sub(_v).normalize().add(_q.set(0, 0.35, 0)).normalize();
      it.placed = true;
    }
  }

  /** Formação 0→1 (usada pela introdução). */
  setFormed(v = 1) { this.items.forEach((it) => { it.mat.uniforms.uForm.value = v; }); }

  /** Por quadro: gira, apaga se invadir texto visível ou se estiver longe demais. Devolve se algum está visível. */
  update(dt, time, screenRects) {
    const cam = this.u.camera, W = window.innerWidth, H = window.innerHeight;
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    let any = false;
    for (const it of this.items) {
      if (!it.placed) { it.mesh.visible = false; continue; }
      it.mesh.rotation.y += dt * it.spin;
      it.mat.uniforms.uTime.value = time;
      _v.copy(it.mesh.position).applyMatrix4(cam.matrixWorldInverse);
      const dist = -_v.z;
      let want = 0;
      if (dist > it.radius * 1.5) {
        _q.copy(it.mesh.position).project(cam);
        const sx = (_q.x * 0.5 + 0.5) * W, sy = (-_q.y * 0.5 + 0.5) * H, sr = (it.radius / (dist * tanV)) * (H / 2);
        const er = sr * it.ext, onScreen = sx + er > 0 && sx - er < W && sy + sr > 0 && sy - sr < H;
        const far = 1 - THREE.MathUtils.smoothstep(dist, it.cfg.depth * 2.6, it.cfg.depth * 4);
        want = onScreen && !overlaps(sx, sy, er * 0.92, screenRects) ? far : 0;
      }
      it.vis += (want - it.vis) * (1 - Math.exp(-dt * (want < it.vis ? 5 : 2.5))); // some e volta suave (sem "piscar")
      it.mat.uniforms.uOpacity.value = it.vis;
      it.mesh.visible = it.vis > 0.004 && it.mat.uniforms.uForm.value > 0.001;
      any ||= it.mesh.visible;
    }
    return any;
  }

  dispose() { this.items.forEach((it) => { it.mesh.traverse((o) => o.geometry?.dispose()); it.mat.dispose(); it.ringMat?.dispose(); }); }
}

/* ===== 7. TERMINAL HACKER ===== */

const C = { bg: '#010409', dim: '#3f6683', text: '#a9d6f0', cyan: '#35d6f5', blue: '#2f8fff', white: '#eaf8ff', red: '#ff3b5c', amber: '#ffb35c' };

/* gerador determinístico (a mesma "invasão" a cada visita, sem saltos ao redimensionar) */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join('');
const ip = (r) => `${10 + Math.floor(r() * 180)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}.${1 + Math.floor(r() * 253)}`;

/** Roteiro do log principal: [tempo, texto, cor, digitado?] */
function script(T) {
  const r = rng(9418), out = [];
  const target = '10.66.13.37';
  let t = T.bootEnd;
  const cmd = (s, dur = 0.22) => { out.push({ t, s, c: C.white, typed: dur }); t += dur + 0.02; };
  const log = (s, c = C.text, gap = 0.035) => { out.push({ t, s, c }); t += gap; };
  cmd(`$ cdsec init --stealth --profile=orbital`, 0.2);
  log(`[*] loading modules: ghostwire · quantum-handshake · mirrorproxy`, C.dim);
  log(`[*] resolving target mesh ................ ${target}`);
  cmd(`$ orbit-scan --ports 1-65535 --rate 9000 ${target}`, 0.22);
  for (let i = 0; i < 6; i++) {
    const port = [22, 80, 443, 5432, 8443, 9418][i];
    const st = i % 3 === 2 ? 'filtered' : 'open';
    log(`[${st === 'open' ? '+' : '-'}] ${String(port).padEnd(5)}/tcp  ${st.padEnd(8)}  ${['ssh-q', 'http', 'https', 'pg-cluster', 'gateway', 'cd-core'][i]}`, st === 'open' ? C.cyan : C.dim, 0.03);
  }
  log(`[!] IDS signature detected — rerouting via ${ip(r)}`, C.amber);
  cmd(`$ ghostwire tunnel --hops 7 --jitter 40ms`, 0.18);
  for (let i = 0; i < 4; i++) log(`    hop ${i + 1}  ${ip(r).padEnd(15)}  ${(8 + r() * 40).toFixed(1)}ms  ok`, C.dim, 0.025);
  cmd(`$ auth-probe --user root --wordlist orbital.lst`, 0.18);
  for (let i = 0; i < 4; i++) log(`[-] AUTH FAILED  user=root  attempt ${i + 1}/5  token=${hex(r, 12)}`, C.red, 0.04);
  log(`[*] negotiating TLS 1.3 handshake ......... ok`);
  log(`[*] deriving session key  0x${hex(r, 32)}`, C.blue);
  cmd(`$ mirrorproxy inject --stage 2 --payload nebula.bin`, 0.18);
  log(`[!] FIREWALL rule #4471 blocking egress`, C.amber);
  log(`[*] fragmenting payload  [${'█'.repeat(6)}${'░'.repeat(10)}]`, C.text);
  log(`[+] hash recovered  ${hex(r, 40)}`, C.cyan);
  log(`[*] escalating privileges  uid=0(root)`, C.white);
  return { lines: out, target };
}

class HackTerminal {
  /** T: tempos (s) { bootEnd, alertsAt, breachAt, grantedAt, end } */
  constructor(T, { reduced = false } = {}) {
    this.T = T; this.reduced = reduced;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'hack-terminal'; this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.data = script(T);
    this.r = rng(1337);
    this.nodes = Array.from({ length: 9 }, () => ip(this.r));
    this.alpha = 1;
    document.body.append(this.canvas);
    // texto acessível (o canvas é decorativo): leitores de tela ouvem só o essencial
    this.live = document.createElement('p'); this.live.className = 'sr-only-intro'; this.live.setAttribute('aria-live', 'polite');
    this.live.textContent = 'Sequência de abertura: simulação fictícia de invasão de sistema.';
    document.body.append(this.live);
    this.resize();
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth; this.H = window.innerHeight; this.dpr = dpr;
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    this.mobile = this.W < 760;
    this.fs = this.mobile ? 10.5 : Math.max(11, Math.min(13.5, this.W / 110));
    this.lh = Math.round(this.fs * 1.45);
  }

  /** Desenha o quadro do instante t (s). */
  draw(t) {
    const g = this.ctx, { W, H, fs, lh, T } = this;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.globalAlpha = 1;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    if (this.alpha <= 0) return;
    g.globalAlpha = this.alpha;
    g.textBaseline = 'top';
    const font = (w = 400, s = fs) => { g.font = `${w} ${s}px 'JetBrains Mono', ui-monospace, Consolas, monospace`; };
    font();

    // A: cursor piscando no escuro
    const boot = Math.min(t / T.bootEnd, 1);
    if (t < T.bootEnd) {
      g.fillStyle = C.cyan;
      if (Math.floor(t * 6) % 2 === 0) g.fillRect(W * 0.04, H * 0.08, fs * 0.6, fs * 1.1);
      g.globalAlpha = this.alpha * boot * 0.6; g.fillStyle = C.dim;
      g.fillText('CD-SEC // BOOT ' + '.'.repeat(Math.floor(t * 20) % 4), W * 0.04 + fs, H * 0.08);
      return;
    }

    const alerting = t >= T.alertsAt && t < T.breachAt;
    const breached = t >= T.breachAt;
    // leve tremor/glitch só na fase C
    const shake = alerting && !this.reduced ? (Math.sin(t * 90) * 0.5 + 0.5) * 2 : 0;
    g.save(); g.translate(shake * (Math.sin(t * 53) > 0 ? 1 : -1), 0);
    if (breached) g.globalAlpha = this.alpha * 0.35; // o resto escurece quando a invasão se confirma

    // barra superior
    const pad = this.mobile ? 12 : W * 0.03;
    font(600);
    g.fillStyle = C.cyan; g.fillText('CD-SEC // INTRUSION FRAMEWORK v4.2', pad, pad);
    const status = breached ? 'ROOT ACCESS' : alerting ? 'COUNTERMEASURES ACTIVE' : ['SCANNING', 'TUNNELING', 'PROBING AUTH', 'INJECTING'][Math.floor((t - T.bootEnd) / ((T.alertsAt - T.bootEnd) / 4)) % 4];
    font(400);
    g.fillStyle = alerting ? C.red : C.text;
    const st = `TARGET ${this.data.target}   STATUS: ${status}   T+${t.toFixed(2)}s`;
    if (!this.mobile) g.fillText(st, W - pad - g.measureText(st).width, pad);
    g.fillStyle = C.dim; g.fillRect(pad, pad + lh + 2, W - pad * 2, 1);

    // log principal (rola: mostra as últimas linhas que cabem)
    const top = pad + lh * 2, logW = this.mobile ? W - pad * 2 : W * 0.6, maxLines = Math.floor((H - top - pad - lh * 2) / lh);
    const shown = [];
    for (const L of this.data.lines) {
      if (L.t > t) break;
      let s = L.s;
      if (L.typed) { const k = Math.min(1, (t - L.t) / L.typed); s = s.slice(0, Math.max(1, Math.floor(s.length * k))) + (k < 1 ? '▌' : ''); }
      shown.push({ s, c: L.c });
    }
    const vis = shown.slice(-maxLines);
    g.save(); g.beginPath(); g.rect(pad, top, logW, H - top); g.clip();
    vis.forEach((L, i) => {
      g.fillStyle = L.c;
      let s = L.s;
      if (alerting && !this.reduced && (i * 7 + Math.floor(t * 30)) % 23 === 0) s = s.replace(/[a-z]/g, (ch) => (Math.random() < 0.4 ? String.fromCharCode(33 + Math.floor(Math.random() * 60)) : ch)); // caracteres tremendo
      g.fillText(s, pad, top + i * lh);
    });
    g.restore();

    // coluna direita: nós de rede, hexdump, progresso
    if (!this.mobile) {
      const x = W * 0.66, w = W - x - pad;
      const box = (y, h, title) => { g.strokeStyle = 'rgba(53,214,245,.35)'; g.strokeRect(x, y, w, h); g.fillStyle = C.cyan; font(600, fs * 0.9); g.fillText(title, x + 8, y + 6); font(400, fs * 0.92); };
      // nós
      let y = top;
      box(y, lh * 11, 'NETWORK NODES');
      this.nodes.forEach((n, i) => {
        const phase = Math.floor((t * 7 + i * 1.7)) % 5;
        const s = breached ? 'PWNED' : alerting && i % 3 === 0 ? 'LOCKED' : ['SCAN', 'OPEN', 'SCAN', 'FILTERED', 'OPEN'][phase];
        g.fillStyle = s === 'LOCKED' ? C.red : s === 'PWNED' ? C.white : s === 'OPEN' ? C.cyan : C.dim;
        g.fillText(`${n.padEnd(16)} ${s}`, x + 8, y + lh * 1.4 + i * lh);
      });
      // hexdump rolando
      y += lh * 11.6;
      const hh = lh * 8;
      box(y, hh, 'DECRYPT STREAM');
      const r = rng(Math.floor(t * 24));
      for (let i = 0; i < 6; i++) { g.fillStyle = i === 5 ? C.blue : C.dim; g.fillText(`${(0x7ffd3a00 + Math.floor(t * 4096) + i * 16).toString(16)}  ${hex(r, 8)} ${hex(r, 8)} ${hex(r, 8)}`, x + 8, y + lh * 1.4 + i * lh); }
      // barras de progresso
      y += hh + lh * 0.6;
      box(y, lh * 7, 'OPERATIONS');
      const bars = [['PORT SCAN', 0.0, 0.45], ['HANDSHAKE', 0.2, 0.7], ['KEY DERIVATION', 0.35, 0.95], ['FIREWALL BYPASS', 0.55, 1.0]];
      bars.forEach(([name, a, b], i) => {
        const k = Math.min(Math.max(((t - T.bootEnd) / (T.breachAt - T.bootEnd) - a) / (b - a), 0), 1);
        const by = y + lh * 1.5 + i * lh * 1.35, bw = w - 16;
        g.fillStyle = C.dim; g.fillText(name, x + 8, by);
        g.fillStyle = 'rgba(47,143,255,.18)'; g.fillRect(x + 8, by + lh * 0.75, bw, 3);
        g.fillStyle = name === 'FIREWALL BYPASS' && alerting ? C.red : C.cyan; g.fillRect(x + 8, by + lh * 0.75, bw * k, 3);
        g.fillStyle = C.text; const pct = `${Math.floor(k * 100)}%`; g.fillText(pct, x + 8 + bw - g.measureText(pct).width, by);
      });
    }

    // prompt na base, digitando sem parar
    g.fillStyle = C.white;
    const prompt = `root@orbital:~# ${['decrypt --all', 'pivot 10.66.0.0/16', 'exfil --mirror', 'clear-logs --silent'][Math.floor(t * 2.5) % 4].slice(0, Math.floor((t * 22) % 24))}${Math.floor(t * 6) % 2 ? '▌' : ''}`;
    g.fillText(prompt, pad, H - pad - lh);
    g.restore();
    g.globalAlpha = this.alpha;

    // C: alertas vermelhos (curtos, legíveis, sem flash de tela inteira)
    if (alerting) {
      const msgs = ['ACCESS DENIED', 'INTRUSION DETECTED', 'SECURITY PROTOCOL ACTIVE', 'FIREWALL COMPROMISED'];
      const span = (T.breachAt - T.alertsAt) / msgs.length;
      const i = Math.min(Math.floor((t - T.alertsAt) / span), msgs.length - 1);
      const k = (t - T.alertsAt - i * span) / span;
      const rr = rng(i * 97 + 5);
      const bx = W * (0.18 + rr() * 0.34), by = H * (0.22 + rr() * 0.45);
      font(700, this.mobile ? 16 : 24);
      const m = msgs[i], mw = g.measureText(m).width;
      g.globalAlpha = this.alpha * (k < 0.12 ? k / 0.12 : 1) * (Math.floor(t * 14) % 5 === 0 ? 0.55 : 1);
      g.fillStyle = 'rgba(40,0,8,.88)'; g.fillRect(bx - 18, by - 14, mw + 36, (this.mobile ? 16 : 24) + 28);
      g.strokeStyle = C.red; g.lineWidth = 1.5; g.strokeRect(bx - 18, by - 14, mw + 36, (this.mobile ? 16 : 24) + 28);
      // glitch: fatia deslocada + separação de cor
      if (!this.reduced && k > 0.3 && k < 0.55) { g.fillStyle = 'rgba(53,214,245,.6)'; g.fillText(m, bx + 3, by); }
      g.fillStyle = C.red; g.fillText(m, bx, by);
      g.globalAlpha = this.alpha;
    }

    // D: SYSTEM BREACHED → ACCESS GRANTED (o clímax: estável, centralizado)
    if (breached) {
      const k = Math.min((t - T.breachAt) / 0.18, 1);
      const big = this.mobile ? 26 : Math.min(64, W / 18);
      font(700, big); g.textAlign = 'center';
      g.globalAlpha = this.alpha * k;
      g.shadowColor = 'rgba(53,214,245,.8)'; g.shadowBlur = 24;
      g.fillStyle = C.white; g.fillText('SYSTEM BREACHED', W / 2, H * 0.4);
      if (t >= T.grantedAt) {
        const k2 = Math.min((t - T.grantedAt) / 0.15, 1);
        font(700, big * 0.62); g.globalAlpha = this.alpha * k2;
        const s = 'ACCESS GRANTED', sw = g.measureText(s).width;
        g.strokeStyle = C.cyan; g.lineWidth = 2; g.strokeRect(W / 2 - sw / 2 - 22, H * 0.4 + big * 1.35, sw + 44, big * 0.62 + 24);
        g.fillStyle = C.cyan; g.fillText(s, W / 2, H * 0.4 + big * 1.35 + 12);
      }
      g.shadowBlur = 0; g.textAlign = 'left';
      g.globalAlpha = this.alpha;
    }
  }

  /** Pixels brilhantes do quadro atual (para virarem partículas): [{x, y, l}] em px de tela. */
  samplePixels(step = 3, max = 7000) {
    const { W, H, dpr } = this, img = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    const pts = [];
    for (let s = step; ; s += 1) {
      pts.length = 0;
      for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
        const i = ((Math.floor(y * dpr) * this.canvas.width) + Math.floor(x * dpr)) * 4;
        const l = (img[i] + img[i + 1] + img[i + 2]) / 765;
        if (l > 0.22) pts.push({ x, y, l, r: img[i] / 255, g: img[i + 1] / 255, b: img[i + 2] / 255 });
      }
      if (pts.length <= max || s > 12) break;
    }
    return pts;
  }

  dispose() { window.removeEventListener('resize', this._onResize); this.canvas.remove(); this.live.remove(); }
}

/* ===== 8. NOME HACKER ===== */

const CHARS = '!<>-_/[]{}—=+*^?#01';
const pick = () => CHARS[(Math.random() * CHARS.length) | 0];

class HackerName {
  constructor() {
    const H = U.intro.hacker;
    this.H = H;
    // linha do tempo: cada palavra decodifica (duração proporcional ao tamanho) e espera um pouco
    let t = H.startAt;
    this.steps = H.words.map((w, i) => {
      const dur = Math.max(H.minDecode, w.length * H.perChar);
      const s = { word: w, start: t, end: t + dur };
      t = s.end + (i < H.words.length - 1 ? H.pause : 0);
      return s;
    });
    this.fullAt = this.steps[this.steps.length - 1].end; // nome completo pronto
    this.el = document.createElement('div');
    this.el.className = 'hacker-name';
    this.el.setAttribute('aria-hidden', 'true'); // o leitor de tela ouve só "Carlos Daniel" (texto .sr-only-intro)
    this.text = document.createElement('span'); this.text.className = 'hacker-name__text';
    this.cursor = document.createElement('span'); this.cursor.className = 'hacker-name__cursor'; this.cursor.textContent = '_';
    this.el.append(this.text, this.cursor);
    document.body.append(this.el);
    this._key = ''; this._tick = -1;
  }

  /** Desenha o estado do instante t (s do relógio da introdução). */
  update(t) {
    const H = this.H, s0 = this.steps[0];
    if (t < s0.start) { this.el.style.opacity = '0'; return; }
    const out = H.exitAt;                       // falha (glitch) → símbolos puxados pelo hiperespaço
    if (t >= out + H.glitchSeconds + H.pullSeconds) { this.el.style.opacity = '0'; return; }

    // símbolos novos ~30 vezes por segundo (legível; o seu código sorteava a cada quadro)
    const tick = Math.floor(t * 30);
    const fresh = tick !== this._tick; this._tick = tick;

    let word, fixed; // fixed[i] = a letra i já travou
    if (t < out) {
      let step = s0;
      for (const s of this.steps) if (t >= s.start) step = s;
      word = step.word;
      const p = (t - step.start) / (step.end - step.start);
      fixed = (i) => p >= 1 || p > i / word.length;
    } else {
      // glitch: as letras voltam a virar símbolos, da direita para a esquerda
      word = this.steps[this.steps.length - 1].word;
      const g = Math.min(1, (t - out) / H.glitchSeconds);
      fixed = (i) => i / word.length < 1 - g;
    }

    if (fresh || this._word !== word) {
      this._word = word;
      let html = '';
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        if (ch === ' ') { html += '<span class="hacker-name__sp"> </span>'; continue; }
        html += fixed(i) ? `<span class="hacker-name__ok">${ch}</span>` : `<span class="hacker-name__sym">${pick().replace('<', '&lt;').replace('>', '&gt;')}</span>`;
      }
      if (html !== this._key) { this.text.innerHTML = html; this._key = html; }
    }

    // estilo da saída
    const el = this.el;
    if (t < out) { el.style.opacity = String(Math.min(1, (t - s0.start) / 0.12)); el.classList.remove('is-glitch'); el.style.transform = ''; el.style.filter = ''; el.style.letterSpacing = ''; return; }
    el.classList.toggle('is-glitch', t < out + H.glitchSeconds);
    const k = Math.max(0, (t - out - H.glitchSeconds * 0.5) / H.pullSeconds); // puxado para a câmera junto com as estrelas
    const e = Math.min(1, k) ** 2;
    el.style.opacity = String(Math.max(0, 1 - Math.min(1, k) ** 1.4));
    el.style.transform = `translate(-50%, -50%) scale(${1 + e * 1.8}, ${1 + e * 0.6})`;
    el.style.letterSpacing = `${e * 0.6}em`;
    el.style.filter = `blur(${e * 7}px)`;
  }

  dispose() { this.el.remove(); }
}

/* ===== 9. INTRODUÇÃO BIG BANG ===== */

/** INTRODUÇÃO — uma única animação contínua, sem cortes de cena */
class BigBangIntro {
  constructor(universe) {
    this.u = universe;
    this.active = false; this.done = false;
    this.T = { t: 0 };
    this.tl = null; this.terminal = null;
  }

  get clock() { return this.T.t; }

  /** Chamado a cada quadro pelo universo (desenha o terminal enquanto ele existe). */
  update() { if (this.terminal) this.terminal.draw(this.T.t); this.hacker?.update(this.T.t); }

  async run({ onShipArrive, onPage, onFinish }) {
    const u = this.u, I = U.intro, TT = I.terminal, fx = u.cosmos.fx, dir = u.director, title = u.title;
    this.active = true;
    this.onPage = onPage; this.onFinish = onFinish;
    this.fx = fx;

    // estado inicial: universo apagado; a câmera começa atrás do Início; o terminal cobre a tela
    fx.reveal.value = 0; fx.flash.value = 0; fx.cloudReveal.value = 0; fx.core.value = 0; fx.ringI.value = 0;
    fx.expand.value = 0; fx.burst.value = 1; fx.setStarOpacity(0);
    fx.flare.visible = true; fx.flare.scale.setScalar(40); fx.ringMesh.visible = true; fx.ringMesh.scale.setScalar(40);
    u.planets.setFormed(0);
    dir.introOffset.set(0, 0, I.cameraBack);
    this.terminal = new HackTerminal(TT, { reduced: u.reduced });

    // nome hacker (texto da introdução; o título fixo da página não é tocado)
    this.hacker = I.hacker.enabled === false ? null : new HackerName();
    document.fonts?.load('700 100px "JetBrains Mono"').catch(() => {});

    const tl = (this.tl = gsap.timeline({ onComplete: () => this._finish() }));
    tl.to(this.T, { t: I.endAt, duration: I.endAt, ease: 'none' }, 0);

    // E) terminal → poeira que converge até o ponto de luz (o centro do Big Bang na tela)
    tl.add(() => this._dissolve(), TT.end);

    // 1) ponto de luz: acende enquanto a poeira chega e "respira"
    tl.to(fx.core, { value: 0.6, duration: I.swellAt - I.pointAt, ease: 'power2.in' }, I.pointAt);
    tl.to(fx.core, { value: 1.0, duration: I.bangAt - I.swellAt, ease: 'sine.in' }, I.swellAt);
    tl.to(fx.flare.scale, { x: 95, y: 95, z: 95, duration: I.bangAt - I.pointAt, ease: 'sine.in' }, I.pointAt);

    // 2) Big Bang (subida rápida, queda lenta: sem flash agressivo)
    const B = I.bangAt;
    tl.to(fx.flash, { value: 0.8, duration: 0.55, ease: 'power2.in' }, B);
    tl.to(fx.flash, { value: 0, duration: 2.2, ease: 'power2.out' }, B + 0.55);
    tl.to(fx.core, { value: 0, duration: 1.0, ease: 'power2.out' }, B + 0.25);
    tl.to(fx.ringMesh.scale, { x: 2400, y: 2400, z: 2400, duration: 2.8, ease: 'power2.out' }, B + 0.1);
    tl.to(fx.ringI, { value: 1, duration: 0.3, ease: 'power1.out' }, B + 0.1);
    tl.to(fx.ringI, { value: 0, duration: 2.0, ease: 'power1.in' }, B + 0.45);
    tl.to(fx.reveal, { value: 1.4, duration: 3.0, ease: 'power2.out' }, B + 0.1);
    tl.to(fx.cloudReveal, { value: 7000, duration: 4, ease: 'power2.out' }, B + 0.2);
    tl.to(fx.starOpacity, { value: 1, duration: 1.0, ease: 'power1.out', onUpdate: () => fx.setStarOpacity(fx.starOpacity.value) }, B + 0.25);
    tl.to(fx.expand, { value: 1, duration: 3.0, ease: 'none' }, B + 0.15);
    tl.to(fx.burst, { value: 0, duration: 2.6, ease: 'power1.in' }, B + 0.5);

    // 3) corpos celestes se condensam
    u.planets.items.forEach((it, i) => {
      tl.to(it.mat.uniforms.uForm, { value: 1, duration: 2.2, ease: 'sine.inOut' }, I.planetsAt + i * 0.25);
    });

    // 4) nome hacker: desenhado a cada quadro por update() (HackerName), no relógio T.t
    const H = I.hyperspaceAt;
    tl.to(dir.introOffset, { z: 0, duration: 2.9, ease: 'power3.inOut' }, H);
    tl.add(() => onShipArrive?.(), H + 0.5);
    tl.add(() => { fx.flare.visible = false; fx.ringMesh.visible = false; }, H);

    // 6) a página aparece: o <h1> surge sobre as partículas, que viram o brilho do título
    tl.add(() => {
      this._page();
      // as partículas do brilho nascem agora (já formadas) e acendem devagar atrás do título fixo
      if (!title.mat) { title.build(false); title.T.form = 0; }
      title.toAura(1.3, gsap);
    }, I.pageAt);
    tl.add(() => this._dropHacker(), I.hacker.exitAt + I.hacker.glitchSeconds + I.hacker.pullSeconds + 0.1);

    this._fail = setTimeout(() => this._finish(), (I.maxSeconds + 0.5) * 1000);
  }

  /** O texto do terminal vira poeira (as partículas nascem dos próprios pixels) e o canvas some. */
  _dissolve() {
    const term = this.terminal; if (!term) return;
    const u = this.u, I = U.intro;
    term.draw(this.T.t);
    const pts = term.samplePixels(window.innerWidth < 760 ? 4 : 3, window.innerWidth < 760 ? 3500 : 7000);
    // ponto de luz do Big Bang na tela (mesma câmera que vai desenhá-lo)
    const v = u.world.bang.clone(); u.camera.updateMatrixWorld(); v.project(u.camera);
    const target = { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
    u.title.buildDust(pts, target, I.terminal.end, I.dustSeconds);
    gsap.to(term, { alpha: 0, duration: 0.18, ease: 'power1.in', onComplete: () => { term.dispose(); if (this.terminal === term) this.terminal = null; } });
  }

  _dropHacker() { this.hacker?.dispose(); this.hacker = null; }

  _page() { if (this._paged) return; this._paged = true; this.onPage?.(); }

  /** Pular: o universo termina de nascer rapidamente e a página aparece completa. */
  skip() {
    if (this.done || this.skipped) return;
    this.skipped = true;
    this.tl?.kill();
    const u = this.u, fx = this.fx ?? u.cosmos.fx, title = u.title;
    this.terminal?.dispose(); this.terminal = null;
    this._dropHacker();
    title.dropDust();
    const to = (o, v, d = 0.6) => gsap.to(o, { value: v, duration: d, ease: 'power2.out' });
    to(fx.reveal, 1.4, 0.7); to(fx.expand, 1, 0.7); to(fx.flash, 0); to(fx.core, 0, 0.3); to(fx.ringI, 0, 0.3); to(fx.burst, 0, 0.5);
    gsap.to(fx.cloudReveal, { value: 7000, duration: 0.8 });
    fx.setStarOpacity(1); fx.flare.visible = false; fx.ringMesh.visible = false;
    gsap.to(u.director.introOffset, { z: 0, duration: 0.9, ease: 'power3.out' });
    u.planets.items.forEach((it) => to(it.mat.uniforms.uForm, 1, 0.8));
    this.T.t = 1e4;
    if (!title.mat) title.build(true);
    title.toAura(0.6, gsap);
    this._page();
    gsap.delayedCall(0.9, () => this._finish());
  }

  _finish() {
    if (this.done) return;
    this.done = true; this.active = false;
    clearTimeout(this._fail);
    this.tl?.kill();
    this.terminal?.dispose(); this.terminal = null;
    this._dropHacker();
    this._page();
    const u = this.u, fx = this.fx ?? u.cosmos.fx;
    // garante o estado final, caso a introdução tenha sido interrompida
    fx.reveal.value = 1.4; fx.expand.value = 1; fx.setStarOpacity(1); fx.flash.value = 0; fx.core.value = 0; fx.ringI.value = 0; fx.burst.value = 0;
    fx.cloudReveal.value = 1e6; fx.flare.visible = false; fx.ringMesh.visible = false;
    u.director.introOffset.set(0, 0, 0);
    u.planets.setFormed(1);
    this.T.t = 1e4;
    u.title.dropDust();
    if (!u.title.mat) u.title.build(true); else u.title.toAura(0.01, null);
    this.onFinish?.();
  }
}

/* ===== 10. TÍTULO DE PARTÍCULAS ===== */

/** CARLOS DANIEL — "escrita holográfica": o nome é IMPRESSO em luz, exatamente onde fica o título da home. */

const NAME_VERT = /* glsl */ `
attribute vec2 aTarget; attribute vec2 aOffset; attribute vec4 aInfo; // aInfo: x início da impressão, y contorno(0/1), z altura na letra (0 base…1 topo), w semente
uniform float uTime, uClock, uDpr, uSize, uForm, uAura, uCalm, uGlide, uPrint;
uniform vec2 uOffset;
varying float vA, vHot, vAura;
void main(){
  float t0 = aInfo.x, edge = aInfo.y, ly = aInfo.z, seed = aInfo.w;
  float r = clamp((uTime - t0) / uPrint, 0.0, 1.0);
  float front = r * 1.12 - 0.06;                                            // altura do feixe que sobe pela letra
  float on = edge > 0.5 ? smoothstep(0.0, 0.3, r) : smoothstep(ly - 0.05, ly + 0.01, front);
  float settle = 1.0 - smoothstep(0.55, 1.0, r);
  vec2 jit = vec2(sin(seed * 91.0 + uClock * 9.0), cos(seed * 37.0 + uClock * 7.0)) * 2.5 * settle * (1.0 - uCalm);
  vec2 pos = aTarget + aOffset * (1.0 - uGlide) + jit;
  // depois de pronto: brilho vivo e discreto
  pos += vec2(sin(uClock * 1.7 + seed * 40.0), cos(uClock * 1.3 + seed * 70.0)) * mix(0.35, 1.1, uAura) * (1.0 - settle) * (1.0 - uCalm);
  // sair do Início: as partículas sobem e esmaecem devagar (sem explosão)
  float sc = 1.0 - uForm;
  pos += vec2((seed - 0.5) * 30.0, 26.0 + seed * 40.0) * sc * sc;
  vHot = (edge > 0.5 ? exp(-pow((r - 0.12) / 0.12, 2.0)) : exp(-pow((front - ly) / 0.05, 2.0))) * settle;
  vA = on * uForm;
  vAura = uAura;
  float tw = mix(1.0, 0.6 + 0.4 * sin(uClock * (1.2 + seed * 2.0) + seed * 30.0), uAura * (1.0 - uCalm));
  vA *= tw;
  gl_PointSize = uSize * (0.85 + seed * 0.4) * (1.0 + vHot * 0.8) * mix(1.0, 1.9, uAura) * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + uOffset, 0.0, 1.0);
}`;
const NAME_FRAG = /* glsl */ `
uniform float uWhite, uGlow; varying float vA, vHot, vAura;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), mix(1.5, 2.4, vAura));
  if (a * vA < 0.004) discard;
  vec3 col = mix(vec3(0.24, 0.62, 1.0), vec3(0.85, 0.97, 1.0), clamp(vHot + uWhite * 0.7, 0.0, 1.0) * (1.0 - vAura * 0.75));
  float k = mix(1.0, 0.26, vAura);
  gl_FragColor = vec4(col * (1.0 + uGlow + vHot * 0.6), a * vA * k);
}`;

const DUST_VERT = /* glsl */ `
attribute vec2 aStart; attribute vec4 aInfo; attribute vec3 aCol; // aInfo: x atraso, y raio inicial, z ângulo inicial, w semente
uniform float uTime, uDur, uDpr; uniform vec2 uTarget;
varying float vA; varying vec3 vCol;
void main(){
  float p = clamp((uTime - aInfo.x) / uDur, 0.0, 1.0);
  float e = p * p * (3.0 - 2.0 * p);
  vec2 d = aStart - uTarget;
  float ang = aInfo.z + (1.0 - (1.0 - e) * (1.0 - e)) * (1.1 + aInfo.w * 0.8);        // espiral suave (gravidade), não explosão
  float rad = aInfo.y * pow(1.0 - e, 1.6);
  vec2 pos = uTarget + vec2(cos(ang), sin(ang)) * rad;
  pos = mix(aStart, pos, smoothstep(0.0, 0.25, p));                                 // começa exatamente no pixel do texto
  vA = (1.0 - smoothstep(0.75, 1.0, p)) * smoothstep(0.0, 0.08, p + 0.02);
  vCol = mix(aCol, vec3(0.35, 0.75, 1.0), smoothstep(0.1, 0.6, p));
  gl_PointSize = mix(3.0, 1.6, e) * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
}`;
const DUST_FRAG = /* glsl */ `
varying float vA; varying vec3 vCol;
void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 1.4) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vCol * 2.4, a); }`;

const rand = (a, b) => a + Math.random() * (b - a);

/** Divide o <h1> em letras (para medir cada uma). Leitores de tela continuam lendo "Carlos Daniel". */
function prepareTitle(h1) {
  if (!h1 || h1.dataset.split) return h1;
  const text = (h1.textContent || site.introName).trim().replace(/\s+/g, ' ');
  h1.setAttribute('aria-label', text);
  h1.textContent = '';
  for (const word of text.split(' ')) {
    const w = document.createElement('span'); w.className = 'hero-title__word'; w.setAttribute('aria-hidden', 'true');
    for (const ch of word) { const c = document.createElement('span'); c.className = 'hero-title__ch'; c.textContent = ch; w.append(c); }
    if (h1.childNodes.length) h1.append(document.createTextNode(' '));
    h1.append(w);
  }
  h1.dataset.split = '1';
  return h1;
}

/** Amostra cada letra na posição real da tela. */
function sampleLetters(h1, maxPts = 9000) {
  const cs = getComputedStyle(h1);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const fontPx = parseFloat(cs.fontSize);
  const letters = [...h1.querySelectorAll('.hero-title__ch')].map((el) => ({ el, ch: el.textContent, r: el.getBoundingClientRect() }));
  const pad = Math.ceil(fontPx * 0.3);
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of letters) { x0 = Math.min(x0, l.r.left); y0 = Math.min(y0, l.r.top); x1 = Math.max(x1, l.r.right); y1 = Math.max(y1, l.r.bottom); }
  cv.width = Math.ceil(x1 - x0) + pad * 2; cv.height = Math.ceil(y1 - y0) + pad * 2;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;

  let step = Math.max(2, fontPx / 46), pts = [];
  const glyph = []; // por letra: caixa real dos pixels (para a altura relativa)
  for (let tries = 0; tries < 5; tries++, step *= 1.2) {
    pts = []; glyph.length = 0;
    letters.forEach((l, slot) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.font = font; ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
      const m = ctx.measureText(l.ch);
      const ascent = m.fontBoundingBoxAscent ?? fontPx * 0.92;
      const lx = l.r.left - x0 + pad, ly = l.r.top - y0 + pad + ascent;
      ctx.fillText(l.ch, lx, ly);
      const rx = Math.max(0, Math.floor(lx - pad / 2)), ry = Math.max(0, Math.floor(l.r.top - y0 + pad / 2));
      const rw = Math.min(cv.width - rx, Math.ceil(l.r.width + pad)), rh = Math.min(cv.height - ry, Math.ceil(l.r.height + pad));
      if (rw <= 0 || rh <= 0) return;
      const data = ctx.getImageData(rx, ry, rw, rh).data;
      const A = (x, y) => (x < 0 || y < 0 || x >= rw || y >= rh ? 0 : data[((y | 0) * rw + (x | 0)) * 4 + 3]);
      let gy0 = Infinity, gy1 = -Infinity;
      const local = [];
      for (let y = 0; y < rh; y += step) for (let x = 0; x < rw; x += step) {
        if (A(x, y) <= 128) continue;
        const edge = A(x - step, y) <= 128 || A(x + step, y) <= 128 || A(x, y - step) <= 128 || A(x, y + step) <= 128;
        const px = rx + x + rand(-0.3, 0.3) * step + x0 - pad, py = ry + y + rand(-0.3, 0.3) * step + y0 - pad;
        gy0 = Math.min(gy0, py); gy1 = Math.max(gy1, py);
        local.push({ x: px - cx, y: -(py - cy), py, slot, edge });
      }
      for (const p of local) { p.ly = gy1 > gy0 ? (gy1 - p.py) / (gy1 - gy0) : 0; pts.push(p); }
      glyph[slot] = { left: l.r.left, width: l.r.width, cy: (l.r.top + l.r.bottom) / 2, ch: l.ch };
    });
    if (pts.length <= maxPts) break;
  }
  return { pts, step, center: { x: cx, y: cy }, glyph, fontPx, slots: letters.length };
}

class TitleParticles {
  constructor(universe, h1) {
    this.u = universe; this.h1 = h1;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.T = { form: 1 };
    this.name = null; this.dust = null;
    this.mode = 'intro';
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    if (this.name && !this.u.intro?.active) { clearTimeout(this._rz); this._rz = setTimeout(() => this.build(this.mode === 'aura'), 180); }
  }

  /** Ordem de impressão: C e D (monograma) primeiro; depois as outras letras da esquerda para a direita. */
  _printTimes(s) {
    const I = U.intro, letters = s.glyph.map((g) => g?.ch ?? '');
    const iC = 0, iD = letters.findIndex((c, i) => i > 0 && c === site.introInitials[1]);
    const t = new Array(letters.length);
    t[iC] = I.monogramAt; if (iD > 0) t[iD] = I.monogramAt + 0.12;
    let k = 0;
    letters.forEach((_, i) => { if (t[i] == null) t[i] = I.nameAt + k++ * I.letterGap; });
    return { t, iC, iD };
  }

  /** Cria (ou recria) o nome. finished = já formado (sem introdução / depois de redimensionar). */
  build(finished = false) {
    if (!this.h1) return;
    this._drop('name');
    const W = window.innerWidth;
    const s = sampleLetters(this.h1, W < 720 ? 5000 : 9000);
    this.sampled = s;
    const { t, iC, iD } = this._printTimes(s);
    // monograma "CD": as duas letras lado a lado no centro do título (mesmo tamanho), depois deslizam ao lugar final
    const gC = s.glyph[iC], gD = s.glyph[iD];
    const off = new Map();
    if (gC && gD) {
      const gap = s.fontPx * 0.06, total = gC.width + gap + gD.width;
      const leftC = s.center.x - total / 2, leftD = leftC + gC.width + gap;
      off.set(iC, { x: leftC - gC.left, y: -(s.center.y - gC.cy) });
      off.set(iD, { x: leftD - gD.left, y: -(s.center.y - gD.cy) });
    }
    const n = s.pts.length;
    const target = new Float32Array(n * 2), offset = new Float32Array(n * 2), info = new Float32Array(n * 4);
    s.pts.forEach((p, i) => {
      target[i * 2] = p.x; target[i * 2 + 1] = p.y;
      const o = off.get(p.slot); if (o) { offset[i * 2] = o.x; offset[i * 2 + 1] = o.y; }
      info.set([t[p.slot] + rand(0, 0.04), p.edge ? 1 : 0, p.ly, Math.random()], i * 4);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aTarget', new THREE.BufferAttribute(target, 2));
    g.setAttribute('aOffset', new THREE.BufferAttribute(offset, 2));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: NAME_VERT, fragmentShader: NAME_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uClock: { value: 0 }, uDpr: { value: this.u.px }, uSize: { value: Math.max(2.2, s.step * 1.3) }, uForm: { value: 1 }, uAura: { value: 0 },
        uCalm: { value: this.u.reduced ? 1 : 0 }, uGlide: { value: 0 }, uPrint: { value: U.intro.printSeconds ?? 0.5 },
        uWhite: { value: 0 }, uGlow: { value: 0 }, uOffset: { value: new THREE.Vector2() },
      },
    });
    this.name = new THREE.Points(g, this.mat); this.name.frustumCulled = false;
    this.scene.add(this.name);
    if (finished) { this.mode = 'aura'; this.mat.uniforms.uTime.value = 1e4; this.mat.uniforms.uGlide.value = 1; this.mat.uniforms.uAura.value = 1; this.mat.uniforms.uForm.value = this.T.form; }
    this._track();
  }

  /** Poeira do terminal: cada pixel brilhante vira uma partícula que converge até o ponto do Big Bang (px de tela). */
  buildDust(pixels, targetPx, startAt, dur) {
    this._drop('dust');
    const W = window.innerWidth, H = window.innerHeight, n = pixels.length;
    const start = new Float32Array(n * 2), info = new Float32Array(n * 4), col = new Float32Array(n * 3);
    const tx = targetPx.x - W / 2, ty = H / 2 - targetPx.y;
    const maxR = Math.hypot(W, H) / 2;
    pixels.forEach((p, i) => {
      const x = p.x - W / 2, y = H / 2 - p.y, dx = x - tx, dy = y - ty, r = Math.hypot(dx, dy);
      start[i * 2] = x; start[i * 2 + 1] = y;
      info.set([startAt + (r / maxR) * 0.18 + rand(0, 0.08), r, Math.atan2(dy, dx), Math.random()], i * 4);
      col.set([p.r, p.g, p.b], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 2));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
    this.dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uDur: { value: dur }, uDpr: { value: this.u.px }, uTarget: { value: new THREE.Vector2(tx, ty) } },
    });
    this.dust = new THREE.Points(g, this.dustMat); this.dust.frustumCulled = false;
    this.scene.add(this.dust);
  }

  /** O título acompanha a rolagem: as partículas ficam sempre sobre as letras. */
  _track() {
    if (!this.sampled || !this.mat) return;
    const r = this.h1.querySelector('.hero-title__ch')?.getBoundingClientRect();
    const r0 = this.sampled.firstRect ??= r;
    const dx = r ? r.left - r0.left : 0, dy = r ? r.top - r0.top : 0;
    const W = window.innerWidth, H = window.innerHeight;
    this.mat.uniforms.uOffset.value.set(this.sampled.center.x + dx - W / 2, H / 2 - (this.sampled.center.y + dy));
  }

  /** Por quadro. clock: tempo da introdução (s) ou null; homeVisible: 1 no Início, 0 longe dele. */
  update(dt, { clock, homeVisible, time }) {
    if (this.dustMat && clock != null) { this.dustMat.uniforms.uTime.value = clock; this.dustMat.uniforms.uDpr.value = this.u.px; }
    if (!this.mat) return !!this.dust;
    const u = this.mat.uniforms;
    if (clock != null) u.uTime.value = clock;
    u.uClock.value = time; u.uDpr.value = this.u.px;
    if (this.mode === 'aura') {
      this.T.form += (homeVisible - this.T.form) * (1 - Math.exp(-dt * (homeVisible > this.T.form ? 2.2 : 4)));
      u.uForm.value = this.u.reduced ? homeVisible : this.T.form;
    }
    this._track();
    return u.uForm.value > 0.01 || !!this.dust;
  }

  /** Fim da introdução: o nome vira o brilho do título. */
  toAura(seconds = 1.6, gsap) {
    this.mode = 'aura';
    this._drop('dust');
    if (!this.mat) return;
    const u = this.mat.uniforms;
    u.uGlide.value = 1;
    if (gsap && seconds > 0) {
      gsap.to(u.uAura, { value: 1, duration: seconds, ease: 'power2.inOut' });
      gsap.to(u.uWhite, { value: 0, duration: seconds, ease: 'power2.inOut' });
    } else { u.uAura.value = 1; u.uWhite.value = 0; }
  }

  _drop(which) {
    if (which === 'dust' && this.dust) { this.scene.remove(this.dust); this.dust.geometry.dispose(); this.dustMat.dispose(); this.dust = null; this.dustMat = null; }
    if (which === 'name' && this.name) { this.scene.remove(this.name); this.name.geometry.dispose(); this.mat.dispose(); this.name = null; this.mat = null; }
  }
  dropDust() { this._drop('dust'); }

  render(renderer) {
    if (!this.name && !this.dust) return;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.autoClear = true;
  }

  dispose() { this._drop('dust'); this._drop('name'); clearTimeout(this._rz); }
}

/* ===== 11. DIRETOR DE CÂMERA ===== */

const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

/** DIRETOR DE CÂMERA — o único dono da câmera do universo. */
class CameraDirector {
  constructor(universe) {
    this.u = universe;
    this.cam = universe.camera;
    this.stops = [];
    this.s = 0; this.sSmooth = 0;
    this.state = 'reading';
    this.introOffset = new THREE.Vector3();
    this.path = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), shiftX: 0, shiftY: 0 };
    this.goal = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), shiftX: 0, shiftY: 0 };
    this.shift = { x: 0, y: 0 };
    this.vel = new THREE.Vector3(); this.velView = new THREE.Vector3();
    this._prev = new THREE.Vector3(); this._first = true;
    this._q = new THREE.Quaternion(); this._tmp = new THREE.Vector3();
  }

  /** Posições de rolagem de cada estação: [{ y0, y1 }] (y0 chegada, y1 fim da leitura). */
  setStops(stops) { this.stops = stops; }

  /** Rolagem → posição contínua no caminho. Platô parado durante a leitura; viagem suave entre as seções. */
  sAt(y) {
    const t = this.stops;
    if (!t.length) return 0;
    if (y <= t[0].y1) return 0;
    for (let i = 0; i < t.length - 1; i++) {
      const a = t[i].y1, b = t[i + 1].y0;
      if (y < b) return i + (b - a > 1 ? smooth(clamp((y - a) / (b - a), 0, 1)) : 1);
      if (y <= t[i + 1].y1) return i + 1;
    }
    return t.length - 1;
  }

  update(dt, scrollY) {
    const u = this.u, reduced = u.reduced;
    let s = this.sAt(scrollY);
    if (reduced) s = Math.round(s);             // movimento reduzido: sem viagem contínua, corta para a estação
    this.s = s;

    u.world.poseAt(s, this.path);
    const g = this.goal;
    g.position.copy(this.path.position); g.quaternion.copy(this.path.quaternion); g.shiftX = this.path.shiftX; g.shiftY = this.path.shiftY;

    if (this.introOffset.lengthSq() > 0) g.position.add(this._tmp.copy(this.introOffset).applyQuaternion(g.quaternion)); // introdução: atrás do Início

    // estado (informativo + usado por outros módulos)
    const frac = Math.abs(s - Math.round(s));
    this.state = u.intro?.active ? 'intro' : frac < 1e-3 ? 'reading' : 'travel';
    this.station = Math.round(s);

    // amortecimento: absorve saltos de rolagem
    const cam = this.cam;
    if (this._first || reduced) {
      cam.position.copy(g.position); cam.quaternion.copy(g.quaternion); this.shift.x = g.shiftX; this.shift.y = g.shiftY;
      this._first = false; this._jumped = true;
    } else {
      const k = 1 - Math.exp(-dt * (u.intro?.active ? 30 : 6));
      cam.position.lerp(g.position, k);
      cam.quaternion.slerp(g.quaternion, k);
      this.shift.x += (g.shiftX - this.shift.x) * k; this.shift.y += (g.shiftY - this.shift.y) * k;
    }
    this._applyShift();
    cam.updateMatrixWorld();

    // velocidade real da câmera (vira rastro nas estrelas)
    if (dt > 0 && !this._jumped) {
      this._tmp.copy(cam.position).sub(this._prev).divideScalar(dt);
      this.vel.lerp(this._tmp, 1 - Math.exp(-dt * 10));
    }
    this._jumped = false;
    this._prev.copy(cam.position);
    this.velView.copy(this.vel).applyQuaternion(this._q.copy(cam.quaternion).invert());
  }

  _applyShift() {
    const cam = this.cam, W = window.innerWidth, H = window.innerHeight, { x, y } = this.shift;
    if (Math.abs(x) + Math.abs(y) < 1e-4) { if (cam.view?.enabled) cam.clearViewOffset(); return; }
    cam.setViewOffset(W, H, W * x, H * y, W, H);
  }

  /** Velocidade (unidades/s) — para a nave e os efeitos. */
  get speed() { return this.vel.length(); }
}

/* ===== 12. MUNDO ===== */

const V = (a) => new THREE.Vector3(...a);
const UP = new THREE.Vector3(0, 1, 0);

/** MAPA DO UNIVERSO — uma estação por seção (na ordem de js/principal.js), o caminho de viagem entre elas */
class World {
  constructor() {
    this.bang = V(U.bangOrigin);
    this.ids = sections.map((s) => s.id);
    this.poses = this.ids.map(() => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), shiftX: 0, shiftY: 0 }));
    this.palettes = this.ids.map((id) => Object.assign([...(U.stations[id]?.palette ?? [0x0a3fb0, 0x0a8cff])], { glow: U.stations[id]?.glow ?? 1 }));
    this.layout();
    this._buildClusters();
    // volume das estrelas: envolve todas as estações com folga
    const box = new THREE.Box3();
    this.poses.forEach((p) => box.expandByPoint(p.position));
    box.expandByPoint(this.bang);
    box.min.add(new THREE.Vector3(-900, -650, -1600)); box.max.add(new THREE.Vector3(900, 650, 500));
    this.bounds = box;
    this.exclude = this.poses.map((p) => ({ center: p.position, radius: 25 }));
  }

  /** Calcula a pose (posição + direção do olhar) de cada estação. */
  layout() {
    this.ids.forEach((id, i) => {
      const cfg = U.stations[id] ?? {}, p = this.poses[i];
      p.position.copy(V(cfg.pos ?? [0, 0, -i * 700]));
      const target = p.position.clone().add(V(cfg.look ?? [0, 0, -1]).normalize());
      p.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(p.position, target, UP));
      p.shiftX = 0; p.shiftY = 0;
    });
  }

  station(id) { const i = this.ids.indexOf(id); return i < 0 ? null : this.poses[i]; }
  index(id) { return this.ids.indexOf(id); }

  /** Pose ao longo do caminho (s contínuo: 0 = 1ª estação … n-1 = última). */
  poseAt(s, out) {
    const P = this.poses, n = P.length;
    s = Math.min(Math.max(s, 0), n - 1);
    const i = Math.min(Math.floor(s), n - 2), f = s - i;
    const p0 = P[Math.max(i - 1, 0)].position, p1 = P[i].position, p2 = P[i + 1].position, p3 = P[Math.min(i + 2, n - 1)].position;
    catmull(p0, p1, p2, p3, f, out.position);
    // a rotação acompanha com leve atraso no meio da viagem (olha "para frente")
    const e = f * f * (3 - 2 * f);
    out.quaternion.slerpQuaternions(P[i].quaternion, P[i + 1].quaternion, e);
    out.shiftX = P[i].shiftX + (P[i + 1].shiftX - P[i].shiftX) * e;
    out.shiftY = P[i].shiftY + (P[i + 1].shiftY - P[i].shiftY) * e;
    return out;
  }

  /** Nuvens de nebulosa: um grupo atrás de cada estação */
  _buildClusters() {
    const out = [];
    this.ids.forEach((id, i) => {
      const p = this.poses[i], pal = this.palettes[i];
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(p.quaternion);
      const far = p.position.clone().addScaledVector(fwd, 1100);
      out.push({ center: far.clone().addScaledVector(right, 260), palette: pal, glow: pal.glow, spread: 520, tilt: 0.35 });
      out.push({ center: far.clone().addScaledVector(right, -420).add(new THREE.Vector3(0, 220, -200)), palette: [pal[1], pal[0]], glow: pal.glow * 0.8, spread: 420, tilt: -0.5 });
      if (i < this.ids.length - 1) { // entre esta estação e a próxima, de lado (passa pela janela durante a viagem)
        const mid = p.position.clone().lerp(this.poses[i + 1].position, 0.5);
        const side = (i % 2 ? 1 : -1);
        out.push({ center: mid.addScaledVector(right, side * 520).add(new THREE.Vector3(0, -120 * side, 0)), palette: [pal[0], this.palettes[i + 1][1]], glow: 0.7, spread: 300, tilt: 0.8 * side });
      }
    });
    out.push({ center: this.bang.clone().add(new THREE.Vector3(0, 0, -900)), palette: [0x0a3fb0, 0x2a1880], glow: 0.9, spread: 700, tilt: 0.2 }); // berço do Big Bang
    this.clusters = out;
  }
}

function catmull(p0, p1, p2, p3, t, out) {
  const t2 = t * t, t3 = t2 * t;
  for (const k of ['x', 'y', 'z']) {
    out[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
  }
  return out;
}

/* ===== 13. NAVES ===== */

const NOSE_YAW = { '+z': -Math.PI / 2, '-z': Math.PI / 2, '+x': Math.PI, '-x': 0 }; // yaw que faz o "nariz" apontar para a esquerda

/** Normaliza o GLB para 1 unidade de comprimento máximo, centrado na origem. Não altera malhas nem materiais. */
function normalize(scene) {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  scene.position.sub(center);
  const g = new THREE.Group(); g.add(scene);
  const k = 1 / Math.max(size.x, size.y, size.z, 1e-6);
  g.scale.setScalar(k);
  const outer = new THREE.Group(); outer.add(g);
  return outer;
}

/** Ponto de uma volta de patrulha (elipse ao fundo, no espaço do rig) e o yaw do bico na direção do movimento
 *  (convenção das naves: yaw 0 = bico para -x). */
function patrolPose(u, p, time) {
  const th = time * p.speed + (p.phase ?? 0), dir = Math.sign(p.speed) || 1;
  const halfH = Math.tan(THREE.MathUtils.degToRad(u.camera.fov / 2)) * (u.rigDepth - p.z), halfW = halfH * u.camera.aspect;
  const pos = new THREE.Vector3(p.x * halfW + Math.cos(th) * p.rx * halfW, p.y * halfH + Math.sin(th * 2) * p.ry * halfH, p.z + Math.sin(th) * p.rz);
  const dx = -Math.sin(th) * p.rx * halfW * dir, dz = Math.cos(th) * p.rz * dir;
  return { pos, yaw: Math.atan2(dz, -dx), halfH };
}
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function makeStreak() {
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0.5, 0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uO: { value: 0 }, uColor: { value: new THREE.Color(U.accent) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uO; uniform vec3 uColor; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.x, 1.6) * pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.0) * uO; gl_FragColor = vec4(mix(uColor, vec3(1.0), pow(1.0 - vUv.x, 4.0)) * a * 1.6, a); }',
  });
  return { mesh: new THREE.Mesh(geo, mat), mat };
}

/** NAVE PRINCIPAL — vive no rig da câmera (acompanha as viagens). */
class MainShip {
  constructor(universe) {
    this.u = universe;
    this.cfg = U.mainShip;
    this.holder = new THREE.Group(); this.holder.visible = false;
    this.u.rig.add(this.holder); // acompanha a câmera (o plano z = 0 do rig fica rigDepth à frente dela)
    this.heading = new THREE.Group(); this.heading.rotation.order = 'YXZ';
    this.holder.add(this.heading);
    this.model = null; this.state = 'hidden'; this.bank = 0; this.size = 1;
    this.yaw = this.cfg.viewYaw;
    this.foot = { kw: 0.95, kh: 0.55 };
    this.streak = makeStreak(); this.streak.mesh.position.set(0.42, 0, 0); this.streak.mesh.visible = false;
    this.heading.add(this.streak.mesh); // traseira: o bico aponta para -x no espaço do heading
    this.streakState = { len: 0, o: 0 };
    this.slot = createModelSlot({ title: 'NAVE PRINCIPAL', path: models.mainSpaceship, parent: document.getElementById('inicio') ?? document.body });
    this.ready = null; this.introDone = false; this.arrived = false; this.fastArrive = false;
  }

  get visible() { return this.holder.visible; }

  load() {
    this.slot.setState('loading');
    this.ready = loadGLB(models.mainSpaceship, (p) => this.slot.setProgress(p)).then((gltf) => {
      this.model = normalize(gltf.scene);
      this.model.rotation.y = NOSE_YAW[this.cfg.noseAxis] ?? 0; // bico do modelo → -x (fixo)
      this.heading.add(this.model);
      this.slot.setState('ready');
      this._measureFootprint();
      this.layout();
      if (this.introDone && !this.arrived) this.arrive(this.fastArrive); // modelo chegou depois da introdução
      return true;
    }).catch((err) => {
      console.info('[universe] Nave principal indisponível:', err.message);
      this.slot.setState('missing', () => this.load());
      return false;
    });
    return this.ready;
  }

  /** Mede o tamanho REAL da nave na tela, na pose do Início (largura/altura por unidade de escala). */
  _measureFootprint() {
    const h = this.heading, keep = [h.rotation.x, h.rotation.y, h.rotation.z];
    const sc = this.holder.scale.x || 1;
    h.rotation.set(0, this.cfg.viewYaw, this.cfg.viewPitch);
    this.holder.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.holder.matrixWorld).invert(), m4 = new THREE.Matrix4();
    const box = new THREE.Box3();
    this.model.traverse((m) => {
      if (!m.isMesh) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      box.union(m.geometry.boundingBox.clone().applyMatrix4(m4.multiplyMatrices(inv, m.matrixWorld)));
    });
    h.rotation.set(...keep);
    const s = box.getSize(new THREE.Vector3());
    if (s.x > 0 && s.y > 0) this.foot = { kw: s.x * 1.06, kh: s.y * 1.1 }; // inv já remove a escala do holder
    void sc;
  }

  /** Lugar e tamanho da nave no Início, calculados pelas ZONAS SEGURAS: o maior espaço livre ao redor do conteúdo */
  layout() {
    const { halfH } = this.u.view();
    const W = window.innerWidth, H = window.innerHeight, { kw, kh } = this.foot;
    const rects = this.u.stationRects('inicio');
    const maxS = Math.min((this.cfg.maxHeightFraction * H) / kh, (this.cfg.maxWidthFraction * W) / kw);
    const spot = freeSpot(rects, { w: W, h: H, top: this.u.headerH }, {
      kw, kh, maxS, minS: (this.cfg.minPx * 0.6) / kw,
      prefer: (x, y) => (x > W * 0.5 ? 1.25 : 1) * (1 - Math.min(Math.abs(y / H - 0.45) * 1.3, 0.75)), // direita, perto da altura do meio
    });
    this.homeSpot = spot && spot.s * kw >= this.cfg.minPx ? spot : null;
    const px = this.homeSpot ? this.homeSpot.s : Math.min(W, H) * 0.32 / kw;
    this.size = (px / H) * halfH * 2;
    this.holder.scale.setScalar(this.size);
  }

  /** Posição (no rig) de cada estado. z < 0 = mais longe da câmera. */
  _pose(name) {
    if (name === 'home') {
      if (!this.homeSpot) return this._at(0.6, -0.1, -160); // sem espaço livre (tela muito pequena): fica longe
      return this.u.ndcToWorld((this.homeSpot.x / window.innerWidth) * 2 - 1, -((this.homeSpot.y / window.innerHeight) * 2 - 1));
    }
    if (name === 'cruise') { const c = this.cfg.cruise; return this._at(c.x, c.y, c.z ?? -8); }
    return patrolPose(this.u, this.cfg.patrol, this.u.time ?? 0).pos; // 'away': ponto atual da patrulha
  }

  /** Ponto da tela (ndc) a uma profundidade z do rig. */
  _at(x, y, z) {
    const k = (this.u.rigDepth - z) / this.u.rigDepth, v = this.u.ndcToWorld(x, y);
    return v.set(v.x * k, v.y * k, z);
  }

  /** Yaw de cada estado: Início = 3/4 (bico à esquerda, voltado ao visitante) */
  _yawFor(mode) { return mode === 'home' || mode === 'arriving' ? this.cfg.viewYaw : -Math.PI / 2 + 0.22; }

  _orient(yaw, bank = 0) { this.heading.rotation.set(bank, yaw, this.cfg.viewPitch); }

  arrive(fast = false) {
    this.slot.allow(true);
    if (!this.model) return Promise.resolve();
    this.arrived = true;
    this.layout();
    this.yaw = this.cfg.viewYaw; this._orient(this.yaw);
    // página aberta fora do Início (recarregar/link): a nave já está longe, à frente — não atravessa a tela
    if (window.scrollY > window.innerHeight * 0.55) {
      this.yaw = this._yawFor('away'); this._orient(this.yaw);
      this.holder.position.copy(this._pose('away')); this.holder.visible = false; this.state = 'away';
      return Promise.resolve();
    }
    const target = this._pose('home'), { halfW } = this.u.view();
    this.holder.visible = true; this.state = 'arriving';
    if (fast || this.u.reduced) { this.holder.position.copy(target); this.state = 'home'; return Promise.resolve(); }
    this.holder.position.set(halfW * 1.7, target.y + 0.3, 0);
    this.streakState.len = 9; this.streakState.o = 1;
    const dur = this.cfg.arriveSeconds ?? 2.6;
    return new Promise((resolve) => {
      gsap.timeline({ onComplete: () => { this.state = 'home'; resolve(); } })
        .to(this.holder.position, { x: target.x, y: target.y, duration: dur, ease: 'power4.out' }, 0)
        .to(this.streakState, { len: 0.4, duration: dur * 0.85, ease: 'power3.out' }, 0)
        .to(this.streakState, { o: 0, duration: dur * 0.45, ease: 'power2.in' }, dur * 0.55);
    });
  }

  update(dt, ctx) {
    const sm = this.streak.mat;
    if (!this.model) { this.holder.visible = false; return; }
    this.streak.mesh.scale.set(Math.max(this.streakState.len, 0.001), 0.06, 1);
    sm.uniforms.uO.value = this.streakState.o;
    this.streak.mesh.visible = this.streakState.o > 0.02;
    if (this.state === 'arriving' || (this.state === 'hidden' && !this.arrived)) return;

    const H = window.innerHeight;
    const fast = !this.u.reduced && (Math.abs(ctx.scrollVel) > 700 || ctx.traveling);
    const homeVisible = ctx.scrollY < H * 0.55;
    const mode = homeVisible && !fast ? 'home' : fast ? 'cruise' : 'away';
    const patrol = mode === 'away' ? patrolPose(this.u, this.cfg.patrol, ctx.time) : null;
    const target = patrol ? patrol.pos : this._pose(mode);
    const { halfH, halfW } = this.u.view();

    // vinha de longe e a viagem começou: entra pela lateral direita, já na profundidade do voo
    // (nunca por trás da câmera, para não passar gigante na frente da tela)
    if (mode === 'cruise' && this.state === 'away' && !this.holder.visible) {
      const c = this.cfg.cruise;
      this.holder.position.copy(this._at(1.5, c.y, c.z ?? -8));
      this.yaw = this._yawFor('cruise');
    }
    if (mode === 'home') {
      target.y += Math.sin(ctx.time * 1.2) * this.cfg.floatAmplitude * halfH * 2;
      target.x += ctx.mouse.x * this.cfg.mouseInfluence * halfW;
      target.y += ctx.mouse.y * this.cfg.mouseInfluence * halfH;
    }
    if (this.u.reduced) this.holder.position.copy(target);
    else this.holder.position.lerp(target, 1 - Math.exp(-dt * (mode === 'away' ? 1.1 : mode === 'cruise' ? 1.6 : 2.6)));
    this.state = mode;

    // bico na direção do movimento; inclinação lateral suave e limitada
    const wantYaw = patrol ? patrol.yaw : this._yawFor(mode) + (mode === 'home' ? ctx.mouse.x * 0.1 : 0);
    const dYaw = wrapAngle(wantYaw - this.yaw);
    this.yaw += dYaw * (1 - Math.exp(-dt * (mode === 'home' ? 3 : patrol ? 2 : 6)));
    // inclina para dentro da curva na patrulha
    const wantBank = mode === 'cruise' ? clamp(ctx.scrollVel / 3000, -1, 1) * 0.22 : patrol ? -0.25 * Math.sign(this.cfg.patrol.speed) : 0;
    this.bank += (wantBank - this.bank) * (1 - Math.exp(-dt * 4));
    this._orient(this.yaw, this.bank);

    // rastro do motor durante as viagens
    const wantLen = mode === 'cruise' ? clamp(Math.abs(ctx.scrollVel) / 1800, 0.3, 1.6) : 0;
    this.streakState.len += (wantLen - this.streakState.len) * (1 - Math.exp(-dt * 6));
    this.streakState.o += ((wantLen > 0 ? 0.7 : 0) - this.streakState.o) * (1 - Math.exp(-dt * 6));

    // atrás da câmera ou longe demais: some (e não gasta nada)
    const z = this.holder.position.z;
    this.holder.visible = z < this.u.rigDepth - 0.5 && z > -150;
  }
}

/** Nave secundária: dá voltas lentas e contínuas ao fundo. */
class SecondaryShip {
  constructor(universe) {
    this.u = universe; this.cfg = U.secondaryShip;
    this.holder = new THREE.Group(); this.holder.visible = false;
    this.u.rig.add(this.holder); // acompanha a câmera (o plano z = 0 do rig fica 10 unidades à frente dela)
    this.model = null; this.timer = null; this.running = false; this.tween = null;
  }

  get visible() { return this.holder.visible; }

  async begin() {
    if (!this.cfg.enabled || this.u.reduced || this.model) return;
    try {
      const gltf = await loadGLB(models.secondarySpaceship);
      this.model = normalize(gltf.scene); this.holder.add(this.model);
    } catch (err) { console.info('[universe] Nave secundária indisponível:', err.message); return; }
    this.running = true;
  }

  /** Volta contínua e lenta ao fundo, com o bico na direção do movimento. */
  update(dt, time) {
    if (!this.running || this.u.intro?.active) { this.holder.visible = false; return; }
    const p = patrolPose(this.u, this.cfg.patrol, time);
    this.holder.scale.setScalar(this.cfg.heightFraction * p.halfH * 2);
    this.holder.position.copy(p.pos);
    this.model.rotation.set(0.1, (NOSE_YAW[this.cfg.noseAxis] ?? 0) + p.yaw, 0.2 * Math.sign(this.cfg.patrol.speed));
    this.holder.visible = true;
  }

  dispose() { this.running = false; }
}

/* ===== 14. MODELOS PRESOS ÀS SEÇÕES (ELFO) ===== */

/** MODELO ANCORADO — um GLB do universo que aparece "dentro" de um espaço reservado no HTML (por exemplo, o elfo */
class AnchoredModel {
  constructor(universe, opts) {
    this.u = universe; this.o = { height: 0.92, yaw: 0, ...opts };
    this.holder = new THREE.Group(); this.holder.visible = false;
    this.u.rig.add(this.holder);
    this.model = null; this.mixer = null; this.shown = 0; this.loading = false;
    this.slot = opts.optional ? null : createModelSlot({ title: opts.title, path: opts.url, parent: opts.anchor });
    this.slot?.allow(true);
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(([e]) => { if (e.isIntersecting) this.load(); }, { rootMargin: '900px 0px' });
      this.io.observe(opts.anchor);
    } else this.load();
  }

  async load() {
    if (this.loading || this.model) return;
    this.loading = true; this.io?.disconnect();
    if (this.o.optional && !(await probe(this.o.url))) { this.loading = false; return; } // opcional e ausente: nada aparece
    this.slot?.setState('loading');
    try {
      const gltf = await loadGLB(this.o.url, (p) => this.slot?.setProgress(p));
      const scene = gltf.scene;
      // normaliza: altura 1, pés na base, centrado (não altera malhas nem materiais)
      const box = new THREE.Box3().setFromObject(scene), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      scene.position.set(-c.x, -box.min.y, -c.z);
      const inner = new THREE.Group(); inner.add(scene); inner.scale.setScalar(1 / Math.max(size.y, size.x, 1e-6));
      inner.position.y = -0.5; inner.rotation.y = this.o.yaw;
      this.model = inner; this.holder.add(inner);
      this.mats = [];
      scene.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; for (const mat of [].concat(m.material)) this.mats.push(mat); } });
      // brilho próprio do modelo (as luzes do rig são as mesmas das naves; < 1 escurece só este modelo)
      const k = this.o.brightness ?? 1;
      if (k !== 1) for (const mat of new Set(this.mats)) {
        mat.color?.multiplyScalar(k);
        if (mat.emissive) mat.emissiveIntensity = (mat.emissiveIntensity ?? 1) * k;
        mat.envMapIntensity = (mat.envMapIntensity ?? 1) * k;
      }
      if (this.o.animation && gltf.animations?.length) {
        const clip = THREE.AnimationClip.findByName(gltf.animations, this.o.animation);
        if (clip) { this.mixer = new THREE.AnimationMixer(scene); this.mixer.clipAction(clip).play(); }
        else console.warn(`[universe] Animação "${this.o.animation}" não encontrada em ${this.o.url}.`);
      }
      this.slot?.setState('ready');
    } catch (err) {
      console.info('[universe] Modelo indisponível:', err.message);
      this.slot?.setState('missing', () => { this.loading = false; this.load(); });
    }
    this.loading = false;
  }

  /** Materialização holográfica (opacidade + escala) na primeira vez que aparece. */
  _materialize() {
    if (this._mat) return; this._mat = true;
    if (this.u.reduced) { this.shown = 1; return; }
    this.mats.forEach((m) => { m.transparent = true; m.opacity = 0; m.needsUpdate = true; });
    const o = { k: 0 };
    gsap.to(o, { k: 1, duration: 1.4, ease: 'power2.out', onUpdate: () => { this.mats.forEach((m) => { m.opacity = o.k; }); this.shown = o.k; },
      onComplete: () => this.mats.forEach((m) => { m.transparent = false; m.opacity = 1; m.needsUpdate = true; }) });
  }

  update(dt) {
    if (!this.model) return false;
    const r = this.o.anchor.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    const vis = r.bottom > 0 && r.top < H && r.width > 0;
    this.holder.visible = vis;
    if (!vis) return false;
    this._materialize();
    const { halfH } = this.u.view();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    this.holder.position.copy(this.u.ndcToWorld((cx / W) * 2 - 1, -((cy / H) * 2 - 1)));
    // altura do modelo: fração da âncora, limitada pela largura dela e por um teto em px (o elfo fica discreto)
    const px = Math.min(r.height * this.o.height, r.width * (this.o.widthRatio ?? Infinity), this.o.maxPx ?? Infinity);
    const s = (px / H) * halfH * 2;
    this.holder.scale.setScalar(s * (this.u.reduced ? 1 : 0.92 + 0.08 * this.shown));
    this.mixer?.update(this.u.reduced ? 0 : dt);
    return true;
  }

  dispose() { this.io?.disconnect(); this.mixer?.stopAllAction(); this.holder.removeFromParent(); this.slot?.dispose(); }
}

/* ===== 15. VIAGENS ===== */

gsap.registerPlugin(ScrollToPlugin);

/** Navegação cinematográfica: clicar numa âncora (#secao) faz uma viagem curta DIRETO até o destino */
function initTravel({ seconds = 1.5, reduced = false, onChange } = {}) {
  let traveling = false;
  const root = document.documentElement;

  const toast = document.createElement('div');
  toast.className = 'sector-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);
  let toastTimer = 0;
  const showSector = (id) => {
    const i = sections.findIndex((s) => s.id === id);
    if (i < 0) return;
    toast.innerHTML = '';
    const a = document.createElement('span'); a.className = 'sector-toast__k'; a.textContent = `SETOR ${String(i + 1).padStart(2, '0')}`;
    const b = document.createElement('span'); b.className = 'sector-toast__v'; b.textContent = sections[i].label;
    toast.append(a, b);
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1700);
  };

  const set = (v) => { traveling = v; document.body.classList.toggle('is-traveling', v); onChange?.(v); bus.emit('travel', v); };
  const stop = () => {
    if (!traveling) return;
    gsap.killTweensOf(window);
    root.style.scrollBehavior = '';
    set(false);
  };
  ['wheel', 'touchstart', 'keydown'].forEach((t) => window.addEventListener(t, stop, { passive: true }));

  const go = (id) => {
    const target = document.getElementById(id);
    if (!target) return false;
    const header = document.getElementById('site-header');
    const offset = id === 'inicio' ? 0 : (header?.offsetHeight ?? 72);
    const y = id === 'inicio' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    const dist = Math.abs(y - window.scrollY);
    const arrive = () => {
      root.style.scrollBehavior = '';
      set(false);
      target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
      try { urlState.setSection(id); } catch { /* ignora */ }
      bus.emit('arrived', id);
      if (!reduced) showSector(id);
    };

    if (reduced || dist < 4) { root.style.scrollBehavior = 'auto'; window.scrollTo(0, y); root.style.scrollBehavior = ''; arrive(); return true; }

    gsap.killTweensOf(window);
    root.style.scrollBehavior = 'auto'; // o "scroll-smooth" do CSS brigaria com a animação
    set(true);
    gsap.to(window, {
      scrollTo: { y, autoKill: true },
      duration: Math.min(seconds, Math.max(0.9, dist / 2600)),
      ease: 'power3.inOut',
      onComplete: arrive,
      onInterrupt: () => { root.style.scrollBehavior = ''; set(false); },
    });
    return true;
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    go(id);
  });

  return { get active() { return traveling; }, go };
}

/* ===== 16. O UNIVERSO ===== */

/** Níveis de qualidade (o automático começa em "high" no desktop e "medium" no celular e desce se ficar lento). */
const QUALITY = {
  // px = resolução máxima (× pixels da tela); bloom = escala da resolução do brilho (0 = desligado)
  high: { px: 1.25, bloom: 1, stars: U.stars.high, clouds: 26, bgScale: 0.5, skySize: 2048 },
  medium: { px: 1, bloom: 0.7, stars: U.stars.medium, clouds: 18, bgScale: 0.4, skySize: 2048 },
  low: { px: 1, bloom: 0, stars: U.stars.low, clouds: 10, bgScale: 0.33, skySize: 1024 },
};
const LEVELS = ['high', 'medium', 'low'];

/** UNIVERSO COMPARTILHADO — UM renderizador, UMA câmera, UM laço de animação para o site inteiro. */
class Universe {
  constructor() {
    this.root = document.documentElement;
    this.reduced = prefs.reducedMotion;
    this.mouse = { x: 0, y: 0 }; this.time = 0; this.scrollY = window.scrollY; this.scrollVel = 0;
    this.rigDepth = 10;
    this.headerH = 72;
    this._frames = 0; this._acc = 0; this._dirty = true; this._lastMeasure = -10;
    this._pending = 0; this._lastScrollAt = 0; this._warmup = 60; // quadros ignorados pela qualidade automática (carregamento)
    const coarse = matchMedia('(pointer: coarse)').matches || window.innerWidth < 720;
    const pref = prefs.get('quality');
    this.autoQuality = !pref || pref === 'auto';
    this.level = this.autoQuality ? (coarse ? 'low' : (navigator.hardwareConcurrency || 8) <= 4 ? 'medium' : 'high') : pref;
    this.q = QUALITY[this.level] ?? QUALITY.medium;
    this.px = Math.min(window.devicePixelRatio || 1, this.q.px);

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'universe-canvas'; this.canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(this.canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.setPixelRatio(this.px);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.camera = new THREE.PerspectiveCamera(U.fov ?? 38, window.innerWidth / window.innerHeight, 0.1, 9000);

    // ---- cena principal ----
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; this.scene.environmentIntensity = 0.55; pm.dispose();
    this.scene.add(new THREE.AmbientLight(0x6f8fff, 0.3));
    this.rig = new THREE.Group(); this.rig.name = 'CameraRig'; this.scene.add(this.rig);
    const key = new THREE.DirectionalLight(0xdfeeff, 1.9); key.position.set(3, 4, 5); key.target.position.set(0, 0, 0);
    const rim = new THREE.PointLight(U.accent, 45, 0, 2); rim.position.set(-4, 1, 3);
    this.rig.add(key, key.target, rim);

    // ---- mundo, céu, estrelas ----
    this.world = new World();
    this.cosmos = new Cosmos(this.renderer, this.world, this.q);
    this.scene.add(this.cosmos.group);
    this.planets = new BackdropPlanets(this); this.scene.add(this.planets.group);
    this.director = new CameraDirector(this);
    this.main = new MainShip(this);
    this.secondary = new SecondaryShip(this);
    this.title = new TitleParticles(this, prepareTitle(document.querySelector('[data-hero-title]')));
    this.intro = null;
    this.travel = initTravel({ seconds: U.travel.menuSeconds, reduced: this.reduced });

    this.anchored = [];
    // o elfo (Sobre mim) tem cena própria: js/elfo.js

    this._buildComposer();
    this.reduceFx = !!prefs.get('reduceEffects');
    this._applyFx();
    this.sectionEls = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    this._resize();
    this._bind();
    gsap.ticker.add(this._tick);
  }

  _buildComposer() {
    const w = window.innerWidth, h = window.innerHeight;
    this.composer?.dispose();
    const rt = new THREE.WebGLRenderTarget(w * this.px, h * this.px, { type: THREE.HalfFloatType });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.85, 0.55, 0.85); // força, raio, limiar (só o muito brilhante brilha)
    this.bloom.enabled = this.q.bloom > 0;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass()); // sem SMAA: o bloom já suaviza, e são 3 passes a menos por quadro
  }

  /** "Reduzir efeitos" (central de acessibilidade): sem bloom, planetas decorativos, rastros e brilho do título. */
  _applyFx() {
    if (this.bloom) this.bloom.enabled = this.q.bloom > 0 && !this.reduceFx;
    if (this.planets) this.planets.group.visible = !this.reduceFx;
    this._dirty = true;
  }

  /** Metade da altura/largura visível no plano z = 0 do rig (10 unidades à frente da câmera). */
  view() {
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.rigDepth;
    return { halfH, halfW: halfH * this.camera.aspect };
  }

  /** Coordenadas de tela (-1…1) → plano z = 0 do rig. */
  ndcToWorld(x, y) { const { halfW, halfH } = this.view(); return new THREE.Vector3(x * halfW, y * halfH, 0); }

  _bind() {
    this._onResize = () => { clearTimeout(this._rzT); this._rzT = setTimeout(() => this._resize(), 60); };
    this._onMove = (e) => { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1); };
    this._onVis = () => { this._paused = document.hidden; };
    this._onCtxLost = (e) => { e.preventDefault(); this._fail(new Error('Contexto WebGL perdido')); };
    window.addEventListener('resize', this._onResize);
    window.addEventListener('pointermove', this._onMove, { passive: true });
    this._onScroll = () => { this._lastScrollAt = performance.now(); };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    document.addEventListener('visibilitychange', this._onVis);
    this.canvas.addEventListener('webglcontextlost', this._onCtxLost);
    document.fonts?.ready.then(() => this._measure());
    this._prefOff = prefs.subscribe((k, v) => {
      if (k === 'motion') { this.reduced = prefs.reducedMotion; this._dirty = true; }
      if (k === 'quality') { this.autoQuality = v === 'auto'; this._setLevel(v === 'auto' ? 'high' : v); }
      if (k === 'reduceEffects') { this.reduceFx = !!v; this._applyFx(); }
      if (k === 'textScale' || k === 'contrast') requestAnimationFrame(() => { this._measure(); if (!this.intro?.active) this.title.build(this.title.mode === 'aura'); });
    });
  }

  /** Mede seções e conteúdo: estações da rolagem e zonas seguras. */
  _measure() {
    const H = window.innerHeight, W = window.innerWidth;
    this.headerH = document.getElementById('site-header')?.offsetHeight ?? 72;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - H);
    const stops = [];
    this._rects = new Map(); this._docRects = [];
    this.sectionEls.forEach((el, i) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y0 = i === 0 ? 0 : clamp(top - this.headerH, 0, maxScroll);
      const y1 = clamp(Math.max(y0, y0 + el.offsetHeight - (H - this.headerH)), y0, maxScroll);
      stops.push({ y0, y1 });
      const rel = contentRects(el);
      const atStation = top - y0; // onde fica o topo da seção na tela quando a câmera está na estação
      this._rects.set(el.id, rel.map((r) => ({ x0: r.x0, x1: r.x1, y0: r.y0 + atStation, y1: r.y1 + atStation })));
      rel.forEach((r) => this._docRects.push({ x0: r.x0, x1: r.x1, y0: r.y0 + top, y1: r.y1 + top }));
    });
    for (let i = 1; i < stops.length; i++) { stops[i].y0 = Math.max(stops[i].y0, stops[i - 1].y1); stops[i].y1 = Math.max(stops[i].y1, stops[i].y0); }
    this.director.setStops(stops);

    this.main?.layout();   // a nave primeiro: os corpos celestes tratam o espaço dela como ocupado
    this.planets.layout();
    this._lastMeasure = this.time;
    this._dirty = true;
  }

  /** Zonas seguras de uma estação (px de tela, com a câmera parada nela). */
  stationRects(id) { return this._rects?.get(id) ?? []; }

  /** Blocos de texto visíveis agora (px de tela). */
  _screenRects() {
    const y = window.scrollY, H = window.innerHeight, out = this._screen ??= [];
    out.length = 0;
    for (const r of this._docRects ?? []) { const y0 = r.y0 - y, y1 = r.y1 - y; if (y1 > 0 && y0 < H) out.push({ x0: r.x0, x1: r.x1, y0, y1 }); }
    return out;
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setPixelRatio(this.px);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(this.px); this.composer.setSize(w, h);
    this.bloom.setSize(Math.max(1, Math.floor(w * this.px * (this.q.bloom || 0.5))), Math.max(1, Math.floor(h * this.px * (this.q.bloom || 0.5))));
    this.cosmos.resize(w, h, this.px);
    this.title.resize();
    this._measure();
  }

  _setLevel(name) {
    const q = QUALITY[name]; if (!q) return;
    this.level = name; this.q = q;
    this.px = Math.min(window.devicePixelRatio || 1, q.px);
    this.cosmos.setStarCount(q.stars); this.cosmos.setCloudCount(q.clouds); this.cosmos.setBackgroundScale(q.bgScale);
    this._applyFx();
    this._resize();
  }

  _tick = (time, deltaMs) => {
    if (this._paused || this._dead) return;
    this._govern(deltaMs / 1000);
    // 60 fps só quando há movimento (introdução, viagem, rolagem recente); parado, 30 fps bastam e a GPU descansa
    this._pending += deltaMs;
    const busy = this.intro?.active || this.travel?.active || this.main?.state === 'arriving' || performance.now() - this._lastScrollAt < 1200;
    const minMs = busy && this.level !== 'low' ? 0 : 1000 / 30 - 3;
    if (this._pending < minMs) return;
    const ms = this._pending; this._pending = 0;
    try { this._step(ms); } catch (err) { this._fail(err); }
  };

  /** Se algo der errado no 3D, o site continua funcionando sem ele. */
  _fail(err) {
    console.error('[universe] Erro no universo 3D; desativado para preservar o site.', err);
    this._dead = true;
    gsap.ticker.remove(this._tick);
    this.root.classList.remove('is-intro');
    this.root.classList.add('no-3d');
    this.canvas.remove();
    this.main.slot.allow(false);
    document.querySelector('.universe-skip')?.remove();
    if (this.intro && !this.intro.done) { try { this.intro._finish(); } catch { /* ignora */ } }
    window.dispatchEvent(new CustomEvent('universe:failed'));
  }

  _step(deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.1);
    this.time += dt;
    if (this.time - this._lastMeasure > 2) this._measure();
    const y = window.scrollY, H = window.innerHeight;
    const vel = (y - this.scrollY) / Math.max(dt, 1e-3);
    this.scrollVel += (vel - this.scrollVel) * (1 - Math.exp(-dt * 8));
    const scrolled = y !== this.scrollY;
    this.scrollY = y;

    const d = this.director;
    d.update(dt, y);

    // rig da câmera: o plano z = 0 dele fica rigDepth à frente da câmera
    this.rig.quaternion.copy(this.camera.quaternion);
    this.rig.position.set(0, 0, -this.rigDepth).applyQuaternion(this.camera.quaternion).add(this.camera.position);
    this.rig.updateMatrixWorld();

    this.cosmos.update({ time: this.time, region: d.s, velView: d.velView, trail: this.reduceFx ? 0 : U.starTrail, calm: this.reduced, camera: this.camera });
    const planetsVisible = this.planets.update(dt, this.time, this._screenRects());

    const ctx = { scrollY: y, scrollVel: this.scrollVel, traveling: this.travel.active || (d.state === 'travel' && d.speed > 40), mouse: this.mouse, time: this.time };
    this.main.update(dt, ctx);
    this.secondary.update(dt, this.time);
    let anchoredVisible = false;
    for (const a of this.anchored) anchoredVisible = a.update(dt) || anchoredVisible;
    const homeVisible = 1 - THREE.MathUtils.smoothstep(y, H * 0.12, H * 0.62);
    this.intro?.active && this.intro.update();
    const titleVisible = this.title.update(dt, { clock: this.intro ? this.intro.clock : null, homeVisible, time: this.time });

    // movimento reduzido: só redesenha quando algo muda
    const animating = !this.reduced || this.intro?.active || this.main.state === 'arriving' || this.secondary.visible;
    if (!animating && !scrolled && !this._dirty) return;
    this._dirty = false;

    this.cosmos.renderBackground(this.renderer, this.camera);
    this.composer.render();
    if (titleVisible && (!this.reduceFx || this.intro?.active)) this.title.render(this.renderer);
  }

  /** Qualidade automática: se os quadros ficarem lentos, desce um nível (resolução, bloom, estrelas, nebulosas).
   *  Mede o intervalo real entre quadros do navegador (não o limite de 30 fps acima). */
  _govern(dt) {
    if (!this.autoQuality) return;
    if (this._warmup > 0) { this._warmup--; return; }
    this._acc += dt; this._frames++;
    if (this._frames < 40) return;
    const avg = this._acc / this._frames; this._frames = 0; this._acc = 0;
    if (avg <= 0.024) return;
    this._warmup = 20; // a troca em si custa um quadro: não conta
    if (this.px > 1 && avg < 0.04) { this.px = Math.max(1, this.px - 0.25); this._resize(); return; }
    const i = LEVELS.indexOf(this.level);
    if (i < LEVELS.length - 1) this._setLevel(LEVELS[i + 1]);
  }

  async start() {
    const wantIntro = U.intro.enabled && this.root.classList.contains('is-intro') && !this.reduced;
    this.main.load();

    if (!wantIntro) {
      // sem introdução (link de projeto, recarregar numa seção, movimento reduzido): vai DIRETO para a seção certa
      this.root.classList.remove('is-intro');
      const target = urlState.initialSection();
      this.jumpTo(target);
      this.main.introDone = true; this.main.fastArrive = true;
      this.main.slot.allow(true);
      this.secondary.begin();
      try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]); } catch { /* ignora */ }
      // as fontes podem mudar a altura das seções: corrige a posição se o visitante ainda não rolou
      const y = window.scrollY;
      this._measure();
      if (target && Math.abs(window.scrollY - this._jumpY) < 4 && y === window.scrollY) this.jumpTo(target);
      this.title.build(true);
      bus.emit('ready');
      return;
    }

    window.scrollTo(0, 0);
    this._measure();
    this.intro = new BigBangIntro(this);
    const skip = document.createElement('button');
    skip.type = 'button'; skip.className = 'universe-skip'; skip.textContent = 'PULAR INTRODUÇÃO ›';
    document.body.append(skip);
    gsap.fromTo(skip, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1.2 });

    const onPage = () => {
      skip.remove();
      this.root.classList.remove('is-intro');
      this.main.introDone = true;
      this.main.slot.allow(true);
      if (!this.main.arrived && this.main.model) this.main.arrive(true);
      this.secondary.begin();
      const id = location.hash.slice(1);
      if (id && id !== 'inicio' && document.getElementById(id)) requestAnimationFrame(() => document.getElementById(id).scrollIntoView({ behavior: 'auto' }));
    };
    const doSkip = () => { if (!this.main.arrived) this.main.arrive(true); this.intro.skip(); };
    skip.addEventListener('click', doSkip);
    this._onKey = (e) => { if (e.key === 'Escape' && this.intro?.active) doSkip(); };
    window.addEventListener('keydown', this._onKey);

    await this.intro.run({ onShipArrive: () => this.main.arrive(false), onPage, onFinish: () => { window.removeEventListener('keydown', this._onKey); bus.emit('ready'); } });
  }

  /** Coloca a página e a câmera direto numa seção (sem animação). */
  jumpTo(id) {
    this._measure();
    const i = id ? this.sectionEls.findIndex((el) => el.id === id) : -1;
    const y = i > 0 ? this.director.stops[i]?.y0 ?? 0 : 0;
    const root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto'; window.scrollTo(0, y); root.style.scrollBehavior = prev;
    this._jumpY = window.scrollY; this.scrollY = window.scrollY; this.scrollVel = 0;
    this.director._first = true; // a câmera aparece já na estação (sem viajar desde o Início)
  }

  dispose() {
    gsap.ticker.remove(this._tick);
    window.removeEventListener('resize', this._onResize); window.removeEventListener('pointermove', this._onMove); window.removeEventListener('scroll', this._onScroll);
    document.removeEventListener('visibilitychange', this._onVis);
    this.canvas.removeEventListener('webglcontextlost', this._onCtxLost);
    this._prefOff?.();
    this.anchored.forEach((a) => a.dispose());
    this.secondary.dispose(); this.cosmos.dispose(); this.planets.dispose(); this.title.dispose();
    this.composer.dispose(); this.renderer.dispose(); this.canvas.remove();
  }
}

/** Cria o universo (síncrono) — a introdução roda depois, com start(). */
function createUniverse() {
  const u = new Universe();
  return u;
}

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { createUniverse };
