export type Stack = 'web' | 'web-server' | 'library';

export interface PresetGeneratorSchema {
  name: string;
  stack?: Stack;
  primaryColor?: string;
  openpurpose?: string;
  author?: string;
}
