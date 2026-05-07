// 1. RÉCUPÉRATION DES ÉLÉMENTS HTML

var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');

var W = canvas.width;
var H = canvas.height; 

var hudPieces = document.getElementById('hudPieces');
var hudTemps = document.getElementById('hudTemps');
var hudNiveau = document.getElementById('hudNiveau');



// 2. CONSTANTES ET VARIABLES DU JEU

var SOL = H - 90;
var JOUEUR_X = 100;
var GRAVITE = 0.10;
var FORCE_SAUT = -2.5;

var SKINS = [
  { id: 'navet',      emoji: '🥕', nom: 'Navet',      prix: 0   },
  { id: 'brocoli',    emoji: '🥦', nom: 'Brocoli',    prix: 80  },
  { id: 'piment',     emoji: '🌶️', nom: 'Piment',     prix: 120 },
  { id: 'aubergine',  emoji: '🍆', nom: 'Aubergine',  prix: 150 },
  { id: 'mais',       emoji: '🌽', nom: 'Maïs',       prix: 200 },
  { id: 'champignon', emoji: '🍄', nom: 'Champignon', prix: 250 },
  { id: 'avocat',     emoji: '🥑', nom: 'Avocat',     prix: 350 },
  { id: 'ail',        emoji: '🧄', nom: 'Ail',        prix: 500 },
];

var joueur = {
  x: JOUEUR_X,
  y: H / 2 - 22,
  vitesseY: 0,
  largeur: 44,
  hauteur: 44,
};

var obstacles = [];
var pieces = [];
var particules = [];
var tempsJeu = 0;
var piecesSession = 0;
var niveau = 1;
var decalageArrierePlan = 0;
var nuagesX = [200, 450, 680];

var etat = 'menu';
var etatAvant = 'menu';

var enAttente = true;

var cacheEmoji = {};



// 3. SAUVEGARDE (localStorage)

var sauvegarde = {
  pieces : 0,
  possedes : ['navet'],
  selectionne : 'navet',
  volMusique : 0.5,
  volSfx : 0.7,
  sensibilite : 1,
};

function chargerSauvegarde() {
  try {
    var donnees = localStorage.getItem('cvr_save');
    if (donnees) {
      var parse = JSON.parse(donnees);
      for (var cle in parse) {
        sauvegarde[cle] = parse[cle];
      }
    }
  } catch (erreur) {
    localStorage.removeItem('cvr_save');
  }
}

function enregistrerSauvegarde() {
  try {
    localStorage.setItem('cvr_save', JSON.stringify(sauvegarde));
  } catch (erreur) {
    // La sauvegarde est ignorée si le navigateur bloque localStorage.
  }
}

chargerSauvegarde();



// 4. AUDIO

var AudioCtx = window.AudioContext || window.webkitAudioContext;
var audioCtx  = null;
var gainMusique = null;
var timeoutMusique;

function getAudio() {
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function demarrerMusique() {
  if (!sauvegarde.volMusique) return;
  var ac = getAudio();
  if (!ac) return;
  gainMusique = ac.createGain();
  gainMusique.gain.value = sauvegarde.volMusique * 0.08;
  gainMusique.connect(ac.destination);

  var notes = [261, 294, 329, 349, 392, 349, 329, 294];
  var t = ac.currentTime + 0.1;

  function jouerNote(freq, debut, duree) {
    var osc = ac.createOscillator();
    var g = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.3, debut);
    g.gain.exponentialRampToValueAtTime(0.001, debut + duree);
    osc.connect(g);
    g.connect(gainMusique);
    osc.start(debut);
    osc.stop(debut + duree);
  }

  function boucle() {
    notes.forEach(function(note, i) {
      jouerNote(note, t + i * 0.3, 0.25);
    });
    t += notes.length * 0.3;
    timeoutMusique = setTimeout(boucle, (notes.length * 0.3 - 0.05) * 1000);
  }

  boucle();
}

function arreterMusique() {
  clearTimeout(timeoutMusique);
  if (gainMusique) {
    gainMusique.disconnect();
    gainMusique = null;
  }
}

function sonSaut() {
  if (!sauvegarde.volSfx) return;
  var ac  = getAudio();
  if (!ac) return;
  var osc = ac.createOscillator();
  var g   = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(700, ac.currentTime + 0.12);
  g.gain.setValueAtTime(sauvegarde.volSfx * 0.25, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.15);
}

function sonPiece() {
  if (!sauvegarde.volSfx) return;
  var ac    = getAudio();
  if (!ac) return;
  var freqs = [880, 1100];
  freqs.forEach(function(f, i) {
    var osc = ac.createOscillator();
    var g   = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    var debut = ac.currentTime + i * 0.08;
    g.gain.setValueAtTime(sauvegarde.volSfx * 0.2, debut);
    g.gain.exponentialRampToValueAtTime(0.001, debut + 0.1);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(debut);
    osc.stop(debut + 0.1);
  });
}

