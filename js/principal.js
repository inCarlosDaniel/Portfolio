
import gsap from 'gsap';

const site = {
  /** Nome formado pelas partículas na introdução. Use MAIÚSCULAS. */
  introName: 'CARLOS DANIEL',
  /** Iniciais mostradas no primeiro instante da formação do nome. */
  introInitials: 'CD',
  github: 'https://github.com/inCarlosDaniel',
};

const sections = [
  { id: 'inicio', label: 'INÍCIO', icon: 'home' },
  { id: 'projetos', label: 'PROJETOS', icon: 'public' },
  { id: 'sobre', label: 'SOBRE MIM', icon: 'badge' },
  { id: 'curriculo', label: 'CURRÍCULO', icon: 'workspace_premium' },
  { id: 'contato', label: 'CONTATO', icon: 'cell_tower' },
];

/* ===== 1c. CAMINHOS DOS MODELOS 3D ===== */

const at = (file) => `models/${file}`; // caminho relativo: funciona no Live Server e no GitHub Pages

const models = {
  mainSpaceship: at('Main_Spaceship.glb'),
  secondarySpaceship: at('Secondary_Spaceship.glb'),
  elfCharacter: at('Elf_Character.glb'),
  magicStaff: at('Magic_Staff.glb'),
  solarSystem: at('Solar_System.glb'),
};

/** Nome da animação do elfo (precisa existir dentro do GLB). */
const elfAnimation = 'Wave_One_Hand';

/* ===== 2a. MENSAGEIRO — avisa as outras partes do site quando algo acontece ===== */

const t = new EventTarget();
const bus = {
  on(name, fn) { const h = (e) => fn(e.detail); t.addEventListener(name, h); return () => t.removeEventListener(name, h); },
  emit(name, detail) { t.dispatchEvent(new CustomEvent(name, { detail })); },
};

/* ===== 2b. PREFERÊNCIAS SALVAS — idioma, acessibilidade, qualidade gráfica ===== */

/** Preferências do visitante (idioma, acessibilidade, qualidade gráfica, áudio). */
const KEY = 'cd-portfolio-prefs-v1';

const defaults = {
  lang: null,            // null = detectar pelo navegador no primeiro acesso
  motion: 'system',      // 'system' | 'reduce'
  contrast: 'normal',    // 'normal' | 'high'
  textScale: 100,        // 90–150 (%)
  reduceEffects: false,
  strongFocus: false,
  bigTargets: false,
  altProjectList: false, // lista visual alternativa dos projetos (desligada por padrão)
  quality: 'auto',       // 'auto' | 'low' | 'medium' | 'high'
  audio: false,          // áudio começa DESLIGADO
  volume: 60,            // 0–100
};

let state = { ...defaults };
try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* sem armazenamento */ }
const subs = new Set();

