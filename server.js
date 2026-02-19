
  const express = require('express'); // importation d'express
  const app = express(); // création de l'application express
  const mysql = require('mysql2');


  const connection = mysql.createConnection({ // configuration de la connexion à la base de données
    host: '192.168.1.77', //change ton ip 
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
  app.use(express.static('public')); // servir les fichiers statiques du dossier public
  app.use(express.json()); // middleware pour parser le JSO

  //=========================================================================================================
  //route pour récupérer les utilisateurs
  app.get('/users', (req, res) => {
    connection.query('SELECT * FROM User', (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json(results);
    });
  });

  //=========================================================================================================
  app.get('/login', (req, res) => { // route GET pour /login
    res.send('<h1>bienvenue sur la page de login!</h1>'); // envoi d'une réponse HTML
  });


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
  // methode post 
  //=========================================================================================================\

  app.post('/endgame', (req, res) => { // route GET pour /endgame
    infoScore(req, res)
   
    if (res.verifPoints < res.verifPointsTemp) {
      connection.query('UPDATE Score SET points = pointsTemp , pointsTemp = 0 WHERE idUser = ?',
        [req.body.userId], (err, results) => {
          if (err) {
            console.error('Erreur lors de la mise à jour du score :', err);
            res.status(500).json({ message: 'Erreur serveur' });    
            return;
          }
          console.log('score mis à jour av  ec succès');
          res.json({ message: 'score mis à jour' });
        });
    }
    else
      (res.json({ message: 'score non changé' }))
  });



  // route pour les reponses 

  app.post('/reponse', (req, res) => { // route GET pour /reponse
    if (req.body.rep == 1) {
      connection.query('UPDATE Score SET pointsTemp = pointsTemp + 1, winstreak = winstreak + 1 WHERE idUser = ?',
        [req.body.userId], (err, results) => {
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
      connection.query('UPDATE Score SET winstreak = 0 WHERE idUser = ?',
        [req.body.userId], (err, results) => {
          if (err) {
            console.error('Erreur lors de la mise à jour du score :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
          }
        }
      )
      console.log('mauvaise réponse');
      res.json({ message: 'mauvaise réponse   winstreak perdu' });
    }
  });


  //=========================================================================================================
  //route d'inscription
  app.post('/register', (req, res) => { // route POST pour /register
    console.log('Données recues pour l\'inscription'); // log dans la console
    console.log(req.body); // affichage du corps de la requête

    connection.query(
      'INSERT INTO User (login, password) VALUES (?, ?)',
      [req.body.V_log, req.body.V_pass],
      (err, results) => {
        if (err) {
          console.error('Erreur lors de l\'insertion dans la base de données :', err);
          res.status(500).json({ message: 'Erreur serveur' });

        }
        // ajout de l'user dans la table score car plus simple 
        connection.query(
          'INSERT INTO Score (idUser) VALUES (?)',
          [results.insertId],
          (err, resultsScore) => {
            if (err) {
              console.error('Erreur lors de l\'insertion dans la table Score :', err);
              res.status(500).json({ message: 'Erreur serveur lors de l\'insertion du score' });

            }
            console.log('Insertion réussie, ID utilisateur :', results.insertId);
            res.json({ message: 'Inscription réussie !', userId: results.insertId });
          }
        );
      });
  });



  //=========================================================================================================
  // route de connexion
  app.post('/login', (req, res) => { // route POST pour /login
    console.log('Données recues pour la connexion'); // log dans la console
    console.log(req.body); // affichage du corps de la requête
    connection.query(
      'SELECT * FROM User WHERE login = ? AND password = ?',
      [req.body.V_log, req.body.V_pass],
      (err, results) => {
        if (err) {
          console.error('Erreur lors de la vérification des identifiants :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }

        if (results[0].login == req.body.V_log && results[0].password == req.body.V_pass) {
          console.log('Connexion réussie pour l\'utilisateur :', results[0].login);
          res.json({ message: 'Connexion réussie ', userId: results[0].id });
        } else {
          console.log('Mot de passe incorrect ou identifiants incorrect');
          res.status(401).json({ message: 'Identifiants invalides' });
        }
      }
    );
  });



  app.listen(3000, () => { // démarrage du serveur sur le port 3000
    let monIp = require("ip").address(); // récupération de l'adresse IP locale
    console.log(`Server running on http://${monIp}:3000`); // log de l'URL du serveur
  })

  function infoScore(req, res) {
    connection.query('SELECT points, pointsTemp FROM Score WHERE idUser = ?',
      [req.body.userId], (err, results) => {
        if (err) {
          console.error('Erreur lors de la récupération du score :', err);
          res.status(500).json({ message: 'Erreur serveur' });

        }
        const verifPoints = results[0].points;
        const verifPointsTemp = results[0].pointsTemp;
      }
    );
  };

