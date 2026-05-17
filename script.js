// ============================================================
// script.js — Quiz Síndrome de Turner (corrigido)
// ============================================================
// CORREÇÕES APLICADAS:
//  1. initAppSafe() garante que render() sempre executa,
//     mesmo se o Firebase falhar.
//  2. Firebase inicializado dentro de try/catch — erro no
//     Firebase não mata o restante do script.
//  3. Verificação de #app antes de qualquer render.
//  4. Fallback de tela de erro caso o DOM não exista.
// ============================================================

// ── Dados do quiz ──────────────────────────────────────────
const questions = [
    {
        text: 'Qual é o cariótipo característico da Síndrome de Turner?',
        options: ['47,XXY', '45,X', '46,XY', '46,XX'],
        answer: 1,
        difficulty: 'easy',
        points: 1,
        explanation: 'O cariótipo típico é 45,X (ausência de um cromossomo X).'
    },
    {
        text: 'Qual é a principal característica física da Síndrome de Turner?',
        options: ['Alta estatura', 'Baixa estatura', 'Obesidade severa', 'Macrocefalia'],
        answer: 1,
        difficulty: 'easy',
        points: 1,
        explanation: 'A baixa estatura é uma das principais características físicas.'
    },
    {
        text: 'O que é mosaicismo na Síndrome de Turner?',
        options: [
            'Presença de dois tipos de tecidos com diferentes cariótipos',
            'Mutação apenas no cromossomo Y',
            'Alteração apenas hormonal',
            'Infecção genética adquirida'
        ],
        answer: 0,
        difficulty: 'medium',
        points: 1.5,
        explanation: 'Mosaicismo é a presença de dois ou mais tipos celulares com cariótipos diferentes.'
    },
    {
        text: 'Qual problema pode estar associado à Síndrome de Turner?',
        options: ['Asma', 'Coarctação da aorta', 'Hepatite', 'Catarata infecciosa'],
        answer: 1,
        difficulty: 'medium',
        points: 1.5,
        explanation: 'Coarctação da aorta é uma cardiopatia congênita comum na síndrome.'
    },
    {
        text: 'Sobre o tratamento hormonal na Síndrome de Turner:',
        options: [
            'Estrogênio deve vir antes do GH',
            'GH e estrogênio devem começar juntos na infância',
            'GH deve ser iniciado cedo e estrogênio apenas na adolescência',
            'Nenhum hormônio é usado'
        ],
        answer: 2,
        difficulty: 'hard',
        points: 3,
        explanation: 'O GH é iniciado cedo para crescimento e o estrogênio apenas na adolescência.'
    }
];

const difficulties = {
    easy:   { label: 'Fácil',  class: 'difficulty-easy'   },
    medium: { label: 'Média',  class: 'difficulty-medium'  },
    hard:   { label: 'Difícil', class: 'difficulty-hard'  }
};

const PASSWORD = '140159';

// ── Estado global ──────────────────────────────────────────
let db = null;

let state = {
    screen: 'home',
    name: '',
    current: 0,
    score: 0,
    correct: 0,
    finished: false
};

// ── Inicialização segura do Firebase ───────────────────────
function initFirebaseSafe() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK não carregado. Ranking desativado.');
            return;
        }
        if (typeof firebaseConfig === 'undefined') {
            console.warn('firebaseConfig não encontrado. Verifique firebase-config.js.');
            return;
        }
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log('Firebase inicializado com sucesso.');
    } catch (err) {
        console.error('Erro ao inicializar Firebase (quiz continua sem ranking):', err);
        db = null;
    }
}

// ── Inicialização principal segura ─────────────────────────
function initAppSafe() {
    // 1. Garante que o elemento #app existe
    let app = document.getElementById('app');
    if (!app) {
        // Cria o elemento caso não exista (segurança extra)
        app = document.createElement('div');
        app.id = 'app';
        document.body.appendChild(app);
    }

    // 2. Inicializa Firebase (sem bloquear o quiz se falhar)
    initFirebaseSafe();

    // 3. Renderiza a tela inicial
    try {
        render();
    } catch (err) {
        console.error('Erro ao renderizar tela inicial:', err);
        app.innerHTML = `
            <div class="title">Síndrome de Turner</div>
            <div class="feedback" style="display:block; color:#ef4444;">
                Ocorreu um erro ao carregar o quiz.<br>
                Recarregue a página ou verifique o console.
            </div>
        `;
    }
}

