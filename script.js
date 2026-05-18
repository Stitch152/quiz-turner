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
// Fáceis: 4 × 1 pt = 4 pts
// Médias: 4 × 1,5 pts = 6 pts
// Difíceis: 2 × 3 pts = 6 pts
// Total: 16 pts
const questions = [
  // ── Fáceis ────────────────────────────────────────────
  {
    text:        'Qual alteração cromossômica acontece na Síndrome de Turner?',
    options:     ['47,XXY', '45,X', '46,XY', '47,XXX'],
    answer:      1,
    difficulty:  'easy',
    points:      1,
    explanation: 'O cariótipo 45,X indica que há apenas um cromossomo X, em vez dos dois habituais. Essa é a alteração típica da Síndrome de Turner.'
  },
  {
    text:        'A Síndrome de Turner afeta principalmente:',
    options:     ['Apenas homens', 'Homens e mulheres igualmente', 'Apenas meninas e mulheres', 'Apenas recém-nascidos'],
    answer:      2,
    difficulty:  'easy',
    points:      1,
    explanation: 'A Síndrome de Turner afeta exclusivamente meninas e mulheres, pois envolve a ausência ou alteração de um dos cromossomos X.'
  },
  {
    text:        'Qual destas características físicas é comum na Síndrome de Turner?',
    options:     ['Baixa estatura', 'Crescimento excessivo', 'Mãos gigantes', 'Ausência de cabelos'],
    answer:      0,
    difficulty:  'easy',
    points:      1,
    explanation: 'A baixa estatura é uma das características mais marcantes, causada pela deficiência do hormônio do crescimento e pela ausência do segundo cromossomo X.'
  },
  {
    text:        'Qual exame é considerado o principal para confirmar o diagnóstico da Síndrome de Turner?',
    options:     ['Raio-X', 'Exame de sangue comum', 'Cariótipo', 'Ultrassom abdominal'],
    answer:      2,
    difficulty:  'easy',
    points:      1,
    explanation: 'O cariótipo analisa o número e a estrutura dos cromossomos e é o exame definitivo para confirmar a Síndrome de Turner.'
  },
  // ── Médias ────────────────────────────────────────────
  {
    text:        'O que significa o mosaicismo na Síndrome de Turner?',
    options:     [
      'Todas as células possuem alteração genética',
      'Algumas células possuem alteração e outras não',
      'A pessoa possui três cromossomos X',
      'Não existe alteração cromossômica'
    ],
    answer:      1,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'No mosaicismo, o organismo possui dois tipos de células: algumas com cariótipo 45,X e outras com cariótipo normal (46,XX). Isso pode tornar os sintomas mais leves.'
  },
  {
    text:        'Qual problema de saúde pode estar associado à Síndrome de Turner?',
    options:     ['Diabetes tipo 2', 'Catarata congênita', 'Alzheimer', 'Pneumonia crônica'],
    answer:      0,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'O diabetes tipo 2 é uma complicação metabólica associada à síndrome, assim como doenças cardíacas (ex: coarctação da aorta) e alterações na tireoide.'
  },
  {
    text:        'O hormônio do crescimento (GH) é utilizado principalmente para:',
    options:     ['Melhorar a visão', 'Aumentar a altura da paciente', 'Corrigir problemas cardíacos', 'Evitar o diabetes'],
    answer:      1,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'O GH é iniciado precocemente para estimular o crescimento ósseo e aumentar a estatura final das pacientes com Síndrome de Turner.'
  },
  {
    text:        'A puberdade atrasada em meninas com Síndrome de Turner ocorre principalmente devido ao:',
    options:     ['Hipogonadismo', 'Excesso de cálcio', 'Problema pulmonar', 'Aumento dos glóbulos vermelhos'],
    answer:      0,
    difficulty:  'medium',
    points:      1.5,
    explanation: 'O hipogonadismo (falência dos ovários) impede a produção adequada de estrogênio, resultando em puberdade atrasada ou ausente. Por isso, a reposição de estrogênio é necessária.'
  },
  // ── Difíceis ──────────────────────────────────────────
  {
    text:        'Sobre a Síndrome de Turner, assinale a alternativa correta:',
    options:     [
      'Está diretamente relacionada à idade materna avançada',
      'Afeta homens e mulheres igualmente',
      'Resulta da perda total ou parcial de um cromossomo X',
      'Sempre é diagnosticada antes do nascimento'
    ],
    answer:      2,
    difficulty:  'hard',
    points:      3,
    explanation: 'A síndrome resulta da perda total (45,X) ou parcial de um cromossomo X. Não está relacionada à idade materna e nem sempre é diagnosticada antes do nascimento — muitos casos só aparecem na adolescência.'
  },
  {
    text:        'O acompanhamento multidisciplinar na Síndrome de Turner é importante porque a paciente pode apresentar alterações em diferentes sistemas do organismo, principalmente:',
    options:     [
      'Digestório e muscular',
      'Cardíaco, endócrino e reprodutivo',
      'Nervoso e auditivo apenas',
      'Respiratório e imunológico exclusivamente'
    ],
    answer:      1,
    difficulty:  'hard',
    points:      3,
    explanation: 'As pacientes precisam de acompanhamento cardiológico (coarctação da aorta), endocrinológico (GH e tireoide) e ginecológico (função reprodutiva e puberdade), além de outras especialidades.'
  }
];

