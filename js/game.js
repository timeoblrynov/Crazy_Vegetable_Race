
const SKINS = [
  { id:'turnip', name:'Navet', emoji:'🥕', price:0, desc:'Le héros' },
  { id:'broccoli', name:'Brocoli', emoji:'🥦', price:50, desc:'Courageux' },
  { id:'eggplant', name:'Aubergine', emoji:'🍆', price:80, desc:'Mystérieux' },
  { id:'carrot', name:'Carotte', emoji:'🥕', price:100, desc:'Rapide' },
  { id:'corn', name:'Maïs', emoji:'🌽', price:150, desc:'Doré' },
  { id:'mushroom', name:'Champignon', emoji:'🍄', price:200, desc:'Magique' },
  { id:'tomato', name:'Tomate', emoji:'🍅', price:250, desc:'Acide' },
  { id:'avocado', name:'Avocat', emoji:'🥑', price:300, desc:'Tendance' },
  { id:'pepper', name:'Piment', emoji:'🌶️', price:400, desc:'Brûlant' },
];
 
let save = { coins: 0, best: 0, owned: ['turnip'], selected: 'turnip', musicVol: 70, sfxVol: 80, jumpSens: 5 };
function loadSave() {
  try { const s = JSON.parse(localStorage.getItem('cvr_save')); if(s) save = {...save,...s}; } catch(e){}
}
function writeSave() {
  try { localStorage.setItem('cvr_save', JSON.stringify(save)); } catch(e){}
}
loadSave();
 

let settings = { music: save.musicVol, sfx: save.sfxVol, jump: save.jumpSens };
let settingsFrom = 'home';
 

const AC = window.AudioContext || window.webkitAudioContext;
let actx = null;
function getAC() { if(!actx) actx = new AC(); return actx; }
 
function beep(freq=440, dur=0.08, type='square', vol=0.15) {
  if(settings.sfx === 0) return;
  try {
    const ctx = getAC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol*(settings.sfx/100), ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur);
  } catch(e){}
}
 
function jumpSound() { beep(520, 0.07, 'sine', 0.2); setTimeout(()=>beep(680,0.05,'sine',0.15),40); }
function coinSound() { beep(880,0.05,'sine',0.1); setTimeout(()=>beep(1100,0.08,'sine',0.1),60); }
function deathSound() {
  beep(200,0.3,'sawtooth',0.2);
  setTimeout(()=>beep(150,0.4,'sawtooth',0.15),100);
  setTimeout(()=>beep(100,0.5,'sawtooth',0.1),250);
}
function levelSound() {
  [600,800,1000,1300].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'sine',0.15),i*80));
}
 
let bgMusicNode = null, bgMusicGain = null, bgMusicRunning = false;
function startBGMusic() {
  if(bgMusicRunning || settings.music===0) return;
  try {
    const ctx = getAC();
    bgMusicGain = ctx.createGain();
    bgMusicGain.gain.value = settings.music/100*0.12;
    bgMusicGain.connect(ctx.destination);
    bgMusicRunning = true;
    const notes = [262,294,330,349,392,440,392,349,330,294];
    let ni = 0;
    function playNext() {
      if(!bgMusicRunning) return;
      const o = ctx.createOscillator();
      o.connect(bgMusicGain);
      o.type = 'sine';
      o.frequency.value = notes[ni % notes.length];
      ni++;
      const g = ctx.createGain();
      o.connect(g); g.connect(bgMusicGain);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(1, ctx.currentTime+0.05);
      g.gain.linearRampToValueAtTime(0.001, ctx.currentTime+0.35);
      o.start(); o.stop(ctx.currentTime+0.4);
      setTimeout(playNext, 380);
    }
    playNext();
  } catch(e){}
}
function stopBGMusic() {
  bgMusicRunning = false;
  if(bgMusicGain) { try { bgMusicGain.gain.value = 0; } catch(e){} }
}
function updateBGMusicVol() {
  if(bgMusicGain) bgMusicGain.gain.value = settings.music/100*0.12;
}
 

const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 480, H = 640;
bgCanvas.width = canvas.width = W;
bgCanvas.height = canvas.height = H;
 

let gameState = 'home';
let score = 0, coins = 0, gameTime = 0, level = 1;
let paused = false;
let frameId = null;
let lastTime = 0;
let justDied = false;
 
