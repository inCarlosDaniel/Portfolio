/**
 * PROJETOS — cadastro dos projetos e o dossiê (a janela que abre ao clicar num planeta).
 *   1. Cadastro dos projetos (edite aqui)
 *   2. Projeto de cada planeta
 *   3. Dossiê do projeto
 */

import gsap from 'gsap';
import { site } from './principal.js';

/* ===== 1. CADASTRO DOS PROJETOS ===== */

/** Cadastro dos projetos (chave = id estável do projeto, NÃO do planeta). */
const projects = {
  skillshare: {
    id: 'skillshare',
    name: 'SkillShare',
    description: 'Plataforma de compartilhamento de conhecimento',
    tagline: "Rede Social Acadêmica em Tempo Real",
    objective: 'Democratizar o acesso ao conhecimento técnico e reduzir a fragmentação do aprendizado entre estudantes.',
    about: 'Rede social acadêmica que conecta estudantes por meio de monitorias, troca de materiais e colaboração em tempo real, com foco no aprendizado coletivo.',
    features: [
      'Match inteligente entre estudantes por habilidade e dificuldade.',
      'Feed acadêmico com publicações, PDFs e imagens.',
      'Chat em tempo real para mentoria e colaboração.',
      'Sistema de gamificação com pontuação e upvotes.',
      'Gestão de perfil por competências e interesses.',
    ],
    technologies: ['Java 17', 'Spring Boot', 'Spring Security', 'OAuth2', 'Thymeleaf', 'WebSocket (STOMP)', 'HTML5', 'CSS3', 'JavaScript', 'MySQL'],
    github: 'https://github.com/inCarlosDaniel/SkillShare',
    demo: '',
    media: [
      { type: 'video', src: 'media/video/VideoSkillShareProject.mp4' },
      { type: 'gif', src: 'https://raw.githubusercontent.com/inCarlosDaniel/SkillShare/main/docs/demo.gif', alt: 'Demonstração do SkillShare' },
    ],
  },

  'visual-anatomy': {
    id: 'visual-anatomy',
    name: 'Visual Anatomy 3D',
    description: 'Sistema interativo de anatomia 3D',
    tagline: "Exploração Anatômica & Modelagem 3D",
    features: [
      'Aplicação 3D interativa desenvolvida em C# com Unity e renderização PBR.',
      'Modelos anatômicos criados no Blender e com Meshy AI, importados em GLB, glTF, FBX e OBJ.',
      'Animações de personagens com Mixamo.',
      'Banco local em SQLite e banco remoto em MySQL, modelado no MySQL Workbench.',
      "Sistema de anotações médicas holográficas e nós de descrição histológica interativos.",
      'Suporte a realidade virtual (VR) em planejamento.',
    ],
    technologies: ['C#', 'Unity', 'Blender', 'Meshy AI', 'Mixamo', 'SQLite', 'MySQL', 'MySQL Workbench', 'Visual Studio Code', 'Git', 'GitHub', 'GLB / glTF / FBX / OBJ'],
    github: '',
    demo: '',
    media: [
      { type: 'video', src: 'media/img/VIsual Anatomy 3D/Gravação de Tela 2026-11-12 011404.mp4', alt: 'Demonstração do Visual Anatomy 3D' },
      { type: 'video', src: 'media/img/VIsual Anatomy 3D/Gravação de Tela 2026-11-12 013049.mp4', alt: 'Demonstração do Visual Anatomy 3D' },
    ],
  },

  'mod-wicked': {
    id: 'mod-wicked',
    name: 'The Wicked World',
    about: "Universo fantástico inspirado no cânone de Oz, transportando elementos icônicos como a Cidade das Esmeraldas e a Estrada de Tijolos Amarelos para mecânicas interativas com engenharia de software criativa e customização profunda.",
    description: 'Mod temático para Minecraft',
    tagline: "Modding Criativo & Engenharia Virtual",
    features: [
      "Geração procedural de estruturas e biomas mágicos inspirados na Cidade das Esmeraldas.",
      "Sistema de itens mágicos, poções alquímicas e mecânicas customizadas com alta taxa de quadros.",
      "Arquitetura modular orientada a eventos para integração contínua de novos assets e feitiços.",
      'Mod desenvolvido em Java 25 com NeoForge para Minecraft 26.3, compilado com Gradle 9.2.1.',
      'Personagens 3D, como a Elphaba, gerados com Meshy AI e refinados no Blender.',
      'Esqueleto (Armature), rigging, skinning e animações criados no Blender 5.3.',
      'Modelos, blocos, itens e texturas no estilo Minecraft criados no Blockbench.',
      'Modelos animados exportados em glTF 2.0 (.GLB), com UV Mapping e texturas em PNG.',
    ],
    technologies: ['Java 25', 'NeoForge', 'Minecraft 26.3', 'Gradle 9.2.1', 'Blender 5.3', 'Blockbench', 'Meshy AI', 'glTF 2.0 / GLB', 'Visual Studio Code', 'GitHub'],
    github: '',
    demo: '',
    media: [
      { type: 'video', src: 'media/img/The Wicked World/Gravação de Tela 2026-11-20 142221.mp4', alt: 'Gameplay do mod The Wicked World' },
      { type: 'video', src: 'media/img/The Wicked World/Gravação de Tela 2026-11-11 220506.mp4', alt: 'Gameplay do mod The Wicked World' },
      { type: 'image', src: 'media/img/The Wicked World/Captura de tela 2026-11-11 220330.png', alt: 'Cidade das Esmeraldas construída no Minecraft' },
    ],
  },

  'gestao-estoque': {
    id: 'gestao-estoque',
    name: 'Gestão de Estoque',
    description: 'Sistema de gerenciamento de estoque',
    tagline: 'Plataforma de Controle de Estoque',
    objective: 'Organizar o controle de produtos e reduzir erros nas entradas e saídas do estoque.',
    about: 'Aplicação em Python para cadastro e controle de estoque, com histórico de movimentações, consulta de saldo e suporte a relatórios gerenciais.',
    features: [
      'Cadastro completo de produtos e atributos.',
      'Controle de entradas e saídas com histórico.',
      'Consulta de estoque em tempo real.',
      'Alertas de estoque baixo.',
      'Relatórios gerenciais para apoio à decisão.',
    ],
    technologies: ['Python', 'Django', 'SQLite', 'pandas'],
    github: 'https://github.com/inCarlosDaniel/Sistema-de-gerenciamento-de-estoque',
    demo: '',
    media: [
      { type: 'gif', src: 'https://raw.githubusercontent.com/inCarlosDaniel/Sistema-de-gerenciamento-de-estoque/main/docs/Gravando%202026-09-01%20095432.gif', alt: 'Demonstração do sistema de estoque' },
    ],
  },

  'ta-de-carro': {
    id: 'ta-de-carro',
    name: 'Tá de Carro',
    description: 'Catálogo digital de veículos',
    tagline: 'Catálogo Digital de Veículos',
    objective: 'Conectar clientes aos veículos da loja com navegação clara e uma experiência digital de compra.',
    about: 'Site de vitrine automotiva com catálogo de carros novos e seminovos, páginas por marca e formulário para solicitação de financiamento.',
    features: [
      'Catálogo de carros novos com dados e preço.',
      'Vitrine de seminovos por marca.',
      'Páginas dedicadas para BYD, GWM, Honda e Chevrolet.',
      'Formulário de financiamento completo.',
      'Layout responsivo com navegação intuitiva.',
    ],
    technologies: ['HTML5', 'CSS3', 'Bootstrap 5.3'],
    github: 'https://github.com/inCarlosDaniel/Ta-de-Carro',
    demo: '',
    media: [
      { type: 'gif', src: 'https://raw.githubusercontent.com/inCarlosDaniel/Ta-de-Carro/main/docs/demo.gif', alt: 'Demonstração do site Tá de Carro' },
    ],
  },

  bicicletaria: {
    id: 'bicicletaria',
    name: 'Bicicletaria',
    description: 'Vitrine de bikes e peças',
    tagline: 'Vitrine de Bikes e Peças',
    objective: 'Melhorar a experiência de visualização dos produtos e facilitar a navegação entre categorias.',
    about: 'Site para exibição de bicicletas e peças, com categorias bem organizadas, destaques promocionais e visual moderno.',
    features: [
      'Página inicial com promoções e lançamentos.',
      'Navegação por categorias: MTB, Speed, Gravel e Peças.',
      'Menu ativo com identificação da página atual.',
      'Animações de entrada e efeitos de hover.',
      'Layout responsivo para desktop e mobile.',
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript'],
    github: 'https://github.com/inCarlosDaniel/Bicicletaria',
    demo: '',
    media: [
      { type: 'gif', src: 'https://raw.githubusercontent.com/inCarlosDaniel/Bicicletaria/main/docs/Grava%C3%A7%C3%A3o%20de%20Tela%202026-07-11%20002220.gif', alt: 'Demonstração do site Bicicletaria' },
    ],
  },
};

/* ===== 2. PROJETO DE CADA PLANETA ===== */

/** QUAL PROJETO FICA EM QUAL PLANETA — é só editar aqui. */
const planetProjects = {
  'golden-bronze': 'bicicletaria',      // ÓRBITA 1
  'crystal-cyan': 'visual-anatomy',     // ÓRBITA 2
  'deep-ocean': 'gestao-estoque',       // ÓRBITA 3
  'emerald-green': 'mod-wicked',        // ÓRBITA 4
  'magma-volcanic': 'ta-de-carro',      // ÓRBITA 5
  'mystical-purple': 'skillshare',      // ÓRBITA 6
};

/* ===== 3. DOSSIÊ DO PROJETO ===== */

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const icon = (name) => { const s = el('span', 'material-symbols-outlined', name); s.setAttribute('aria-hidden', 'true'); return s; };
const kindOf = (m) => {
  if (m.type === 'gif' || /\.gif([?#]|$)/i.test(m.src)) return 'gif';
  if (m.type === 'video' || (m.type !== 'image' && /\.(mp4|webm|mov)([?#]|$)/i.test(m.src))) return 'video';
  return 'image';
};
const KIND_LABEL = { video: 'Vídeo', image: 'Imagem', gif: 'GIF' };
const KIND_ORDER = ['video', 'image', 'gif'];
const pad = (n) => String(n).padStart(2, '0');

/* Selos das tecnologias (sigla + cor). Tecnologia fora da lista ganha sigla automática e cor própria. */
const TECH = {
  java: ['Jv', '#f89820'], 'java 17': ['Jv', '#f89820'], 'spring boot': ['Sb', '#6db33f'], 'spring security': ['Ss', '#6db33f'],
  javascript: ['JS', '#f7df1e'], typescript: ['TS', '#3178c6'], 'c#': ['C#', '#a179dc'], unity: ['U', '#e8e8e8'], sqlite: ['SQL', '#5ab0e6'],
  mysql: ['My', '#5fa8e0'], postgresql: ['Pg', '#4f8fd6'], neoforge: ['NF', '#e8843c'], blender: ['Bl', '#f5792a'], 'blender 5.3': ['Bl', '#f5792a'], 'java 25': ['Jv', '#f89820'], 'minecraft 26.3': ['MC', '#62b047'], 'gradle 9.2.1': ['Gr', '#3fb0c4'], blockbench: ['BB', '#3e90ff'], 'meshy ai': ['AI', '#c18cff'], 'gltf 2.0 / glb': ['GL', '#8fd14f'], 'visual studio code': ['VS', '#3ea6f5'], mixamo: ['Mx', '#ff7a59'], 'mysql workbench': ['WB', '#5fa8e0'], git: ['Git', '#f1502f'], 'glb / gltf / fbx / obj': ['3D', '#8fd14f'], github: ['GH', '#e6edf3'], python: ['Py', '#4b8bbe'],
  django: ['Dj', '#44b78b'], 'bootstrap 5': ['Bs', '#8c5cf0'], 'bootstrap 5.3': ['Bs', '#8c5cf0'], pandas: ['Pd', '#e70488'], 'chart.js': ['Ch', '#ff6384'], 'rest endpoints': ['API', '#19d4ff'],
  'three.js': ['3D', '#e6f4ff'], webgl: ['GL', '#e2445c'], html5: ['H5', '#e34f26'], css3: ['C3', '#4d8dff'], oauth2: ['OA', '#eb5424'],
  thymeleaf: ['Th', '#5cc46a'], 'websocket (stomp)': ['WS', '#8fd8ff'], 'websocket stomp': ['WS', '#8fd8ff'], react: ['Re', '#61dafb'],
  'node.js': ['No', '#6cc24a'], docker: ['Dk', '#2496ed'], flutter: ['Fl', '#54c5f8'], firebase: ['Fb', '#ffca28'],
};
function techBadge(name) {
  const k = name.trim().toLowerCase();
  if (TECH[k]) return TECH[k];
  const words = name.replace(/[^\p{L}\p{N}#+ ]/gu, ' ').trim().split(/\s+/);
  const abbr = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)) || '•';
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) % 360;
  return [abbr.charAt(0).toUpperCase() + abbr.slice(1), `hsl(${h} 80% 66%)`];
}
const FEATURE_ICONS = ['bolt', 'hub', 'memory', 'shield', 'insights', 'extension', 'layers', 'auto_awesome'];

class ProjectDossier {
  /** section: elemento da seção Projetos (o dossiê cobre a área do título até os cartões) */
  constructor(section, { onClose, onStep, onPick, planets = [], reducedMotion = false } = {}) {
    this.section = section; this.onClose = onClose; this.onStep = onStep; this.onPick = onPick;
    this.planetList = planets; this.reduced = reducedMotion;
    this.isOpen = false; this.project = null; this.meta = null;
    this.media = []; this.kind = null; this.index = 0;
    this._tl = null; this._rz = 0;
    this._build();
    this._onResize = () => { cancelAnimationFrame(this._rz); this._rz = requestAnimationFrame(() => { if (this.isOpen) { this.layout(); this.onRelayout?.(); } }); };
    window.addEventListener('resize', this._onResize);
  }

  /* ------------------------------------------------------------------ estrutura */
  _build() {
    const root = (this.root = el('div', 'pd'));
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'false'); root.setAttribute('aria-labelledby', 'pd-title');
    root.hidden = true;
    // nunca vira clique em planeta / arrasto do sistema solar
    ['pointerdown', 'pointerup', 'click'].forEach((t) => root.addEventListener(t, (e) => e.stopPropagation()));

    /* topo fixo: cabeçalho + janela de varredura */
    const top = (this.top = el('div', 'pd-top'));
    const head = (this.head = el('header', 'pd-panel pd-head'));
    const kicker = el('div', 'pd-kicker');
    this.kProj = el('span', 'pd-kicker__num'); this.kOrbit = el('span', 'pd-kicker__orbit');
    kicker.append(el('span', null, 'PROJETO'), this.kProj, el('span', 'pd-kicker__sep', '//'), el('span', null, 'ÓRBITA'), this.kOrbit);
    this.titleEl = el('h3', 'pd-title'); this.titleEl.id = 'pd-title';
    this.taglineEl = el('p', 'pd-tagline');
    const actions = el('div', 'pd-actions');
    this.orbitsNav = el('nav', 'pd-orbits'); this.orbitsNav.setAttribute('aria-label', 'Projetos');
    this.planetList.forEach((p, i) => {
      const b = el('button', 'pd-orbit', pad(i + 1)); b.type = 'button'; b.dataset.planet = p.id;
      b.style.setProperty('--acc', p.accent || '#35d6f5');
      b.setAttribute('aria-label', p.name); b.title = p.name;
      b.addEventListener('click', () => { if (p.id !== this.meta?.planetId) this.onPick?.(p.id); });
      this.orbitsNav.append(b);
    });
    const prev = this._btn('pd-step', 'Projeto anterior', () => this.onStep?.(-1), icon('chevron_left'));
    const next = this._btn('pd-step', 'Próximo projeto', () => this.onStep?.(1), icon('chevron_right'));
    this.closeBtn = this._btn('pd-close', 'Voltar ao sistema solar', () => this.onClose?.(), icon('travel_explore'), el('span', 'pd-close__txt', 'Visão geral'));
    actions.append(prev, this.orbitsNav, next, this.closeBtn);
    head.append(kicker, this.titleEl, this.taglineEl, actions);

    const scan = (this.scan = el('div', 'pd-scan'));
    scan.setAttribute('aria-hidden', 'true');
    this.scanName = el('span', 'pd-scan__name'); this.scanData = el('span', 'pd-scan__data');
    const reticle = el('div', 'pd-scan__reticle');
    scan.append(el('span', 'pd-scan__corner pd-scan__corner--tl'), el('span', 'pd-scan__corner pd-scan__corner--tr'),
      el('span', 'pd-scan__corner pd-scan__corner--bl'), el('span', 'pd-scan__corner pd-scan__corner--br'),
      reticle, el('span', 'pd-scan__label', 'ALVO ORBITAL'), this.scanName, this.scanData, el('span', 'pd-scan__sweep'));
    top.append(head, scan);

    /* corpo rolável */
    const body = (this.body = el('div', 'pd-body'));
    body.tabIndex = 0; body.setAttribute('aria-label', 'Detalhes do projeto');
    this.grid = el('div', 'pd-grid');
    this.hint = el('div', 'pd-hint'); this.hint.setAttribute('aria-hidden', 'true');
    this.hint.append(icon('keyboard_double_arrow_down'), el('span', null, 'Mais detalhes'));
    body.append(this.grid);
    body.addEventListener('scroll', () => this._hintUpdate(), { passive: true });

    root.append(top, body, this.hint);
    this.section.append(root);

    // inclinação sutil do painel sob o ponteiro (profundidade)
    root.addEventListener('pointermove', (e) => {
      const p = e.target.closest?.('.pd-panel');
      if (p !== this._tilt) { this._tilt?.style.removeProperty('--tx'); this._tilt?.style.removeProperty('--ty'); this._tilt = p; }
      if (!p || this.reduced || p.classList.contains('pd-scan')) return;
      const r = p.getBoundingClientRect();
      p.style.setProperty('--tx', `${(((e.clientY - r.top) / r.height) - 0.5) * -2.2}deg`);
      p.style.setProperty('--ty', `${(((e.clientX - r.left) / r.width) - 0.5) * 2.2}deg`);
    });
    root.addEventListener('pointerleave', () => { this._tilt?.style.removeProperty('--tx'); this._tilt?.style.removeProperty('--ty'); this._tilt = null; });
    root.addEventListener('keydown', (e) => {
      if (e.target.closest?.('video, input')) return;
      if (e.target.closest?.('.pd-media') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); this._go(this.index + (e.key === 'ArrowLeft' ? -1 : 1)); }
    });
  }

  _btn(cls, label, fn, ...kids) {
    const b = el('button', cls); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label;
    b.append(...kids); b.addEventListener('click', fn); return b;
  }

  /* ------------------------------------------------------------------ conteúdo */
  /** meta: { planetId, index (1…n), total, accent, orbit: { a, speed }, node } */
  render(project, meta) {
    const same = this.project === project && this.meta?.planetId === meta.planetId;
    this.project = project; this.meta = meta;
    this.root.style.setProperty('--pd-accent', meta.accent || '#35d6f5');
    if (same) return;
    this._pause();
    const pr = project ?? { name: meta.name ?? '' };
    this.kProj.textContent = pad(meta.index); this.kOrbit.textContent = `${meta.index} / ${meta.total}`;
    this.titleEl.textContent = pr.name ?? '';
    this.taglineEl.textContent = pr.tagline || pr.subtitle || '';
    this.taglineEl.hidden = !this.taglineEl.textContent;
    this.scanName.textContent = meta.node ?? '';
    this.scanData.replaceChildren();
    if (meta.orbit) {
      const period = (Math.PI * 2) / Math.max(meta.orbit.speed, 1e-3);
      this.scanData.append(el('span', null, `R ${meta.orbit.a.toFixed(1)} UA`), el('span', null, `T ${period.toFixed(0)} s`));
    }
    [...this.orbitsNav.children].forEach((b) => {
      const on = b.dataset.planet === meta.planetId;
      b.classList.toggle('is-active', on); on ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current');
    });

    const cells = [];
    const has = (v) => (Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim()));
    this.media = (pr.media ?? []).filter((m) => m && m.src);
    const hasMedia = this.media.length > 0;
    const objective = pr.objective || pr.description;
    // ao lado da mídia: Objetivo + Tecnologias · embaixo: Funcionalidades + Sobre o projeto
    const info = [];
    if (has(objective)) info.push(this._textPanel(pr.objective ? 'Objetivo' : 'Resumo', pr.objective ? 'flag' : 'subject', objective, 'pd-objective'));
    const techs = has(pr.technologies) ? this._techPanel(pr.technologies) : null;
    if (techs) info.push(techs);
    const about = has(pr.about) && pr.about !== objective ? this._textPanel('Sobre o projeto', 'description', pr.about, 'pd-about') : null;
    const feats = has(pr.features) ? this._featuresPanel(pr.features) : null;
    const link = this._linkPanel(pr);

    // painéis de largura total embaixo: nenhuma caixa estica para igualar a vizinha (nada de espaço vazio)
    if (hasMedia) {
      cells.push([this._mediaPanel(), info.length ? 'media' : 'full']);
      if (info.length) { const col = el('div', 'pd-col'); col.append(...info); cells.push([col, 'info']); }
      if (about) cells.push([about, 'full']);
    } else {
      // sem mídia: [resumo | tecnologias] · sobre o projeto (largura total)
      if (info.length === 2) { cells.push([info[0], 'info-nm']); cells.push([info[1], 'about-nm']); }
      else if (info.length) cells.push([info[0], 'full']);
      if (about) cells.push([about, 'full']);
    }
    if (feats) cells.push([feats, 'full']);
    if (!info.length && !about && !feats && !hasMedia) {
      const empty = el('section', 'pd-panel pd-empty');
      empty.append(icon('satellite_alt'), el('h4', 'pd-h', 'Dossiê em preparação'), el('p', 'pd-p', 'Os detalhes deste projeto serão publicados em breve.'));
      cells.push([empty, 'full']);
    }
    cells.push([link, 'full']);
    this.grid.replaceChildren(...cells.map(([c, area]) => { c.dataset.area = area; return c; }));
    this.grid.classList.toggle('has-media', hasMedia);
    if (hasMedia) { this.kind = KIND_ORDER.find((k) => this.media.some((m) => kindOf(m) === k)); this._renderTabs(); this._go(0); }
    this.body.scrollTop = 0;
    requestAnimationFrame(() => this._hintUpdate());
  }

  _panel(cls, title, iconName) {
    const p = el('section', `pd-panel ${cls}`);
    if (title) { const h = el('h4', 'pd-h'); h.append(icon(iconName), el('span', null, title)); p.append(h); }
    return p;
  }

  _textPanel(title, iconName, text, cls) {
    const p = this._panel(cls, title, iconName);
    p.append(el('p', 'pd-p', text));
    return p;
  }

  _featuresPanel(list) {
    const p = this._panel('pd-features', 'Funcionalidades', 'auto_awesome');
    const ul = el('ul', 'pd-feats');
    list.forEach((f, i) => { const li = el('li', 'pd-feat'); const ic = el('span', 'pd-feat__icon'); ic.append(icon(FEATURE_ICONS[i % FEATURE_ICONS.length])); li.append(ic, el('span', 'pd-feat__txt', f)); ul.append(li); });
    p.append(ul);
    return p;
  }

  _techPanel(list) {
    const p = this._panel('pd-tech', 'Tecnologias', 'deployed_code');
    const ul = el('ul', 'pd-techs');
    for (const t of list) {
      const [abbr, color] = techBadge(t);
      const li = el('li', 'pd-techtile'); li.style.setProperty('--tc', color);
      const b = el('span', 'pd-techtile__badge', abbr); b.setAttribute('aria-hidden', 'true'); b.dataset.noI18n = '';
      const n = el('span', 'pd-techtile__name', t); n.dataset.noI18n = '';
      li.append(b, n); ul.append(li);
    }
    p.append(ul);
    return p;
  }

  _linkPanel(pr) {
    const p = el('section', 'pd-panel pd-link');
    const txt = el('div', 'pd-link__txt');
    txt.append(el('h4', 'pd-link__title', 'Explore mais dos meus projetos!'), el('p', 'pd-link__sub', 'Confira todos os meus repositórios no GitHub.'));
    const btns = el('div', 'pd-link__btns');
    const a = (href, label, cls, ic) => { const l = el('a', cls); l.href = href; l.target = '_blank'; l.rel = 'noopener noreferrer'; l.append(icon(ic), el('span', null, label), icon('arrow_outward')); btns.append(l); };
    if (pr.demo) a(pr.demo, 'Ver demonstração', 'pd-cta pd-cta--ghost', 'play_circle');
    a(pr.github || site.github, pr.github ? 'Ver projeto no GitHub' : 'Ver meu GitHub', 'pd-cta', 'code');
    p.append(txt, btns);
    return p;
  }

  /* ------------------------------------------------------------------ mídia */
  _mediaPanel() {
    const p = el('section', 'pd-panel pd-media');
    p.setAttribute('aria-label', 'Mídia do projeto');
    const stage = el('div', 'pd-viewer');
    this.viewer = el('div', 'pd-viewer__frame');
    this.mPrev = this._btn('pd-mnav pd-mnav--prev', 'Mídia anterior', () => this._go(this.index - 1), icon('chevron_left'));
    this.mNext = this._btn('pd-mnav pd-mnav--next', 'Próxima mídia', () => this._go(this.index + 1), icon('chevron_right'));
    this.fsBtn = this._btn('pd-fs', 'Tela cheia', () => this._fullscreen(), icon('fullscreen'));
    stage.append(this.viewer, this.mPrev, this.mNext, this.fsBtn);
    const bar = el('div', 'pd-mbar');
    this.tabs = el('div', 'pd-tabs'); this.tabs.setAttribute('role', 'tablist'); this.tabs.setAttribute('aria-label', 'Tipo de mídia');
    this.thumbs = el('div', 'pd-thumbs');
    this.counter = el('span', 'pd-counter');
    bar.append(this.tabs, this.thumbs, this.counter);
    this.caption = el('p', 'pd-caption');
    p.append(stage, bar, this.caption);
    return p;
  }

  _items() { return this.media.filter((m) => kindOf(m) === this.kind); }

  _renderTabs() {
    this.tabs.replaceChildren();
    for (const k of KIND_ORDER) {
      if (!this.media.some((m) => kindOf(m) === k)) continue;
      const b = el('button', 'pd-tab', KIND_LABEL[k]); b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(k === this.kind));
      b.addEventListener('click', () => { if (this.kind !== k) { this.kind = k; this._renderTabs(); this._go(0); } });
      this.tabs.append(b);
    }
  }

  _go(i) {
    const items = this._items(), n = items.length; if (!n) return;
    this._pause();
    this.index = (i + n) % n;
    const m = items[this.index], kind = kindOf(m);
    let node;
    const fail = () => {
      console.warn(`[dossiê] Não foi possível carregar a mídia: ${m.src}`, node?.error ?? '');
      this.viewer.replaceChildren(el('div', 'pd-merror', 'Mídia indisponível')); this.fsBtn.hidden = true;
    };
    if (kind === 'video') {
      node = el('video'); node.controls = true; node.playsInline = true; node.preload = 'metadata'; // sem reprodução automática
      if (m.poster) node.poster = m.poster;
      node.src = m.src;
    } else {
      node = el('img'); node.decoding = 'async'; node.src = m.src;
      node.alt = m.alt || m.caption || `${this.project?.name ?? 'Projeto'} — ${KIND_LABEL[kind].toLowerCase()} ${this.index + 1}`;
    }
    node.addEventListener('error', fail);
    // a janela assume a proporção real da mídia (limites para não ficar estreita/alta demais)
    const fit = (w, h) => { if (w && h && this._items()[this.index] === m) this.viewer.parentElement.style.setProperty('--ar', String(Math.min(Math.max(w / h, 4 / 3), 21 / 9))); };
    node.addEventListener(kind === 'video' ? 'loadedmetadata' : 'load', () => fit(node.videoWidth || node.naturalWidth, node.videoHeight || node.naturalHeight));
    this.viewer.replaceChildren(node);
    this.fsBtn.hidden = !(node.requestFullscreen || node.webkitEnterFullscreen || node.webkitRequestFullscreen);
    this.mPrev.hidden = this.mNext.hidden = n < 2;
    this.caption.textContent = m.caption || ''; this.caption.hidden = !m.caption;
    this.counter.textContent = n > 1 ? `${this.index + 1} / ${n}` : '';
    this.thumbs.replaceChildren();
    if (n > 1) items.forEach((it, k) => {
      const b = el('button', 'pd-thumb'); b.type = 'button';
      b.setAttribute('aria-label', `${KIND_LABEL[kindOf(it)]} ${k + 1} / ${n}`);
      if (k === this.index) b.setAttribute('aria-current', 'true');
      if (kindOf(it) !== 'video' || it.poster) { const im = el('img'); im.src = it.poster || it.src; im.alt = ''; im.loading = 'lazy'; b.append(im); }
      else b.append(icon('play_arrow'));
      b.addEventListener('click', () => this._go(k));
      this.thumbs.append(b);
    });
  }

  _fullscreen() {
    const n = this.viewer.firstElementChild; if (!n) return;
    (n.requestFullscreen || n.webkitRequestFullscreen || n.webkitEnterFullscreen)?.call(n);
  }

  _pause() { this.root.querySelectorAll('video').forEach((v) => v.pause()); }

  /* ------------------------------------------------------------------ posição e alvo do planeta */
  /** O dossiê cobre a seção do título até os cartões (sem mudar a altura da página). */
  layout() {
    const s = this.section, head = s.querySelector('.projects-head'), cards = s.querySelector('.orbital-hud__cards');
    const sr = s.getBoundingClientRect();
    const a = (head ?? s).getBoundingClientRect(), b = (cards ?? s).getBoundingClientRect();
    // no computador, deixa livre a coluna dos botões flutuantes
    const right = innerWidth >= 768 ? Math.min(a.right, document.documentElement.clientWidth - 78) : a.right;
    Object.assign(this.root.style, {
      left: `${a.left - sr.left}px`, width: `${Math.max(280, right - a.left)}px`,
      // nunca mais alto que a tela (no celular, acima da navegação de seções)
      top: `${a.top - sr.top}px`, height: `${Math.max(320, Math.min(b.bottom - a.top, innerHeight - (innerWidth < 768 ? 140 : 88)))}px`,
    });
    // a mídia cabe inteira na área visível do corpo (sem precisar rolar para ver o vídeo todo)
    const narrow = matchMedia('(max-width: 760px)').matches;
    this.root.style.setProperty('--pd-media-max', `${Math.max(200, this.body.clientHeight - (narrow ? 140 : 112))}px`);
    this.scan.style.setProperty('--scan-h', `${this.scan.clientHeight}px`);
    this._hintUpdate();
  }

  /** Centro e tamanho (px de tela) que o planeta deve ocupar dentro da janela de varredura. */
  scanTarget() {
    const r = this.scan.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 + 6, size: Math.min(r.width, r.height) * 0.5 };
  }

  _hintUpdate() {
    const b = this.body, more = b.scrollHeight - b.clientHeight - b.scrollTop > 24;
    this.hint.classList.toggle('is-on', this.isOpen && more);
  }

  /* ------------------------------------------------------------------ abrir / fechar */
  open() {
    const was = this.isOpen;
    this.isOpen = true;
    this.root.hidden = false;
    this.section.classList.add('has-dossier');
    this.layout();
    this._tl?.kill();
    const cells = [...this.grid.children], heads = [this.head, this.scan];
    if (this.reduced) { gsap.set([...heads, ...cells], { clearProps: 'opacity,transform' }); this._hintUpdate(); return; }
    const tl = (this._tl = gsap.timeline({ onComplete: () => this._hintUpdate() }));
    if (!was) {
      tl.fromTo(heads, { opacity: 0, y: -18, z: -60, rotationX: 10 }, { opacity: 1, y: 0, z: 0, rotationX: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, clearProps: 'transform' }, 0.25);
      tl.fromTo(this.scan, { '--pd-open': 0 }, { '--pd-open': 1, duration: 0.9, ease: 'power2.out' }, 0.35);
    } else {
      tl.fromTo(this.head, { opacity: 0.4 }, { opacity: 1, duration: 0.35 }, 0);
    }
    tl.fromTo(cells, { opacity: 0, y: 28, z: -90, rotationX: 7 }, { opacity: 1, y: 0, z: 0, rotationX: 0, duration: 0.75, ease: 'power3.out', stagger: 0.075, clearProps: 'transform' }, was ? 0.05 : 0.55);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._pause();
    this._tl?.kill();
    this.hint.classList.remove('is-on');
    const done = () => { if (!this.isOpen) { this.root.hidden = true; this.section.classList.remove('has-dossier'); gsap.set([this.head, this.scan, ...this.grid.children], { clearProps: 'opacity,transform' }); } };
    if (this.reduced) { done(); return; }
    this.section.classList.remove('has-dossier');
    this._tl = gsap.timeline({ onComplete: done })
      .to([...this.grid.children].reverse(), { opacity: 0, y: 16, z: -60, duration: 0.28, ease: 'power2.in', stagger: 0.03 }, 0)
      .to([this.scan, this.head], { opacity: 0, y: -12, duration: 0.3, ease: 'power2.in', stagger: 0.05 }, 0.08);
  }

  /** Foco no cabeçalho (teclado / leitor de tela) sem rolar a página. */
  focus() { this.titleEl.tabIndex = -1; this.titleEl.focus({ preventScroll: true }); }

  dispose() {
    this._pause(); this._tl?.kill(); cancelAnimationFrame(this._rz);
    window.removeEventListener('resize', this._onResize);
    this.root.remove(); this.section.classList.remove('has-dossier');
  }
}

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { projects, planetProjects, ProjectDossier };