const difficulties = {
  easy:   { label: 'Fácil',   cls: 'difficulty-easy'   },
  medium: { label: 'Média',   cls: 'difficulty-medium'  },
  hard:   { label: 'Difícil', cls: 'difficulty-hard'   }
};

const PASSWORD = '140159';

// ── Embaralhamento (Fisher-Yates) ─────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Gera cópia embaralhada: ordem das questões e posição das alternativas
function prepareQuestions() {
  const shuffledQuestions = shuffle(questions);
  return shuffledQuestions.map(q => {
    const correctText = q.options[q.answer];
    const shuffledOptions = shuffle(q.options);
    const newAnswer = shuffledOptions.indexOf(correctText);
    return { ...q, options: shuffledOptions, answer: newAnswer };
  });
}

// ── Firebase ──────────────────────────────────────────────
let _db = null;
let _firebaseError = null;
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
let activeQuestions = [];

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

function getContainer() {
  return document.getElementById('app');
}

// ── Mensagem de desempenho (total = 16 pts) ───────────────
function getPerformanceMsg(score) {
  const maxScore = questions.reduce((s, q) => s + q.points, 0);
  if (score >= maxScore)      return '🏆 Nota 10! Você domina completamente o tema. Parabéns!';
  if (score >= maxScore * 0.8) return '🌟 Excelente! Você tem ótimo conhecimento sobre a Síndrome de Turner.';
  if (score >= maxScore * 0.6) return '👍 Bom desempenho!';
  if (score >= maxScore * 0.4) return '📚 Regular.';
  if (score >= maxScore * 0.2) return '😕 Não desista!';
  return '❌ Resultado muito baixo!';
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
  activeQuestions = prepareQuestions();
  render();
}

// ── Quiz ──────────────────────────────────────────────────
function renderQuiz() {
  const app = getContainer();
  if (!app) return;
  const q        = activeQuestions[state.current];
  const diff     = difficulties[q.difficulty];
  const progress = (state.current / activeQuestions.length) * 100;

  let optionsHtml = '';
  q.options.forEach((opt, i) => {
    optionsHtml += `<div class="option" data-idx="${i}">${String.fromCharCode(65 + i)}) ${opt}</div>`;
  });

  app.innerHTML = `
    <div class="progress-bar"><div class="progress" style="width:${progress}%;"></div></div>
    <div style="font-size:0.82rem;color:#94a3b8;margin-bottom:10px;text-align:right;">
      Questão ${state.current + 1} de ${activeQuestions.length}
    </div>
    <div class="question">${q.text}</div>
    <div class="${diff.cls}">${diff.label} · ${q.points} pt${q.points !== 1 ? 's' : ''}</div>
    <div class="options">${optionsHtml}</div>
    <button class="btn" id="nextBtn" style="display:none;margin-top:10px;">Próxima</button>
  `;

  app.querySelectorAll('.option').forEach(el => {
    el.addEventListener('click', () => selectOption(Number(el.dataset.idx)));
  });
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
}

function selectOption(idx) {
  const q       = activeQuestions[state.current];
  const options = document.querySelectorAll('.option');

  options.forEach(el => {
    el.replaceWith(el.cloneNode(true));
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
  if (state.current >= activeQuestions.length) {
    state.finished = true;
    state.screen   = 'result';
  }
  render();
}

// ── Resultado ─────────────────────────────────────────────
function renderResult() {
  const app = getContainer();
  if (!app) return;
  const maxScore   = questions.reduce((s, q) => s + q.points, 0);
  const performance = getPerformanceMsg(state.score);
  const scoreRound  = Math.round(state.score * 10) / 10;

  app.innerHTML = `
    <div class="title">Resultado Final</div>
    <div class="result">
      <div><b>Nome:</b> ${escapeHtml(state.name)}</div>
      <div class="score">${scoreRound} <span style="font-size:1.2rem;font-weight:600;color:#6366f1;">/ ${maxScore}</span></div>
      <div><b>Acertos:</b> ${state.correct} de ${activeQuestions.length}</div>
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAppSafe);
} else {
  initAppSafe();
}
