const GROUND_BG  = 150;
const GROUND_K   = 260;

const SKINS = [
  { id: 'navet',      emoji: '🥕' },
  { id: 'brocoli',    emoji: '🥦' },
  { id: 'piment',     emoji: '🌶️' },
  { id: 'aubergine',  emoji: '🍆' },
  { id: 'maïs',       emoji: '🌽' },
  { id: 'champignon', emoji: '🍄' },
  { id: 'avocat',     emoji: '🥑' },
  { id: 'ail',        emoji: '🧄' },
];

//  CACHE EMOJI
const _emojiCache = {};
function getEmojiCanvas(emoji, size) {
  const key = emoji + size;
  if (_emojiCache[key]) return _emojiCache[key];
  const oc = document.createElement('canvas');
  oc.width  = size + 8;
  oc.height = size + 8;
  const ox = oc.getContext('2d');
  ox.font = size + 'px serif';
  ox.textAlign    = 'center';
  ox.textBaseline = 'middle';
  ox.fillText(emoji, (size + 8) / 2, (size + 8) / 2);
  _emojiCache[key] = oc;
  return oc;
}

//  BACKGROUND
function drawBackground(ctx, W, H, GROUND, bgOffset = 0, cloudX = [130, 360, 600]) {
  // Ciel
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#5bc8f5');
  sky.addColorStop(1, '#a8e8c8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND);

  // Nuages
  cloudX.forEach((cx, i) => {
    const cy = 32 + i * 22;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(cx,      cy,      55, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 30, cy - 10, 35, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 28, cy - 5,  32, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // herbe
  ctx.fillStyle = '#4ecb71';
  ctx.fillRect(0, GROUND - 14, W, 20);

  // Sol / terre
  const soilGrad = ctx.createLinearGradient(0, GROUND + 6, 0, H);
  soilGrad.addColorStop(0, '#8B5E3C');
  soilGrad.addColorStop(1, '#4a2f12');
  ctx.fillStyle = soilGrad;
  ctx.fillRect(0, GROUND + 6, W, H - GROUND - 6);

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = -1; i < W / 80 + 2; i++) {
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.arc(i * 80 - bgOffset + j * 18, GROUND + 28 + j * 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Touffes d'herbe
  for (let i = -1; i < W / 60 + 2; i++) {
    const gx = ((i * 60 - bgOffset * 0.8) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.fillStyle = '#38a85a';
    ctx.beginPath();
    ctx.moveTo(gx - 6, GROUND - 10);
    ctx.lineTo(gx,     GROUND - 24);
    ctx.lineTo(gx + 6, GROUND - 10);
    ctx.fill();
  }
}

// 1. Préchargement (une seule fois, au démarrage)
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossible de charger : ${src}`));
    img.src = src;
  });
}

let knifeImg = null;

async function init() {
  knifeImg = await loadImage('./knife2.png');
  startGame();
}

// 2. Dessin (pointe en bas)
function drawKnifeFromTop(ctx, cx, tipY, w, GROUND) {
  if (!knifeImg) return;
  const totalLen = GROUND - tipY;
  ctx.drawImage(knifeImg, cx - w / 2, tipY, w, totalLen);
}

// 3. Dessin (pointe en haut)
function drawKnifeFromFloor(ctx, cx, tipY, w, GROUND) {
  if (!knifeImg) return;
  const totalLen = GROUND - tipY;
  ctx.save();
  ctx.translate(cx, tipY + totalLen);
  ctx.scale(1, -1);
  ctx.drawImage(knifeImg, -w / 2, 0, w, totalLen);
  ctx.restore();
}

// Démarrage
init();

//  JOUEUR (emoji avec ombre)
function drawPlayer(ctx, px, py, pw, ph, GROUND, vy = 0, emoji = '🥕') {
  // Ombre projetée au sol
  const dist        = GROUND - (py + ph);
  const shadowAlpha = Math.max(0.05, 0.35 - dist * 0.0012);
  const shadowScaleX = Math.max(0.4, 1 - dist * 0.003);
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(px + pw / 2, GROUND - 2, 22 * shadowScaleX, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Emoji
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  const tilt = Math.max(-0.5, Math.min(0.5, vy * 0.04));
  ctx.rotate(tilt);
  const ec   = getEmojiCanvas(emoji, pw);
  const half = (pw + 8) / 2;
  ctx.drawImage(ec, -half, -half);
  ctx.restore();
}

//  PIÈCE (emoji animée)
function drawCoin(ctx, cx, cy, anim = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = 1 + Math.sin(anim) * 0.1;
  ctx.scale(scale, scale);
  const ec = getEmojiCanvas('🪙', 22);
  ctx.drawImage(ec, -15, -15);
  ctx.restore();
}

//  PARTICULES
function drawParticles(ctx, particles) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
