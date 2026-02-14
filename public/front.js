const monInput = document.getElementById('monInput'); // Récupération de l'élément input
const monInput2 = document.getElementById('monInput2'); // Récupération du deuxième élément input
const monBouton = document.getElementById('monBouton'); // Récupération de l'élément bouton

monBouton.addEventListener('click', () => { // Ajout d'un écouteur d'événement au bouton
    fetch('/register', { // Requête POST vers /register
        method: 'POST', // Méthode POST
        headers: { // En-têtes de la requête
            'Content-Type': 'application/json' // Indication que le corps de la requête est en JSON
        },
        body: JSON.stringify({ V_log: monInput.value, V_pass: monInput2.value }) // Corps de la requête avec la valeur de l'input convertie en JSON
    })
        .then(response => response.json()) // Conversion de la réponse en JSON
        .then(data => { // Traitement de la réponse JSON
            alert(data.message); // Affichage d'une alerte avec la réponse
        });
});

window.onload = () => {
    fetch('/users')
        .then(response => response.json())
        .then(users => {
            const usersList = document.getElementById('usersList');
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.text = user.login;
                usersList.appendChild(option);

            });
        });
    };
//===================================================================================================    