const prefs = {
  get: (k) => state[k],
  all: () => ({ ...state }),
  set(k, v) {
    if (state[k] === v) return;
    state[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignora */ }
    subs.forEach((fn) => fn(k, v));
  },
  reset() { Object.keys(defaults).forEach((k) => prefs.set(k, defaults[k])); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  /** Movimento reduzido: preferência do sistema OU escolha do visitante. */
  get reducedMotion() { return state.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches; },
};

/* ===== 2c. ENDEREÇO DA PÁGINA — seção atual (#sobre) e projeto aberto (?projeto=...) ===== */

const ids = new Set(sections.map((s) => s.id));
const here = () => location.pathname + location.search + location.hash;
const build = (projeto, section) => {
  const q = projeto ? `?projeto=${encodeURIComponent(projeto)}` : '';
  return location.pathname + q + (section && section !== sections[0].id ? `#${section}` : '');
};

const urlState = {
  /** Projeto pedido no endereço (ou null). */
  project() { return new URLSearchParams(location.search).get('projeto'); },

  /** Seção do endereço, se for válida (ou null). */
  section() { const h = decodeURIComponent(location.hash.slice(1)); return ids.has(h) ? h : null; },

  /** Seção onde a página deve abrir: link de projeto → Projetos; senão, o #hash. */
  initialSection() { return this.project() ? 'projetos' : this.section(); },

  /** A rolagem chegou a outra seção. O projeto só continua no endereço enquanto estamos em Projetos. */
  setSection(id) {
    if (!ids.has(id)) return;
    const url = build(id === 'projetos' ? this.project() : null, id);
    if (url !== here()) history.replaceState(history.state, '', url);
  },

  /** Projeto aberto (id) ou fechado (null). push = ação do visitante (entra no histórico). */
  setProject(id, push = false) {
    const url = build(id, 'projetos');
    if (url === here()) return;
    history[push ? 'pushState' : 'replaceState']({ projeto: id ?? null }, '', url);
  },

  /** Remove o projeto do endereço sem mudar a seção (ex.: o visitante rolou para fora de Projetos). */
  clearProject() {
    if (!this.project()) return;
    history.replaceState(history.state, '', build(null, this.section()));
  },
};

/* ===== 3. FORMULÁRIO DE CONTATO ===== */

// Formulário de contato (comportamento original preservado: simulação de envio).
function simulateTransmission() {
  const btn = document.getElementById('submit-btn');
  const text = document.getElementById('btn-text');
  const feedback = document.getElementById('form-feedback');

  text.innerText = "ENCRIPTANDO & TRANSMITINDO...";
  btn.classList.add('opacity-75', 'cursor-wait');

  setTimeout(() => {
    feedback.classList.remove('hidden');
    text.innerText = "TRANSMISSÃO CONCLUÍDA";
    btn.classList.remove('cursor-wait');

    setTimeout(() => {
      document.getElementById('contact-form').reset();
      text.innerText = "ENVIAR TRANSMISSÃO ESTELAR";
      btn.classList.remove('opacity-75');
      feedback.classList.add('hidden');
    }, 5000);
  }, 1200);
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => { e.preventDefault(); simulateTransmission(); });
}

/* ===== 4. REVELAÇÃO DOS PAINÉIS ===== */

/** Painéis se materializam ao chegar na seção: fade suave + pequeno deslocamento, com atraso escalonado. */

const root = document.documentElement;
const SECTIONS = '#inicio, #projetos, #sobre, #curriculo, #contato';

/** Itens de uma seção, em grupos (cada grupo escalona o atraso). Grades viram os seus cartões. */
function groups(section) {
  const out = [];
  for (const child of section.children) {
    if (child.classList.contains('model-slot')) continue;
    if (child.hasAttribute('data-no-reveal')) continue; // o título do Início nasce das partículas do Big Bang
    if (child.matches('.grid')) out.push([...child.children]);
    else if ([...child.children].some((c) => c.matches('.grid'))) {
      out.push(...[...child.children].map((c) => (c.matches('.grid') ? [...c.children] : [c])));
    } else out.push([child]);
  }
  return out;
}

function initReveal() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const pending = new Set();
  let waiting = root.classList.contains('is-intro');

  const show = (el) => {
    el.classList.add('is-in');
    const wait = parseFloat(el.style.getPropertyValue('--d')) || 0;
    setTimeout(() => { el.classList.remove('reveal', 'is-in'); el.style.removeProperty('--d'); }, 900 + wait);
  };
  const traveling = () => document.body.classList.contains('is-traveling');
  const flush = () => {
    if (waiting || traveling()) return;
    for (const el of pending) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.95 && r.bottom > 0) { pending.delete(el); show(el); }
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      pending.add(e.target);
    }
    flush();
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll(SECTIONS).forEach((sec) => {
    groups(sec).forEach((items) => items.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--d', `${Math.min(i * 70, 560)}ms`);
      io.observe(el);
    }));
  });

  // espera a introdução terminar / a viagem chegar
  new MutationObserver(() => { const w = root.classList.contains('is-intro'); if (waiting && !w) { waiting = false; setTimeout(flush, 250); } })
    .observe(root, { attributes: true, attributeFilter: ['class'] });
  bus.on('travel', (v) => { if (!v) setTimeout(flush, 120); });
  window.addEventListener('scroll', () => { if (pending.size) flush(); }, { passive: true });
}

