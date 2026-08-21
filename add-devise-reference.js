/**
 * Pose la devise de reference (deviseReference) sur les transporteurs
 * existants. Par defaut : le franc CFA.
 * Usage : node add-devise-reference.js   (a la racine, API ARRETEE)
 * Idempotent.
 */
const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

let n = 0;
(db.transporteurs || []).forEach(t => {
  if (!t.deviseReference) { t.deviseReference = 'XOF'; n++; }
});

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
console.log(n + ' transporteur(s) ont recu deviseReference = XOF.');
console.log('Modifiable ensuite dans Mon profil. Redemarrez : npm run api');
