const SKINS = [
  { id: 'carotte', emoji: '🥕', nom: 'Carotte', prix: 0 },
  { id: 'brocoli', emoji: '🥦', nom: 'Brocoli', prix: 10 },
  { id: 'piment', emoji: '🌶️', nom: 'Piment', prix: 15 },
  { id: 'aubergine', emoji: '🍆', nom: 'Aubergine', prix: 20 },
  { id: 'mais', emoji: '🌽', nom: 'Maïs', prix: 25 },
  { id: 'champignon', emoji: '🍄', nom: 'Champignon', prix: 30 },
  { id: 'avocat', emoji: '🥑', nom: 'Avocat', prix: 35 },
  { id: 'ail', emoji: '🧄', nom: 'Ail', prix: 40 },
];

const state = {
  coins: Number(localStorage.getItem('cvr_coins') || '0'),
  best: Number(localStorage.getItem('cvr_best') || '0'),
  selectedSkin: localStorage.getItem('cvr_skin') || 'carotte',
  ownedSkins: JSON.parse(localStorage.getItem('cvr_owned_skins') || '["carotte"]'),
};

function saveState() {
  localStorage.setItem('cvr_coins', String(state.coins));
  localStorage.setItem('cvr_best', String(state.best));
  localStorage.setItem('cvr_skin', state.selectedSkin);
  localStorage.setItem('cvr_owned_skins', JSON.stringify(state.ownedSkins));
}

function getSelectedSkin() {
  return SKINS.find((skin) => skin.id === state.selectedSkin) || SKINS[0];
}

function refreshMenu() {
  document.getElementById('best-val').textContent = state.best;
  document.getElementById('coins-val').textContent = state.coins;
  document.getElementById('perso').textContent = getSelectedSkin().emoji;
}

function ouvrirBoutique() {
  document.getElementById('boutique').classList.remove('cache');
  renderSkins();
  refreshMenu();
}

function fermerBoutique() {
  document.getElementById('boutique').classList.add('cache');
}

function ouvrirOptions() {
  document.getElementById('options').classList.remove('cache');
}

function fermerOptions() {
  document.getElementById('options').classList.add('cache');
}

function renderSkins() {
  const grid = document.getElementById('grille-skins');
  grid.innerHTML = '';

  SKINS.forEach((skin) => {
    const owned = state.ownedSkins.includes(skin.id);
    const selected = state.selectedSkin === skin.id;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `carte-skin ${owned ? 'possede' : ''} ${selected ? 'selectionne' : ''}`;
    card.innerHTML = `
      <span class="skin-emoji">${skin.emoji}</span>
      <span class="skin-nom">${skin.nom}</span>
      <span class="skin-prix">${owned ? (selected ? 'Sélectionné' : 'Possédé') : skin.prix + ' 🪙'}</span>
    `;

    card.addEventListener('click', () => {
      if (owned) {
        state.selectedSkin = skin.id;
      } else if (state.coins >= skin.prix) {
        state.coins -= skin.prix;
        state.ownedSkins.push(skin.id);
        state.selectedSkin = skin.id;
      } else {
        alert('Pas assez de pièces.');
      }
      saveState();
      renderSkins();
      refreshMenu();
    });

    grid.appendChild(card);
  });
}

refreshMenu();