/* ===== 5. NAVEGAÇÃO ===== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** NAVEGAÇÃO: destaca a seção atual (menu, trilho lateral, celular), barra de progresso, recolhe o menu ao rolar */
function initNavigation() {
  const header = $('#site-header'), nav = $('#main-nav'), glider = $('.nav-glider', nav);
  const menuBtn = $('#menu-btn'), menu = $('#mobile-menu');
  const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
  let current = -1, lastY = window.scrollY, ticking = false;
  // o endereço só acompanha a rolagem depois que a página foi posicionada na seção pedida
  let urlLive = false;
  bus.on('ready', () => { urlLive = true; if (current >= 0) urlState.setSection(sections[current].id); });

  /* ----- trilho lateral e navegação compacta do celular (criados aqui, a partir de config/sections.js) ----- */
  const rail = document.createElement('nav');
  rail.className = 'rail'; rail.setAttribute('aria-label', 'Seções');
  sections.forEach((s) => { const a = document.createElement('a'); a.href = `#${s.id}`; a.dataset.nav = s.id; const sp = document.createElement('span'); sp.textContent = s.label; a.setAttribute('aria-label', s.label); a.append(sp); rail.append(a); });
  document.body.append(rail);

  const pager = document.createElement('div');
  pager.className = 'pager'; pager.setAttribute('role', 'group'); pager.setAttribute('aria-label', 'Seções');
  pager.innerHTML = `<button type="button" data-dir="-1" aria-label="Anterior"><span class="material-symbols-outlined" aria-hidden="true">chevron_left</span></button>
    <span class="pager__label" aria-live="polite"></span>
    <button type="button" data-dir="1" aria-label="Próxima"><span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></button>`;
  document.body.append(pager);
  const pagerLabel = $('.pager__label', pager), prev = $('[data-dir="-1"]', pager), next = $('[data-dir="1"]', pager);

  const top = document.createElement('button');
  top.type = 'button'; top.className = 'to-top'; top.setAttribute('aria-label', 'Voltar ao início');
  top.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">keyboard_double_arrow_up</span>';
  top.addEventListener('click', () => { const a = document.createElement('a'); a.href = '#inicio'; document.body.append(a); a.click(); a.remove(); });
  document.body.append(top);

  /* ----- seção atual ----- */
  /* Indicador sob o item ativo. */
  const moveGlider = (link) => {
    if (!link || !glider || !nav.offsetWidth) { glider?.classList.remove('is-on'); return; }
    const n = nav.getBoundingClientRect(), r = link.getBoundingClientRect();
    if (!r.width) { glider.classList.remove('is-on'); return; }
    glider.style.width = `${r.width}px`;
    glider.style.transform = `translateX(${r.left - n.left - nav.clientLeft}px)`;
    glider.classList.add('is-on');
  };
  const regGlide = () => moveGlider($(`.nav-link[data-nav="${sections[current]?.id}"]`, nav));
  // larguras mudam ao trocar o idioma, ao carregar fontes ou ao inserir o seletor de idioma no cabeçalho
  if (nav && 'ResizeObserver' in window) {
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(regGlide); });
    ro.observe(nav); $$('.nav-link', nav).forEach((a) => ro.observe(a));
  }
  bus.on('lang', () => requestAnimationFrame(regGlide));
  const setCurrent = (i) => {
    if (i === current) return;
    current = i;
    const id = sections[i]?.id;
    $$('[data-nav]').forEach((a) => {
      const on = a.dataset.nav === id;
      a.classList.toggle('is-active', on);
      on ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current');
    });
    moveGlider($(`.nav-link[data-nav="${id}"]`, nav));
    pagerLabel.textContent = sections[i].label;
    prev.disabled = i <= 0; next.disabled = i >= sections.length - 1;
    document.documentElement.dataset.section = id;
    // o endereço acompanha a seção (recarregar volta para ela, sem introdução)
    if (urlLive && !document.documentElement.classList.contains('is-intro') && !document.body.classList.contains('is-traveling')) urlState.setSection(id);
    bus.emit('section', id);
  };
  const measure = () => {
    const probe = window.scrollY + window.innerHeight * 0.38;
    let idx = 0;
    els.forEach((el, i) => { if (el.offsetTop <= probe) idx = i; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = els.length - 1; // fim da página
    setCurrent(idx);
  };

  /* ----- rolagem: progresso, recolher o menu, botão voltar ao início ----- */
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      header.style.setProperty('--p', String(Math.min(1, y / max)));
      measure();
      const menuOpen = !menu.hidden;
      const goingDown = y > lastY + 6, goingUp = y < lastY - 6;
      const traveling = document.body.classList.contains('is-traveling');
      if (y < 90 || menuOpen || traveling) header.classList.remove('is-hidden');
      else if (goingDown && !header.contains(document.activeElement)) header.classList.add('is-hidden');
      else if (goingUp) header.classList.remove('is-hidden');
      if (goingDown || goingUp) lastY = y;
      top.classList.toggle('is-on', y > window.innerHeight * 0.9);
      pager.classList.toggle('is-away', !menu.hidden);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); regGlide(); closeMenu(); });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  /* ----- menu do celular ----- */
  const icon = $('[data-menu-icon]', menuBtn);
  const openMenu = () => { menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); icon.textContent = 'close'; header.classList.remove('is-hidden'); pager.classList.add('is-away'); };
  function closeMenu() { if (menu.hidden) return; menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); icon.textContent = 'menu'; pager.classList.remove('is-away'); }
  menuBtn.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuBtn.focus(); } });
  document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !header.contains(e.target)) closeMenu(); });

  /* ----- seção anterior / próxima (celular) ----- */
  pager.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dir]'); if (!b) return;
    const i = Math.min(Math.max(current + Number(b.dataset.dir), 0), sections.length - 1);
    const a = document.createElement('a'); a.href = `#${sections[i].id}`; document.body.append(a); a.click(); a.remove();
  });

  bus.on('travel', (v) => { if (!v) { lastY = window.scrollY; } header.classList.remove('is-hidden'); }); // depois de viajar, o menu continua à mão
  measure(); onScroll();
  document.fonts?.ready.then(regGlide);
  return { get current() { return sections[current]?.id; }, closeMenu, measure };
}

