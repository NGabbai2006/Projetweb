// variables globales
let pseudoConnecte = null;
let personnaliteActuelle = null;
let scoreActuel = 0;
let numeroRound = 1;
let classementOuvert = false;

// récupération des éléments du DOM
const btnConnexion = document.getElementById('btnConnexion');
const btnInscription = document.getElementById('btnInscription');
const btnDeconnexion = document.getElementById('btnDeconnexion');
const btnJouer = document.getElementById('btnJouer');
const btnRejouer = document.getElementById('btnRejouer');
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
    if (donnees.tokenId) {
      pseudoConnecte = pseudo;
      localStorage.setItem('tokenId', donnees.tokenId);
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
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    },
    body: JSON.stringify({})
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    console.log(donnees.message);
  });

  pseudoConnecte = null;
  localStorage.removeItem('tokenId');
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('startScreen').style.display = '';
  document.getElementById('cardScreen').style.display = 'none';
  document.getElementById('finScreen').style.display = 'none';
});


// on cache le pop-up et on affiche l'application principale
function afficherApplication() {
  document.getElementById('authOverlay').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('displayUsername').textContent = pseudoConnecte;
  chargerClassement();
}


// lancement du jeu
btnJouer.addEventListener('click', function() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('cardScreen').style.display = 'flex';

  scoreActuel = 0;
  numeroRound = 1;
  document.getElementById('scoreActuel').textContent = 0;

  fetch('/startgame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    },
    body: JSON.stringify({})
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    console.log(donnees.message);
  });

  chargerProchaineCarte();
});


// rejouer depuis l'écran de fin
btnRejouer.addEventListener('click', function() {
  document.getElementById('finScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = '';
});


// fin de partie : on sauvegarde le score et on affiche l'écran de fin
function terminerPartie() {
  fetch('/endgame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    },
    body: JSON.stringify({})
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    console.log(donnees.message);
    chargerClassement();
  });

  document.getElementById('cardScreen').style.display = 'none';
  document.getElementById('scoreFinal').textContent = scoreActuel;
  document.getElementById('finScreen').style.display = 'flex';
}


// chargement d'une nouvelle carte depuis GET /quizz
function chargerProchaineCarte() {
  btnOui.disabled = false;
  btnNon.disabled = false;
  document.getElementById('resultFeedback').textContent = '';
  document.getElementById('cardStamp').className = 'card-stamp';
  document.getElementById('cardStamp').textContent = '?';
  document.getElementById('roundInfo').textContent = 'DOSSIER N°' + numeroRound;

  fetch('/quizz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    },
    body: JSON.stringify({})
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    personnaliteActuelle = donnees.question;

    document.getElementById('cardName').textContent = donnees.question.nom;

    if (donnees.question.chemin) {
      document.getElementById('cardPhoto').src = donnees.question.chemin;
      document.getElementById('cardPhoto').style.display = 'block';
      document.getElementById('cardPhotoPlaceholder').style.display = 'none';
    } else {
      document.getElementById('cardPhoto').style.display = 'none';
      document.getElementById('cardPhotoPlaceholder').style.display = 'flex';
    }
  });
}


// envoi de la réponse du joueur vers POST /reponse
// valeurReponse = 1 si "mentionné", 0 si "absent"
function repondre(valeurReponse) {
  btnOui.disabled = true;
  btnNon.disabled = true;

  fetch('/reponse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    },
    body: JSON.stringify({ idQuizz: personnaliteActuelle.id, reponse: valeurReponse })
  })
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {

    // on déduit la vraie réponse pour afficher le bon tampon
    let vraiReponse;
    if (donnees.message == 'score mis à jour') {
      vraiReponse = valeurReponse;
    } else {
      vraiReponse = (valeurReponse == 1) ? 0 : 1;
    }

    if (vraiReponse == 1) {
      document.getElementById('cardStamp').textContent = 'MENTIONNÉ';
      document.getElementById('cardStamp').className = 'card-stamp mentioned';
    } else {
      document.getElementById('cardStamp').textContent = 'ABSENT';
      document.getElementById('cardStamp').className = 'card-stamp clean';
    }

    if (donnees.message == 'score mis à jour') {
      scoreActuel++;
      document.getElementById('scoreActuel').textContent = scoreActuel;
      document.getElementById('resultFeedback').textContent = '✓ BONNE RÉPONSE';
      document.getElementById('resultFeedback').className = 'feedback-ok';
    } else {
      document.getElementById('resultFeedback').textContent = '✗ MAUVAISE RÉPONSE';
      document.getElementById('resultFeedback').className = 'feedback-erreur';
    }

    numeroRound++;

    // le back signale la fin de partie avec stop: true
    if (donnees.stop == true) {
      setTimeout(function() {
        terminerPartie();
      }, 1800);
    } else {
      setTimeout(function() {
        chargerProchaineCarte();
      }, 1800);
    }

    chargerClassement();
  });
}

btnOui.addEventListener('click', function() { repondre(1); });
btnNon.addEventListener('click', function() { repondre(0); });


// chargement du classement depuis GET /Top100
function chargerClassement() {
  const contenu = document.getElementById('leaderboardContenu');

  fetch('/Top100')
  .then(function(reponse) { return reponse.json(); })
  .then(function(donnees) {
    contenu.innerHTML = '';

    donnees.forEach(function(joueur) {
      const tr = document.createElement('tr');

      const tdRang = document.createElement('td');
      tdRang.className = 'leaderboard-rang';
      tdRang.innerText = donnees.indexOf(joueur) + 1;
      tr.appendChild(tdRang);

      const tdNom = document.createElement('td');
      tdNom.className = 'leaderboard-nom';
      tdNom.innerText = joueur.login;
      tr.appendChild(tdNom);

      const tdPoints = document.createElement('td');
      tdPoints.className = 'leaderboard-points';
      tdPoints.innerText = joueur.points;
      tr.appendChild(tdPoints);

      contenu.appendChild(tr);
    });
  });
}


// ouverture / fermeture du panneau classement
leaderboardToggle.addEventListener('click', function() {
  if (classementOuvert == false) {
    classementOuvert = true;
    document.getElementById('leaderboard').style.transform = 'translateX(0)';
    leaderboardToggle.style.right = '260px';
  } else {
    classementOuvert = false;
    document.getElementById('leaderboard').style.transform = 'translateX(100%)';
    leaderboardToggle.style.right = '0';
  }
});

window.onload = () => {
  fetch('/check', {
    headers: { 'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('tokenId')
    } })
    .then(reponse => reponse.json())
    .then(data => {
    if (data.data===true){
    afficherApplication();
  }
  else{
    return;
  }
})
 

}