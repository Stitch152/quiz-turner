// ============================================================
// script.js — Quiz Síndrome de Turner
// Firebase Modular SDK v12 (type="module")
// ============================================================

import { initializeApp,
         getApps,
         getApp }                 from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore,
         collection,
         addDoc,
         query,
         orderBy,
         onSnapshot,
         serverTimestamp }        from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ── Configuração Firebase ─────────────────────────────────
// Substitua os valores abaixo pelos do seu projeto se mudar.
const firebaseConfig = {
  apiKey:            "AIzaSyBNb5eOXQyGJEImUmFdTf1CDMrSvjo5Cr8",
  authDomain:        "trabalho-faculdade-85d9f.firebaseapp.com",
  projectId:         "trabalho-faculdade-85d9f",
  storageBucket:     "trabalho-faculdade-85d9f.firebasestorage.app",
  messagingSenderId: "529348366136",
  appId:             "1:529348366136:web:0d741b2259a08704f77bcd",
  measurementId:     "G-PX7VB80P72"
};

// ── Dados do quiz ─────────────────────────────────────────
const questions = [
  {
    text:        'Qual é o cariótipo característico da Síndrome de Turner?',
    options:     ['47,XXY', '45,X', '46,XY', '46,XX'],
    answer:      1,
    difficulty:  'easy',
    points:      1,
    explanation: 'O cariótipo típico é 45,X (ausência de um cromossomo X).'
  },
  {
    text:        'Qual é a principal característica física da Síndrome de Turner?',
    options:     ['Alta estatura', 'Baixa estatura', 'Obesidade severa', 'Macrocefalia'],
    answer:      1,
    difficulty:  'easy',
    points:      1,
    explanation: 'A baixa estatura é uma das principais características físicas.'
  },
  {
    text:    'O que é mosaicismo na Síndrome de Turner?',
    options: [
      'Presença de dois tipos de tecidos com diferentes cariótipos',
      'Mutação apenas no cromossomo Y',
      'Alteração apenas hormonal',
      'Infecção genética adquirida'
    ],
    answer:      0,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'Mosaicismo é a presença de dois ou mais tipos celulares com cariótipos diferentes.'
  },
  {
    text:        'Qual problema pode estar associado à Síndrome de Turner?',
    options:     ['Asma', 'Coarctação da aorta', 'Hepatite', 'Catarata infecciosa'],
    answer:      1,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'Coarctação da aorta é uma cardiopatia congênita comum na síndrome.'
  },
  {
    text:    'Sobre o tratamento hormonal na Síndrome de Turner:',
    options: [
      'Estrogênio deve vir antes do GH',
      'GH e estrogênio devem começar juntos na infância',
      'GH deve ser iniciado cedo e estrogênio apenas na adolescência',
      'Nenhum hormônio é usado'
    ],
    answer:      2,
    difficulty:  'hard',
    points:      3,
    explanation: 'O GH é iniciado cedo para crescimento e o estrogênio apenas na adolescência.'
  }
];

const difficulties = {
  easy:   { label: 'Fácil',   cls: 'difficulty-easy'   },
  medium: { label: 'Média',   cls: 'difficulty-medium'  },
  hard:   { label: 'Difícil', cls: 'difficulty-hard'   }
};

const PASSWORD = '140159';

// ── Firebase ──────────────────────────────────────────────
// Como este arquivo é type="module", cada variável aqui é
// local ao módulo — sem nenhum conflito com outros scripts.
let _db = null;
let _firebaseError = null; // armazena o erro real para exibir na tela
let _unsubRanking = null;

function initFirebaseSafe() {
  try {
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    _db = getFirestore(fbApp);
    _firebaseError = null;
    console.log('Firestore inicializado com sucesso.');
  } catch (e) {
    _db = null;
    _firebaseError = e.message || String(e);
    console.error('Erro Firebase:', e);
  }
}

// ── Estado ────────────────────────────────────────────────
let state = {
  screen:   'home',
  name:     '',
  current:  0,
  score:    0,
  correct:  0,
  finished: false
};

// ── Helpers ───────────────────────────────────────────────
function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Renomeado para não conflitar com getApp() importado do Firebase
function getContainer() {
  return document.getElementById('app');
}

