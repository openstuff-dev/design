export interface SiteGeneratorSchema {
  name: string;
  tagline?: string;
  directory?: string;
  domain?: string;
  repository?: string;
  appUrl?: string;
  primaryColor?: string;
  glyph?: 'diamond' | 'hexagon' | 'plus' | 'half' | 'bars';
}
