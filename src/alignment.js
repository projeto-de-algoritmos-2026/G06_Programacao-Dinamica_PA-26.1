function sequenceAlignment(s1, s2, costs = { match: 0, mismatch: 1, gap: 1 }) {
  const m = s1.length;
  const n = s2.length;

  // ─── 1. Inicialização da matriz DP ────────────────────────────────────────
  // dp[i][j] = custo mínimo para alinhar s1[0..i-1] com s2[0..j-1]
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
  }

  // Caso base: alinhar com string vazia custa i * gap
  for (let i = 0; i <= m; i++) dp[i][0] = i * costs.gap;
  for (let j = 0; j <= n; j++) dp[0][j] = j * costs.gap;

  // ─── 2. Preenchimento da matriz (recorrência) ─────────────────────────────
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const isMatch = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase();
      const substitutionCost = isMatch ? costs.match : costs.mismatch;

      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + substitutionCost, // diagonal: substituição/match
        dp[i - 1][j] + costs.gap,             // cima:     deleção em s1
        dp[i][j - 1] + costs.gap              // esquerda: inserção em s1
      );
    }
  }

  // ─── 3. Traceback: reconstrói o alinhamento ótimo ────────────────────────
  const alignment = traceback(s1, s2, dp, costs);

  // ─── 4. Score de similaridade normalizado [0, 1] ─────────────────────────
  const maxDistance = Math.max(m, n) * costs.gap;
  const distance = dp[m][n];
  const similarity = maxDistance > 0 ? 1 - distance / maxDistance : 1;

  return {
    dp,           // Matriz DP completa (para visualização)
    distance,     // Distância de edição (valor em dp[m][n])
    similarity,   // Score normalizado: 1.0 = palavras idênticas
    alignment,    // { aligned1, aligned2, operations } — traceback
    s1,
    s2,
  };
}


function traceback(s1, s2, dp, costs) {
  let i = s1.length;
  let j = s2.length;
  let aligned1 = "";
  let aligned2 = "";
  const operations = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const isMatch = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase();
      const diagCost = isMatch ? costs.match : costs.mismatch;

      if (dp[i][j] === dp[i - 1][j - 1] + diagCost) {
        // Veio da diagonal → match ou mismatch
        aligned1 = s1[i - 1] + aligned1;
        aligned2 = s2[j - 1] + aligned2;
        operations.unshift(isMatch ? "match" : "mismatch");
        i--;
        j--;
      } else if (dp[i][j] === dp[i - 1][j] + costs.gap) {
        // Veio de cima → gap em s2 (deleção)
        aligned1 = s1[i - 1] + aligned1;
        aligned2 = "-" + aligned2;
        operations.unshift("gap");
        i--;
      } else {
        // Veio da esquerda → gap em s1 (inserção)
        aligned1 = "-" + aligned1;
        aligned2 = s2[j - 1] + aligned2;
        operations.unshift("gap");
        j--;
      }
    } else if (i > 0) {
      aligned1 = s1[i - 1] + aligned1;
      aligned2 = "-" + aligned2;
      operations.unshift("gap");
      i--;
    } else {
      aligned1 = "-" + aligned1;
      aligned2 = s2[j - 1] + aligned2;
      operations.unshift("gap");
      j--;
    }
  }

  return { aligned1, aligned2, operations };
}


function getLetterFeedback(guess, secret) {
  const result = sequenceAlignment(guess, secret);
  const feedback = [];

  // Conta letras disponíveis na palavra secreta
  const secretLetterCount = {};
  for (const ch of secret.toLowerCase()) {
    secretLetterCount[ch] = (secretLetterCount[ch] || 0) + 1;
  }

  // Primeira passagem: marca os 'correct' e decrementa o contador
  const usedInSecret = { ...secretLetterCount };
  const statuses = new Array(guess.length).fill(null);

  for (let i = 0; i < guess.length; i++) {
    const ch = guess[i].toLowerCase();
    if (i < secret.length && ch === secret[i].toLowerCase()) {
      statuses[i] = "correct";
      usedInSecret[ch]--;
    }
  }

  // Segunda passagem: marca 'present' ou 'absent'
  for (let i = 0; i < guess.length; i++) {
    if (statuses[i] !== null) continue;
    const ch = guess[i].toLowerCase();
    if (usedInSecret[ch] > 0) {
      statuses[i] = "present";
      usedInSecret[ch]--;
    } else {
      statuses[i] = "absent";
    }
  }

  for (let i = 0; i < guess.length; i++) {
    feedback.push({ letter: guess[i], status: statuses[i] });
  }

  return { feedback, alignment: result };
}
