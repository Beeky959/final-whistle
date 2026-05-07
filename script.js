const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");
const stadiumCard = document.querySelector(".stadium-card");
const setupForm = document.getElementById("setupForm");
const playerNameInput = document.getElementById("playerName");
const startButton = document.getElementById("startButton");
const playAgainButton = document.getElementById("playAgainButton");
const roundText = document.getElementById("roundText");
const scorePill = document.querySelector(".score-pill");
const scoreText = document.getElementById("scoreText");
const playerText = document.getElementById("playerText");
const difficultyText = document.getElementById("difficultyText");
const reactionText = document.getElementById("reactionText");
const targetZone = document.getElementById("targetZone");
const footballTarget = document.getElementById("footballTarget");
const situationCard = document.getElementById("situationCard");
const situationText = document.getElementById("situationText");
const answerButtons = document.querySelectorAll(".answer-button");
const feedbackText = document.getElementById("feedbackText");
const timerText = document.getElementById("timerText");
const timerProgress = document.getElementById("timerProgress");
const timerBarFill = document.getElementById("timerBarFill");
const finalScoreText = document.getElementById("finalScoreText");
const ratingText = document.getElementById("ratingText");
const bestReactionText = document.getElementById("bestReactionText");
const leaderboardList = document.getElementById("leaderboardList");

const totalRounds = 10;
const timerCircleLength = 188.5;
const leaderboardKey = "finalWhistleReactionLeaderboard";

// Difficulty controls only the timer length. Scoring still rewards speed.
const difficultySettings = {
  easy: {
    label: "Easy",
    time: 5
  },
  medium: {
    label: "Medium",
    time: 3
  },
  hard: {
    label: "Hard",
    time: 1.5
  }
};

// Each situation has one best football decision.
const situations = [
  {
    text: "Your winger is free on the right, and two defenders are closing you down.",
    answer: "Pass"
  },
  {
    text: "The goalkeeper is off the line, and you have space at the edge of the box.",
    answer: "Shoot"
  },
  {
    text: "A defender dives into a tackle too early, leaving space behind them.",
    answer: "Dribble"
  },
  {
    text: "The other team launches a counterattack, and you are the last player back.",
    answer: "Defend"
  },
  {
    text: "A teammate makes a clean run between the center backs.",
    answer: "Pass"
  },
  {
    text: "The ball sits perfectly on your strong foot inside the penalty area.",
    answer: "Shoot"
  },
  {
    text: "You receive the ball near the touchline with only one defender in front of you.",
    answer: "Dribble"
  },
  {
    text: "Your opponent turns toward goal with no pressure on the ball.",
    answer: "Defend"
  },
  {
    text: "You are crowded in midfield, but your fullback is open behind you.",
    answer: "Pass"
  },
  {
    text: "A loose clearance drops to you just outside the six-yard box.",
    answer: "Shoot"
  },
  {
    text: "You spot a gap between two tired defenders near the final whistle.",
    answer: "Dribble"
  },
  {
    text: "The striker is shaping to shoot, and you can close the angle quickly.",
    answer: "Defend"
  }
];

let currentRound = 0;
let score = 0;
let currentSituation = null;
let timerId = null;
let timeLeft = difficultySettings.medium.time;
let roundTime = difficultySettings.medium.time;
let playerName = "Player";
let currentDifficulty = "medium";
let bestReactionTime = null;
let acceptingAnswers = false;
let availableSituations = [];

startButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", showHomeScreen);

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startGame();
});

answerButtons.forEach((button) => {
  button.addEventListener("click", () => handleAnswer(button.dataset.answer));
});

function startGame() {
  if (!setupForm.reportValidity()) {
    return;
  }

  const selectedDifficulty = document.querySelector("input[name='difficulty']:checked");

  playerName = playerNameInput.value.trim() || "Player";
  currentDifficulty = selectedDifficulty.value;
  roundTime = difficultySettings[currentDifficulty].time;
  currentRound = 0;
  score = 0;
  bestReactionTime = null;
  availableSituations = shuffleArray([...situations]);
  scoreText.textContent = score;
  reactionText.textContent = "--";
  playerText.textContent = playerName;
  difficultyText.textContent = difficultySettings[currentDifficulty].label;
  showScreen(gameScreen);
  startRound();
}

function startRound() {
  currentRound += 1;
  currentSituation = availableSituations.pop();
  timeLeft = roundTime;
  acceptingAnswers = true;

  roundText.textContent = currentRound;
  situationText.textContent = currentSituation.text;
  feedbackText.textContent = "";
  reactionText.textContent = "--";
  resetAnswerButtons();
  resetFeedbackEffects();
  animateSituationCard();
  updateTimerDisplay();

  clearInterval(timerId);
  timerId = setInterval(tickTimer, 100);
}

function tickTimer() {
  timeLeft -= 0.1;

  if (timeLeft <= 0) {
    timeLeft = 0;
    updateTimerDisplay();
    finishRound(null);
    return;
  }

  updateTimerDisplay();
}

function updateTimerDisplay() {
  const progress = timeLeft / roundTime;
  timerText.textContent = timeLeft.toFixed(1);
  timerProgress.style.strokeDashoffset = timerCircleLength * (1 - progress);
  timerBarFill.style.transform = `scaleX(${progress})`;

  // Switch to red as the whistle gets close.
  timerProgress.style.stroke = timeLeft <= 1 ? "var(--red)" : "var(--gold)";
  timerBarFill.style.background = timeLeft <= 1
    ? "linear-gradient(90deg, var(--red), var(--gold))"
    : "linear-gradient(90deg, var(--green), var(--gold))";
}

