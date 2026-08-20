export function formatCommandeNumber(id: string): string {
  const compactId = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = compactId.slice(-6).padStart(6, '0');
  return `CMD-${suffix}`;
}