/* ===== 6. CENTRAL DE ACESSIBILIDADE ===== */

const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  kids.flat().forEach((c) => c && e.append(c));
  return e;
};
const icon = (name) => el('span', { class: 'material-symbols-outlined', 'aria-hidden': 'true', text: name });

/** Aplica as preferências na página (classes no <html>; o universo 3D escuta o prefs por conta própria). */
function applyPrefs() {
  const r = document.documentElement, p = prefs.all();
  r.classList.toggle('a11y-contrast', p.contrast === 'high');
  r.classList.toggle('a11y-reduce-motion', p.motion === 'reduce');
  r.classList.toggle('a11y-reduce-effects', !!p.reduceEffects);
  r.classList.toggle('a11y-focus', !!p.strongFocus);
  r.classList.toggle('a11y-targets', !!p.bigTargets);
  r.style.setProperty('--a11y-zoom', String((p.textScale || 100) / 100));
  r.classList.toggle('a11y-zoomed', (p.textScale || 100) !== 100);
  renderAltList(!!p.altProjectList);
}

/* ---------- lista de projetos sem 3D (dentro da seção Projetos) ---------- */
let altBox = null;
function renderAltList(on) {
  const sec = document.getElementById('projetos');
  if (!sec) return;
  if (!on) { altBox?.remove(); altBox = null; return; }
  if (altBox) return;
  altBox = el('section', { class: 'alt-projects', 'aria-labelledby': 'alt-projects-title', 'data-safe': '' },
    el('h3', { id: 'alt-projects-title', class: 'alt-projects__title', text: 'Lista de projetos' }));
  const list = el('ul', { class: 'alt-projects__list' });
  for (const [planet, key] of Object.entries(planetProjects)) {
    const p = projects[key]; if (!p) continue;
    const links = el('div', { class: 'alt-projects__links' });
    if (p.github) links.append(el('a', { href: p.github, target: '_blank', rel: 'noopener noreferrer', text: 'GitHub ↗' }));
    if (p.demo) links.append(el('a', { href: p.demo, target: '_blank', rel: 'noopener noreferrer', text: 'Demo ao vivo ↗' }));
    links.append(el('button', { type: 'button', text: 'Ver no sistema solar', onclick: () => document.querySelector(`[data-planet="${planet}"]`)?.click() }));
    list.append(el('li', { class: 'alt-projects__item' },
      el('h4', { text: p.name }),
      p.subtitle ? el('p', { class: 'alt-projects__sub', text: p.subtitle }) : null,
      p.description ? el('p', { text: p.description }) : null,
      p.technologies?.length ? el('p', { class: 'alt-projects__tech', text: p.technologies.join(' · ') }) : null,
      links));
  }
  altBox.append(list);
  (document.getElementById('orbital-hud') ?? sec.lastElementChild).after(altBox);
}

