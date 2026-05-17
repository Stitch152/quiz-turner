(function () {
'use strict';

// ── Dados do quiz ──────────────────────────────────────────
var questions = [
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

var difficulties = {
    easy:   { label: 'Fácil',   cls: 'difficulty-easy'   },
    medium: { label: 'Média',   cls: 'difficulty-medium'  },
    hard:   { label: 'Difícil', cls: 'difficulty-hard'   }
};

var PASSWORD = '140159';

// ── Estado ─────────────────────────────────────────────────
var _db = null;           // Firestore — nome privado evita conflito
var _unsubRanking = null; // listener em tempo real

var state = {
    screen: 'home',
    name: '',
    current: 0,
    score: 0,
    correct: 0,
    finished: false
};

// ── Firebase seguro ────────────────────────────────────────
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
        _db = firebase.firestore();
        console.log('Firebase inicializado com sucesso.');
    } catch (e) {
        console.error('Erro ao inicializar Firebase (quiz continua sem ranking):', e);
        _db = null;
    }
}

// ── Init principal ─────────────────────────────────────────
function initAppSafe() {
    var app = document.getElementById('app');
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
        app.innerHTML =
            '<div class="title">Síndrome de Turner</div>' +
            '<div class="feedback" style="display:block;color:#ef4444;">' +
            'Ocorreu um erro ao carregar o quiz. Recarregue a página.</div>';
    }
}

// ── Render ─────────────────────────────────────────────────
function render() {
    var app = document.getElementById('app');
    if (!app) return;

    if (state.screen === 'home') {
        app.innerHTML =
            '<div class="title">Síndrome de Turner</div>' +
            '<button class="btn" onclick="quizApp.startName()">Início do Questionário</button>' +
            '<button class="btn btn-secondary" onclick="quizApp.showRankingLogin()">Área das Respostas</button>';

    } else if (state.screen === 'name') {
        app.innerHTML =
            '<div class="title">Digite seu nome</div>' +
            '<div class="input-group">' +
            '<input type="text" id="inputName" maxlength="30" placeholder="Seu nome" />' +
            '</div>' +
            '<button class="btn" onclick="quizApp.submitName()">Iniciar Quiz</button>' +
            '<button class="btn btn-secondary" onclick="quizApp.goHome()">Voltar</button>';
        setTimeout(function () {
            var el = document.getElementById('inputName');
            if (el) el.focus();
        }, 100);

    } else if (state.screen === 'quiz') {
        renderQuiz();

    } else if (state.screen === 'result') {
        renderResult();

    } else if (state.screen === 'ranking-login') {
        app.innerHTML =
            '<div class="title">Área das Respostas</div>' +
            '<div class="input-group">' +
            '<input type="password" id="inputPass" maxlength="12" placeholder="Senha de acesso" />' +
            '</div>' +
            '<button class="btn" onclick="quizApp.submitPassword()">Entrar</button>' +
            '<button class="btn btn-secondary" onclick="quizApp.goHome()">Voltar</button>' +
            '<div id="passFeedback" class="feedback" style="display:none;"></div>';
        setTimeout(function () {
            var el = document.getElementById('inputPass');
            if (el) el.focus();
        }, 100);

    } else if (state.screen === 'ranking') {
        renderRanking();
    }
}

// ── Navegação ──────────────────────────────────────────────
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
    var input = document.getElementById('inputName');
    if (!input) return;
    var name = input.value.trim();
    if (!name) { input.style.border = '2px solid #ef4444'; return; }
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
    var app = document.getElementById('app');
    if (!app) return;
    var q = questions[state.current];
    var diff = difficulties[q.difficulty];
    var progress = (state.current / questions.length) * 100;
    var optionsHtml = '';
    for (var i = 0; i < q.options.length; i++) {
        optionsHtml +=
            '<div class="option" id="opt' + i + '" onclick="quizApp.selectOption(' + i + ')">' +
            String.fromCharCode(65 + i) + ') ' + q.options[i] +
            '</div>';
    }
    app.innerHTML =
        '<div class="progress-bar"><div class="progress" style="width:' + progress + '%;"></div></div>' +
        '<div class="question">' + q.text + '</div>' +
        '<div class="' + diff.cls + '">' + diff.label + '</div>' +
        '<div class="options">' + optionsHtml + '</div>' +
        '<button class="btn" id="nextBtn" style="display:none;margin-top:10px;" onclick="quizApp.nextQuestion()">Próxima</button>';
}

function selectOption(idx) {
    var q = questions[state.current];
    var options = document.querySelectorAll('.option');
    for (var i = 0; i < options.length; i++) {
        options[i].onclick = null;
        options[i].classList.remove('selected', 'correct', 'incorrect');
    }
    options[idx].classList.add('selected');

    setTimeout(function () {
        if (idx === q.answer) {
            options[idx].classList.add('correct');
            state.score += q.points;
            state.correct++;
            setTimeout(nextQuestion, 900);
        } else {
            options[idx].classList.add('incorrect');
            options[q.answer].classList.add('correct');
            showFeedback(q.explanation);
        }
    }, 250);
}