const GRAVITY = 0.45;
const JUMP_BASE = -9;
const PIPE_W = 70;
const GAP = 175;
const PIPE_FREQ_BASE = 1700;
let pipeSpeed = 2.5;
 
let player = {};
let pipes = [], coinItems = [];
let bgOffset = 0;
let clouds = [];
let stars = [];
let coinFlash = 0;
 
function getJumpForce() { return JUMP_BASE * (0.7 + settings.jump*0.06); }
 
function initPlayer() {
  const skin = SKINS.find(s=>s.id===save.selected) || SKINS[0];
  player = {
    x: 100, y: H/2,
    vy: 0,
    w: 48, h: 48,
    skin: skin.emoji,
    rotation: 0,
    alive: true,
    flash: 0
  };
}
 
function initStars() {
  stars = [];
  for(let i=0;i<30;i++){
    stars.push({x:Math.random()*W, y:Math.random()*(H*0.55), r:Math.random()*2+0.5, twinkle:Math.random()*Math.PI*2});
  }
}
 
function initClouds() {
  clouds = [];
  for(let i=0;i<5;i++){
    clouds.push({x:Math.random()*W, y:20+Math.random()*140, w:40+Math.random()*60, speed:0.3+Math.random()*0.3});
  }
}
 

function getLevel(timeMs) { return Math.min(10, Math.floor(timeMs/60000)+1); }
function getSpeedForLevel(lvl) { return 2.5 + (lvl-1)*0.45; }
function getPipeFreq(lvl) { return Math.max(900, PIPE_FREQ_BASE - (lvl-1)*80); }
 

function drawBG(dt) {

  const sky = bgCtx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#0d2b0d');
  sky.addColorStop(0.5,'#1a4a0a');
  sky.addColorStop(1,'#2d7015');
  bgCtx.fillStyle = sky;
  bgCtx.fillRect(0,0,W,H);
 

  stars.forEach(s=>{
    s.twinkle += 0.04;
    const a = 0.4 + 0.4*Math.sin(s.twinkle);
    bgCtx.beginPath();
    bgCtx.arc(s.x,s.y,s.r,0,Math.PI*2);
    bgCtx.fillStyle = `rgba(255,255,200,${a})`;
    bgCtx.fill();
  });
 

  bgCtx.beginPath();
  bgCtx.arc(W-60, 55, 28, 0, Math.PI*2);
  bgCtx.fillStyle = '#f5e89a';
  bgCtx.fill();
  bgCtx.beginPath();
  bgCtx.arc(W-50, 50, 22, 0, Math.PI*2);
  bgCtx.fillStyle = '#2a5a0a';
  bgCtx.fill();
 

  const groundY = H-80;
  bgCtx.fillStyle = '#1a4a0a';
  bgCtx.fillRect(0, groundY, W, H-groundY);
 

  bgCtx.fillStyle = '#3d8c15';
  for(let x=0;x<W;x+=20){
    const gx = x + (bgOffset%20);
    bgCtx.beginPath();
    bgCtx.moveTo(gx, groundY);
    bgCtx.quadraticCurveTo(gx+5, groundY-12, gx+10, groundY);
    bgCtx.quadraticCurveTo(gx+15, groundY-10, gx+20, groundY);
    bgCtx.fillStyle = '#4ab31c';
    bgCtx.fill();
  }
 

  bgCtx.fillStyle = '#4ab31c';
  bgCtx.fillRect(0, groundY, W, 8);
 

  clouds.forEach(c=>{
    bgCtx.save();
    bgCtx.globalAlpha = 0.25;
    bgCtx.fillStyle = '#c8f0a0';
    bgCtx.beginPath();
    bgCtx.ellipse(c.x, c.y, c.w, c.w*0.4, 0, 0, Math.PI*2);
    bgCtx.fill();
    bgCtx.globalAlpha = 1;
    bgCtx.restore();
    if(gameState==='playing'||gameState==='paused'){
      c.x -= c.speed*(dt/16);
      if(c.x < -c.w*2) c.x = W+c.w;
    }
  });
}
 

const GROUND_Y = H - 80;
 