function handleAnswer(selectedAnswer) {
  if (!acceptingAnswers) {
    return;
  }

  finishRound(selectedAnswer);
}

function finishRound(selectedAnswer) {
  acceptingAnswers = false;
  clearInterval(timerId);

  const wasCorrect = selectedAnswer === currentSituation.answer;
  const reactionSeconds = selectedAnswer === null ? roundTime : roundTime - timeLeft;

  reactionText.textContent = `${reactionSeconds.toFixed(2)}s`;

  answerButtons.forEach((button) => {
    button.disabled = true;

    if (button.dataset.answer === currentSituation.answer) {
      button.classList.add("correct");
    }

    if (selectedAnswer === button.dataset.answer && !wasCorrect) {
      button.classList.add("wrong");
    }
  });

  if (wasCorrect) {
    const roundPoints = Math.max(1, Math.ceil((timeLeft / roundTime) * 12));
    score += roundPoints;
    scoreText.textContent = score;

    if (bestReactionTime === null || reactionSeconds < bestReactionTime) {
      bestReactionTime = reactionSeconds;
    }

    feedbackText.textContent = `GOAL! +${roundPoints} points`;
    showGoalEffects();
  } else if (selectedAnswer === null) {
    feedbackText.textContent = "MISS! Too slow";
    showMissEffects();
  } else {
    feedbackText.textContent = "MISS! Wrong choice";
    showMissEffects();
  }

  setTimeout(() => {
    if (currentRound === totalRounds) {
      endGame();
    } else {
      startRound();
    }
  }, 1050);
}

function endGame() {
  finalScoreText.textContent = score;
  ratingText.textContent = getRating(score);
  bestReactionText.textContent = bestReactionTime === null ? "--" : `${bestReactionTime.toFixed(2)}s`;
  saveScore();
  showLeaderboard();
  showScreen(endScreen);
}

function getRating(finalScore) {
  if (finalScore <= 20) {
    return "Beginner";
  }

  if (finalScore <= 45) {
    return "Academy Player";
  }

  if (finalScore <= 75) {
    return "Pro Player";
  }

  return "Legend";
}

function showScreen(screenToShow) {
  homeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  endScreen.classList.remove("active");
  screenToShow.classList.add("active");
}

function showHomeScreen() {
  clearInterval(timerId);
  feedbackText.textContent = "";
  showScreen(homeScreen);
}

function resetAnswerButtons() {
  answerButtons.forEach((button) => {
    button.disabled = false;
    button.classList.remove("correct", "wrong");
  });
}

function resetFeedbackEffects() {
  feedbackText.classList.remove("goal", "miss");
  stadiumCard.classList.remove("goal-flash", "miss-flash");
  scorePill.classList.remove("score-boost");
  targetZone.classList.remove("miss-shake");
  footballTarget.classList.remove("goal-pop");
}

function showGoalEffects() {
  feedbackText.classList.add("goal");
  restartAnimation(stadiumCard, "goal-flash");
  restartAnimation(scorePill, "score-boost");
  restartAnimation(footballTarget, "goal-pop");
}

function showMissEffects() {
  feedbackText.classList.add("miss");
  restartAnimation(stadiumCard, "miss-flash");
  restartAnimation(targetZone, "miss-shake");
}

function restartAnimation(element, className) {
  element.classList.remove(className);

  // Reading offsetWidth lets the browser restart the animation cleanly.
  element.offsetWidth;
  element.classList.add(className);
}

function animateSituationCard() {
  situationCard.classList.remove("round-enter");

  // Restart the CSS animation each round.
  setTimeout(() => {
    situationCard.classList.add("round-enter");
  }, 20);
}

function saveScore() {
  const leaderboard = getLeaderboard();
  const scoreEntry = {
    name: playerName,
    score,
    difficulty: difficultySettings[currentDifficulty].label,
    date: new Date().toLocaleDateString()
  };

  leaderboard.push(scoreEntry);
  leaderboard.sort((a, b) => b.score - a.score);

  try {
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard.slice(0, 5)));
  } catch (error) {
    // If storage is blocked, the game can still show the final score.
  }
}

function showLeaderboard() {
  const leaderboard = getLeaderboard();
  leaderboardList.innerHTML = "";
  leaderboardList.classList.toggle("leaderboard-empty", leaderboard.length === 0);

  if (leaderboard.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No scores yet.";
    leaderboardList.appendChild(emptyItem);
    return;
  }

  leaderboard.forEach((entry) => {
    const listItem = document.createElement("li");
    const name = document.createElement("strong");
    const scoreValue = document.createElement("span");
    const details = document.createTextNode(` - ${entry.difficulty} - ${entry.date}`);

    name.textContent = entry.name;
    scoreValue.textContent = ` ${entry.score} pts`;

    listItem.appendChild(name);
    listItem.appendChild(scoreValue);
    listItem.appendChild(details);
    leaderboardList.appendChild(listItem);
  });
}

function getLeaderboard() {
  try {
    const savedScores = localStorage.getItem(leaderboardKey);

    if (!savedScores) {
      return [];
    }

    return JSON.parse(savedScores);
  } catch (error) {
    return [];
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }

  return array;
}