/* ---------- seletor de idioma (cabeçalho) ---------- */
function langSelect(cls, id) {
  const s = el('select', { class: cls, id, 'aria-label': 'Idioma' });
  for (const l of LANGS) s.append(el('option', { value: l.code, lang: l.code, 'data-no-i18n': '', text: l.name }));
  s.value = currentLang();
  s.addEventListener('change', () => setLang(s.value));
  bus.on('lang', (c) => { s.value = c; });
  return s;
}

function initA11yCenter() {
  applyPrefs();
  prefs.subscribe(() => applyPrefs());

  // seletor de idioma no cabeçalho (telas médias e grandes; no celular ele fica na central)
  const actions = document.querySelector('#site-header > div.shrink-0') ?? document.getElementById('site-header');
  const pick = el('label', { class: 'lang-picker' }, icon('language'), langSelect('lang-picker__select', 'lang-select-header'));
  actions?.prepend(pick);

  // botão fixo
  const fab = el('button', { type: 'button', class: 'a11y-fab', 'aria-label': 'Abrir central de acessibilidade', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' }, icon('accessibility_new'));

  // painel
  const row = (label, control, id) => el('div', { class: 'a11y-row' }, el('label', { for: id, text: label }), control);
  const toggle = (key, label, desc, on = (v) => !!v, set = (c) => c) => {
    const id = `a11y-${key}`;
    const c = el('input', { type: 'checkbox', id, class: 'a11y-switch', role: 'switch' });
    c.checked = on(prefs.get(key));
    c.addEventListener('change', () => prefs.set(key, set(c.checked)));
    prefs.subscribe((k) => { if (k === key) c.checked = on(prefs.get(key)); });
    return el('div', { class: 'a11y-row a11y-row--toggle' }, el('div', {}, el('label', { for: id, text: label }), el('p', { class: 'a11y-desc', text: desc })), c);
  };

  const scale = el('input', { type: 'range', id: 'a11y-text', min: '90', max: '150', step: '10', class: 'a11y-range' });
  const scaleOut = el('output', { for: 'a11y-text', class: 'a11y-out' });
  const syncScale = () => { scale.value = prefs.get('textScale') || 100; scaleOut.textContent = `${scale.value}%`; };
  scale.addEventListener('input', () => { prefs.set('textScale', Number(scale.value)); syncScale(); });
  syncScale(); prefs.subscribe((k) => { if (k === 'textScale') syncScale(); });

  const quality = el('select', { id: 'a11y-quality', class: 'a11y-select' },
    el('option', { value: 'auto', text: 'Automática' }), el('option', { value: 'low', text: 'Baixa' }), el('option', { value: 'medium', text: 'Média' }), el('option', { value: 'high', text: 'Alta' }));
  quality.value = prefs.get('quality') || 'auto';
  quality.addEventListener('change', () => prefs.set('quality', quality.value));
  prefs.subscribe((k) => { if (k === 'quality') quality.value = prefs.get('quality'); });

  const close = el('button', { type: 'button', class: 'a11y-close', 'aria-label': 'Fechar central de acessibilidade' }, icon('close'));
  const reset = el('button', { type: 'button', class: 'a11y-reset', text: 'Restaurar padrão', onclick: () => { const l = prefs.get('lang'); prefs.reset(); prefs.set('lang', l); } });

  const panel = el('div', { class: 'a11y-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'a11y-title', hidden: '' },
    el('div', { class: 'a11y-head' }, el('h2', { id: 'a11y-title', class: 'a11y-title' }, icon('accessibility_new'), el('span', { text: 'Acessibilidade' })), close),
    el('div', { class: 'a11y-body' },
      row('Idioma', langSelect('a11y-select', 'a11y-lang'), 'a11y-lang'),
      el('div', { class: 'a11y-row' }, el('label', { for: 'a11y-text', text: 'Tamanho do texto' }), el('div', { class: 'a11y-range-wrap' }, scale, scaleOut)),
      toggle('contrast', 'Alto contraste', 'Textos mais claros e painéis mais escuros.', (v) => v === 'high', (c) => (c ? 'high' : 'normal')),
      toggle('motion', 'Reduzir movimento', 'Sem introdução animada, sem rastros; a câmera vai direto para cada seção.', (v) => v === 'reduce', (c) => (c ? 'reduce' : 'system')),
      toggle('reduceEffects', 'Reduzir efeitos visuais', 'Desliga brilhos, partículas e planetas decorativos.'),
      toggle('strongFocus', 'Foco bem visível', 'Contorno forte no item selecionado pelo teclado.'),
      toggle('bigTargets', 'Alvos maiores', 'Botões e links maiores para clicar ou tocar.'),
      toggle('altProjectList', 'Lista de projetos sem 3D', 'Mostra os projetos também em uma lista simples.'),
      row('Qualidade gráfica', quality, 'a11y-quality'),
      reset));
  document.body.append(fab, panel);

  // abrir / fechar com foco preso dentro do painel
  let last = null;
  const focusables = () => [...panel.querySelectorAll('button, select, input, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
  const open = () => { last = document.activeElement; panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); requestAnimationFrame(() => focusables()[0]?.focus()); };
  const shut = () => { panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); (last && document.contains(last) ? last : fab).focus(); };
  fab.addEventListener('click', () => (panel.hidden ? open() : shut()));
  close.addEventListener('click', shut);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); shut(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(), first = f[0], end = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
    else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) shut(); });
  return { open, close: shut };
}

