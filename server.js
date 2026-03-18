const express = require('express'); // importation d'express
const app = express(); // création de l'application express
const mysql = require('mysql2');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
require('dotenv').config();

const connection = mysql.createConnection({ // configuration de la connexion à la base de données
  host: '172.29.16.241', //changer ip
  user: process.env.LoginBDD,
  password: process.env.PasswordBDD,
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

app.get('/check', auth, (req, res) => {
  connection.query('SELECT id FROM User WHERE id = ?',
    [req.auth.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la verif du token :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      else {
        res.json({ data: true })
        return;
      }

    })
})

//=========================================================================================================

app.get('/Top100', (req, res) => { // route GET pour /scoreTab
  connection.query('SELECT User.login, Score.points FROM Score,User WHERE Score.idUser = User.id ORDER BY points DESC LIMIT 100',
    (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du classement :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      res.json(results);
      return;
    });
});




//=========================================================================================================
// methode post 
//=========================================================================================================\

app.post('/startgame', auth, (req, res) => { // route POST pour /startgame
  connection.query('UPDATE Score SET pointsTemp = 0 WHERE idUser = ?',
    [req.auth.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la réinitialisation du scoreTemp :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      connection.query('DELETE FROM Session WHERE idUser = ?',
        [req.auth.id], (err, results) => {
          if (err) {
            console.error('Erreur lors de la suppression de la session :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;
          }
          console.log('scoreTemp réinitialisés avec succès');
          res.json({ message: 'reinitialisation effectuée' });
          return;
        });
    });
}
);


//=========================================================================================================
// route pour la fin de partie et la mise à jour du score
app.post('/endgame', auth, (req, res) => { // route POST pour /endgame
  connection.query('SELECT points, pointsTemp FROM Score WHERE idUser = ?',
    [req.auth.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du score :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;

      }
      
      else if (results[0].points < results[0].pointsTemp) {
        connection.query('UPDATE Score SET points = pointsTemp, pointsTemp = 0 WHERE idUser = ?',
          [req.auth.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du score :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            else {
              connection.query('DELETE FROM Session WHERE idUser = ?',
                [req.auth.id], (err, results) => {
                  if (err) {
                    console.error('Erreur lors de la suppression de la session :', err);
                    res.status(500).json({ message: 'Erreur serveur' });
                    return;
                  }

                  console.log('score mis à jour avec succès');
                  res.json({ message: 'score mis à jour' });
                  return;
                });
            }
          });
      }
      // else if (results[0].winstreak < results[0].winstreakTemp) {
      //   connection.query('UPDATE Score SET winstreak = winstreakTemp , winstreakTemp = 0 WHERE idUser = ?',
      //     [req.auth.id], (err, results) => {
      //       if (err) {
      //         console.error('Erreur lors de la mise à jour du winstreak :', err);
      //         res.status(500).json({ message: 'Erreur serveur' });
      //         return;
      //       }
      //       console.log('winstreak mis à jour avec succès');
      //       res.json({ message: 'winstreak mis à jour' });

      //     })
      // }
      else {

        connection.query('DELETE FROM Session WHERE idUser = ?',
          [req.auth.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la suppression de la session :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;
            }
            res.json({ message: 'score non mis à jour' });
            return;
          });
      }
    });
})





//=========================================================================================================
// route pour les questions
app.post('/quizz', auth, (req, res) => { // route POST pour /quizz
  let randomImage = 0;
  connection.query('SELECT login FROM User WHERE id = ?',
    [req.auth.id], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération du login :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;
      }
      else if (results.length === 0) {
        res.json({ message: 'Utilisateur introuvable' });
        return;
      }
      else {
        var pseudo= results[0].login;
      }
    
  connection.query('SELECT id FROM Quizz', (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du quizz :', err);
      res.status(500).json({ message: 'Erreur serveur' });
      return;
    }
    var nbQuizz = results.length;
    function regenere() {
      randomImage = Math.floor(Math.random() * nbQuizz);
      let saveId = results[randomImage].id;
      connection.query('SELECT idUser, idQuizz FROM  Session WHERE idUser = ? AND idQuizz = ?', [req.auth.id, saveId], (err, results) => {
        if (err) {
          console.error('Erreur lors de la récupération du quizz :', err);
          res.status(500).json({ message: 'Erreur serveur' });
          return;
        }
        else if (results.length === 0) {
          connection.query('Insert INTO Session (idQuizz,idUser) VALUES (?,?) ',
            [saveId, req.auth.id, saveId, req.auth.id], (err, results) => {
              if (err) {
                console.error('Erreur lors de la création de la session :', err);
                res.status(500).json({ message: 'Erreur serveur' });
                return;

              }

              connection.query('SELECT Quizz.chemin,Quizz.nom,Session.attendre FROM Quizz, Session WHERE Quizz.id = ? AND Quizz.id = Session.idQuizz AND Session.idUser = ?',
                [saveId, req.auth.id], (err, results) => {

                  if (err) {
                    console.error('Erreur lors de la récupération du quizz :', err);
                    res.status(500).json({ message: 'Erreur serveur' });
                    return;

                  }
                  else if (results[0].attendre > 0) {
                    console.log('quizz en attente, génération d\'un nouveau quizz');
                    return regenere();
                  }
                  
                  else {
                    let idTemp = crypto.randomBytes(16).toString('hex');
                    var stocker = {
                      chemin: results[0].chemin,
                      nom: results[0].nom,
                      id: idTemp
                    }
                    connection.query('DELETE FROM Session WHERE attendre =1', (err, results) => {
                      if (err) {
                        console.error('Erreur lors de la suppression des sessions :', err);
                        res.status(500).json({ message: 'Erreur serveur' });
                        return;

                      }
                      connection.query('UPDATE Session SET idTemp = ? WHERE idQuizz = ? AND idUser = ?',
                        [idTemp, saveId, req.auth.id], (err, results) => {
                          if (err) {
                            console.error('Erreur lors de la mise à jour du quizz :', err);
                            res.status(500).json({ message: 'Erreur serveur' });
                            return;

                          }

                          console.log('quizz mis à jour avec succès pour l\'utilisateur :', pseudo);
                          res.json({ question: stocker });
                          return;
                        });
                    })

                  }
                }
              )

            })
        }
        else {
          return regenere();
        }


      })

    }
    regenere();
  })
});

})


