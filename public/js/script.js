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
  const random = -((Math.random() * 300) + 200);
  space.style.top = `${random}px`;
  score += 1;
  scoreEl.textContent = score;
});

setInterval(function() {
    var itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue("top"));
    if(jumping == 0){
        items.style.top = (itemsTop + 3) + "px";
    }

    const blockRect = block.getBoundingClientRect();
    const spaceRect = space.getBoundingClientRect();
    const itemsRect = items.getBoundingClientRect();
    const globalRect = document.getElementById('global').getBoundingClientRect();

    const hitHorizontally =
        itemsRect.right > blockRect.left &&
        itemsRect.left < blockRect.right;

    const insideGap =
        itemsRect.top > spaceRect.top &&
        itemsRect.bottom < spaceRect.bottom;

    const hitGround =
        itemsRect.bottom >= globalRect.bottom;

    if (hitGround || (hitHorizontally && !insideGap)) {
        items.style.top = "100px";
        endGame();
    }
},10);

function randomRotation() {
    return Math.floor(Math.random()*166) - 66;
}

function jump() {
    jumping = 1;
    let jumpingCount = 0;
    var jumpInterval = setInterval(function() {
        var itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue("top"));
        if((itemsTop > 6)&&(jumpingCount < 15)) {
            items.style.top = (itemsTop - 5) + "px";
            items.style.rotate = Math.floor(Math.random()*166) - 66;
        }
        
        if(jumpingCount > 20) {
            clearInterval(jumpInterval);
            jumping = 0;
            jumpingCount = 0;
        }
        jumpingCount ++;
    },10)
}