/* ===== 7. INÍCIO DO SITE ===== */

// Preenchidos quando idiomas.js e projetos.js terminam de carregar (usados pela central de acessibilidade).
let LANGS = [], setLang = async () => {}, currentLang = () => 'pt-BR';
let projects = {}, planetProjects = {};

/** Carrega os outros 4 arquivos e liga tudo, na mesma ordem do site original. */
async function iniciar() {
  const [idiomas, projetos, sistemaSolar, universo3d] = await Promise.all([
    import('./idiomas.js'),
    import('./projetos.js'),
    import('./sistema-solar.js'),
    import('./universo.js'),
  ]);
  ({ LANGS, setLang, currentLang } = idiomas);
  ({ projects, planetProjects } = projetos);

  idiomas.initI18n();     // idiomas (traduz a página e tudo que o JavaScript criar)
  initA11yCenter();       // central de acessibilidade + seletor de idioma
  initContactForm();      // seção Contato
  initNavigation();       // menu, seção atual, progresso, voltar ao início
  initReveal();           // painéis se materializam ao chegar

  // UM universo 3D para o site inteiro (fundo, Big Bang, título, naves, elfo
  let universe = null;
  try { universe = universo3d.createUniverse(); } catch (err) {
    console.error('[universe] Não foi possível iniciar o universo 3D.', err);
    document.documentElement.classList.remove('is-intro');
    document.documentElement.classList.add('no-3d');
  }
  // sem universo 3D: posiciona a página na seção pedida e libera o endereço para acompanhar a rolagem
  if (!universe) {
    const id = urlState.initialSection();
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'auto' });
    bus.emit('ready');
  }
  sistemaSolar.mountOrbitalHud(document.getElementById('orbital-hud'), { universe }); // seção Projetos: sistema solar 3D
  universe?.start().catch((err) => {
    console.error('[universe] Falha na introdução.', err);
    document.documentElement.classList.remove('is-intro');
  });
}

iniciar().catch((err) => {
  console.error('[site] Não foi possível carregar os arquivos do site.', err);
  document.documentElement.classList.remove('is-intro');
});

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { site, sections, models, elfAnimation, bus, prefs, urlState };
