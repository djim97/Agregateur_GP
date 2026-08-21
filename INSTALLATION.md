# Barre du haut : emplacement et icone du compte

## Ce qui n allait pas

- Le lien vers le profil etait place EN PREMIER dans la partie droite,
  donc AVANT les liens de navigation. La convention le place a
  l extremite droite, pres de la deconnexion.
- Le seul repere visuel etait un petit point colore (user-dot), pas une
  icone de compte.

## Ce qui change

- L ordre devient : liens de navigation, separateur vertical, compte,
  deconnexion.
- Le compte affiche une VRAIE icone (silhouette au trait, meme style que
  les autres icones de l application) dans une pastille teal, suivie du
  nom.
- Etat actif : contour teal quand on est sur la page profil.
- Sur ecran etroit (moins de 720 px), seul le rond avec l icone reste,
  le nom et le separateur disparaissent pour ne pas encombrer.

## Fichiers
- src/app/shared/components/topbar/topbar.html
- src/app/shared/components/topbar/topbar.css
  (les anciennes regles .user-name et .user-dot sont retirees)

## Installation
Dezipper a la racine, ng serve. Aucun changement de donnees.

## Test
Connecte en client puis en transporteur : le compte est a droite, juste
avant Deconnexion, avec son icone. Un clic mene a Mon profil, et la
pastille prend un contour quand on y est.