//=========================================================================================================
// route pour les reponses 
app.post('/reponse', auth, (req, res) => { // route GET pour /reponse
  connection.query('SELECT Quizz.reponse FROM Quizz, Session WHERE Quizz.id = Session.idQuizz AND Session.idTemp = ?',
    [req.body.idQuizz], (err, results) => {
      if (err) {
        console.error('Erreur lors de la récupération de la réponse :', err);
        res.status(500).json({ message: 'Erreur serveur' });
        return;

      }
      if (results.length === 0) {
        res.json({ message: 'Quizz introuvable' });
        return;

      }
      else if (results[0].reponse == req.body.reponse) {
        connection.query('UPDATE Score SET pointsTemp = pointsTemp + 1 WHERE idUser = ?',
          [req.auth.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du score :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;

            }
            else {
              connection.query('UPDATE Session SET attendre = 20, idTemp = 0 WHERE idTemp = ? AND idUser = ?',
                [req.body.idQuizz, req.auth.id], (err, results) => {
                  if (err) {
                    console.error('Erreur lors de la mise à jour du quizz :', err);
                    res.status(500).json({ message: 'Erreur serveur' });
                    return;

                  }
                  else {
                    connection.query('UPDATE Session SET attendre = attendre - 1 WHERE attendre !=0 AND idTemp != ? AND idUser = ?',
                      [req.body.idQuizz, req.auth.id], (err, results) => {
                        if (err) {
                          console.error('Erreur lors de la mise à jour du quizz :', err);
                          res.status(500).json({ message: 'Erreur serveur' });
                          return;

                        }
                      })
                  }
                  console.log('score mis à jour');
                  res.json({ message: 'score mis à jour' });
                  return;
                })
            }
          });
      }

      else {
        // connection.query('UPDATE Score SET winstreakTemp = 0 WHERE idUser = ?',
        //   [req.auth.id], (err, results) => {
        //     if (err) {
        //       console.error('Erreur lors de la mise à jour du score :', err);
        //       res.status(500).json({ message: 'Erreur serveur' });
        //       return;
        //     }
        //   }
        // )
        connection.query('UPDATE Session SET attendre = 20, idTemp= 0 WHERE idTemp = ? AND idUser = ?',
          [req.body.idQuizz, req.auth.id], (err, results) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du quizz :', err);
              res.status(500).json({ message: 'Erreur serveur' });
              return;

            }
            else {
              connection.query('UPDATE Session SET attendre = attendre - 1 WHERE attendre > 0 AND idTemp != ? AND idUser = ?',
                [req.body.idQuizz, req.auth.id], (err, results) => {
                  if (err) {
                    console.error('Erreur lors de la mise à jour du quizz :', err);
                    res.status(500).json({ message: 'Erreur serveur' });
                    return;

                  }
                  console.log('mauvaise réponse');
                  res.json({ message: 'mauvaise réponse', stop: true });
                  return;
                }

              )
            }
          });
      }
    });
});

