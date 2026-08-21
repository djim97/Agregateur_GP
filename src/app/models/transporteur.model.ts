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

  // ----- Coordonnées exhaustives -----
  /** Email de contact public */
  email: string;
  /** Adresse (siège ou point de dépôt principal) */
  adresse: string;
  /** NINEA : identifiant national des entreprises (PROFESSIONNEL uniquement) */
  ninea?: string;
  /** Téléphone du service client (PROFESSIONNEL, optionnel) */
  serviceClient?: string;
}
