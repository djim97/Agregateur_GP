/**
 * Jeu de donnees de demonstration pour le tableau de bord de GP Express
 * (transporteurId "1", compte gpexpress@gp.sn).
 *
 * Alimente :
 *  - le graphe de remplissage des trajets
 *  - le donut des statuts de commandes
 *  - l'histogramme du chiffre d'affaires par jour
 *  - le temps de livraison moyen et le respect des delais
 *  - le taux de satisfaction (avis)
 *  - le chiffre d'affaires PAR DEVISE (un trajet facture en euros)
 *  - une reclamation a traiter
 *
 * Usage : node seed-demo.js        (a la racine, API ARRETEE)
 *         node seed-demo.js --reset  (retire les donnees de demo puis les recree)
 *
 * Idempotent : toutes les entrees creees portent le prefixe "demo-".
 */
const fs = require('fs');

const PREFIXE = 'demo-';
const TRANSPORTEUR = '1';     // GP Express
const CLIENT = '1';           // client@gp.sn
const CLIENT2 = '3';          // test@gp.sn

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));
db.reviews = db.reviews || [];
db.reclamations = db.reclamations || [];

// --- Nettoyage des donnees de demo precedentes ---
const estDemo = x => String(x.id || '').startsWith(PREFIXE);
['trajets', 'commandes', 'livraisons', 'reviews', 'reclamations', 'rendezvous'].forEach(res => {
  db[res] = (db[res] || []).filter(x => !estDemo(x));
});

if (process.argv.includes('--reset')) {
  fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');
  console.log('Donnees de demo retirees. Redemarrez : npm run api');
  process.exit(0);
}

// --- Utilitaires de dates (relatives a aujourd'hui) ---
const jour = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const jourHeure = (n, h) => `${jour(n)}T${h}`;

// ============ TRAJETS ============
const trajets = [
  // Termine : sert aux livraisons passees (national, FCFA)
  {
    id: PREFIXE + 't1', transporteurId: TRANSPORTEUR, destination: 'Thies',
    dateDepart: jourHeure(-12, '08:00'), prixParKilo: 250, devise: 'XOF',
    capaciteKilosTotale: 80, kilosReserves: 0, complet: true,
    plageReception: { debut: jourHeure(-15, '08:00'), fin: jourHeure(-13, '18:00') },
  },
  {
    id: PREFIXE + 't2', transporteurId: TRANSPORTEUR, destination: 'Touba',
    dateDepart: jourHeure(-8, '07:30'), prixParKilo: 300, devise: 'XOF',
    capaciteKilosTotale: 60, kilosReserves: 0, complet: true,
    plageReception: { debut: jourHeure(-11, '08:00'), fin: jourHeure(-9, '18:00') },
  },
  {
    id: PREFIXE + 't3', transporteurId: TRANSPORTEUR, destination: 'Saint-Louis',
    dateDepart: jourHeure(-4, '09:00'), prixParKilo: 280, devise: 'XOF',
    capaciteKilosTotale: 70, kilosReserves: 0, complet: false,
    plageReception: { debut: jourHeure(-7, '08:00'), fin: jourHeure(-5, '18:00') },
  },
  // A venir, international en EUROS : montre le CA par devise
  {
    id: PREFIXE + 't4', transporteurId: TRANSPORTEUR, destination: 'Paris',
    dateDepart: jourHeure(9, '23:40'), prixParKilo: 7, devise: 'EUR',
    capaciteKilosTotale: 120, kilosReserves: 0, complet: false,
    plageReception: { debut: jourHeure(3, '09:00'), fin: jourHeure(8, '17:00') },
  },
  // A venir, national : remplissage partiel visible
  {
    id: PREFIXE + 't5', transporteurId: TRANSPORTEUR, destination: 'Ziguinchor',
    dateDepart: jourHeure(6, '06:00'), prixParKilo: 400, devise: 'XOF',
    capaciteKilosTotale: 90, kilosReserves: 0, complet: false,
    plageReception: { debut: jourHeure(1, '08:00'), fin: jourHeure(5, '18:00') },
  },
];

