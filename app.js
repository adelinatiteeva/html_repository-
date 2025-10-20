const STORAGE_KEY = 'lexidash-monster';
const ROUND_DURATION = 30000; // 30 seconds

const dom = {
    authSection: document.getElementById('auth-section'),
    appSection: document.getElementById('app-section'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    showLogin: document.getElementById('show-login'),
    showRegister: document.getElementById('show-register'),
    welcomeMessage: document.getElementById('welcome-message'),
    boardCount: document.getElementById('board-count'),
    logoutBtn: document.getElementById('logout-btn'),
    boardList: document.getElementById('board-list'),
    newBoardBtn: document.getElementById('new-board-btn'),
    cardForm: document.getElementById('card-form'),
    cardList: document.getElementById('card-list'),
    activeBoardName: document.getElementById('active-board-name'),
    startRoundBtn: document.getElementById('start-round-btn'),
    currentTerm: document.getElementById('current-term'),
    answerForm: document.getElementById('answer-form'),
    answerInput: document.getElementById('answer-input'),
    roundFeedback: document.getElementById('round-feedback'),
    monster: document.getElementById('monster'),
    explosion: document.getElementById('explosion'),
    analytics: {
        rounds: document.getElementById('metric-rounds'),
        success: document.getElementById('metric-success'),
        fastest: document.getElementById('metric-fastest')
    },
    historyTable: document.querySelector('#history-table tbody')
};

document.getElementById('current-year').textContent = new Date().getFullYear();

const state = {
    data: loadData(),
    currentUser: null,
    activeBoardId: null,
    currentRound: null
};

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { users: {} };
    } catch (error) {
        console.error('Failed to load data', error);
        return { users: {} };
    }
}

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function getUser(email) {
    return state.data.users[email] || null;
}

function setUser(user) {
    state.data.users[user.email] = user;
    persist();
}

function switchToLogin() {
    dom.showLogin.classList.add('active');
    dom.showRegister.classList.remove('active');
    dom.loginForm.classList.remove('hidden');
    dom.registerForm.classList.add('hidden');
}

function switchToRegister() {
    dom.showRegister.classList.add('active');
    dom.showLogin.classList.remove('active');
    dom.registerForm.classList.remove('hidden');
    dom.loginForm.classList.add('hidden');
}

function loginUser(user) {
    state.currentUser = user.email;
    dom.authSection.classList.add('hidden');
    dom.appSection.classList.remove('hidden');
    dom.answerInput.disabled = true;
    dom.answerForm.querySelector('button').disabled = true;
    renderDashboard();
}

function logoutUser() {
    endRound('logout');
    state.currentUser = null;
    state.activeBoardId = null;
    dom.appSection.classList.add('hidden');
    dom.authSection.classList.remove('hidden');
    switchToLogin();
    dom.loginForm.reset();
}

function renderDashboard() {
    const user = getCurrentUser();
    if (!user) return;

    dom.welcomeMessage.textContent = `Welcome back, ${user.name}!`;
    dom.boardCount.textContent = `${user.boards.length} board${user.boards.length === 1 ? '' : 's'} created`;

    renderBoards();
    renderCards();
    updateAnalytics();
    renderHistory();
}

function renderBoards() {
    const user = getCurrentUser();
    dom.boardList.innerHTML = '';
    if (!user) return;

    if (!user.boards.length) {
        const li = document.createElement('li');
        li.textContent = 'No boards yet. Create one to get started!';
        li.style.justifyContent = 'center';
        dom.boardList.appendChild(li);
        return;
    }

    user.boards.forEach(board => {
        const li = document.createElement('li');
        li.dataset.boardId = board.id;
        li.classList.toggle('active', board.id === state.activeBoardId);

        const meta = document.createElement('div');
        meta.className = 'meta';
        const name = document.createElement('strong');
        name.textContent = board.name;
        const details = document.createElement('span');
        details.textContent = `${board.cards.length} card${board.cards.length === 1 ? '' : 's'}`;

        meta.append(name, details);
        li.appendChild(meta);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'ghost small';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteBoard(board.id);
        });

        li.appendChild(deleteBtn);
        li.addEventListener('click', () => {
            state.activeBoardId = board.id;
            renderBoards();
            renderCards();
            resetRoundUI();
        });

        dom.boardList.appendChild(li);
    });
}

