// ─── Lista de palavras em português (tamanhos variados: 5 a 8 letras) ─────────
const WORD_LIST = [
  // 5 letras
  "carro", "porta", "piano", "prato", "floco",
  "cobra", "navio", "plano", "chuva", "festa",
  "gripe", "vento", "forno", "bloco", "crise",
  "curva", "mundo", "pausa", "queda", "terra",
  "sabor", "valor", "amigo", "barco", "calma",
  "drama", "elite", "heroi", "justo", "karma",
  "leite", "nexus", "pedra", "campo", "livro",
  "dueto", "salsa", "radar", "altar", "omega",

  // 6 letras
  "aberto", "bonito", "caneta", "debate", "esfera",
  "fabric", "gelado", "humano", "impeto", "jovial",
  "limite", "metodo", "numero", "objeto", "pagina",
  "quanto", "rapido", "silaba", "telhad", "urbano",
  "viagem", "xadrez", "zarpar", "alarme", "bolsao",
  "cabeca", "dancar", "escola", "flores", "girafa",
  "habito", "ideias", "janela", "kleene", "lancer",
  "mestre", "neutro", "oracle", "pecado", "queijo",

  // 7 letras
  "abstrat", "bateria", "cadeira", "desenho", "esquema",
  "familia", "garagem", "historia", "incrivel","jornada",
  "lancado", "maquina", "natural", "ocidente","palavra",
  "questao", "reserva", "sistema", "termina", "univers",
  "viajant", "website", "xicarea", "yearold", "zincode",
  "abelhas", "carbono", "destino", "estrada", "fortuna",
  "galeria", "harmoni", "impulso", "janeiro", "ketchup",
  "leitura", "memoria", "noticia", "opiniao", "planeta",

  // 8 letras
  "abertura", "batalhar", "calcular", "deposito", "especial",
  "fantasia", "gasolina", "horizont", "industri", "julgando",
  "laborato", "medicina", "nacional", "operacao", "problema",
  "qualquer", "recurso", "silvest", "trabalho", "universo",
  "vitoria", "ambiente", "caminhao", "distanci", "elemento",
  "felidade", "graduado", "hardware", "invencao", "jornalis",
  "conhecer", "discurso", "estudante","floresta", "governo",
  "linguagem","mercado", "negocio", "orgulho", "politica",
];

const MAX_ATTEMPTS = 6;

function createGame() {
  const secret = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  return {
    secret,            // Palavra secreta (não mostrar ao jogador!)
    wordLength: secret.length, // Tamanho real — oculto na UI
    attempts: [],      // Array de tentativas: [{ guess, feedback, alignmentResult }]
    status: "playing", // 'playing' | 'won' | 'lost'
    currentInput: "",  // Input atual do jogador
  };
}

function submitGuess(state, guess, alignFn) {
  if (state.status !== "playing") {
    return { state, error: "O jogo já terminou." };
  }

  const normalized = guess.toLowerCase().trim();

  if (normalized.length < 2) {
    return { state, error: "Digite pelo menos 2 letras." };
  }

  if (!/^[a-záàãâéêíóôõúç]+$/i.test(normalized)) {
    return { state, error: "Use apenas letras." };
  }

  if (state.attempts.length >= MAX_ATTEMPTS) {
    return { state, error: "Número máximo de tentativas atingido." };
  }

  // Calcula o feedback com sequence alignment
  const { feedback, alignment } = alignFn(normalized, state.secret);

  const attempt = {
    guess: normalized,
    feedback,
    alignment,
    attemptNumber: state.attempts.length + 1,
  };

  const newAttempts = [...state.attempts, attempt];

  // Vitória: todas as letras do palpite são 'correct' E o tamanho bate
  const won =
    normalized.length === state.secret.length &&
    feedback.every((f) => f.status === "correct");
  const lost = !won && newAttempts.length >= MAX_ATTEMPTS;

  const newState = {
    ...state,
    attempts: newAttempts,
    currentInput: "",
    status: won ? "won" : lost ? "lost" : "playing",
  };

  return { state: newState };
}

function getKeyboardState(attempts) {
  const priority = { correct: 3, present: 2, absent: 1, unknown: 0 };
  const keyboard = {};

  for (const attempt of attempts) {
    for (const { letter, status } of attempt.feedback) {
      const ch = letter.toLowerCase();
      const current = keyboard[ch] || "unknown";
      if ((priority[status] || 0) > (priority[current] || 0)) {
        keyboard[ch] = status;
      }
    }
  }

  return keyboard;
}


function getEndMessage(state) {
  if (state.status === "won") {
    const n = state.attempts.length;
    const msgs = [
      "Incrível! Acertou de primeira!",
      "Excelente! Apenas 2 tentativas!",
      "Muito bom! 3 tentativas!",
      "Bom trabalho! 4 tentativas",
      "Ufa! Quase não deu...",
      "Na última! Que susto!",
    ];
    return msgs[n - 1] || "Parabéns!";
  }
  if (state.status === "lost") {
    return `Que pena! A palavra era: ${state.secret.toUpperCase()}`;
  }
  return "";
}