// ── Renderização principal ─────────────────────────────────
function render() {
    const app = document.getElementById('app');
    if (!app) return;

    if (state.screen === 'home') {
        app.innerHTML = `
            <div class="title">Síndrome de Turner</div>
            <button class="btn" onclick="startName()">Início do Questionário</button>
            <button class="btn btn-secondary" onclick="showRankingLogin()">Área das Respostas</button>
        `;
    } else if (state.screen === 'name') {
        app.innerHTML = `
            <div class="title">Digite seu nome</div>
            <div class="input-group">
                <input type="text" id="inputName" maxlength="30" placeholder="Seu nome" />
            </div>
            <button class="btn" onclick="submitName()">Iniciar Quiz</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
        `;
        setTimeout(() => {
            const el = document.getElementById('inputName');
            if (el) el.focus();
        }, 100);
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
            <button class="btn" onclick="submitPassword()">Entrar</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
            <div id="passFeedback" class="feedback" style="display:none;"></div>
        `;
        setTimeout(() => {
            const el = document.getElementById('inputPass');
            if (el) el.focus();
        }, 100);
    } else if (state.screen === 'ranking') {
        renderRanking();
    }
}

// ── Navegação ──────────────────────────────────────────────
function goHome() {
    if (unsubscribeRanking) {
        unsubscribeRanking();
        unsubscribeRanking = null;
    }
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
    if (!name) {
        input.style.border = '2px solid #ef4444';
        return;
    }
    state.name = name;
    state.screen = 'quiz';
    state.current = 0;
    state.score = 0;
    state.correct = 0;
    state.finished = false;
    render();
}

// ── Quiz ───────────────────────────────────────────────────
function renderQuiz() {
    const app = document.getElementById('app');
    if (!app) return;

    const q = questions[state.current];
    const diff = difficulties[q.difficulty];
    const progress = (state.current / questions.length) * 100;

    let optionsHtml = '';
    q.options.forEach((opt, i) => {
        optionsHtml += `<div class="option" id="opt${i}" onclick="selectOption(${i})">
            ${String.fromCharCode(65 + i)}) ${opt}
        </div>`;
    });

    app.innerHTML = `
        <div class="progress-bar"><div class="progress" style="width:${progress}%;"></div></div>
        <div class="question">${q.text}</div>
        <div class="${diff.class}">${diff.label}</div>
        <div class="options">${optionsHtml}</div>
        <button class="btn" id="nextBtn" style="display:none; margin-top:10px;" onclick="nextQuestion()">Próxima</button>
    `;
}

function selectOption(idx) {
    const q = questions[state.current];
    const options = document.querySelectorAll('.option');

    // Remove eventos de clique imediatamente para evitar duplo clique
    options.forEach(opt => {
        opt.onclick = null;
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    options[idx].classList.add('selected');

    setTimeout(() => {
        if (idx === q.answer) {
            options[idx].classList.add('correct');
            state.score += q.points;
            state.correct++;
            nextQuestionDelayed();
        } else {
            options[idx].classList.add('incorrect');
            options[q.answer].classList.add('correct');
            showFeedback(q.explanation);
        }
    }, 250);
}

function showFeedback(msg) {
    const optionsEl = document.querySelector('.options');
    const nextBtn = document.getElementById('nextBtn');
    if (!optionsEl || !nextBtn) return;

    // Remove feedback anterior se existir
    const existing = document.querySelector('.feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.innerHTML = `<b>Resposta incorreta.</b> ${msg}`;
    optionsEl.after(feedback);
    nextBtn.style.display = 'block';
}

function nextQuestionDelayed() {
    setTimeout(nextQuestion, 900);
}

function nextQuestion() {
    state.current++;
    if (state.current >= questions.length) {
        state.finished = true;
        state.screen = 'result';
    }
    render();
}

// ── Resultado ──────────────────────────────────────────────
function renderResult() {
    const app = document.getElementById('app');
    if (!app) return;

    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
    const percent = Math.round((state.score / maxScore) * 100);

    let performance = '';
    if (state.score >= maxScore) performance = 'Excelente! Você acertou tudo!';
    else if (percent >= 75) performance = 'Ótimo desempenho!';
    else if (percent >= 50) performance = 'Bom, mas pode melhorar.';
    else performance = 'Até tentou, mas o resultado final foi TRISTE.';

    app.innerHTML = `
        <div class="title">Resultado Final</div>
        <div class="result">
            <div><b>Nome:</b> ${escapeHtml(state.name)}</div>
            <div class="score">${state.score} pontos</div>
            <div><b>Acertos:</b> ${state.correct} de ${questions.length}</div>
            <div class="performance">${performance}</div>
            <button class="btn" onclick="goHome()">Voltar ao Início</button>
        </div>
    `;
    saveRanking();
}

// Previne XSS ao exibir nomes no HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ── Firestore ──────────────────────────────────────────────
function saveRanking() {
    if (!db) return;
    try {
        db.collection('turner_ranking').add({
            name: state.name,
            score: state.score,
            correct: state.correct,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error('Erro ao salvar ranking:', err));
    } catch (err) {
        console.error('Erro ao salvar ranking:', err);
    }
}

function showRankingLogin() {
    state.screen = 'ranking-login';
    render();
}

function submitPassword() {
    const input = document.getElementById('inputPass');
    const feedback = document.getElementById('passFeedback');
    if (!input) return;

    if (input.value === PASSWORD) {
        state.screen = 'ranking';
        render();
    } else {
        if (feedback) {
            feedback.style.display = 'block';
            feedback.innerText = 'Senha incorreta.';
        }
        input.style.border = '2px solid #ef4444';
        input.value = '';
        setTimeout(() => input.focus(), 50);
    }
}

// ── Ranking em tempo real ──────────────────────────────────
let unsubscribeRanking = null;

function renderRanking() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="title">Ranking</div>
        <div id="ranking-status" style="text-align:center; margin:18px; color:#6366f1;">
            ${db ? 'Carregando ranking...' : 'Firebase não configurado. Ranking indisponível.'}
        </div>
        <table class="ranking-table" id="ranking-table" style="display:none;">
            <thead>
                <tr><th>#</th><th>Nome</th><th>Pontuação</th><th>Acertos</th></tr>
            </thead>
            <tbody id="ranking-body"></tbody>
        </table>
        <button class="btn" onclick="goHome()" style="margin-top:16px;">Voltar ao Início</button>
    `;

    if (!db) return;

    // Cancela listener anterior se existir
    if (unsubscribeRanking) {
        unsubscribeRanking();
        unsubscribeRanking = null;
    }

    try {
        unsubscribeRanking = db.collection('turner_ranking')
            .orderBy('score', 'desc')
            .orderBy('correct', 'desc')
            .orderBy('timestamp', 'asc')
            .onSnapshot(
                snapshot => {
                    const statusEl = document.getElementById('ranking-status');
                    const tableEl  = document.getElementById('ranking-table');
                    const bodyEl   = document.getElementById('ranking-body');
                    if (!bodyEl) return;

                    const rows = [];
                    let i = 1;
                    snapshot.forEach(doc => {
                        const r = doc.data();
                        rows.push(`<tr>
                            <td>${i++}</td>
                            <td>${escapeHtml(r.name || '')}</td>
                            <td>${r.score}</td>
                            <td>${r.correct}</td>
                        </tr>`);
                    });

                    if (statusEl) statusEl.style.display = 'none';
                    if (tableEl) tableEl.style.display = 'table';
                    if (bodyEl) {
                        bodyEl.innerHTML = rows.length
                            ? rows.join('')
                            : '<tr><td colspan="4" style="text-align:center;">Nenhum resultado ainda.</td></tr>';
                    }
                },
                err => {
                    console.error('Erro ao carregar ranking:', err);
                    const statusEl = document.getElementById('ranking-status');
                    if (statusEl) {
                        statusEl.style.color = '#ef4444';
                        statusEl.innerText = 'Erro ao carregar ranking. Verifique as regras do Firestore.';
                    }
                }
            );
    } catch (err) {
        console.error('Erro ao configurar listener do ranking:', err);
    }
}

// ── Ponto de entrada ───────────────────────────────────────
// Usa DOMContentLoaded + window.onload como fallback duplo
// para garantir compatibilidade com todos os navegadores.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppSafe);
} else {
    // DOM já está pronto (script carregado com defer ou no fim do body)
    initAppSafe();
}
