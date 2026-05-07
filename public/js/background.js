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

//  COUTEAU DEPUIS LE PLAFOND
function drawKnifeFromCeiling(ctx, cx, tipY, w) {
  ctx.save();
  ctx.translate(cx, tipY);
  ctx.rotate(Math.PI);

  const totalLen  = tipY;
  const bladeLen  = Math.min(totalLen - 30, 110);
  const handleLen = totalLen - bladeLen;

  // Manche bois
  const hGrad = ctx.createLinearGradient(-w * 0.38, 0, w * 0.38, 0);
  hGrad.addColorStop(0,   '#2c1a0a');
  hGrad.addColorStop(0.2, '#7a4e28');
  hGrad.addColorStop(0.5, '#a0683a');
  hGrad.addColorStop(0.8, '#7a4e28');
  hGrad.addColorStop(1,   '#2c1a0a');
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.roundRect(-w * 0.38, 0, w * 0.76, handleLen, [4, 4, 2, 2]);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let i = 8; i < handleLen - 4; i += 10) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, i);
    ctx.lineTo( w * 0.35, i);
    ctx.stroke();
  }

  [handleLen * 0.25, handleLen * 0.6].forEach(ry => {
    ctx.fillStyle = '#c8a040';
    ctx.beginPath();
    ctx.ellipse(0, ry, w * 0.12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6010';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  ctx.strokeStyle = '#1a0a00';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.38, 0, w * 0.76, handleLen, [4, 4, 2, 2]);
  ctx.stroke();

  const gY = handleLen;
  ctx.fillStyle = '#b0b8c8';
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.fill();
  const gGrad = ctx.createLinearGradient(-w * 0.58, gY, w * 0.58, gY);
  gGrad.addColorStop(0,   'rgba(255,255,255,0.3)');
  gGrad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  gGrad.addColorStop(1,   'rgba(0,0,0,0.2)');
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.fill();
  ctx.strokeStyle = '#707888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.stroke();

  const bY    = gY + 7;
  const bGrad = ctx.createLinearGradient(-w * 0.42, bY, w * 0.42, bY);
  bGrad.addColorStop(0,   '#d8dde8');
  bGrad.addColorStop(0.3, '#f5f8ff');
  bGrad.addColorStop(0.7, '#e8eaf0');
  bGrad.addColorStop(1,   '#8090a8');
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, bY);
  ctx.lineTo( w * 0.42, bY);
  ctx.quadraticCurveTo(w * 0.38, bY + bladeLen * 0.6, 0, bY + bladeLen);
  ctx.lineTo(-w * 0.38, bY + bladeLen - 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a6878';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, bY + 4);
  ctx.quadraticCurveTo(-w * 0.2, bY + bladeLen * 0.55, -w * 0.04, bY + bladeLen - 10);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo( w * 0.1,  bY + 4);
  ctx.lineTo( w * 0.3,  bY + 4);
  ctx.quadraticCurveTo(w * 0.25, bY + bladeLen * 0.4, w * 0.04, bY + bladeLen * 0.5);
  ctx.lineTo(-w * 0.02, bY + bladeLen * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

//  COUTEAU DEPUIS LE SOL (pointe vers le haut)
function drawKnifeFromFloor(ctx, cx, tipY, w, GROUND) {
  ctx.save();
  ctx.translate(cx, tipY);

  const totalLen  = GROUND - tipY;
  const bladeLen  = Math.min(totalLen - 30, 110);
  const handleLen = totalLen - bladeLen;

  const bGrad = ctx.createLinearGradient(-w * 0.42, 0, w * 0.42, 0);
  bGrad.addColorStop(0,   '#d8dde8');
  bGrad.addColorStop(0.3, '#f5f8ff');
  bGrad.addColorStop(0.7, '#e8eaf0');
  bGrad.addColorStop(1,   '#8090a8');
  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.moveTo(-w * 0.42, -bladeLen + 8);
  ctx.lineTo( w * 0.42, -bladeLen + 8);
  ctx.quadraticCurveTo(w * 0.38, -bladeLen * 0.4, 0, 0);
  ctx.lineTo(-w * 0.38, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#5a6878';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.28, -bladeLen + 12);
  ctx.quadraticCurveTo(-w * 0.2, -bladeLen * 0.45, -w * 0.04, -10);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.moveTo( w * 0.1,  -bladeLen + 12);
  ctx.lineTo( w * 0.3,  -bladeLen + 12);
  ctx.quadraticCurveTo(w * 0.25, -bladeLen * 0.6, w * 0.04, -bladeLen * 0.5);
  ctx.lineTo(-w * 0.02, -bladeLen * 0.5);
  ctx.closePath();
  ctx.fill();

  const gY = -bladeLen + 2;
  ctx.fillStyle = '#b0b8c8';
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.fill();
  const gGrad = ctx.createLinearGradient(-w * 0.58, gY, w * 0.58, gY);
  gGrad.addColorStop(0,   'rgba(255,255,255,0.3)');
  gGrad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  gGrad.addColorStop(1,   'rgba(0,0,0,0.2)');
  ctx.fillStyle = gGrad;
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.fill();
  ctx.strokeStyle = '#707888';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-w * 0.58, gY - 5, w * 1.16, 12, 3);
  ctx.stroke();

  const hY    = gY + 7;
  const hGrad = ctx.createLinearGradient(-w * 0.38, 0, w * 0.38, 0);
  hGrad.addColorStop(0,   '#2c1a0a');
  hGrad.addColorStop(0.2, '#7a4e28');
  hGrad.addColorStop(0.5, '#a0683a');
  hGrad.addColorStop(0.8, '#7a4e28');
  hGrad.addColorStop(1,   '#2c1a0a');
  ctx.fillStyle = hGrad;
  ctx.beginPath();
  ctx.roundRect(-w * 0.38, hY, w * 0.76, handleLen, [2, 2, 4, 4]);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let i = 8; i < handleLen - 4; i += 10) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, hY + i);
    ctx.lineTo( w * 0.35, hY + i);
    ctx.stroke();
  }

  [handleLen * 0.25, handleLen * 0.6].forEach(ry => {
    ctx.fillStyle = '#c8a040';
    ctx.beginPath();
    ctx.ellipse(0, hY + ry, w * 0.12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6010';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  ctx.strokeStyle = '#1a0a00';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-w * 0.38, hY, w * 0.76, handleLen, [2, 2, 4, 4]);
  ctx.stroke();

  ctx.restore();
}

