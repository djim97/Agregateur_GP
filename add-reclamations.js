/**
 * Ajoute la ressource "reclamations" à db.json et sa permission à routes.json.
 * Usage : node add-reclamations.js   (à la racine du projet, API ARRÊTÉE)
 * Idempotent : peut être relancé sans dégât.
 */
const fs = require('fs');

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
if (!Array.isArray(db.reclamations)) {
  db.reclamations = [];
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
  console.log('db.json : ressource "reclamations" ajoutee.');
} else {
  console.log('db.json : "reclamations" deja presente (' + db.reclamations.length + ' entree(s)).');
}

const routes = JSON.parse(fs.readFileSync('routes.json', 'utf8'));
if (routes.reclamations !== 660) {
  routes.reclamations = 660;   // proprietaire : lecture + ecriture ; connecte : lecture + ecriture
  fs.writeFileSync('routes.json', JSON.stringify(routes, null, 2), 'utf8');
  console.log('routes.json : permission "reclamations" = 660.');
} else {
  console.log('routes.json : permission deja en place.');
}

console.log('Termine. Redemarrez : npm run api');