function drawPipe(x, topH) {
  const botY = topH + GAP;
  const botH = GROUND_Y - botY;
  const pw = PIPE_W;
 

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x+6, 0, pw, topH);
  ctx.fillRect(x+6, botY, pw, botH);
 

  const pipeGrad = ctx.createLinearGradient(x,0,x+pw,0);
  pipeGrad.addColorStop(0,'#2ea00a');
  pipeGrad.addColorStop(0.3,'#5cd61e');
  pipeGrad.addColorStop(0.7,'#3caa10');
  pipeGrad.addColorStop(1,'#1a6a00');
  ctx.fillStyle = pipeGrad;
  ctx.fillRect(x, 0, pw, topH-12);
  ctx.fillRect(x, botY+12, pw, botH);
 

  const capGrad = ctx.createLinearGradient(x,0,x+pw,0);
  capGrad.addColorStop(0,'#1e8a00');
  capGrad.addColorStop(0.3,'#4cbf10');
  capGrad.addColorStop(0.7,'#28a000');
  capGrad.addColorStop(1,'#0e5a00');
  ctx.fillStyle = capGrad;
  ctx.fillRect(x-8, topH-12, pw+16, 14);
  ctx.fillRect(x-8, botY-2, pw+16, 14);
 

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x+8, 0, 10, topH-12);
  ctx.fillRect(x+8, botY+14, 10, botH-14);
 

}
 
