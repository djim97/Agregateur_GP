/**
 * Ajoute les coordonnées exhaustives (email, adresse, ninea, serviceClient)
 * aux transporteurs existants de db.json, SANS toucher au reste.
 * Usage : node migrate-coordonnees.js   (à la racine du projet, API arrêtée)
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

const DONNEES = {
  '1': { email: 'contact@gpexpress.sn',   adresse: 'Km 4,5 Boulevard du Centenaire, Dakar', ninea: '0057214893A2', serviceClient: '33 821 45 67' },
  '2': { email: 'sunugp@gmail.com',       adresse: 'Quartier Escale, Touba' },
  '3': { email: 'terangacolis@gmail.com', adresse: 'Avenue Général de Gaulle, Saint-Louis' },
  '4': { email: 'contact@ndiayetransport.sn', adresse: 'Zone industrielle, Rufisque', ninea: '0083901276B1', serviceClient: '33 836 22 10' },
  '5': { email: 'baolexpress@gmail.com',  adresse: 'Marché central, Diourbel' },
};

let modifies = 0;
db.transporteurs.forEach(t => {
  const extra = DONNEES[String(t.id)];
  if (extra) {
    Object.assign(t, extra);
    modifies++;
  } else if (!t.email) {
    // transporteurs créés via l'inscription avant cette évolution
    t.email = 'contact@' + t.nom.toLowerCase().replace(/[^a-z]/g, '') + '.sn';
    t.adresse = 'Dakar';
    modifies++;
  }
});

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log(modifies + ' transporteur(s) enrichi(s). Redemarrez npm run api.');