function showFeedback(msg) {
    var optionsEl = document.querySelector('.options');
    var nextBtn = document.getElementById('nextBtn');
    if (!optionsEl || !nextBtn) return;
    var existing = document.querySelector('.feedback');
    if (existing) existing.remove();
    var feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.innerHTML = '<b>Resposta incorreta.</b> ' + msg;
    optionsEl.after(feedback);
    nextBtn.style.display = 'block';
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
    var app = document.getElementById('app');
    if (!app) return;
    var maxScore = 0;
    for (var i = 0; i < questions.length; i++) maxScore += questions[i].points;
    var percent = Math.round((state.score / maxScore) * 100);
    var performance = '';
    if (state.score >= maxScore)   performance = 'Excelente! Você acertou tudo!';
    else if (percent >= 75)         performance = 'Ótimo desempenho!';
    else if (percent >= 50)         performance = 'Bom, mas pode melhorar.';
    else                            performance = 'Até tentou, mas o resultado final foi TRISTE.';

    app.innerHTML =
        '<div class="title">Resultado Final</div>' +
        '<div class="result">' +
        '<div><b>Nome:</b> ' + escapeHtml(state.name) + '</div>' +
        '<div class="score">' + state.score + ' pontos</div>' +
        '<div><b>Acertos:</b> ' + state.correct + ' de ' + questions.length + '</div>' +
        '<div class="performance">' + performance + '</div>' +
        '<button class="btn" onclick="quizApp.goHome()">Voltar ao Início</button>' +
        '</div>';
    saveRanking();
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ── Firestore ──────────────────────────────────────────────
function saveRanking() {
    if (!_db) return;
    try {
        _db.collection('turner_ranking').add({
            name: state.name,
            score: state.score,
            correct: state.correct,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(function (e) { console.error('Erro ao salvar ranking:', e); });
    } catch (e) {
        console.error('Erro ao salvar ranking:', e);
    }
}

function showRankingLogin() {
    state.screen = 'ranking-login';
    render();
}

function submitPassword() {
    var input = document.getElementById('inputPass');
    var feedback = document.getElementById('passFeedback');
    if (!input) return;
    if (input.value === PASSWORD) {
        state.screen = 'ranking';
        render();
    } else {
        if (feedback) { feedback.style.display = 'block'; feedback.innerText = 'Senha incorreta.'; }
        input.style.border = '2px solid #ef4444';
        input.value = '';
        setTimeout(function () { input.focus(); }, 50);
    }
}

// ── Ranking em tempo real ──────────────────────────────────
function renderRanking() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML =
        '<div class="title">Ranking</div>' +
        '<div id="ranking-status" style="text-align:center;margin:18px;color:#6366f1;">' +
        (_db ? 'Carregando ranking...' : 'Firebase não configurado. Ranking indisponível.') +
        '</div>' +
        '<table class="ranking-table" id="ranking-table" style="display:none;">' +
        '<thead><tr><th>#</th><th>Nome</th><th>Pontuação</th><th>Acertos</th></tr></thead>' +
        '<tbody id="ranking-body"></tbody>' +
        '</table>' +
        '<button class="btn" onclick="quizApp.goHome()" style="margin-top:16px;">Voltar ao Início</button>';

    if (!_db) return;
    if (_unsubRanking) { _unsubRanking(); _unsubRanking = null; }

    try {
        _unsubRanking = _db.collection('turner_ranking')
            .orderBy('score', 'desc')
            .orderBy('correct', 'desc')
            .orderBy('timestamp', 'asc')
            .onSnapshot(function (snapshot) {
                var statusEl = document.getElementById('ranking-status');
                var tableEl  = document.getElementById('ranking-table');
                var bodyEl   = document.getElementById('ranking-body');
                if (!bodyEl) return;
                var rows = [];
                var pos = 1;
                snapshot.forEach(function (doc) {
                    var r = doc.data();
                    rows.push('<tr><td>' + pos++ + '</td><td>' + escapeHtml(r.name || '') +
                        '</td><td>' + r.score + '</td><td>' + r.correct + '</td></tr>');
                });
                if (statusEl) statusEl.style.display = 'none';
                if (tableEl)  tableEl.style.display = 'table';
                if (bodyEl)   bodyEl.innerHTML = rows.length
                    ? rows.join('')
                    : '<tr><td colspan="4" style="text-align:center;">Nenhum resultado ainda.</td></tr>';
            }, function (e) {
                console.error('Erro ao carregar ranking:', e);
                var statusEl = document.getElementById('ranking-status');
                if (statusEl) { statusEl.style.color = '#ef4444'; statusEl.innerText = 'Erro ao carregar ranking. Verifique as regras do Firestore.'; }
            });
    } catch (e) {
        console.error('Erro ao configurar listener do ranking:', e);
    }
}

// ── Expõe funções ao escopo global via quizApp ─────────────
window.quizApp = {
    goHome:           goHome,
    startName:        startName,
    submitName:       submitName,
    selectOption:     selectOption,
    nextQuestion:     nextQuestion,
    showRankingLogin: showRankingLogin,
    submitPassword:   submitPassword
};

// ── Ponto de entrada ───────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppSafe);
} else {
    initAppSafe();
}

})(); // fim do IIFE
