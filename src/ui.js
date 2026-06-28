const $ = (id) => document.getElementById(id);

const DOM = {
  board: $("board"),
  input: $("guess-input"),
  submitBtn: $("submit-btn"),
  resetBtn: $("reset-btn"),
  message: $("message"),
  keyboard: $("keyboard"),
  dpMatrixContainer: $("dp-matrix-container"),
  dpAlignmentContainer: $("dp-alignment-container"),
  dpStats: $("dp-stats"),
  dpSection: $("dp-section"),
  lengthHint: $("length-hint"),
};

const KB_ROWS = [
  ["q","w","e","r","t","y","u","i","o","p"],
  ["a","s","d","f","g","h","j","k","l"],
  ["ENTER","z","x","c","v","b","n","m","⌫"],
];

// ─── Tabuleiro ────────────────────────────────────────────────────────────────

function initBoard(maxAttempts) {
  DOM.board.innerHTML = "";
  for (let r = 0; r < maxAttempts; r++) {
    const row = document.createElement("div");
    row.className = "row row-empty";
    row.id = `row-${r}`;
    // Placeholder visual para a linha ainda não usada
    const placeholder = document.createElement("div");
    placeholder.className = "row-placeholder";
    row.appendChild(placeholder);
    DOM.board.appendChild(row);
  }
}

function updateCurrentRowDisplay(rowIndex, currentInput) {
  const row = $(`row-${rowIndex}`);
  if (!row) return;

  // Reconstrói os tiles conforme o input cresce/diminui
  row.innerHTML = "";
  row.classList.remove("row-empty");

  if (currentInput.length === 0) {
    row.classList.add("row-empty");
    const placeholder = document.createElement("div");
    placeholder.className = "row-placeholder";
    row.appendChild(placeholder);
    return;
  }

  for (let c = 0; c < currentInput.length; c++) {
    const tile = document.createElement("div");
    tile.className = "tile tile-dynamic";
    tile.id = `tile-${rowIndex}-${c}`;
    tile.textContent = currentInput[c].toUpperCase();
    tile.dataset.filled = "true";

    // Animação de pop apenas na última letra adicionada
    if (c === currentInput.length - 1) {
      void tile.offsetWidth;
      tile.classList.add("pop");
    }
    row.appendChild(tile);
  }
}

function revealRow(rowIndex, feedback) {
  const row = $(`row-${rowIndex}`);
  if (!row) return;

  // Limpa o estado de digitação e popula com tiles fixos
  row.innerHTML = "";
  row.classList.remove("row-empty");

  feedback.forEach(({ letter, status }, col) => {
    const tile = document.createElement("div");
    tile.className = "tile tile-dynamic";
    tile.id = `tile-${rowIndex}-${col}`;
    tile.textContent = letter.toUpperCase();
    row.appendChild(tile);

    const delay = col * 110;
    setTimeout(() => {
      tile.classList.add("flip");
      setTimeout(() => {
        tile.dataset.status = status;
        tile.classList.remove("flip");
      }, 250);
    }, delay);
  });
}

function shakeRow(rowIndex) {
  const row = $(`row-${rowIndex}`);
  if (!row) return;
  row.querySelectorAll(".tile").forEach((t) => {
    t.classList.remove("shake");
    void t.offsetWidth;
    t.classList.add("shake");
  });
  // Shake no placeholder se a linha estiver vazia
  const ph = row.querySelector(".row-placeholder");
  if (ph) {
    ph.classList.remove("shake");
    void ph.offsetWidth;
    ph.classList.add("shake");
  }
}

// ─── Dica de comprimento ──────────────────────────────────────────────────────
function updateLengthHint(attempts) {
  if (!DOM.lengthHint) return;
  if (attempts.length === 0) {
    DOM.lengthHint.textContent = "Tente adivinhar o tamanho da palavra!";
    return;
  }
  const last = attempts[attempts.length - 1];
  const dist = last.alignment.distance;
  const guessLen = last.guess.length;
  const sim = (last.alignment.similarity * 100).toFixed(0);

  let hint = `Último: "${last.guess.toUpperCase()}" (${guessLen} letras) → distância ${dist}, similaridade ${sim}%`;
  DOM.lengthHint.textContent = hint;
}

// ─── Teclado Virtual ──────────────────────────────────────────────────────────

function initKeyboard(onKey) {
  DOM.keyboard.innerHTML = "";
  KB_ROWS.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    row.forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "kb-key" + (key.length > 1 ? " wide" : "");
      btn.textContent = key;
      btn.dataset.key = key;
      btn.addEventListener("click", () => onKey(key));
      rowEl.appendChild(btn);
    });
    DOM.keyboard.appendChild(rowEl);
  });
}