function sonMort() {
  if (!sauvegarde.volSfx) return;
  var ac    = getAudio();
  if (!ac) return;
  var freqs = [400, 300, 200];
  freqs.forEach(function(f, i) {
    var osc = ac.createOscillator();
    var g   = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    var debut = ac.currentTime + i * 0.15;
    g.gain.setValueAtTime(sauvegarde.volSfx * 0.3, debut);
    g.gain.exponentialRampToValueAtTime(0.001, debut + 0.2);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(debut);
    osc.stop(debut + 0.2);
  });
}



// 5. INITIALISATION D'UNE PARTIE

function initialiserPartie() {
  joueur.x = JOUEUR_X;
  joueur.y = H / 2 - 22;
  joueur.vitesseY = 0;

  obstacles = [];
  pieces = [];
  particules = [];

  tempsJeu = 0;
  piecesSession = 0;
  niveau = 1;
  decalageArrierePlan = 0;

  enAttente = true;
}

function getVitesse() {
  var niv = Math.min(niveau, 10);
  return 2.0 + (niv - 1) * 0.33;
}

function creerObstacle() {
  var largeurPassage = Math.max(170 - niveau * 4, 130);
  var centrPassage = 80 + Math.random() * (SOL - 160);
  var topH = centrPassage - largeurPassage / 2;
  var botY = centrPassage + largeurPassage / 2;

  obstacles.push({
    x: W + 60,
    topH: topH,
    botY: botY,
    w: 48,
    passe: false,
  });
}

function creerPieceEntre(obsA, obsB) {
  var x = (obsA.x + obsB.x) / 2;

  var y = null;
  for (var essai = 0; essai < 20; essai++) {
    var candidat = 40 + Math.random() * (SOL - 80);
    var securise = candidat > obsA.topH && candidat < obsA.botY
                && candidat > obsB.topH && candidat < obsB.botY;
    if (securise) {
      y = candidat;
      break;
    }
  }
  if (y === null) y = SOL / 2;

  pieces.push({ x: x, y: y, rayon: 12, ramassee: false, anim: 0 });
}

function ajouterParticules(x, y) {
  for (var i = 0; i < 8; i++) {
    particules.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5 - 2,
      vie: 1,
      rayon: 3 + Math.random() * 4,
    });
  }
}



// 6. DESSIN

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



// 7. MISE À JOUR (physique + collisions)

function mettreAJour(dt) {
  if (enAttente) return;

  var vitesse = getVitesse();

  tempsJeu += dt / 60;

  var nouveauNiveau = Math.min(Math.floor(tempsJeu/60) + 1, 10);
  if (nouveauNiveau > niveau) {
    niveau = nouveauNiveau;
    afficherBadgeNiveau(niveau);
  }

  joueur.vitesseY += GRAVITE;
  joueur.y += joueur.vitesseY;
  if (joueur.y + joueur.hauteur >= SOL) {
    joueur.y        = SOL - joueur.hauteur;
    joueur.vitesseY = 0;
  }

  if (joueur.y <= 0) {
    gererMort();
    return;
  }

  var distanceMin  = Math.max(480 - niveau * 10, 300);
  var dernierObs = obstacles[obstacles.length - 1];
  if (!dernierObs || dernierObs.x < W - distanceMin) {
    creerObstacle();
  }

  obstacles.forEach(function(o) {
    o.x -= vitesse;
  });

  if (obstacles.length >= 2) {
    var obsAvant = obstacles[obstacles.length - 2];
    var obsApres = obstacles[obstacles.length - 1];
    var milieu = (obsAvant.x + obsApres.x) / 2;
    var dejaPiece = pieces.some(function(p) { return Math.abs(p.x - milieu) < 60; });
    if (!dejaPiece && milieu > 0 && milieu < W + 200) {
      creerPieceEntre(obsAvant, obsApres);
    }
  }

  pieces.forEach(function(p) {
    p.x -= vitesse;
    p.anim += 0.08;
  });

  obstacles = obstacles.filter(function(o) { return o.x + o.w + 60 > 0; });
  pieces = pieces.filter(function(p)    { return p.x + p.rayon > 0; });

  pieces.forEach(function(p) {
    if (p.ramassee) return;
    var dx = (joueur.x + joueur.largeur / 2) - p.x;
    var dy = (joueur.y + joueur.hauteur / 2) - p.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < joueur.largeur / 2 + p.rayon) {
      p.ramassee = true;
      piecesSession++;
      sauvegarde.pieces++;
      ajouterParticules(p.x, p.y);
      sonPiece();
    }
  });

  var jx = joueur.x + 6;
  var jy = joueur.y + 6;
  var jw = joueur.largeur - 12;
  var jh = joueur.hauteur - 12;

  obstacles.forEach(function(o) {
    var dansZoneX = jx + jw > o.x && jx < o.x + o.w;

    if (dansZoneX) {
      if (jy < o.topH) {
        gererMort();
        return;
      }
      if (jy + jh > o.botY) {
        gererMort();
        return;
      }
    }
  });

  particules.forEach(function(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vie -= 0.03;
    p.rayon *= 0.97;
  });
  particules = particules.filter(function(p) { return p.vie > 0; });
}