// ============ COMMANDES ============
// [trajet, clientId, jourCommande, poidsFacture, statut, categorie]
const specs = [
  [PREFIXE + 't1', CLIENT,  -15, 12,  'LIVREE',     'vetements'],
  [PREFIXE + 't1', CLIENT2, -14, 8,   'LIVREE',     'documents'],
  [PREFIXE + 't1', CLIENT,  -14, 20,  'LIVREE',     'alimentaire'],
  [PREFIXE + 't2', CLIENT,  -11, 15,  'LIVREE',     'cosmetiques'],
  [PREFIXE + 't2', CLIENT2, -10, 25,  'LIVREE',     'vetements'],
  [PREFIXE + 't3', CLIENT,  -7,  18,  'LIVREE',     'electronique'],
  [PREFIXE + 't3', CLIENT2, -6,  10,  'EN_COURS',   'documents'],
  [PREFIXE + 't3', CLIENT,  -5,  14,  'EN_COURS',   'vetements'],
  [PREFIXE + 't5', CLIENT,  -2,  22,  'EN_ATTENTE', 'alimentaire'],
  [PREFIXE + 't5', CLIENT2, -1,  16,  'EN_ATTENTE', 'pieces-detachees'],
  [PREFIXE + 't4', CLIENT,  -1,  9,   'EN_ATTENTE', 'documents'],   // en EUROS
  [PREFIXE + 't4', CLIENT2, 0,   14,  'EN_ATTENTE', 'vetements'],   // en EUROS
];

const parId = Object.fromEntries(trajets.map(t => [t.id, t]));
const commandes = specs.map(([trajetId, clientId, j, poids, statut, categorie], i) => {
  const t = parId[trajetId];
  const dims = { L: 40, l: 30, h: 20 };
  const prix = t.devise === 'XOF'
    ? Math.round(poids * t.prixParKilo)
    : Math.round(poids * t.prixParKilo * 100) / 100;
  t.kilosReserves = Math.round((t.kilosReserves + poids) * 100) / 100;
  return {
    id: `${PREFIXE}c${i + 1}`,
    clientId, trajetId,
    statut,
    dateCommande: jour(j),
    description: `Colis de demonstration ${i + 1}`,
    poids, dimensions: dims,
    poidsFacture: poids,
    prixCalcule: prix,
    devise: t.devise,
    niveauFragilite: i % 5 === 0 ? 'FRAGILE' : 'AUCUNE',
    categorieProduit: categorie,
  };
});

// ============ LIVRAISONS (avec date reelle : indicateurs de service) ============
// [commande, jourEstime, jourReel]  -> 5 dans les temps sur 6 = 83 %
const livraisonsSpec = [
  [PREFIXE + 'c1', -11, -12],  // en avance
  [PREFIXE + 'c2', -10, -10],  // pile a l'heure
  [PREFIXE + 'c3', -10, -9],   // EN RETARD
  [PREFIXE + 'c4', -6,  -7],   // en avance
  [PREFIXE + 'c5', -6,  -6],   // a l'heure
  [PREFIXE + 'c6', -2,  -3],   // en avance
];
const livraisons = livraisonsSpec.map(([commandeId, est, reel], i) => ({
  id: `${PREFIXE}l${i + 1}`,
  commandeId,
  statut: 'LIVRE',
  positionActuelle: 'Livre au destinataire',
  dateEstimee: jour(est),
  dateLivraisonReelle: jour(reel),
}));
// Deux livraisons en cours
livraisons.push(
  { id: PREFIXE + 'l7', commandeId: PREFIXE + 'c7', statut: 'EN_COURS', positionActuelle: 'Rufisque', dateEstimee: jour(1) },
  { id: PREFIXE + 'l8', commandeId: PREFIXE + 'c8', statut: 'EN_COURS', positionActuelle: 'Mbour', dateEstimee: jour(2) },
);

