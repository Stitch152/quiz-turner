// Dados do quiz
// Requer: firebase-config.js com firebaseConfig válido
// Firebase SDK já incluído em index.html

let db;

if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
}

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
    easy: { label: 'Fácil', class: 'difficulty-easy' },
    medium: { label: 'Média', class: 'difficulty-medium' },
    hard: { label: 'Difícil', class: 'difficulty-hard' }
};

const PASSWORD = '140159';

let state = {
    screen: 'home',
    name: '',
    current: 0,
    score: 0,
    correct: 0,
    finished: false
};

// ---------------- UI ----------------

function render() {
    const app = document.getElementById('app');

    if (state.screen === 'home') {
        app.innerHTML = `
            <div class="title">Síndrome de Turner</div>
            <button class="btn" onclick="startName()">Início do Questionário</button>
            <button class="btn btn-secondary" onclick="showRankingLogin()">Área das Respostas</button>
        `;
    }

    else if (state.screen === 'name') {
        app.innerHTML = `
            <div class="title">Digite seu nome</div>
            <input id="inputName" placeholder="Seu nome"/>
            <button class="btn" onclick="submitName()">Iniciar</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
        `;
    }

    else if (state.screen === 'quiz') {
        renderQuiz();
    }

    else if (state.screen === 'result') {
        renderResult();
    }

    else if (state.screen === 'ranking-login') {
        app.innerHTML = `
            <div class="title">Área das Respostas</div>
            <input id="inputPass" type="password" placeholder="Senha"/>
            <button class="btn" onclick="submitPassword()">Entrar</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
            <div id="passFeedback"></div>
        `;
    }

    else if (state.screen === 'ranking') {
        renderRanking();
    }
}

// ---------------- NAV ----------------

function goHome() {
    state = { screen: 'home', name: '', current: 0, score: 0, correct: 0, finished: false };
    render();
}

function startName() {
    state.screen = 'name';
    render();
}

function submitName() {
    const name = document.getElementById('inputName').value.trim();
    if (!name) return;

    state.name = name;
    state.screen = 'quiz';
    state.current = 0;
    state.score = 0;
    state.correct = 0;
    render();
}

// ---------------- QUIZ ----------------

function renderQuiz() {
    const q = questions[state.current];
    const diff = difficulties[q.difficulty];

    let optionsHtml = '';

    q.options.forEach((opt, i) => {
        optionsHtml += `
            <div class="option" onclick="selectOption(${i})">
                ${String.fromCharCode(65 + i)}) ${opt}
            </div>
        `;
    });

    document.getElementById('app').innerHTML = `
        <div class="title">${q.text}</div>
        <div class="${diff.class}">${diff.label}</div>
        <div>${optionsHtml}</div>
    `;
}

function selectOption(i) {
    const q = questions[state.current];

    if (i === q.answer) {
        state.score += q.points;
        state.correct++;
    }

    state.current++;

    if (state.current >= questions.length) {
        state.screen = 'result';
    }

    render();
}

// ---------------- RESULT ----------------

function renderResult() {
    document.getElementById('app').innerHTML = `
        <div class="title">Resultado</div>
        <p>Nome: ${state.name}</p>
        <p>Pontos: ${state.score}</p>
        <p>Acertos: ${state.correct}</p>
        <button class="btn" onclick="goHome()">Voltar</button>
    `;

    saveRanking();
}

// ---------------- FIREBASE ----------------

function saveRanking() {
    if (!db) return;

    db.collection('turner_ranking').add({
        name: state.name,
        score: state.score,
        correct: state.correct,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// ---------------- RANKING ----------------

function showRankingLogin() {
    state.screen = 'ranking-login';
    render();
}

function submitPassword() {
    const pass = document.getElementById('inputPass').value;

    if (pass === PASSWORD) {
        state.screen = 'ranking';
        render();
    } else {
        document.getElementById('passFeedback').innerText = 'Senha incorreta';
    }
}

let unsubscribeRanking = null;

function renderRanking() {
    document.getElementById('app').innerHTML = `
        <div class="title">Ranking</div>
        <div id="ranking-loading">Carregando...</div>
        <table class="ranking-table" style="display:none;">
            <tbody id="ranking-body"></tbody>
        </table>
        <button class="btn" onclick="goHome()">Voltar</button>
    `;

    if (unsubscribeRanking) unsubscribeRanking();

    unsubscribeRanking = db.collection('turner_ranking')
        .orderBy('score', 'desc')
        .onSnapshot(snapshot => {

            const loading = document.getElementById('ranking-loading');
            const body = document.getElementById('ranking-body');
            const table = document.querySelector('.ranking-table');

            if (!loading || !body || !table) return;

            let html = '';
            let i = 1;

            snapshot.forEach(doc => {
                const r = doc.data();
                html += `
                    <tr>
                        <td>${i++}</td>
                        <td>${r.name}</td>
                        <td>${r.score}</td>
                        <td>${r.correct}</td>
                    </tr>
                `;
            });

            loading.style.display = 'none';
            table.style.display = 'table';
            body.innerHTML = html;
        });
}

// ---------------- INIT ----------------

window.addEventListener('DOMContentLoaded', render);