function updateKeyboard(keyboardState) {
  document.querySelectorAll(".kb-key").forEach((btn) => {
    const key = btn.dataset.key.toLowerCase();
    const status = keyboardState[key];
    if (status) btn.dataset.status = status;
  });
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

function showMessage(text, type = "info") {
  DOM.message.textContent = text;
  DOM.message.className = type;
}

function clearMessage() {
  DOM.message.textContent = "";
  DOM.message.className = "";
}

// ─── Visualização da Matriz DP ────────────────────────────────────────────────

function renderDPMatrix(alignmentResult) {
  const { dp, s1, s2 } = alignmentResult;

  const pathSet = new Set();
  buildTracebackPath(dp, s1, s2, pathSet);

  let html = '<table class="dp-table">';
  html += "<thead><tr>";
  html += `<th></th><th style="color:var(--dp-accent)">-</th>`;
  for (const ch of s2.toUpperCase()) {
    html += `<th style="color:var(--dp-accent)">${ch}</th>`;
  }
  html += "</tr></thead><tbody>";

  for (let i = 0; i <= s1.length; i++) {
    html += "<tr>";
    const rowLabel = i === 0 ? "-" : s1[i - 1].toUpperCase();
    html += `<th style="color:var(--dp-accent)">${rowLabel}</th>`;
    for (let j = 0; j <= s2.length; j++) {
      const key = `${i},${j}`;
      const isPath = pathSet.has(key);
      const isMatch = i > 0 && j > 0 && s1[i-1].toLowerCase() === s2[j-1].toLowerCase();
      let cls = "dp-cell";
      if (isPath) cls += " dp-cell-path";
      else if (isMatch) cls += " dp-cell-match";
      else if (i === 0 || j === 0) cls += " dp-cell-highlight";
      html += `<td class="${cls}" title="dp[${i}][${j}]=${dp[i][j]}">${dp[i][j]}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table>";
  DOM.dpMatrixContainer.innerHTML = html;
}

function buildTracebackPath(dp, s1, s2, pathSet) {
  const costs = { match: 0, mismatch: 1, gap: 1 };
  let i = s1.length, j = s2.length;
  while (i > 0 || j > 0) {
    pathSet.add(`${i},${j}`);
    if (i > 0 && j > 0) {
      const isMatch = s1[i-1].toLowerCase() === s2[j-1].toLowerCase();
      const diagCost = isMatch ? costs.match : costs.mismatch;
      if (dp[i][j] === dp[i-1][j-1] + diagCost) { i--; j--; }
      else if (dp[i][j] === dp[i-1][j] + costs.gap) { i--; }
      else { j--; }
    } else if (i > 0) { i--; }
    else { j--; }
  }
  pathSet.add("0,0");
}

// ─── Alinhamento Textual ──────────────────────────────────────────────────────

function renderAlignment(alignmentResult) {
  const { alignment, similarity, distance } = alignmentResult;
  const { aligned1, aligned2, operations } = alignment;

  const pct = (similarity * 100).toFixed(0);
  DOM.dpStats.innerHTML = `
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-value">${distance}</div>
        <div class="stat-label">Distância</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${pct}%</div>
        <div class="stat-label">Similaridade</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${operations.filter(o=>o==="match").length}</div>
        <div class="stat-label">Matches</div>
      </div>
    </div>
  `;

  const opIcons = { match: "✓", mismatch: "✗", gap: "·" };
  const opColors = { match: "var(--correct)", mismatch: "#f87171", gap: "var(--text-muted)" };

  function makeChars(str, ops) {
    return str.split("").map((ch, i) => {
      const op = ops[i] || "gap";
      return `<span class="align-ch ${op}">${ch.toUpperCase()}</span>`;
    }).join("");
  }

  DOM.dpAlignmentContainer.innerHTML = `
    <div class="alignment-display">
      <div class="align-line">
        <span class="align-label">palpite</span>
        <div class="align-chars">${makeChars(aligned1, operations)}</div>
      </div>
      <div class="align-line align-ops-line">
        <span class="align-label"></span>
        <div class="align-chars align-ops-row">${operations.map(op => `<span class="op-icon" style="color:${opColors[op]}">${opIcons[op]}</span>`).join("")}</div>
      </div>
      <div class="align-line">
        <span class="align-label">secreta</span>
        <div class="align-chars">${makeChars(aligned2, operations)}</div>
      </div>
    </div>
  `;
}
