// variables globales
let pseudoConnecte = null;
let idConnecte = null;
let personnaliteActuelle = null;
let scoreOk = 0;
let scoreErreur = 0;
let numeroRound = 1;
let classementOuvert = false;

// récupération des éléments du DOM
const btnConnexion = document.getElementById('btnConnexion');
const btnInscription = document.getElementById('btnInscription');
const btnDeconnexion = document.getElementById('btnDeconnexion');
const btnJouer = document.getElementById('btnJouer');
const btnOui = document.getElementById('btnOui');
const btnNon = document.getElementById('btnNon');
const leaderboardToggle = document.getElementById('leaderboardToggle');


// envoi du formulaire d'inscription vers POST /register
btnInscription.addEventListener('click', function() {
  const pseudo = document.getElementById('regUser').value;
  const motDePasse = document.getElementById('regPass').value;
  const zoneMessage = document.getElementById('registerMsg');

  fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ V_log: pseudo, V_pass: motDePasse })
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    zoneMessage.textContent = donnees.message;
  });
});


// envoi du formulaire de connexion vers POST /login
btnConnexion.addEventListener('click', function() {
  const pseudo = document.getElementById('loginUser').value;
  const motDePasse = document.getElementById('loginPass').value;
  const zoneMessage = document.getElementById('loginMsg');

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ V_log: pseudo, V_pass: motDePasse })
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    if (donnees.id) {
      pseudoConnecte = pseudo;
      idConnecte = donnees.id;
      afficherApplication();
    } else {
      zoneMessage.textContent = donnees.message;
    }
  });
});


// déconnexion
btnDeconnexion.addEventListener('click', function() {
  fetch('/endgame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: idConnecte })
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    console.log(donnees.message);
  });

  pseudoConnecte = null;
  idConnecte = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('startScreen').style.display = '';
  document.getElementById('cardScreen').style.display = 'none';
});