// ── Render principal ──────────────────────────────────────
function render() {
  const app = getContainer();
  if (!app) return;

  if (state.screen === 'home') {
    app.innerHTML = `
      <div class="title">Síndrome de Turner</div>
      <button class="btn" id="btnStart">Início do Questionário</button>
      <button class="btn btn-secondary" id="btnRanking">Área das Respostas</button>
    `;
    document.getElementById('btnStart').addEventListener('click', startName);
    document.getElementById('btnRanking').addEventListener('click', showRankingLogin);

  } else if (state.screen === 'name') {
    app.innerHTML = `
      <div class="title">Digite seu nome</div>
      <div class="input-group">
        <input type="text" id="inputName" maxlength="30" placeholder="Seu nome" />
      </div>
      <button class="btn" id="btnSubmitName">Iniciar Quiz</button>
      <button class="btn btn-secondary" id="btnBack">Voltar</button>
    `;
    document.getElementById('btnSubmitName').addEventListener('click', submitName);
    document.getElementById('btnBack').addEventListener('click', goHome);
    setTimeout(() => { const el = document.getElementById('inputName'); if (el) el.focus(); }, 100);

  } else if (state.screen === 'quiz') {
    renderQuiz();

  } else if (state.screen === 'result') {
    renderResult();

  } else if (state.screen === 'ranking-login') {
    app.innerHTML = `
      <div class="title">Área das Respostas</div>
      <div class="input-group">
        <input type="password" id="inputPass" maxlength="12" placeholder="Senha de acesso" />
      </div>
      <button class="btn" id="btnSubmitPass">Entrar</button>
      <button class="btn btn-secondary" id="btnBack">Voltar</button>
      <div id="passFeedback" class="feedback" style="display:none;"></div>
    `;
    document.getElementById('btnSubmitPass').addEventListener('click', submitPassword);
    document.getElementById('btnBack').addEventListener('click', goHome);
    setTimeout(() => { const el = document.getElementById('inputPass'); if (el) el.focus(); }, 100);

  } else if (state.screen === 'admin') {
    renderAdmin();
  } else if (state.screen === 'ranking') {
    renderRanking();
  } else if (state.screen === 'gabarito') {
    renderGabarito();
  }
}

// ── Navegação ─────────────────────────────────────────────
function goHome() {
  if (_unsubRanking) { _unsubRanking(); _unsubRanking = null; }
  state = { screen: 'home', name: '', current: 0, score: 0, correct: 0, finished: false };
  render();
}

function startName() {
  state.screen = 'name';
  render();
}

function submitName() {
  const input = document.getElementById('inputName');
  if (!input) return;
  const name = input.value.trim();
  if (!name) { input.style.border = '2px solid #ef4444'; return; }
  state.name    = name;
  state.screen  = 'quiz';
  state.current = 0;
  state.score   = 0;
  state.correct = 0;
  state.finished = false;
  render();
}

// ── Quiz ──────────────────────────────────────────────────
function renderQuiz() {
  const app = getContainer();
  if (!app) return;
  const q       = questions[state.current];
  const diff    = difficulties[q.difficulty];
  const progress = (state.current / questions.length) * 100;

  let optionsHtml = '';
  q.options.forEach((opt, i) => {
    optionsHtml += `<div class="option" data-idx="${i}">${String.fromCharCode(65 + i)}) ${opt}</div>`;
  });

  app.innerHTML = `
    <div class="progress-bar"><div class="progress" style="width:${progress}%;"></div></div>
    <div class="question">${q.text}</div>
    <div class="${diff.cls}">${diff.label}</div>
    <div class="options">${optionsHtml}</div>
    <button class="btn" id="nextBtn" style="display:none;margin-top:10px;">Próxima</button>
  `;

  app.querySelectorAll('.option').forEach(el => {
    el.addEventListener('click', () => selectOption(Number(el.dataset.idx)));
  });
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
}

function selectOption(idx) {
  const q       = questions[state.current];
  const options = document.querySelectorAll('.option');

  options.forEach(el => {
    el.replaceWith(el.cloneNode(true)); // remove todos os listeners
  });

  const freshOptions = document.querySelectorAll('.option');
  freshOptions[idx].classList.add('selected');

  setTimeout(() => {
    if (idx === q.answer) {
      freshOptions[idx].classList.add('correct');
      state.score   += q.points;
      state.correct += 1;
      setTimeout(nextQuestion, 900);
    } else {
      freshOptions[idx].classList.add('incorrect');
      freshOptions[q.answer].classList.add('correct');
      showFeedback(q.explanation);
    }
  }, 250);
}

