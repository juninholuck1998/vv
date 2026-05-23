// ═══════════════════════════════════════════════
// DATA — constantes do edital, XP, patentes, etc.
// ═══════════════════════════════════════════════

// Data padrão da prova (configurável em Configurações)
const DEFAULT_EXAM_DATE = '2026-07-26';

// Matérias
const MATS = {
  port: { l: 'Portugues',     ico: '📖', c: '#378ADD', bc: 'badge-port' },
  leg:  { l: 'Legislacao',    ico: '⚖️', c: '#22c55e', bc: 'badge-leg'  },
  geo:  { l: 'Geografia MG',  ico: '🗺️', c: '#a78bfa', bc: 'badge-geo'  },
  hist: { l: 'Historia MG',   ico: '🏛️', c: '#fbbf24', bc: 'badge-hist' },
  def:  { l: 'Defesa Civil',  ico: '🛡️', c: '#f472b6', bc: 'badge-def'  },
  rlm:  { l: 'RLM',           ico: '🧮', c: '#34d399', bc: 'badge-rlm'  },
  bio:  { l: 'Biologia',      ico: '🫀', c: '#2dd4bf', bc: 'badge-bio'  },
  fis:  { l: 'Fisica',        ico: '⚡', c: '#fb923c', bc: 'badge-fis'  },
  qui:  { l: 'Quimica',       ico: '🧪', c: '#f87171', bc: 'badge-qui'  }
};

// Tipos de sessão de questão (módulo Questões)
const Q_TIPOS = { aula: 'Aula', rev1: 'Rev.1a', rev2: 'Rev.2a', rev3: 'Rev.3a+', simulado: 'Simulado' };

// XP por evento
const XP_COMPLETE = 100, XP_REV1 = 60, XP_REV2 = 40, XP_REV3 = 25;
const XP_QUESTOES_BLOCK = 10;     // +10 XP a cada 10 questões resolvidas
const XP_SIMULADO_BONUS = 20;     // +20 XP por simulado completo (>=30q)
const XP_BLOCO_OK_BONUS = 5;      // +5 XP por bloco de 10 com >=80% acertos

// Intervalos de revisão espaçada (dias)
const REV_DAYS = [3, 10, 21, 40];

// Patentes / Ranks
const RANKS = [
  { name: 'Soldado',  ico: '🪖', cls: 'rank-Soldado',  min: 0,    max: 499,      next: 500  },
  { name: 'Cabo',     ico: '⭐', cls: 'rank-Cabo',     min: 500,  max: 1499,     next: 1500 },
  { name: 'Sargento', ico: '🎖️', cls: 'rank-Sargento', min: 1500, max: 3999,     next: 4000 },
  { name: 'Tenente',  ico: '🔱', cls: 'rank-Tenente',  min: 4000, max: 7999,     next: 8000 },
  { name: 'Capitao',  ico: '🏅', cls: 'rank-Capitao',  min: 8000, max: Infinity, next: null }
];