// ============ AVIS (taux de satisfaction) ============
// 5,4,5,3,5,4 -> moyenne 4,33 -> 87 %
const avisSpec = [
  [PREFIXE + 'c1', CLIENT,  5, 'Colis arrive avant la date annoncee, tres bon contact.', -11],
  [PREFIXE + 'c2', CLIENT2, 4, 'Bonne communication, livraison conforme.',               -10],
  [PREFIXE + 'c3', CLIENT,  5, 'Parfait, je recommande sans hesiter.',                    -9],
  [PREFIXE + 'c4', CLIENT,  3, 'Correct mais un peu de retard sur le depot.',             -7],
  [PREFIXE + 'c5', CLIENT2, 5, 'Rapide et soigneux, rien a redire.',                      -6],
  [PREFIXE + 'c6', CLIENT,  4, 'Bien emballe, transporteur ponctuel.',                    -3],
];
const reviews = avisSpec.map(([commandeId, clientId, note, commentaire, j], i) => ({
  id: `${PREFIXE}a${i + 1}`,
  commandeId, clientId, transporteurId: TRANSPORTEUR,
  note, commentaire, date: jour(j),
}));

// ============ RECLAMATION (dossier a traiter) ============
const reclamations = [
  {
    id: PREFIXE + 'r1',
    clientId: CLIENT, commandeId: PREFIXE + 'c3', transporteurId: TRANSPORTEUR,
    motif: 'Retard de livraison',
    description: "Le colis est arrive avec un jour de retard sur la date annoncee, ce qui m'a oblige a reporter une remise en main propre.",
    statut: 'OUVERTE',
    dateCreation: jour(-8),
  },
  {
    id: PREFIXE + 'r2',
    clientId: CLIENT2, commandeId: PREFIXE + 'c5', transporteurId: TRANSPORTEUR,
    motif: 'Colis endommage',
    description: 'Un coin du carton etait enfonce a la reception, le contenu est intact mais je le signale.',
    statut: 'RESOLUE',
    dateCreation: jour(-5),
    reponse: 'Nous avons identifie un probleme de calage dans la soute et renforce nos protections. Merci du signalement.',
    dateReponse: jour(-4),
  },
];

// ============ RENDEZ-VOUS (un a confirmer) ============
const rendezvous = [
  { id: PREFIXE + 'rdv1', commandeId: PREFIXE + 'c9',  date: jourHeure(2, '10:00'), lieu: 'Gare routiere des Baux Maraichers', statut: 'EN_ATTENTE' },
  { id: PREFIXE + 'rdv2', commandeId: PREFIXE + 'c10', date: jourHeure(3, '15:30'), lieu: 'Agence Sacre-Coeur',                statut: 'EN_ATTENTE' },
  { id: PREFIXE + 'rdv3', commandeId: PREFIXE + 'c11', date: jourHeure(4, '11:00'), lieu: 'Terminal fret AIBD',                statut: 'CONFIRME'   },
];

// --- Ecriture ---
db.trajets.push(...trajets);
db.commandes.push(...commandes);
db.livraisons.push(...livraisons);
db.reviews.push(...reviews);
db.reclamations.push(...reclamations);
db.rendezvous.push(...rendezvous);

fs.writeFileSync('db.json', JSON.stringify(db, null, 2), 'utf8');

console.log('Donnees de demo ajoutees pour GP Express (gpexpress@gp.sn) :');
console.log('  ' + trajets.length + ' trajets (dont 1 facture en EUR)');
console.log('  ' + commandes.length + ' commandes reparties sur 15 jours');
console.log('  ' + livraisons.length + ' livraisons (6 terminees avec date reelle)');
console.log('  ' + reviews.length + ' avis, ' + reclamations.length + ' reclamations, ' + rendezvous.length + ' rendez-vous');
console.log('Redemarrez : npm run api');