function drawKnife(x, y, flipped=false) {
  ctx.save();
  ctx.translate(x, y);
  if(flipped) ctx.scale(1,-1);

  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-5, 0, 10, 30);

  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.lineTo(2, -40);
  ctx.lineTo(-2, -40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(2, -5);
  ctx.lineTo(1, -38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
 

function spawnCoin(x, topH) {
  const midY = topH + GAP/2;
  const offsetY = (Math.random()-0.5) * (GAP*0.5);
  coinItems.push({ x: x + PIPE_W/2, y: midY+offsetY, r:12, collected:false, anim:0 });
}
 
function drawCoin(c) {
  c.anim += 0.08;
  const scale = 1 + 0.15*Math.sin(c.anim);
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(scale, scale);

  const grd = ctx.createRadialGradient(0,0,4,0,0,18);
  grd.addColorStop(0,'rgba(255,220,50,0.6)');
  grd.addColorStop(1,'rgba(255,180,0,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();

  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(0,0,c.r,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e6a800';
  ctx.beginPath(); ctx.arc(0,0,c.r-3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffeaa0';
  ctx.font = 'bold 11px Nunito'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('$',0,0);
  ctx.restore();
}
 

function drawPlayer() {
  if(!player.alive && player.flash > 0) {
    player.flash--;
    if(player.flash%4 < 2) return;
  }
  ctx.save();
  ctx.translate(player.x, player.y);

  const targetRot = Math.min(Math.max(player.vy*3.5, -25), 80) * Math.PI/180;
  player.rotation += (targetRot - player.rotation)*0.2;
  ctx.rotate(player.rotation);
 

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(2, player.h/2+4, player.w/2-4, 6, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
 

  ctx.font = `${player.w}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.skin, 0, 0);
 

  if(gameState==='playing'){
    for(let t=1;t<=3;t++){
      ctx.globalAlpha = 0.12*t;
      ctx.save();
      ctx.translate(-t*12, player.vy*t*0.3);
      ctx.font = `${player.w}px serif`;
      ctx.fillText(player.skin, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
 

let nextPipeTime = 0;
let pipesPassedCount = 0;
 
function spawnPipe(now) {
  const minH = 60, maxH = GROUND_Y - GAP - 60;
  const topH = minH + Math.random()*(maxH-minH);
  const hasKnife = Math.random() < 0.4 + level*0.04;
  pipes.push({ x: W+10, topH, speed: pipeSpeed, passed:false, knife: hasKnife });
  if(Math.random() < 0.7) spawnCoin(W+10, topH);
  nextPipeTime = now + getPipeFreq(level);
}
 
function updatePipes(dt) {
  pipes.forEach(p => {
    p.x -= p.speed * (dt/16);
    p.speed = pipeSpeed;
    if(!p.passed && p.x + PIPE_W < player.x) {
      p.passed = true;
      score++;
      pipesPassedCount++;
      document.getElementById('scoreDisplay').textContent = score;
      beep(440+score*5, 0.05, 'sine', 0.08);
    }
  });
  pipes = pipes.filter(p => p.x > -PIPE_W - 20);
}
 

function checkCollision() {
  const px = player.x - player.w/2 + 8;
  const py = player.y - player.h/2 + 8;
  const pw = player.w - 16;
  const ph = player.h - 16;
 

  if(player.y - player.h/2 < 0 || player.y + player.h/2 > GROUND_Y) return true;
 
  for(const p of pipes) {
    const right = p.x + PIPE_W + 8;
    const left = p.x - 8;
    if(px < right && px+pw > left) {
      if(py < p.topH || py+ph > p.topH+GAP) return true;
    }
  }
  return false;
}
 
function checkCoins() {
  coinItems.forEach(c => {
    if(c.collected) return;
    const dx = player.x - c.x, dy = player.y - c.y;
    if(Math.sqrt(dx*dx+dy*dy) < player.w/2 + c.r) {
      c.collected = true;
      coins++;
      coinSound();
      document.getElementById('hudCoins').textContent = coins;
      showCoinPopup(c.x, c.y);
    }
  });
  coinItems = coinItems.filter(c => !c.collected && c.x > -30);
}
 
function showCoinPopup(x, y) {
  const d = document.createElement('div');
  d.className = 'coin-popup';
  d.textContent = '+1 🪙';
  d.style.left = x+'px';
  d.style.top = y+'px';
  document.getElementById('gameWrapper').appendChild(d);
  setTimeout(()=>d.remove(), 1000);
}
 

function jump() {
  if(gameState !== 'playing') return;
  if(!player.alive) return;
  player.vy = getJumpForce();
  jumpSound();

  document.getElementById('notice').classList.add('hidden');
}
 
document.addEventListener('keydown', e => {
  if(e.code === 'Space') { e.preventDefault(); jump(); }
  if(e.code === 'Escape') { if(gameState==='playing'||gameState==='paused') togglePause(); }
});
document.getElementById('gameCanvas').addEventListener('click', jump);
document.getElementById('bgCanvas').addEventListener('click', jump);
 

let lastLevel = 1;
function checkLevel() {
  const newLevel = getLevel(gameTime);
  if(newLevel !== lastLevel) {
    lastLevel = newLevel;
    level = newLevel;
    pipeSpeed = getSpeedForLevel(level);
    document.getElementById('levelBadge').textContent = `Niv. ${level}`;
    levelSound();
    showLevelUp(level);
  }
}
 
function showLevelUp(lvl) {
  const el = document.getElementById('levelUpBanner');
  el.textContent = lvl <= 10 ? `🎉 NIVEAU ${lvl} !` : `🔥 MAX SPEED !`;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1800);
}
 

function gameLoop(timestamp) {
  if(gameState !== 'playing') return;
 
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;
  gameTime += dt;
 

  player.vy += GRAVITY;
  player.y += player.vy;
  bgOffset += pipeSpeed;
 
  checkLevel();
 

  const sec = Math.floor(gameTime/1000);
  const min = Math.floor(sec/60);
  const s = sec%60;
  document.getElementById('hudTime').textContent = `${min}:${s<10?'0':''}${s}`;
 

  if(timestamp > nextPipeTime) spawnPipe(timestamp);
 
  updatePipes(dt);
  checkCoins();
 

  if(checkCollision()) {
    triggerDeath();
    return;
  }
 

  coinItems.forEach(c => { c.x -= pipeSpeed*(dt/16); });
 

  drawBG(dt);
  ctx.clearRect(0,0,W,H);
 

  pipes.forEach(p => {
    drawPipe(p.x, p.topH);
    if(p.knife) {
      drawKnife(p.x + PIPE_W/2, p.topH - 5, false);
      drawKnife(p.x + PIPE_W/2, p.topH + GAP + 5, true);
    }
  });
 

  coinItems.filter(c=>!c.collected).forEach(drawCoin);
 

  drawPlayer();
 
  frameId = requestAnimationFrame(gameLoop);
}
 

function triggerDeath() {
  player.alive = false;
  player.flash = 40;
  deathSound();
  stopBGMusic();
 

  player.vy = 8;
 

  let fallFrames = 0;
  function fallLoop(ts) {
    drawBG(0);
    ctx.clearRect(0,0,W,H);
    pipes.forEach(p => drawPipe(p.x, p.topH));
    coinItems.filter(c=>!c.collected).forEach(drawCoin);
    player.y += player.vy;
    player.vy += 1;
    drawPlayer();
    fallFrames++;
    if(player.y < H+60 && fallFrames < 60) requestAnimationFrame(fallLoop);
    else showGameOver();
  }
  requestAnimationFrame(fallLoop);
}
 
function showGameOver() {
  gameState = 'gameover';
 

  save.coins += coins;
  if(score > save.best) save.best = score;
  writeSave();
 
  document.getElementById('overScore').textContent = score;
  document.getElementById('overBest').textContent = save.best;
  const sec = Math.floor(gameTime/1000);
  const min = Math.floor(sec/60);
  const s = sec%60;
  document.getElementById('overTime').textContent = `${min}:${s<10?'0':''}${s}`;
  document.getElementById('overCoins').textContent = `🪙 +${coins} pièce${coins>1?'s':''}`;
  document.getElementById('homeBest').textContent = save.best;
 
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('notice').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.remove('hidden');
}
 

function startIntro() {
  hideAll();
  gameState = 'intro';
 
  const skin = SKINS.find(s=>s.id===save.selected) || SKINS[0];
  const charEl = document.getElementById('introChar');
  const textEl = document.getElementById('introText');
  charEl.textContent = skin.emoji;
 
  const overlay = document.getElementById('introOverlay');
  overlay.classList.remove('hidden');
  charEl.style.bottom = '-80px';
  textEl.style.opacity = '0';
  textEl.textContent = '';
 
  setTimeout(()=>{ charEl.style.bottom = '120px'; }, 100);
  setTimeout(()=>{
    textEl.textContent = '3';
    textEl.style.opacity = '1';
    beep(400,0.1,'sine',0.2);
  }, 900);
  setTimeout(()=>{ textEl.textContent = '2'; beep(400,0.1,'sine',0.2); }, 1600);
  setTimeout(()=>{ textEl.textContent = '1'; beep(400,0.1,'sine',0.2); }, 2300);
  setTimeout(()=>{ textEl.textContent = 'GO !'; textEl.style.color='#f0ff70'; beep(800,0.15,'sine',0.25); }, 3000);
  setTimeout(()=>{
    overlay.classList.add('hidden');
    startGame();
  }, 3600);
}
 
function startGame() {
  hideAll();
  gameState = 'playing';
  score = 0; coins = 0; gameTime = 0; level = 1; lastLevel = 1;
  pipes = []; coinItems = [];
  pipeSpeed = getSpeedForLevel(1);
  bgOffset = 0;
  initPlayer();
  initStars();
  initClouds();
  nextPipeTime = performance.now() + 1500;
  document.getElementById('scoreDisplay').textContent = '0';
  document.getElementById('hudCoins').textContent = '0';
  document.getElementById('hudTime').textContent = '0:00';
  document.getElementById('levelBadge').textContent = 'Niv. 1';
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('notice').classList.remove('hidden');
  startBGMusic();
  lastTime = performance.now();
  frameId = requestAnimationFrame(gameLoop);
}
 

function togglePause() {
  if(gameState === 'playing') {
    gameState = 'paused';
    paused = true;
    stopBGMusic();
    document.getElementById('pauseScreen').classList.remove('hidden');
    document.getElementById('pauseBtn').textContent = '▶';
  } else if(gameState === 'paused') {
    gameState = 'playing';
    paused = false;
    startBGMusic();
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('pauseBtn').textContent = '⏸';
    lastTime = performance.now();
    frameId = requestAnimationFrame(gameLoop);
  }
}
 

function openSettings(from) {
  settingsFrom = from;
  document.getElementById('musicVol').value = settings.music;
  document.getElementById('sfxVol').value = settings.sfx;
  document.getElementById('jumpSens').value = settings.jump;
  document.getElementById('musicVal').textContent = settings.music;
  document.getElementById('sfxVal').textContent = settings.sfx;
  document.getElementById('jumpVal').textContent = settings.jump;
  document.getElementById('settingsScreen').classList.remove('hidden');
}
 
function updateSetting(key, val) {
  val = parseInt(val);
  if(key==='music') { settings.music=val; document.getElementById('musicVal').textContent=val; updateBGMusicVol(); }
  if(key==='sfx') { settings.sfx=val; document.getElementById('sfxVal').textContent=val; }
  if(key==='jump') { settings.jump=val; document.getElementById('jumpVal').textContent=val; }
  save.musicVol=settings.music; save.sfxVol=settings.sfx; save.jumpSens=settings.jump;
  writeSave();
}
 
function closeSettings() {
  document.getElementById('settingsScreen').classList.add('hidden');
}
 

function openShop() {
  const prevState = gameState;
  if(gameState==='playing') togglePause();
  gameState = 'shop';
  renderShop();
  hideAll();
  document.getElementById('shopScreen').classList.remove('hidden');
  if(gameState==='playing'||gameState==='paused') document.getElementById('hud').classList.remove('hidden');
}
 
function renderShop() {
  document.getElementById('shopCoins').textContent = save.coins;
  const grid = document.getElementById('skinsGrid');
  grid.innerHTML = '';
  SKINS.forEach(skin => {
    const owned = save.owned.includes(skin.id);
    const selected = save.selected === skin.id;
    const card = document.createElement('div');
    card.className = `skin-card ${owned?'owned':''} ${selected?'selected':''} ${!owned&&skin.price>save.coins?'locked':''}`;
    card.innerHTML = `
      <span class="skin-emoji">${skin.emoji}</span>
      <div class="skin-name">${skin.name}</div>
      <div class="skin-price ${skin.price===0?'free':''}">${owned ? (selected?'✅ Actif':'✓ Possédé') : `🪙 ${skin.price}`}</div>
      ${selected?'<div class="selected-badge">Actif</div>':''}
    `;
    card.onclick = () => buySkin(skin.id);
    grid.appendChild(card);
  });

  const activeSkin = SKINS.find(s=>s.id===save.selected)||SKINS[0];
  document.getElementById('homeTurnip').textContent = activeSkin.emoji;
}
 
function buySkin(id) {
  const skin = SKINS.find(s=>s.id===id);
  if(!skin) return;
  if(save.owned.includes(id)) {
    save.selected = id;
    writeSave();
    renderShop();
    beep(600,0.1,'sine',0.15);
    return;
  }
  if(save.coins >= skin.price) {
    save.coins -= skin.price;
    save.owned.push(id);
    save.selected = id;
    writeSave();
    renderShop();
    levelSound();
  } else {
    beep(200,0.2,'sawtooth',0.15);
  
    const card = document.querySelectorAll('.skin-card')[SKINS.findIndex(s=>s.id===id)];
    if(card){ card.style.borderColor='#ff4444'; setTimeout(()=>card.style.borderColor='',500); }
  }
}
 
function closeShop() {
  gameState = 'home';
  hideAll();
  document.getElementById('homeScreen').classList.remove('hidden');
  updateHomeUI();
}
 

function hideAll() {
  ['homeScreen','pauseScreen','settingsScreen','gameOverScreen','shopScreen','hud','notice']
    .forEach(id=>document.getElementById(id).classList.add('hidden'));
}
 
function backToMenu() {
  if(frameId) cancelAnimationFrame(frameId);
  stopBGMusic();
  gameState = 'home';
  hideAll();
  document.getElementById('homeScreen').classList.remove('hidden');
  updateHomeUI();

  ctx.clearRect(0,0,W,H);
  drawBG(0);
}
 
function updateHomeUI() {
  document.getElementById('homeBest').textContent = save.best;
  const activeSkin = SKINS.find(s=>s.id===save.selected)||SKINS[0];
  document.getElementById('homeTurnip').textContent = activeSkin.emoji;
  initStars(); initClouds();
  homeAnimLoop();
}
 

let homeAnimRunning = false;
function homeAnimLoop() {
  if(homeAnimRunning) return;
  homeAnimRunning = true;
  function loop() {
    if(gameState !== 'home') { homeAnimRunning=false; return; }
    drawBG(16);
    ctx.clearRect(0,0,W,H);
    bgOffset += 0.5;
    requestAnimationFrame(loop);
  }
  loop();
}
 

updateHomeUI();