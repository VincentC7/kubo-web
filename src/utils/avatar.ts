/**
 * Génère une teinte HSL (0–359) déterministe à partir d'une adresse email.
 * Utilisé pour générer les avatars colorés dans la sidebar et le profil.
 */
export function emailToHue(email: string): number {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0
  }
  return hash % 360
}