function renderCards() {
    const board = getActiveBoard();
    dom.cardList.innerHTML = '';
    dom.activeBoardName.textContent = board ? board.name : 'No board selected';

    if (!board) {
        return;
    }

    if (!board.cards.length) {
        const li = document.createElement('li');
        li.textContent = 'Add cards to this board to play a round.';
        li.style.justifyContent = 'center';
        dom.cardList.appendChild(li);
        return;
    }

    board.cards.forEach(card => {
        const li = document.createElement('li');
        li.innerHTML = `<span><strong>${card.term}</strong> → ${card.translation}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ghost small';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => deleteCard(card.id));
        li.appendChild(removeBtn);
        dom.cardList.appendChild(li);
    });
}

function renderHistory() {
    const user = getCurrentUser();
    dom.historyTable.innerHTML = '';
    if (!user || !user.history.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.textContent = 'Play a round to see analytics history.';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        dom.historyTable.appendChild(row);
        return;
    }

    user.history.slice(-10).reverse().forEach(entry => {
        const row = document.createElement('tr');
        const board = user.boards.find(b => b.id === entry.boardId);
        const resultLabel = entry.success ? 'Victory' : 'Missed';
        const formattedTime = entry.timeLeft !== null ? `${entry.timeLeft.toFixed(1)}s` : '0s';

        row.innerHTML = `
            <td>${board ? board.name : 'Deleted board'}</td>
            <td>${entry.term}</td>
            <td>${resultLabel}</td>
            <td>${formattedTime}</td>
            <td>${new Date(entry.playedAt).toLocaleString()}</td>
        `;
        dom.historyTable.appendChild(row);
    });
}

function updateAnalytics() {
    const user = getCurrentUser();
    if (!user) return;

    const total = user.history.length;
    const wins = user.history.filter(entry => entry.success).length;
    const fastest = user.history
        .filter(entry => entry.success)
        .reduce((min, entry) => entry.timeLeft !== null && entry.timeLeft > min ? entry.timeLeft : min, 0);

    dom.analytics.rounds.textContent = total.toString();
    dom.analytics.success.textContent = total ? `${Math.round((wins / total) * 100)}%` : '0%';
    dom.analytics.fastest.textContent = fastest ? `${fastest.toFixed(1)}s` : '–';
}

function getCurrentUser() {
    if (!state.currentUser) return null;
    return getUser(state.currentUser);
}

function getActiveBoard() {
    const user = getCurrentUser();
    if (!user) return null;
    return user.boards.find(board => board.id === state.activeBoardId) || null;
}

function createBoard(name) {
    const user = getCurrentUser();
    if (!user) return;
    const id = crypto.randomUUID();
    user.boards.push({ id, name, cards: [] });
    setUser(user);
    state.activeBoardId = id;
    renderDashboard();
}

function deleteBoard(boardId) {
    const user = getCurrentUser();
    if (!user) return;
    user.boards = user.boards.filter(board => board.id !== boardId);
    if (state.activeBoardId === boardId) {
        state.activeBoardId = user.boards[0]?.id || null;
    }
    setUser(user);
    renderDashboard();
}

function addCard(term, translation) {
    const board = getActiveBoard();
    if (!board) return;
    board.cards.push({ id: crypto.randomUUID(), term, translation });
    setUser(getCurrentUser());
    renderCards();
}

function deleteCard(cardId) {
    const board = getActiveBoard();
    if (!board) return;
    board.cards = board.cards.filter(card => card.id !== cardId);
    setUser(getCurrentUser());
    renderCards();
}

function startRound() {
    const board = getActiveBoard();
    if (!board) {
        showFeedback('Select a board to start.', false);
        return;
    }
    if (!board.cards.length) {
        showFeedback('Add at least one card to this board.', false);
        return;
    }

    const card = board.cards[Math.floor(Math.random() * board.cards.length)];
    dom.currentTerm.textContent = `Translate: ${card.term}`;
    dom.answerInput.value = '';
    dom.answerInput.disabled = false;
    dom.answerForm.querySelector('button').disabled = false;
    dom.answerInput.focus();

    resetTrack();
    void dom.monster.offsetWidth;
    dom.monster.classList.add('running');
    dom.roundFeedback.textContent = '';
    dom.roundFeedback.classList.remove('success', 'fail');

    const timeoutId = setTimeout(() => finishRound(false), ROUND_DURATION);
    state.currentRound = {
        boardId: board.id,
        term: card.term,
        translation: card.translation,
        startTime: performance.now(),
        timeoutId
    };
}

function finishRound(success) {
    if (!state.currentRound) return;
    clearTimeout(state.currentRound.timeoutId);

    const elapsed = performance.now() - state.currentRound.startTime;
    const timeLeft = Math.max(0, (ROUND_DURATION - elapsed) / 1000);
    const rounded = Number(timeLeft.toFixed(1));

    const user = getCurrentUser();
    if (user) {
        user.history.push({
            boardId: state.currentRound.boardId,
            term: state.currentRound.term,
            success,
            timeLeft: success ? rounded : 0,
            playedAt: new Date().toISOString()
        });
        setUser(user);
        updateAnalytics();
        renderHistory();
    }

    if (success) {
        dom.roundFeedback.textContent = `Monster defeated with ${rounded.toFixed(1)}s left!`;
        dom.roundFeedback.classList.remove('fail');
        dom.roundFeedback.classList.add('success');
        dom.monster.classList.remove('running');
        dom.monster.style.opacity = '0';
        dom.explosion.classList.remove('hidden');
        dom.explosion.classList.add('visible');
        setTimeout(resetTrack, 1500);
    } else {
        dom.roundFeedback.textContent = 'Oh no! The monster escaped.';
        dom.roundFeedback.classList.remove('success');
        dom.roundFeedback.classList.add('fail');
        dom.monster.classList.remove('running');
        dom.monster.style.left = 'calc(100% - 64px)';
        dom.monster.style.opacity = '1';
        dom.explosion.classList.add('hidden');
        dom.explosion.classList.remove('visible');
    }

    dom.answerInput.disabled = true;
    dom.answerForm.querySelector('button').disabled = true;
    state.currentRound = null;
}

function endRound(reason) {
    if (!state.currentRound) return;
    clearTimeout(state.currentRound.timeoutId);
    if (reason === 'logout') {
        resetRoundUI();
    }
    state.currentRound = null;
}

function resetRoundUI() {
    dom.currentTerm.textContent = 'Select a board and start a round.';
    dom.roundFeedback.textContent = '';
    dom.roundFeedback.classList.remove('success', 'fail');
    dom.answerInput.value = '';
    dom.answerInput.disabled = true;
    dom.answerForm.querySelector('button').disabled = true;
    resetTrack();
}

function resetTrack() {
    dom.monster.classList.remove('running');
    dom.monster.style.left = '12px';
    dom.monster.style.opacity = '1';
    dom.explosion.classList.add('hidden');
    dom.explosion.classList.remove('visible');
}

function showFeedback(message, success) {
    dom.roundFeedback.textContent = message;
    dom.roundFeedback.classList.toggle('success', success);
    dom.roundFeedback.classList.toggle('fail', !success);
}

// Event bindings

dom.showLogin.addEventListener('click', switchToLogin);
dom.showRegister.addEventListener('click', switchToRegister);

dom.registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const password = document.getElementById('register-password').value;

    if (getUser(email)) {
        alert('An account with this email already exists.');
        return;
    }

    const newUser = {
        name,
        email,
        password,
        boards: [],
        history: []
    };
    setUser(newUser);
    dom.registerForm.reset();
    loginUser(newUser);
});

dom.loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const user = getUser(email);
    if (!user || user.password !== password) {
        alert('Invalid credentials.');
        return;
    }

    loginUser(user);
});

dom.logoutBtn.addEventListener('click', logoutUser);

dom.newBoardBtn.addEventListener('click', () => {
    const name = prompt('Name your new board');
    if (name) {
        createBoard(name.trim());
    }
});

dom.cardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const term = document.getElementById('term-input').value.trim();
    const translation = document.getElementById('translation-input').value.trim();
    if (!term || !translation) return;
    addCard(term, translation);
    dom.cardForm.reset();
});

dom.startRoundBtn.addEventListener('click', startRound);

dom.answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.currentRound) return;
    const guess = dom.answerInput.value.trim().toLowerCase();
    const correct = state.currentRound.translation.trim().toLowerCase();
    if (!guess) return;
    finishRound(guess === correct);
});

window.addEventListener('beforeunload', () => {
    if (state.currentRound) {
        endRound();
    }
});
