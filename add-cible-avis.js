/**
 * Pose le sens (cible) sur les avis existants.
 * Tous les avis anterieurs ont ete deposes par des clients sur des
 * transporteurs : on pose cible = "TRANSPORTEUR".
 * Usage : node add-cible-avis.js   (a la racine, API ARRETEE)
 * Idempotent.
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

db.reviews = db.reviews || [];
let n = 0;
db.reviews.forEach(a => { if (!a.cible) { a.cible = 'TRANSPORTEUR'; n++; } });

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log(n + ' avis marque(s) comme portant sur un transporteur.');
console.log('Redemarrez : npm run api');