// Tópicos do edital — UMA ENTRADA POR ID. Toda aula = 30 min.
const TOPICS = [
  // ── PORTUGUÊS (Sequência Didática — 6 fases) ───────────────
  // Fase 1 — Base fonético-ortográfica
  { id:'p01',mat:'port',cod:'Fase 1',nome:'Emprego da acentuacao grafica — Fonetica Basica',aulas:1,dur:30,imp:'a' },
  { id:'p02',mat:'port',cod:'Fase 1',nome:'Emprego da acentuacao grafica — Regras de Acentuacao',aulas:1,dur:30,imp:'a' },
  { id:'p03',mat:'port',cod:'Fase 1',nome:'Emprego das letras — Aula 01',aulas:1,dur:30,imp:'a' },
  { id:'p04',mat:'port',cod:'Fase 1',nome:'Emprego das letras — Aula 02',aulas:1,dur:30,imp:'a' },
  // Fase 2 — Morfologia completa
  { id:'p05',mat:'port',cod:'Fase 2',nome:'Formacao de Palavras — Aula 01',aulas:1,dur:30,imp:'a' },
  { id:'p06',mat:'port',cod:'Fase 2',nome:'Formacao de Palavras — Aula 02',aulas:1,dur:30,imp:'a' },
  { id:'p07',mat:'port',cod:'Fase 2',nome:'Substantivos',aulas:1,dur:30,imp:'a' },
  { id:'p08',mat:'port',cod:'Fase 2',nome:'Adjetivos',aulas:1,dur:30,imp:'a' },
  { id:'p09',mat:'port',cod:'Fase 2',nome:'Artigos',aulas:1,dur:30,imp:'a' },
  { id:'p10',mat:'port',cod:'Fase 2',nome:'Numerais',aulas:1,dur:30,imp:'a' },
  { id:'p11',mat:'port',cod:'Fase 2',nome:'Pronomes — Aula 07',aulas:1,dur:30,imp:'a' },
  { id:'p12',mat:'port',cod:'Fase 2',nome:'Pronomes — Aula 08',aulas:1,dur:30,imp:'a' },
  { id:'p13',mat:'port',cod:'Fase 2',nome:'Pronomes — Aula 09',aulas:1,dur:30,imp:'a' },
  { id:'p14',mat:'port',cod:'Fase 2',nome:'Verbos',aulas:1,dur:30,imp:'a' },
  { id:'p15',mat:'port',cod:'Fase 2',nome:'Adverbios',aulas:1,dur:30,imp:'a' },
  { id:'p16',mat:'port',cod:'Fase 2',nome:'Preposicoes',aulas:1,dur:30,imp:'a' },
  { id:'p17',mat:'port',cod:'Fase 2',nome:'Conjuncoes',aulas:1,dur:30,imp:'a' },
  { id:'p18',mat:'port',cod:'Fase 2',nome:'Interjeicoes',aulas:1,dur:30,imp:'a' },
  // Fase 3 — Sintaxe
  { id:'p19',mat:'port',cod:'Fase 3',nome:'Sintaxe — Introducao',aulas:1,dur:30,imp:'a' },
  { id:'p20',mat:'port',cod:'Fase 3',nome:'Sujeito',aulas:1,dur:30,imp:'a' },
  { id:'p21',mat:'port',cod:'Fase 3',nome:'Transitividade e Objetos',aulas:1,dur:30,imp:'a' },
  { id:'p22',mat:'port',cod:'Fase 3',nome:'Verbo de Ligacao e Tipos de Predicado',aulas:1,dur:30,imp:'a' },
  { id:'p23',mat:'port',cod:'Fase 3',nome:'Termos Integrantes',aulas:1,dur:30,imp:'a' },
  { id:'p24',mat:'port',cod:'Fase 3',nome:'Vozes Verbais',aulas:1,dur:30,imp:'a' },
  { id:'p25',mat:'port',cod:'Fase 3',nome:'Adjunto Adnominal — Aula 07',aulas:1,dur:30,imp:'a' },
  { id:'p26',mat:'port',cod:'Fase 3',nome:'Adjunto Adnominal — Aula 08',aulas:1,dur:30,imp:'a' },
  { id:'p27',mat:'port',cod:'Fase 3',nome:'Adjuntos Adverbiais',aulas:1,dur:30,imp:'a' },
  { id:'p28',mat:'port',cod:'Fase 3',nome:'Aposto e Vocativo',aulas:1,dur:30,imp:'a' },
  // Fase 4 — Gramática aplicada ao texto
  { id:'p29',mat:'port',cod:'Fase 4',nome:'Emprego/correlacao de tempos e modos verbais — Aula 01',aulas:1,dur:30,imp:'a' },
  { id:'p30',mat:'port',cod:'Fase 4',nome:'Emprego/correlacao de tempos e modos verbais — Aula 02',aulas:1,dur:30,imp:'a' },
  { id:'p31',mat:'port',cod:'Fase 4',nome:'Relacoes de coordenacao e subordinacao — Introducao',aulas:1,dur:30,imp:'a' },
  { id:'p32',mat:'port',cod:'Fase 4',nome:'Oracoes Substantivas',aulas:1,dur:30,imp:'a' },
  { id:'p33',mat:'port',cod:'Fase 4',nome:'Oracoes Adjetivas',aulas:1,dur:30,imp:'a' },
  { id:'p34',mat:'port',cod:'Fase 4',nome:'Oracoes Adverbiais',aulas:1,dur:30,imp:'a' },
  { id:'p35',mat:'port',cod:'Fase 4',nome:'Oracoes Coordenadas',aulas:1,dur:30,imp:'a' },
  { id:'p36',mat:'port',cod:'Fase 4',nome:'Coordenacao/Subordinacao — Exercicios',aulas:1,dur:30,imp:'a' },
  { id:'p37',mat:'port',cod:'Fase 4',nome:'Concordancia nominal',aulas:1,dur:30,imp:'a' },
  { id:'p38',mat:'port',cod:'Fase 4',nome:'Concordancia verbal',aulas:1,dur:30,imp:'a' },
  { id:'p39',mat:'port',cod:'Fase 4',nome:'Concordancia — Exercicios',aulas:1,dur:30,imp:'a' },
  { id:'p40',mat:'port',cod:'Fase 4',nome:'Emprego dos sinais de pontuacao — Virgula',aulas:1,dur:30,imp:'a' },
  { id:'p41',mat:'port',cod:'Fase 4',nome:'Demais sinais de pontuacao',aulas:1,dur:30,imp:'a' },
  { id:'p42',mat:'port',cod:'Fase 4',nome:'Pontuacao — Exercicios',aulas:1,dur:30,imp:'a' },
  { id:'p43',mat:'port',cod:'Fase 4',nome:'Emprego do sinal indicativo de crase — Teoria',aulas:1,dur:30,imp:'a' },
  { id:'p44',mat:'port',cod:'Fase 4',nome:'Crase — Exercicios',aulas:1,dur:30,imp:'a' },
  { id:'p45',mat:'port',cod:'Fase 4',nome:'Colocacao dos pronomes atonos — Teoria',aulas:1,dur:30,imp:'a' },
  { id:'p46',mat:'port',cod:'Fase 4',nome:'Colocacao dos pronomes atonos — Exercicios',aulas:1,dur:30,imp:'a' },
  // Fase 5 — Coesão e coerência textual
  { id:'p47',mat:'port',cod:'Fase 5',nome:'Elementos de referenciacao, substituicao, conectores e sequenciacao textual — Aula 01',aulas:1,dur:30,imp:'a' },
  { id:'p48',mat:'port',cod:'Fase 5',nome:'Elementos de referenciacao, substituicao, conectores e sequenciacao textual — Aula 02',aulas:1,dur:30,imp:'a' },
  // Fase 6 — Leitura e interpretação de textos
  { id:'p49',mat:'port',cod:'Fase 6',nome:'Reconhecimento de tipos e generos textuais — Teoria',aulas:1,dur:30,imp:'a' },
  { id:'p50',mat:'port',cod:'Fase 6',nome:'Reconhecimento de tipos e generos textuais — Exercicios',aulas:1,dur:30,imp:'a' },
  { id:'p51',mat:'port',cod:'Fase 6',nome:'Compreensao e interpretacao de textos — Conceitos — Aula 01',aulas:1,dur:30,imp:'a' },
  { id:'p52',mat:'port',cod:'Fase 6',nome:'Compreensao e interpretacao de textos — Conceitos — Aula 02',aulas:1,dur:30,imp:'a' },
  // ── LEGISLAÇÃO ─────────────────────────────────────────────
  { id:'l01',mat:'leg',cod:'6.1',nome:'Direitos fundamentais pt.1',aulas:6,dur:30,imp:'a' },
  { id:'l02',mat:'leg',cod:'6.2',nome:'Direitos fundamentais pt.2',aulas:7,dur:30,imp:'a' },
  { id:'l03',mat:'leg',cod:'6.3',nome:'Direitos fundamentais pt.3',aulas:7,dur:30,imp:'a' },
  { id:'l04',mat:'leg',cod:'6.4',nome:'Adm publica e militares dos estados',aulas:3,dur:30,imp:'a' },
  { id:'l05',mat:'leg',cod:'6.5',nome:'Organizacao judiciaria dos estados',aulas:1,dur:30,imp:'a' },
  { id:'l06',mat:'leg',cod:'6.6',nome:'Forcas armadas e seguranca publica',aulas:1,dur:30,imp:'a' },
  { id:'l07',mat:'leg',cod:'6.7',nome:'Lei 4657/42',aulas:1,dur:30,imp:'a' },
  { id:'l08',mat:'leg',cod:'6.8',nome:'Conceitos DH',aulas:4,dur:30,imp:'a' },
  { id:'l09',mat:'leg',cod:'6.9',nome:'PIDCP',aulas:2,dur:30,imp:'a' },
  { id:'l10',mat:'leg',cod:'6.10',nome:'PIDESC',aulas:1,dur:30,imp:'a' },
  { id:'l11',mat:'leg',cod:'6.11',nome:'ONU',aulas:1,dur:30,imp:'a' },
  { id:'l12',mat:'leg',cod:'6.12',nome:'DUDH',aulas:2,dur:30,imp:'a' },
  { id:'l13',mat:'leg',cod:'6.13',nome:'CADH',aulas:3,dur:30,imp:'a' },
  { id:'l14',mat:'leg',cod:'6.14',nome:'Lei 5301/69 e Constituicao MG',aulas:7,dur:30,imp:'a' },
  // ── GEOGRAFIA ──────────────────────────────────────────────
  { id:'g01',mat:'geo',cod:'1.1',nome:'Relevo',aulas:2,dur:30,imp:'a' },
  { id:'g02',mat:'geo',cod:'1.2',nome:'Vegetacao',aulas:2,dur:30,imp:'a' },
  { id:'g03',mat:'geo',cod:'1.3',nome:'Hidrografia',aulas:1,dur:30,imp:'a' },
  { id:'g04',mat:'geo',cod:'1.4',nome:'Hidreletricas, mineracao, barragens, cavernas',aulas:2,dur:30,imp:'a' },
  { id:'g05',mat:'geo',cod:'1.5',nome:'Divisao regional de MG',aulas:1,dur:30,imp:'a' },
  // ── HISTÓRIA ───────────────────────────────────────────────
  { id:'h01',mat:'hist',cod:'2',nome:'Historia de MG',aulas:5,dur:30,imp:'a' },
  // ── DEFESA CIVIL ───────────────────────────────────────────
  { id:'d01',mat:'def',cod:'3',nome:'Defesa Civil',aulas:3,dur:30,imp:'a' },
  // ── RLM (Raciocínio Lógico-Matemático) ─────────────────────
  { id:'r01',mat:'rlm',cod:'RLM · Aula 01',nome:'Proposicoes — Definicao, Reconhecimento, Principios',aulas:1,dur:30,imp:'a' },
  { id:'r02',mat:'rlm',cod:'RLM · Aula 02',nome:'Proposicoes — Definicao, Reconhecimento, Principios — QUESTOES',aulas:1,dur:30,imp:'a' },
  { id:'r03',mat:'rlm',cod:'RLM · Aula 03',nome:'Classificacao das proposicoes, representacao simbolica e conectivos',aulas:1,dur:30,imp:'a' },
  { id:'r04',mat:'rlm',cod:'RLM · Aula 04',nome:'Negacao de proposicao composta — 1',aulas:1,dur:30,imp:'a' },
  { id:'r05',mat:'rlm',cod:'RLM · Aula 05',nome:'Negacao de proposicao composta — 2',aulas:1,dur:30,imp:'a' },
  { id:'r06',mat:'rlm',cod:'RLM · Aula 06',nome:'Negacao de proposicao composta — 3',aulas:1,dur:30,imp:'a' },
  { id:'r07',mat:'rlm',cod:'RLM · Aula 07',nome:'Equivalencias — 1',aulas:1,dur:30,imp:'a' },
  { id:'r08',mat:'rlm',cod:'RLM · Aula 08',nome:'Equivalencias — 2',aulas:1,dur:30,imp:'a' },
  { id:'r09',mat:'rlm',cod:'RLM · Aula 09',nome:'Equivalencias — 3',aulas:1,dur:30,imp:'a' },
  { id:'r10',mat:'rlm',cod:'RLM · Aula 10',nome:'Operacoes com conjuntos',aulas:1,dur:30,imp:'a' },
  // ── BIOLOGIA ───────────────────────────────────────────────
  { id:'b01',mat:'bio',cod:'00-007',nome:'Introducao ao corpo humano (modulos 00-007)',aulas:9,dur:20,imp:'a' },
  { id:'b02',mat:'bio',cod:'1.1/1.2',nome:'Posicao anatomica e divisoes do corpo',aulas:1,dur:20,imp:'ma' },
  { id:'b03',mat:'bio',cod:'1.5',nome:'Sistema cardiovascular completo',aulas:14,dur:20,imp:'ma' },
  { id:'b04',mat:'bio',cod:'SBV',nome:'Suporte Basico de Vida',aulas:11,dur:30,imp:'ma' },
  { id:'b05',mat:'bio',cod:'Agr.CV',nome:'Agravos Cardiovasculares',aulas:6,dur:30,imp:'ma' },
  { id:'b06',mat:'bio',cod:'Agr.Resp',nome:'Agravos Respiratorios',aulas:5,dur:30,imp:'ma' },
  { id:'b07',mat:'bio',cod:'Agr.Neur',nome:'Agravos Neurologicos',aulas:5,dur:30,imp:'ma' },
  { id:'b08',mat:'bio',cod:'1.3',nome:'Sistema esqueletico',aulas:10,dur:20,imp:'a' },
  { id:'b09',mat:'bio',cod:'1.4',nome:'Sistema muscular',aulas:8,dur:20,imp:'a' },
  { id:'b10',mat:'bio',cod:'1.6',nome:'Sistema respiratorio',aulas:11,dur:20,imp:'a' },
  { id:'b11',mat:'bio',cod:'1.7',nome:'Sistema nervoso',aulas:18,dur:20,imp:'a' },
  { id:'b12',mat:'bio',cod:'Agr.End',nome:'Agravos Endocrinologicos',aulas:7,dur:30,imp:'a' },
  { id:'b13',mat:'bio',cod:'Agr.Ren',nome:'Agravos Renais e Urologicos',aulas:5,dur:30,imp:'a' },
  { id:'b14',mat:'bio',cod:'1.8/1.9',nome:'Sistema digestorio e quadrantes abdominais',aulas:10,dur:20,imp:'m' },
  { id:'b15',mat:'bio',cod:'1.10',nome:'Sistema geniturinario',aulas:11,dur:20,imp:'m' },
  { id:'b16',mat:'bio',cod:'Hom',nome:'Homeostase e Regulacao',aulas:1,dur:30,imp:'b' },
  // ── FÍSICA ─────────────────────────────────────────────────
  { id:'f01',mat:'fis',cod:'3.4',nome:'Corrente eletrica',aulas:2,dur:30,imp:'ma' },
  { id:'f02',mat:'fis',cod:'3.5',nome:'Potencia eletrica e resistores',aulas:3,dur:30,imp:'ma' },
  { id:'f03',mat:'fis',cod:'3.6',nome:'Circuitos eletricos',aulas:3,dur:30,imp:'ma' },
  { id:'f04',mat:'fis',cod:'1.1',nome:'Cinematica escalar',aulas:6,dur:30,imp:'ma' },
  { id:'f05',mat:'fis',cod:'1.2',nome:'Cinematica vetorial',aulas:5,dur:30,imp:'ma' },
  { id:'f06',mat:'fis',cod:'1.4',nome:'Leis de Newton',aulas:6,dur:30,imp:'ma' },
  { id:'f07',mat:'fis',cod:'3.2',nome:'Campo eletrico',aulas:2,dur:30,imp:'a' },
  { id:'f08',mat:'fis',cod:'3.3',nome:'Potencial eletrico',aulas:2,dur:30,imp:'a' },
  { id:'f09',mat:'fis',cod:'1.5/1.6/1.7',nome:'Trabalho, potencia e energia',aulas:4,dur:30,imp:'a' },
  { id:'f10',mat:'fis',cod:'1.8',nome:'Impulso e quantidade de movimento',aulas:4,dur:30,imp:'a' },
  { id:'f11',mat:'fis',cod:'2.2',nome:'Temperatura e dilatacao termica',aulas:3,dur:30,imp:'a' },
  { id:'f12',mat:'fis',cod:'2.3',nome:'Calor especifico',aulas:3,dur:30,imp:'a' },
  { id:'f13',mat:'fis',cod:'2.4/2.5',nome:'Mudanca de fase e diagrama',aulas:7,dur:30,imp:'a' },
  { id:'f14',mat:'fis',cod:'2.6',nome:'Propagacao do calor',aulas:3,dur:30,imp:'a' },
  { id:'f15',mat:'fis',cod:'2.10/2.11/2.12',nome:'Leis da termodinamica',aulas:6,dur:30,imp:'a' },
  { id:'f16',mat:'fis',cod:'3.1',nome:'Eletricidade — introducao',aulas:2,dur:30,imp:'m' },
  { id:'f17',mat:'fis',cod:'1.3',nome:'Movimento circular',aulas:5,dur:30,imp:'m' },
  { id:'f18',mat:'fis',cod:'1.9',nome:'Estatica dos corpos rigidos',aulas:2,dur:30,imp:'m' },
  { id:'f19',mat:'fis',cod:'1.10/1.11',nome:'Estatica dos fluidos',aulas:4,dur:30,imp:'m' },
  { id:'f20',mat:'fis',cod:'2.1',nome:'Calor e temperatura',aulas:4,dur:30,imp:'m' },
  { id:'f21',mat:'fis',cod:'2.7',nome:'Teoria cinetica dos gases',aulas:2,dur:30,imp:'m' },
  { id:'f22',mat:'fis',cod:'2.8/2.9',nome:'Energia interna e lei de Joule',aulas:4,dur:30,imp:'m' },
  // ── QUÍMICA ────────────────────────────────────────────────
  { id:'q01',mat:'qui',cod:'2.1',nome:'Teoria Atomico-Molecular e estequiometria base',aulas:6,dur:30,imp:'ma' },
  { id:'q02',mat:'qui',cod:'2.2',nome:'Formulas quimicas',aulas:1,dur:30,imp:'ma' },
  { id:'q03',mat:'qui',cod:'8.3',nome:'Pilhas e acumuladores',aulas:2,dur:30,imp:'ma' },
  { id:'q04',mat:'qui',cod:'8.4',nome:'Eletrolise',aulas:4,dur:30,imp:'ma' },
  { id:'q05',mat:'qui',cod:'9.2',nome:'Leis dos gases',aulas:4,dur:30,imp:'ma' },
  { id:'q06',mat:'qui',cod:'1.3',nome:'Configuracao eletronica dos elementos',aulas:2,dur:30,imp:'a' },
  { id:'q07',mat:'qui',cod:'1.4',nome:'Propriedades periodicas e aperiodicas',aulas:2,dur:30,imp:'a' },
  { id:'q08',mat:'qui',cod:'3.1',nome:'Ligacoes ionica, covalente e metalica',aulas:3,dur:30,imp:'a' },
  { id:'q09',mat:'qui',cod:'3.2',nome:'Ligacoes intra e intermoleculares',aulas:6,dur:30,imp:'a' },
  { id:'q10',mat:'qui',cod:'2.3',nome:'Calculos estequiometricos',aulas:6,dur:30,imp:'a' },
  { id:'q11',mat:'qui',cod:'4.3',nome:'Caracteristicas de gases, liquidos e solidos',aulas:2,dur:30,imp:'a' },
  { id:'q12',mat:'qui',cod:'4.4',nome:'Ligacoes quimicas nos estados da materia',aulas:2,dur:30,imp:'a' },
  { id:'q13',mat:'qui',cod:'5.1',nome:'Mistura e Solucao',aulas:7,dur:30,imp:'a' },
  { id:'q14',mat:'qui',cod:'5.2',nome:'Propriedades coligativas',aulas:5,dur:30,imp:'a' },
  { id:'q15',mat:'qui',cod:'6.1/6.2/6.3',nome:'Cinetica quimica',aulas:4,dur:30,imp:'a' },
  { id:'q16',mat:'qui',cod:'7',nome:'Equilibrio quimico (pt.1+2+3)',aulas:16,dur:30,imp:'a' },
  { id:'q17',mat:'qui',cod:'8.1/8.2',nome:'Oxirreducao e espontaneidade',aulas:4,dur:30,imp:'a' },
  { id:'q18',mat:'qui',cod:'1.1/1.2',nome:'Tabela Periodica — historico e classificacao',aulas:3,dur:30,imp:'m' },
  { id:'q19',mat:'qui',cod:'4.1/4.2/4.5',nome:'Estados da materia, mudancas, separacao',aulas:7,dur:30,imp:'m' },
  { id:'q20',mat:'qui',cod:'8.5/9.1/9.3/9.4',nome:'Corrosao, teoria cinetica, gases reais',aulas:4,dur:30,imp:'m' }
];
