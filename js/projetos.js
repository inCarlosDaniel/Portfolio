/**
 * PROJETOS — cadastro dos projetos (o painel que abre ao clicar num planeta fica em js/sistema-solar.js).
 *   1. Cadastro dos projetos (edite aqui)
 *   2. Projeto de cada planeta
 */

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

/* ===== O QUE OS OUTROS ARQUIVOS USAM DESTE ===== */
export { projects, planetProjects };
