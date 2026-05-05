export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 70);

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || 'call'}-${suffix}`;
}
