const block = document.getElementById('block');
const space = document.getElementById('space');
const items = document.getElementById('items');
const scoreEl = document.getElementById('score');

let jumping = false;
let score = 0;
let gameOver = false;

const skinById = {
  carotte: '🥕',
  brocoli: '🥦',
  piment: '🌶️',
  aubergine: '🍆',
  mais: '🌽',
  champignon: '🍄',
  avocat: '🥑',
  ail: '🧄',
};

const selectedSkin = localStorage.getItem('cvr_skin') || 'carotte';
items.textContent = skinById[selectedSkin] || '🥕';

function resetGame() {
  items.style.top = '100px';
  score = 0;
  scoreEl.textContent = score;
  gameOver = false;
}

function endGame() {
  if (gameOver) return;
  gameOver = true;

  const best = Number(localStorage.getItem('cvr_best') || '0');
  const coins = Number(localStorage.getItem('cvr_coins') || '0');

  if (score > best) localStorage.setItem('cvr_best', String(score));
  localStorage.setItem('cvr_coins', String(coins + Math.floor(score / 5)));

  alert(`Game over\nScore : ${score}\nPièces gagnées : ${Math.floor(score / 5)}`);
  resetGame();
}

space.addEventListener('animationiteration', () => {
  const random = -((Math.random() * 300) + 150);
  space.style.top = `${random}px`;
  score += 1;
  scoreEl.textContent = score;
});

setInterval(() => {
  if (gameOver) return;

  const itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue('top'), 10);
  if (!jumping) {
    items.style.top = `${itemsTop + 3}px`;
  }

  const blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue('left'), 10);
  const spaceTop = parseInt(window.getComputedStyle(space).getPropertyValue('top'), 10);
  const currentItemsTop = parseInt(window.getComputedStyle(items).getPropertyValue('top'), 10);
  const collisionTop = -(500 - currentItemsTop);

  const hitsGround = currentItemsTop > 830;
  const hitsObstacle = blockLeft < 45 && blockLeft > -50 && (collisionTop < spaceTop || collisionTop > spaceTop + 150);

  if (hitsGround || hitsObstacle) endGame();
}, 10);

function jump() {
  if (jumping || gameOver) return;

  jumping = true;
  let jumpingCount = 0;

  const jumpInterval = setInterval(() => {
    const itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue('top'), 10);

    if (itemsTop > 6 && jumpingCount < 15) {
      items.style.top = `${itemsTop - 6}px`;
    }

    if (jumpingCount > 20) {
      clearInterval(jumpInterval);
      jumping = false;
    }

    jumpingCount += 1;
  }, 10);
}

document.addEventListener('click', jump);
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
  }
});