function showFeedback(msg) {
  const optionsEl = document.querySelector('.options');
  const nextBtn   = document.getElementById('nextBtn');
  if (!optionsEl || !nextBtn) return;
  const existing = document.querySelector('.feedback');
  if (existing) existing.remove();
  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  feedback.innerHTML = `<b>Resposta incorreta.</b> ${msg}`;
  optionsEl.after(feedback);
  nextBtn.style.display = 'block';
}

function nextQuestion() {
  state.current++;
  if (state.current >= questions.length) {
    state.finished = true;
    state.screen   = 'result';
  }
  render();
}

// ── Resultado ─────────────────────────────────────────────
function renderResult() {
  const app = getContainer();
  if (!app) return;
  const maxScore = questions.reduce((s, q) => s + q.points, 0);
  const percent  = Math.round((state.score / maxScore) * 100);
  let performance = '';
  if (state.score >= maxScore) performance = 'Excelente! Você acertou tudo!';
  else if (percent >= 75)      performance = 'Ótimo desempenho!';
  else if (percent >= 50)      performance = 'Bom, mas pode melhorar.';
  else                         performance = 'Até tentou, mas o resultado final foi TRISTE.';

  app.innerHTML = `
    <div class="title">Resultado Final</div>
    <div class="result">
      <div><b>Nome:</b> ${escapeHtml(state.name)}</div>
      <div class="score">${state.score} pontos</div>
      <div><b>Acertos:</b> ${state.correct} de ${questions.length}</div>
      <div class="performance">${performance}</div>
      <button class="btn" id="btnHome">Voltar ao Início</button>
    </div>
  `;
  document.getElementById('btnHome').addEventListener('click', goHome);
  saveRanking();
}

