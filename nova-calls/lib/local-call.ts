export type NovaCall = {
  title: string;
  description: string;
  type: string;
  accessType: 'public' | 'private';
  slug: string;
  pulse: number;
  participants: number;
  createdAt: string;
};

export const demoCalls: NovaCall[] = [
  {
    title: 'Mi trasferisco a Milano?',
    description: 'Nuova città, nuove opportunità, ma è la scelta giusta per me adesso?',
    type: 'Decidere',
    accessType: 'public',
    slug: 'mi-trasferisco-a-milano',
    pulse: 92,
    participants: 138,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Cambio lavoro o resto?',
    description: 'Vorrei capire se quello che sento è paura o un segnale concreto di cambiare.',
    type: 'Capire',
    accessType: 'public',
    slug: 'cambio-lavoro-o-resto',
    pulse: 76,
    participants: 92,
    createdAt: new Date().toISOString(),
  },
  {
    title: 'Lancio la mia startup?',
    description: 'Ho una prima idea ma mi serve capire se vale davvero la pena provarci.',
    type: 'Creare insieme',
    accessType: 'public',
    slug: 'lancio-la-mia-startup',
    pulse: 83,
    participants: 76,
    createdAt: new Date().toISOString(),
  },
];

export function makeSlug(input: string) {
  const base = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 72);

  return `${base || 'call'}-${Math.random().toString(36).slice(2, 7)}`;
}
