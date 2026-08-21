/**
 * Ajoute la devise aux trajets et aux commandes existants.
 * Tout l'historique est en francs CFA : on pose devise = "XOF".
 * Usage : node add-devises.js   (à la racine, API ARRÊTÉE)
 * Idempotent.
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

let t = 0, c = 0;
(db.trajets || []).forEach(x => { if (!x.devise) { x.devise = 'XOF'; t++; } });
(db.commandes || []).forEach(x => { if (!x.devise) { x.devise = 'XOF'; c++; } });

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log(t + ' trajet(s) et ' + c + ' commande(s) passes en XOF.');
console.log('Redemarrez : npm run api');