// ── Firestore ─────────────────────────────────────────────
async function saveRanking() {
  if (!_db) return;
  try {
    await addDoc(collection(_db, 'turner_ranking'), {
      name:      state.name,
      score:     state.score,
      correct:   state.correct,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error('Erro ao salvar ranking:', e);
  }
}

function showRankingLogin() {
  state.screen = 'ranking-login';
  render();
}

function submitPassword() {
  const input    = document.getElementById('inputPass');
  const feedback = document.getElementById('passFeedback');
  if (!input) return;
  if (input.value === PASSWORD) {
    state.screen = 'admin';
    render();
  } else {
    if (feedback) { feedback.style.display = 'block'; feedback.innerText = 'Senha incorreta.'; }
    input.style.border = '2px solid #ef4444';
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
}

// ── Tela admin (após senha) ───────────────────────────────
function renderAdmin() {
  const app = getContainer();
  if (!app) return;
  app.innerHTML = `
    <div class="title">Área das Respostas</div>
    <button class="btn" id="btnGoRanking">🏆 Ver Ranking</button>
    <button class="btn btn-secondary" id="btnGoGabarito">📋 Ver Gabarito</button>
    <button class="btn btn-secondary" id="btnHome" style="margin-top:8px;">Voltar ao Início</button>
  `;
  document.getElementById('btnGoRanking').addEventListener('click', () => { state.screen = 'ranking'; render(); });
  document.getElementById('btnGoGabarito').addEventListener('click', () => { state.screen = 'gabarito'; render(); });
  document.getElementById('btnHome').addEventListener('click', goHome);
}

// ── Gabarito ──────────────────────────────────────────────
function renderGabarito() {
  const app = getContainer();
  if (!app) return;

  const diffLabels = { easy: 'Fácil', medium: 'Média', hard: 'Difícil' };
  const diffColors = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444' };

  let html = '<div class="title">Gabarito</div>';

  questions.forEach((q, i) => {
    const color = diffColors[q.difficulty];
    const label = diffLabels[q.difficulty];
    html += `
      <div class="gabarito-card">
        <div class="gabarito-num">Questão ${i + 1}
          <span class="gabarito-diff" style="color:${color};">${label} · ${q.points} pt${q.points !== 1 ? 's' : ''}</span>
        </div>
        <div class="gabarito-question">${q.text}</div>
        <div class="gabarito-options">
          ${q.options.map((opt, idx) => `
            <div class="gabarito-option ${idx === q.answer ? 'gabarito-correct' : ''}">
              ${String.fromCharCode(65 + idx)}) ${opt}
              ${idx === q.answer ? ' ✔' : ''}
            </div>
          `).join('')}
        </div>
        <div class="gabarito-explanation">💡 ${q.explanation}</div>
      </div>
    `;
  });

  html += `<button class="btn btn-secondary" id="btnBackAdmin" style="margin-top:16px;">← Voltar</button>`;
  app.innerHTML = html;
  document.getElementById('btnBackAdmin').addEventListener('click', () => { state.screen = 'admin'; render(); });
}

// ── Ranking em tempo real ─────────────────────────────────
function renderRanking() {
  const app = getContainer();
  if (!app) return;

  app.innerHTML = `
    <div class="title">Ranking</div>
    <div id="ranking-status" style="text-align:center;margin:18px;color:#6366f1;">
      ${_db ? 'Carregando ranking...' : (_firebaseError ? 'Erro Firebase: ' + _firebaseError : 'Firebase não configurado.')}
    </div>
    <table class="ranking-table" id="ranking-table" style="display:none;">
      <thead><tr><th>#</th><th>Nome</th><th>Pontuação</th><th>Acertos</th></tr></thead>
      <tbody id="ranking-body"></tbody>
    </table>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-secondary" id="btnBackAdmin" style="flex:1;">← Voltar</button>
      <button class="btn btn-secondary" id="btnHome" style="flex:1;">🏠 Início</button>
    </div>
  `;
  document.getElementById('btnBackAdmin').addEventListener('click', () => { if (_unsubRanking) { _unsubRanking(); _unsubRanking = null; } state.screen = 'admin'; render(); });
  document.getElementById('btnHome').addEventListener('click', goHome);

  if (!_db) return;
  if (_unsubRanking) { _unsubRanking(); _unsubRanking = null; }

  try {
    // Ordenação só por score — não precisa de índice composto
    const q = query(
      collection(_db, 'turner_ranking'),
      orderBy('score', 'desc')
    );
    _unsubRanking = onSnapshot(q,
      snapshot => {
        const statusEl = document.getElementById('ranking-status');
        const tableEl  = document.getElementById('ranking-table');
        const bodyEl   = document.getElementById('ranking-body');
        if (!bodyEl) return;

        // Ordena client-side por score desc, correct desc
        const docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        docs.sort((a, b) => b.score - a.score || b.correct - a.correct);

        const rows = [];
        let pos = 1;
        docs.forEach(r => {
          rows.push(`<tr>
            <td>${pos++}</td>
            <td>${escapeHtml(r.name || '')}</td>
            <td>${r.score}</td>
            <td>${r.correct}</td>
          </tr>`);
        });
        if (statusEl) statusEl.style.display = 'none';
        if (tableEl)  tableEl.style.display  = 'table';
        if (bodyEl)   bodyEl.innerHTML = rows.length
          ? rows.join('')
          : '<tr><td colspan="4" style="text-align:center;">Nenhum resultado ainda.</td></tr>';
      },
      err => {
        console.error('Erro ao carregar ranking:', err);
        const statusEl = document.getElementById('ranking-status');
        if (statusEl) {
          statusEl.style.color = '#ef4444';
          statusEl.innerText   = 'Erro ao carregar ranking. Verifique as regras do Firestore.';
        }
      }
    );
  } catch (e) {
    console.error('Erro ao configurar ranking:', e);
  }
}

// ── Inicialização ─────────────────────────────────────────
function initAppSafe() {
  let app = document.getElementById('app');
  if (!app) {
    app = document.createElement('div');
    app.id = 'app';
    document.body.appendChild(app);
  }
  initFirebaseSafe();
  try {
    render();
  } catch (e) {
    console.error('Erro ao renderizar:', e);
    app.innerHTML = `
      <div class="title">Síndrome de Turner</div>
      <div class="feedback" style="display:block;color:#ef4444;">
        Erro ao carregar o quiz. Recarregue a página.
      </div>
    `;
  }
}

// Módulo ES tem seu próprio escopo — sem conflito com nada.
// Inicia quando o DOM estiver pronto.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppSafe);
} else {
  initAppSafe();
}
