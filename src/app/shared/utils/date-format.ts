/**
 * Formatage des dates d'étape.
 * Les données mêlent deux formes : "2026-08-12" (ancien) et
 * "2026-08-12T14:30" (nouveau). On affiche l'heure quand elle existe.
 */

/** "2026-08-12T14:30" -> "12/08/2026 à 14:30" ; "2026-08-12" -> "12/08/2026" */
export function formatDateHeure(valeur: string | null | undefined): string {
  if (!valeur) return '';
  const [datePart, heurePart] = valeur.split('T');
  const [a, m, j] = datePart.split('-');
  if (!a || !m || !j) return valeur;
  const date = `${j}/${m}/${a}`;
  if (!heurePart) return date;
  return `${date} à ${heurePart.slice(0, 5)}`;
}

/** Horodatage courant, à la minute : "2026-08-21T14:30" */
export function maintenantISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