function gererMort() {
  if (etat !== 'jeu') return;

  sonMort();
  arreterMusique();
  enregistrerSauvegarde();

  var minutes  = Math.floor(tempsJeu / 60);
  var secondes = Math.floor(tempsJeu % 60);
  var tempsFormate = minutes + ':' + String(secondes).padStart(2, '0');

  document.getElementById('mortTemps').textContent = tempsFormate;
  document.getElementById('mortNiveau').textContent = niveau;
  document.getElementById('mortPieces').textContent = piecesSession;
  document.getElementById('mortTotal').textContent = sauvegarde.pieces;

  changerEcran('mort');
  document.getElementById('hud').classList.add('cache');
}

var timerBadge;
function afficherBadgeNiveau(niv) {
  var badge = document.getElementById('badgeNiveau');
  badge.textContent = '🎉 Niveau ' + niv + ' !';
  badge.classList.add('visible');
  clearTimeout(timerBadge);
  timerBadge = setTimeout(function() {
    badge.classList.remove('visible');
  }, 2500);
}



// 8. BOUCLE DE JEU PRINCIPALE

var dernierTemps = 0;

function boucle(timestamp) {
  var dt = Math.min((timestamp - dernierTemps) / 1000, 0.05) * 60;
  dernierTemps = timestamp;

  if (etat === 'jeu') {
    mettreAJour(dt);
  }

  ctx.clearRect(0, 0, W, H);
  dessinerFond();

  if (etat === 'jeu' || etat === 'pause') {
    obstacles.forEach(dessinerObstacle);
    pieces.filter(function(p) { return !p.ramassee; }).forEach(dessinerPiece);
    dessinerParticules();
    dessinerJoueur();

    if (enAttente) {
      dessinerMessageAttente();
    }

    var m = Math.floor(tempsJeu / 60);
    var s = Math.floor(tempsJeu % 60);
    hudPieces.textContent = sauvegarde.pieces;
    hudTemps.textContent  = m + ':' + String(s).padStart(2, '0');
    hudNiveau.textContent = niveau;
  }

  requestAnimationFrame(boucle);
}



// 9. INTERFACE (menus, boutique)

function changerEcran(nouvelEtat) {
  var tousLesEcrans = ['ecranMenu', 'ecranPause', 'ecranParametres', 'ecranBoutique', 'ecranMort'];

  var correspondance = {
    'menu': 'ecranMenu',
    'pause': 'ecranPause',
    'parametres': 'ecranParametres',
    'boutique': 'ecranBoutique',
    'mort': 'ecranMort',
  };

  tousLesEcrans.forEach(function(id) {
    document.getElementById(id).classList.add('cache');
  });

  if (correspondance[nouvelEtat]) {
    document.getElementById(correspondance[nouvelEtat]).classList.remove('cache');
  }

  etat = nouvelEtat;
}

function afficherBoutique() {
  document.getElementById('boutiquePieces').textContent = sauvegarde.pieces;

  var grille = document.getElementById('grilleSkins');
  grille.innerHTML = '';

  SKINS.forEach(function(skin) {
    var possede   = sauvegarde.possedes.indexOf(skin.id) !== -1;
    var estEquipe = sauvegarde.selectionne === skin.id;

    var carte = document.createElement('div');
    carte.className = 'carteSkin';
    if (possede) carte.classList.add('possede');
    if (estEquipe) carte.classList.add('equipe');

    var textePrix;
    if (estEquipe) {
      textePrix = '✓ Équipé';
    } else if (possede) {
      textePrix = '✓ Possédé';
    } else {
      textePrix = '🪙 ' + skin.prix;
    }

    carte.innerHTML =
      '<span class="emoji">' + skin.emoji + '</span>' +
      '<span class="nom">' + skin.nom + '</span>' +
      '<span class="prix">' + textePrix + '</span>';

    carte.addEventListener('click', function() {
      if (possede) {
        sauvegarde.selectionne = skin.id;
        enregistrerSauvegarde();
        afficherBoutique();
      } else if (sauvegarde.pieces >= skin.prix) {
        sauvegarde.pieces -= skin.prix;
        sauvegarde.possedes.push(skin.id);
        sauvegarde.selectionne = skin.id;
        enregistrerSauvegarde();
        sonPiece();
        afficherBoutique();
      }
    });

    grille.appendChild(carte);
  });
}

