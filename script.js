// Dados do quiz
// Requer: firebase-config.js com firebaseConfig válido
// Firebase SDK já incluído em index.html

// Inicialização Firebase compatível para HTML puro
// usa o db vindo do firebase-config.js

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

function render() {
    const app = document.getElementById('app');
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
                <input type="text" id="inputName" maxlength="30" placeholder="Seu nome" autofocus />
            </div>
            <button class="btn" onclick="submitName()">Iniciar Quiz</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
        `;
        setTimeout(() => document.getElementById('inputName').focus(), 100);
    } else if (state.screen === 'quiz') {
        renderQuiz();
    } else if (state.screen === 'result') {
        renderResult();
    } else if (state.screen === 'ranking-login') {
        app.innerHTML = `
            <div class="title">Área das Respostas</div>
            <div class="input-group">
                <input type="password" id="inputPass" maxlength="12" placeholder="Senha de acesso" autofocus />
            </div>
            <button class="btn" onclick="submitPassword()">Entrar</button>
            <button class="btn btn-secondary" onclick="goHome()">Voltar</button>
            <div id="passFeedback" class="feedback" style="display:none;"></div>
        `;
        setTimeout(() => document.getElementById('inputPass').focus(), 100);
    } else if (state.screen === 'ranking') {
        renderRanking();
    }
}

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
    if (!name) {
        document.getElementById('inputName').style.border = '2px solid #ef4444';
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

function renderQuiz() {
    const q = questions[state.current];
    const diff = difficulties[q.difficulty];
    const progress = ((state.current) / questions.length) * 100;
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
        optionsHtml += `<div class="option" id="opt${i}" onclick="selectOption(${i})">${String.fromCharCode(65+i)}) ${opt}</div>`;
    });
    document.getElementById('app').innerHTML = `
        <div class="progress-bar"><div class="progress" style="width:${progress}%;"></div></div>
        <div class="question">${q.text}</div>
        <div class="${diff.class}">${diff.label}</div>
        <div class="options">${optionsHtml}</div>
        <button class="btn" id="nextBtn" style="display:none; margin-top:10px;">Próxima</button>
    `;
}

function selectOption(idx) {
    const q = questions[state.current];
    const options = document.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected', 'correct', 'incorrect'));
    options[idx].classList.add('selected');
    setTimeout(() => {
        if (idx === q.answer) {
            options[idx].classList.add('correct');
            state.score += q.points;
            state.correct++;
            nextQuestionDelayed();
        } else {
            options[idx].classList.add('incorrect');
            showFeedback(q.explanation);
        }
        options.forEach(opt => opt.onclick = null);
    }, 250);
}

function showFeedback(msg) {
    let feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.innerHTML = `Resposta incorreta. Explicação: ${msg}`;
    document.querySelector('.options').after(feedback);
    document.getElementById('nextBtn').style.display = 'block';
    document.getElementById('nextBtn').onclick = nextQuestion;
}

function nextQuestionDelayed() {
    setTimeout(() => {
        nextQuestion();
    }, 900);
}

function nextQuestion() {
    state.current++;
    if (state.current >= questions.length) {
        state.finished = true;
        state.screen = 'result';
    }
    render();
}

function renderResult() {
    const percent = Math.round((state.score / 8) * 100);
    let performance = '';
    if (state.score === 8) performance = 'Excelente! Você acertou tudo!';
    else if (state.score >= 6) performance = 'Ótimo desempenho!';
    else if (state.score >= 4) performance = 'Bom, mas pode melhorar.';
    else performance = 'Até tentou, mas o resultado final foi TRISTE.';
    document.getElementById('app').innerHTML = `
        <div class="title">Resultado Final</div>
        <div class="result">
            <div><b>Nome:</b> ${state.name}</div>
            <div class="score">${state.score} pontos</div>
            <div><b>Acertos:</b> ${state.correct} de ${questions.length}</div>
            <div class="performance">${performance}</div>
            <button class="btn" onclick="goHome()">Voltar ao Início</button>
        </div>
    `;
    saveRanking();
}

// Salva tentativa no Firestore
function saveRanking() {
    if (!db) return;
    db.collection('turner_ranking').add({
        name: state.name,
        score: state.score,
        correct: state.correct,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

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
        const feedback = document.getElementById('passFeedback');
        feedback.style.display = 'block';
        feedback.innerText = 'Senha incorreta.';
        document.getElementById('inputPass').style.border = '2px solid #ef4444';
    }
}

// Ranking global em tempo real
let unsubscribeRanking = null;
// Ranking global em tempo real
let unsubscribeRanking = null;

function renderRanking() {
    document.getElementById('app').innerHTML = `
        <div class="title">Ranking</div>
        <div id="ranking-loading" style="text-align:center; margin:18px;">
            Carregando ranking...
        </div>

        <table class="ranking-table" style="display:none;">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nome</th>
                    <th>Pontuação</th>
                    <th>Acertos</th>
                </tr>
            </thead>
            <tbody id="ranking-body"></tbody>
        </table>

        <button class="btn" onclick="goHome()">
            Voltar ao Início
        </button>
    `;

    // Cancela listener antigo
    if (unsubscribeRanking) {
        unsubscribeRanking();
    }

    // Atualização em tempo real
    unsubscribeRanking = db.collection('turner_ranking')
        .orderBy('score', 'desc')
        .orderBy('correct', 'desc')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {

            const loading = document.getElementById('ranking-loading');
            const table = document.querySelector('.ranking-table');
            const body = document.getElementById('ranking-body');

            // Proteção
            if (!loading || !table || !body) return;

            const rows = [];
            let i = 1;

            snapshot.forEach(doc => {
                const r = doc.data();

                rows.push(`
                    <tr>
                        <td>${i++}</td>
                        <td>${r.name}</td>
                        <td>${r.score}</td>
                        <td>${r.correct}</td>
                    </tr>
                `);
            });

            loading.style.display = 'none';
            table.style.display = 'table';
            body.innerHTML = rows.join('');
        });
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    render();
});