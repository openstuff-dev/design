export const template = `<p>Hello</p>`;

export function label(name: string): string {
  return name.trim() || 'Untitled';
}
