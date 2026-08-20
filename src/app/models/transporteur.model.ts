export type TypeTransporteur = 'INFORMEL' | 'PROFESSIONNEL';
export type ModeTransport = 'ROUTE' | 'BATEAU' | 'AVION';

export interface Transporteur {
  id: string;
  nom: string;
  telephone: string;
  zonesDesservies: string[];
  note: number;
  /** Figé à l'inscription, non modifiable (décision 1) */
  type: TypeTransporteur;
  /** INFORMEL : toujours ['ROUTE'] ; PROFESSIONNEL : un ou plusieurs modes */
  modesTransport: ModeTransport[];
  /** Catégories refusées par CE transporteur (en plus de la liste globale) */
  produitsIllicites: string[];
}
