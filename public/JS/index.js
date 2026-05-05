function dessinerFond() {
  var ciel = ctx.createLinearGradient(0, 0, 0, SOL);
  ciel.addColorStop(0, '#5bc8f5');
  ciel.addColorStop(1, '#a8e8c8');
  ctx.fillStyle = ciel;
  ctx.fillRect(0, 0, W, SOL);

  var vitesseNuage = (etat === 'jeu') ? getVitesse() * 0.18 : 0.4;
  for (var i = 0; i < nuagesX.length; i++) {
    nuagesX[i] -= vitesseNuage;
    if (nuagesX[i] < -160) nuagesX[i] = W + 80 + Math.random() * 200;

    var nx = nuagesX[i];
    var ny = 40 + i * 28;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(nx,      ny,      55, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(nx + 30, ny - 10, 35, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(nx - 28, ny - 5,  32, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = '#4ecb71';
  ctx.fillRect(0, SOL - 14, W, 20);

  var sol = ctx.createLinearGradient(0, SOL + 6, 0, H);
  sol.addColorStop(0, '#8B5E3C');
  sol.addColorStop(1, '#4a2f12');
  ctx.fillStyle = sol;
  ctx.fillRect(0, SOL + 6, W, H - SOL - 6);

  var vitesseSol = (etat === 'jeu') ? getVitesse() : 0.5;
  decalageArrierePlan = (decalageArrierePlan + vitesseSol) % 80;

  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (var col = -1; col < W / 80 + 2; col++) {
    for (var row = 0; row < 3; row++) {
      ctx.beginPath();
      ctx.arc(col * 80 - decalageArrierePlan + row * 18, SOL + 28 + row * 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#38a85a';
  for (var k = -1; k < W / 60 + 2; k++) {
    var gx = ((k * 60 - decalageArrierePlan * 0.8) % (W + 60) + W + 60) % (W + 60) - 30;
    ctx.beginPath();
    ctx.moveTo(gx - 6, SOL - 10);
    ctx.lineTo(gx,     SOL - 24);
    ctx.lineTo(gx + 6, SOL - 10);
    ctx.fill();
  }
}

function dessinerCouteau(cx, y, pointeVersLeBas) {
  ctx.save();
  ctx.translate(cx, y);

  if (!pointeVersLeBas) {
    ctx.scale(1, -1);
  }

  ctx.fillStyle = '#5c3a1e';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 16, 38, 4);
  ctx.fill();
  ctx.strokeStyle = '#3a2010';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  ctx.roundRect(-11, 36, 22, 8, 2);
  ctx.fill();

  var lameGrad = ctx.createLinearGradient(-6, 44, 6, 44);
  lameGrad.addColorStop(0,   '#e0e0e0');
  lameGrad.addColorStop(0.5, '#ffffff');
  lameGrad.addColorStop(1,   '#bbb');
  ctx.fillStyle = lameGrad;
  ctx.beginPath();
  ctx.moveTo(-6,  44);
  ctx.lineTo( 6,  44);
  ctx.lineTo( 2, 112);
  ctx.lineTo(-2, 112);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(-3, 46);
  ctx.lineTo(-1, 46);
  ctx.lineTo(-1.5, 105);
  ctx.lineTo(-3, 105);
  ctx.fill();

  ctx.restore();
}

function dessinerObstacle(obs) {
  var cx = obs.x + obs.w / 2;
  var lame = 112;

  var baseMancheHaut = obs.topH - lame;
  if (baseMancheHaut > 0) {
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(obs.x + obs.w/2 - 8, 0, 16, baseMancheHaut);
  }
  dessinerCouteau(cx, baseMancheHaut, true);

  var baseMancheBas = obs.botY + lame;
  dessinerCouteau(cx, baseMancheBas, false);
  if (baseMancheBas < SOL) {
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(obs.x + obs.w/2 - 8, baseMancheBas, 16, SOL - baseMancheBas);
  }
}

function getEmojiCanvas(emoji, taille) {
  var cle = emoji + taille;
  if (cacheEmoji[cle]) return cacheEmoji[cle];

  var miniCanvas = document.createElement('canvas');
  miniCanvas.width = taille + 8;
  miniCanvas.height = taille + 8;
  var miniCtx = miniCanvas.getContext('2d');
  miniCtx.font = taille + 'px serif';
  miniCtx.textAlign = 'center';
  miniCtx.textBaseline = 'middle';
  miniCtx.fillText(emoji, (taille + 8) / 2, (taille + 8) / 2);

  cacheEmoji[cle] = miniCanvas;
  return miniCanvas;
}

function dessinerJoueur() {
  var p = joueur;

  var distSol = SOL - (p.y + p.hauteur);
  var alphaOmbre = Math.max(0.05, 0.35 - distSol * 0.0012);
  var echelleOmbre = Math.max(0.4, 1 - distSol * 0.003);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,' + alphaOmbre + ')';
  ctx.beginPath();
  ctx.ellipse(p.x + p.largeur / 2, SOL - 2, 22 * echelleOmbre, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  var inclinaison = Math.max(-0.5, Math.min(0.5, p.vitesseY * 0.04));

  ctx.save();
  ctx.translate(p.x + p.largeur / 2, p.y + p.hauteur / 2);
  ctx.rotate(inclinaison);

  var skin = SKINS.find(function(s) { return s.id === sauvegarde.selectionne; }) || SKINS[0];
  var emojiCanvas = getEmojiCanvas(skin.emoji, p.largeur);
  var moitie = (p.largeur + 8) / 2;
  ctx.drawImage(emojiCanvas, -moitie, -moitie);

  ctx.restore();
}

function dessinerPiece(piece) {
  ctx.save();
  ctx.translate(piece.x, piece.y);

  var echelle = 1 + Math.sin(piece.anim) * 0.1;
  ctx.scale(echelle, echelle);

  var emojiCanvas = getEmojiCanvas('🪙', 22);
  ctx.drawImage(emojiCanvas, -15, -15);
  ctx.restore();
}

function dessinerParticules() {
  particules.forEach(function(p) {
    ctx.save();
    ctx.globalAlpha = p.vie;
    ctx.fillStyle = '#f5c842';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.rayon, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function dessinerMessageAttente() {
  ctx.save();
  ctx.globalAlpha = 0.85 + Math.sin(Date.now() / 300) * 0.15;
  ctx.fillStyle = 'white';
  ctx.font = "bold 22px 'Fredoka One', cursive";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText('⎵  Appuie sur Espace pour démarrer  ⎵', W / 2, H / 2 + 60);
  ctx.restore();
}