//=========================================================================================================
//route d'inscription
//tokenid n'est pas vraiment un token juste un id dure a trouver
app.post('/register', (req, res) => { // route POST pour /register
  if (req.body === undefined) {
    res.json({ message: 'aucun donnée recu' });
    return;
  }
  else {
    async function reloadRegister() {
      if (req.body.V_log.length < 4) {
        console.log('login trop court');
        res.json({ message: 'Le login doit contenir au moins 4 caractères' });
        return;

      }
      else if (req.body.V_log.length > 20) {
        console.log('login trop long');
        res.json({ message: 'Le login ne doit pas dépasser 20 caractères' });
        return;
      }
      else if (req.body.V_pass.length > 30) {
        console.log('mdp trop long');
        res.json({ message: 'Le mot de passe ne doit pas dépasser 30 caractères' });
        return;
      }
      else if (req.body.V_pass.length < 8) {
        console.log('mdp trop court');
        res.json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
        return;
      }
      else {
        let hache = await bcrypt.hash(req.body.V_pass, 10);
        connection.query(
          'INSERT INTO User (login, password) VALUES (?,?)',
          [req.body.V_log, hache],
          (err, results) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                console.error('Erreur: login déjà utilisé :', err);
                return res.status(400).json({ message: 'Login déjà utilisé' });

              }
              else {
                console.error('erreur lors de de l\'inscription :', err);
                res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
                return;
              }
            }
            else {
              // ajout de l'user dans la table score car plus simple 
              connection.query(
                'INSERT INTO Score (idUser) VALUES (?)',
                [results.insertId],
                (err, resultsScore) => {
                  if (err) {
                    console.error('Erreur lors de l\'insertion dans la table Score :', err);
                    res.status(500).json({ message: 'Erreur serveur lors de l\'insertion du score' });
                    return;

                  }
                  console.log('Insertion réussie, ID utilisateur :', results.insertId);
                  res.json({ message: 'Inscription réussie !' });
                  return;
                }
              );
            }
          });

      }



    }
    reloadRegister();
  }



});




//=========================================================================================================
// route de connexion
app.post('/login', (req, res) => { // route POST pour /login

  if (req.body === undefined) {
    res.json({ message: 'aucun donnée recu' });
    return;
  }
  else {
    console.log('Données recues pour la connexion'); // log dans la console
    console.log(req.body);

    connection.query(
      'SELECT * FROM User WHERE login = ?',
      [req.body.V_log],
      (err, results) => {
        async function attHache() {
          if (err) {
            console.error('Erreur lors de la vérification des identifiants :', err);
            res.status(500).json({ message: 'Erreur serveur' });
            return;

          }
          else if (results.length === 0) {
            res.json({ message: 'Identifiants invalides' });
            return;

          }

          else {

            let hache = await bcrypt.compare(req.body.V_pass, results[0].password);
            if (hache) {
              console.log('Connexion réussie pour l\'utilisateur :', results[0].login);

              res.json({
                message: 'Connexion réussie ',
                tokenId: jwt.sign({
                  id: results[0].id
                },
                  process.env.SecretJWT,
                  { expiresIn: '2h' })
              });
              return;
            }

            else {
              console.log('Mot de passe incorrect ou identifiants incorrect');
              res.json({
                message: 'Identifiants invalides merci de saisir des identifiants valide'
              });
              return;
            }
          }





        }
        attHache();
      }

  )
    
  };
});



//=========================================================================================================
app.listen(2000, () => { // démarrage du serveur sur le port 2000
  let monIp = require("ip").address(); // récupération de l'adresse IP locale
  console.log(`Server running on http://${monIp}:2000`); // log de l'URL du serveur
});