function demarrerPartie() {
  initialiserPartie();
  changerEcran('jeu');
  document.getElementById('hud').classList.remove('cache');
  document.getElementById('badgeNiveau').classList.remove('visible');
}



// 10. CONTRÔLES (clavier et clic)

document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') {
    e.preventDefault();

    if (etat === 'jeu') {
      if (enAttente) {
        enAttente = false;
        demarrerMusique();
        joueur.vitesseY = FORCE_SAUT * sauvegarde.sensibilite;
        sonSaut();
      } else {
        joueur.vitesseY = FORCE_SAUT * sauvegarde.sensibilite;
        sonSaut();
      }
    } else if (etat === 'menu') {
      demarrerPartie();
    } else if (etat === 'pause') {
      reprendrePartie();
    }
  }

  if (e.code === 'Escape') {
    if (etat === 'jeu')   pauserPartie();
    if (etat === 'pause') reprendrePartie();
  }
});

canvas.addEventListener('click', function() {
  if (etat === 'jeu') {
    if (enAttente) {
      enAttente = false;
      demarrerMusique();
      joueur.vitesseY = FORCE_SAUT * sauvegarde.sensibilite;
      sonSaut();
    } else {
      joueur.vitesseY = FORCE_SAUT * sauvegarde.sensibilite;
      sonSaut();
    }
  }
});

function pauserPartie() {
  arreterMusique();
  changerEcran('pause');
}

function reprendrePartie() {
  changerEcran('jeu');
  demarrerMusique();
}

function quitterVersMenu() {
  arreterMusique();
  changerEcran('menu');
  document.getElementById('hud').classList.add('cache');
  document.getElementById('badgeNiveau').classList.remove('visible');
}

document.getElementById('btnJouer').addEventListener('click', demarrerPartie);

document.getElementById('btnBoutique').addEventListener('click', function() {
  etatAvant = 'menu';
  afficherBoutique();
  changerEcran('boutique');
});

document.getElementById('btnPause').addEventListener('click', pauserPartie);

document.getElementById('btnParametres').addEventListener('click', function() {
  etatAvant = etat;
  changerEcran('parametres');
});

document.getElementById('btnReprendre').addEventListener('click', reprendrePartie);

document.getElementById('btnPauseShop').addEventListener('click', function() {
  etatAvant = 'pause';
  afficherBoutique();
  changerEcran('boutique');
});

document.getElementById('btnPauseParam').addEventListener('click', function() {
  etatAvant = 'pause';
  changerEcran('parametres');
});

document.getElementById('btnQuitter').addEventListener('click', quitterVersMenu);

document.getElementById('btnRetourParam').addEventListener('click', function() {
  changerEcran(etatAvant);
});

document.getElementById('btnRetourBoutique').addEventListener('click', function() {
  changerEcran(etatAvant);
});

document.getElementById('btnRejouer').addEventListener('click', demarrerPartie);

document.getElementById('btnMortShop').addEventListener('click', function() {
  etatAvant = 'mort';
  afficherBoutique();
  changerEcran('boutique');
});

document.getElementById('btnMortMenu').addEventListener('click', quitterVersMenu);

document.getElementById('sliderMusique').value = sauvegarde.volMusique;
document.getElementById('sliderSfx').value     = sauvegarde.volSfx;
document.getElementById('sliderSens').value    = sauvegarde.sensibilite;

document.getElementById('sliderMusique').addEventListener('input', function(e) {
  sauvegarde.volMusique = parseFloat(e.target.value);
  if (gainMusique) gainMusique.gain.value = sauvegarde.volMusique * 0.08;
  enregistrerSauvegarde();
});

document.getElementById('sliderSfx').addEventListener('input', function(e) {
  sauvegarde.volSfx = parseFloat(e.target.value);
  enregistrerSauvegarde();
});

document.getElementById('sliderSens').addEventListener('input', function(e) {
  sauvegarde.sensibilite = parseFloat(e.target.value);
  enregistrerSauvegarde();
});



// 11. DÉMARRAGE

changerEcran('menu');
document.getElementById('hud').classList.add('cache');

requestAnimationFrame(function(ts) {
  dernierTemps = ts;
  requestAnimationFrame(boucle);
});
