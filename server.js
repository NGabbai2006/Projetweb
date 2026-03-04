
const express = require('express'); // importation d'express
const app = express(); // création de l'application express
const mysql = require('mysql2');
const crypto = require('crypto');

const connection = mysql.createConnection({ // configuration de la connexion à la base de données
  host: '192.168.1.124', //change ton ip 
  user: 'Userweb',
  password: 'Userweb',
  database: 'ProjetWeb'
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connecté à la base de données MySQL.');
});

app.use(express.json());
app.use(express.static('public')); 



//=========================================================================================================

app.get('/Top100', (req, res) => { // route GET pour /scoreTab
  connection.query('SELECT User.login, Score.points, Score.winstreak FROM Score,User WHERE Score.idUser = User.id ORDER BY points DESC LIMIT 100',
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du classement :', err);
        res.status(500).json({ message: 'Erreur serveur' });
      }
      res.json(results);
    });
});


//=========================================================================================================
app.get('/quizz', (req, res) => { // route POST pour /quizz
  let randomImage=0;
  connection.query('SELECT nom,chemin,id FROM Quizz', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du quizz :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
      randomImage = Math.floor(Math.random() * results.length);
    

    res.json({ question: results[randomImage] });
  });
});

//=========================================================================================================
// methode post 
//=========================================================================================================\

app.post('/startgame', (req, res) => { // route POST pour /startgame
        connection.query('UPDATE Score SET pointsTemp = 0, winstreakTemp = 0 WHERE idUser = ?',
          [req.body.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la réinitialisation du scoreTemp et winstreakTemp :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            console.log('scoreTemp et winstreakTemp réinitialisés avec succès');
            res.json({ message: 'reinitialisation effectuée' });
          });

      }
);


//=========================================================================================================
// route pour la fin de partie et la mise à jour du score
app.post('/endgame', (req, res) => { // route POST pour /endgame
  connection.query('SELECT points, pointsTemp, winstreakTemp, winstreak FROM Score WHERE idUser = ?',
    [req.body.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du score :', err);
        res.status(500).json({ message: 'Erreur serveur' });

      }
      if (results[0].points < results[0].pointsTemp && results[0].winstreak < results[0].winstreakTemp) {
        connection.query('UPDATE Score SET points = pointsTemp, pointsTemp=0, winstreak = winstreakTemp , winstreakTemp = 0 WHERE idUser = ?',
          [req.body.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du winstreak et du score :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            console.log('winstreak mis à jour avec succès');
            res.json({ message: 'score et winstreak mis à jour' });
          });
      }

      else if (results[0].points < results[0].pointsTemp) {
        connection.query('UPDATE Score SET points = pointsTemp , pointsTemp = 0 WHERE idUser = ?',
          [req.body.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du score :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            console.log('score mis à jour avec succès');
            res.json({ message: 'score mis à jour' });
          })
      }
      else if (results[0].winstreak < results[0].winstreakTemp) {
        connection.query('UPDATE Score SET winstreak = winstreakTemp , winstreakTemp = 0 WHERE idUser = ?',
          [req.body.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du winstreak :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            console.log('winstreak mis à jour avec succès');
            res.json({ message: 'winstreak mis à jour' });

          })
      }
        else {
          res.json({ message: 'score et winstreak non mis à jour' });
        }
    });
});


//=========================================================================================================
// route pour les reponses 

app.post('/reponse', (req, res) => { // route GET pour /reponse
  connection.query('SELECT reponse FROM Quizz WHERE id = ?',
    [req.body.idQuizz], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de la réponse :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      if (results[0].reponse == req.body.reponse) {
    connection.query('UPDATE Score SET pointsTemp = pointsTemp + 1, winstreakTemp = winstreakTemp + 1 WHERE idUser = ?',
      [req.body.id], (err, results) => {
        if (err) {
          console.error('Erreur lors de la mise à jour du score :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }
        console.log('score mis à jour avec succès');
        res.json({ message: 'score mis à jour' });
      });
  }
  else {
    connection.query('UPDATE Score SET winstreakTemp = 0 WHERE idUser = ?',
      [req.body.id], (err, results) => {
        if (err) {
          console.error('Erreur lors de la mise à jour du score :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }
      }
    )
    console.log('mauvaise réponse');
    res.json({ message: 'mauvaise réponse  winstreak perdu' });
  }
});
});

//=========================================================================================================
//route d'inscription
//tokenid n'est pas vraiment un token juste un id dure a trouver
app.post('/register', (req, res) => { // route POST pour /register
  function reloadRegister() {
    let hache = hacher(req.body.V_pass);
    let a = 0;
    const tokenId = crypto.randomBytes(16).toString('hex'); //genere un tokenid
    connection.query(
      'INSERT INTO User (id, login, password) VALUES (?,?, ?)',
      [tokenId, req.body.V_log, hache],
      (err, results) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('PRIMARY')) {
              console.error('Erreur : tokenId en double, génération d\'un nouveau tokenId');
              return reloadRegister();
            }
            else{
            console.error('Erreur: login déjà utilisé :', err);
            return res.status(400).json({ message: 'Login déjà utilisé' });
            }
          }
          else {
            console.error('erreur lors de de l\'inscription :', err);
            res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
          }
        }
        else {
          // ajout de l'user dans la table score car plus simple 
          connection.query(
            'INSERT INTO Score (idUser) VALUES (?)',
            [tokenId],
            (err, resultsScore) => {
              if (err) {
                console.error('Erreur lors de l\'insertion dans la table Score :', err);
                res.status(500).json({ message: 'Erreur serveur lors de l\'insertion du score' });

              }
              console.log('Insertion réussie, ID utilisateur :', tokenId);
              res.json({ message: 'Inscription réussie !', id: tokenId });
            }
          );
        }
      });

  }
  reloadRegister();
});




//=========================================================================================================
// route de connexion
app.post('/login', (req, res) => { // route POST pour /login
  console.log('Données recues pour la connexion'); // log dans la console
  console.log(req.body);
  let hache = hacher(req.body.V_pass); // hachage du mot de passe reçu
  connection.query(
    'SELECT * FROM User WHERE login = ? AND password = ?',
    [req.body.V_log, hache],
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la vérification des identifiants :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }


      else if (results.length === 0) {
        res.status(401).json({ message: 'Identifiants invalides' });
        return;
      }


      else if (results[0].login == req.body.V_log && results[0].password == hache) {
        console.log('Connexion réussie pour l\'utilisateur :', results[0].login);
        
        res.json({ message: 'Connexion réussie ', id: results[0].id });
      }

      else {
        console.log('Mot de passe incorrect ou identifiants incorrect');
        res.status(401).json({ message: 'Identifiants invalides' });
      }
    }
  );
});


//=========================================================================================================
app.listen(2000, () => { // démarrage du serveur sur le port 2000
  let monIp = require("ip").address(); // récupération de l'adresse IP locale
  console.log(`Server running on http://${monIp}:2000`); // log de l'URL du serveur
})

//=========================================================================================================

function hacher(password) {
  let hash = "";
  let code;

  for (var i = 0; i < password.length; i++) {
    code = password.charCodeAt(i);
    if (i % 2 == 0) {
      hash = hash + (code << 3);
    }
    else {
      hash = hash + (code >> 2);
    }
  }
  return hash;
}




