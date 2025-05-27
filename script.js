document.addEventListener('DOMContentLoaded', () => {
  const board = document.getElementById('game-board');
  const movesCounter = document.getElementById('moves');
  const timerDisplay = document.getElementById('timer');
  const restartBtn = document.getElementById('restartBtn');
  const winPopup = document.getElementById('win-popup');
  const finalMoves = document.getElementById('final-moves');
  const finalTime = document.getElementById('final-time');
  const playAgainBtn = document.getElementById('play-again-btn');
  const submitScoreBtn = document.getElementById('submit-score-btn');
  const nicknameInput = document.getElementById('nickname-input');
  const difficultyButtons = document.querySelectorAll('.difficulty-btn');
  const scoreboardBody = document.querySelector('#scoreboard tbody');

  const flipSound = document.getElementById('flip-sound');
  const matchSound = document.getElementById('match-sound');
  const winSound = document.getElementById('win-sound');

  const allEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'
  ];

  let difficulty = 'easy';
  let emojis = [];
  let cardsArray = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  let timer = null;
  let secondsElapsed = 0;
  let gameStarted = false;
  let playerHasSubmittedScore = false;

  const leaderboardKey = 'memoryGameLeaderboardV2';

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    secondsElapsed = 0;
    timerDisplay.textContent = formatTime(secondsElapsed);
    timer = setInterval(() => {
      secondsElapsed++;
      timerDisplay.textContent = formatTime(secondsElapsed);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setDifficulty(level) {
    difficulty = level;
    difficultyButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });
    createBoard();
    updateScoreboard();
  }

  function createBoard() {
    board.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    playerHasSubmittedScore = false;
    movesCounter.textContent = moves;
    stopTimer();
    gameStarted = false;
    winPopup.classList.add('hidden');
    nicknameInput.value = '';

    if (difficulty === 'easy') {
      emojis = allEmojis.slice(0, 4);
      board.style.gridTemplateColumns = 'repeat(4, 80px)';
    } else if (difficulty === 'medium') {
      emojis = allEmojis.slice(0, 8);
      board.style.gridTemplateColumns = 'repeat(4, 80px)';
    } else {
      emojis = allEmojis.slice(0, 12);
      board.style.gridTemplateColumns = 'repeat(6, 80px)';
    }

    cardsArray = [...emojis, ...emojis];
    cardsArray = shuffle(cardsArray);

    cardsArray.forEach((emoji, index) => {
      const card = document.createElement('div');
      card.classList.add('card');
      card.dataset.emoji = emoji;
      card.dataset.index = index;
      card.innerHTML = `
        <div class="front">?</div>
        <div class="back">${emoji}</div>
      `;
      card.addEventListener('click', flipCard);
      board.appendChild(card);
    });
  }

  function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
  }

  function flipCard(e) {
    const card = e.currentTarget;

    if (!gameStarted) {
      startTimer();
      gameStarted = true;
    }

    if (flippedCards.length === 2 || card.classList.contains('flipped')) return;

    card.classList.add('flipped');
    playSound(flipSound);
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      moves++;
      movesCounter.textContent = moves;
      checkMatch();
    }
  }

  function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.emoji === card2.dataset.emoji) {
      matchedPairs++;
      playSound(matchSound);
      flippedCards = [];
      if (matchedPairs === emojis.length) {
        stopTimer();
        playSound(winSound);
        showWinPopup();
      }
    } else {
      setTimeout(() => {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        flippedCards = [];
      }, 1000);
    }
  }

  function showWinPopup() {
    finalMoves.textContent = moves;
    finalTime.textContent = formatTime(secondsElapsed);
    winPopup.classList.remove('hidden');
  }

  function saveScore(nickname) {
    if (!nickname) return false;

    const leaderboard = getLeaderboard();

    if (!leaderboard[difficulty]) {
      leaderboard[difficulty] = [];
    }

    leaderboard[difficulty].push({
      player: nickname,
      moves,
      time: secondsElapsed,
      date: new Date().toISOString()
    });

    // Sort by moves, then time
    leaderboard[difficulty].sort((a, b) => {
      if (a.moves === b.moves) return a.time - b.time;
      return a.moves - b.moves;
    });

    // Keep only top 10 scores
    leaderboard[difficulty] = leaderboard[difficulty].slice(0, 10);

    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
    return true;
  }

  function getLeaderboard() {
    const data = localStorage.getItem(leaderboardKey);
    return data ? JSON.parse(data) : {};
  }

  function updateScoreboard() {
    const leaderboard = getLeaderboard();
    const scores = leaderboard[difficulty] || [];

    scoreboardBody.innerHTML = '';

    if (scores.length === 0) {
      scoreboardBody.innerHTML = `<tr><td colspan="4">No scores yet. Be the first!</td></tr>`;
      return;
    }

    scores.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${sanitize(entry.player)}</td>
        <td>${entry.moves}</td>
        <td>${formatTime(entry.time)}</td>
      `;
      scoreboardBody.appendChild(row);
    });
  }

  function sanitize(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  restartBtn.addEventListener('click', () => {
    createBoard();
    updateScoreboard();
  });

  playAgainBtn.addEventListener('click', () => {
    createBoard();
    updateScoreboard();
    winPopup.classList.add('hidden');
  });

  submitScoreBtn.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    if (nickname.length === 0) {
      alert('Please enter a nickname before submitting your score.');
      nicknameInput.focus();
      return;
    }

    if (playerHasSubmittedScore) {
      alert('You already submitted your score!');
      return;
    }

    if (saveScore(nickname)) {
      playerHasSubmittedScore = true;
      alert('Score submitted! Check the leaderboard.');
      updateScoreboard();
    }
  });

  difficultyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setDifficulty(btn.dataset.level);
    });
  });

  setDifficulty('easy');
  updateScoreboard();
});
