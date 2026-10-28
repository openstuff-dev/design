let next = 0;

/** A page-unique id for wiring labels, descriptions and popovers together. */
export function uniqueId(prefix: string): string {
  return `os-${prefix}-${String(next++)}`;
}
