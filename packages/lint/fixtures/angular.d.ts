// Just enough of Angular for the fixtures to type-check.
declare module '@angular/core' {
  export const ChangeDetectionStrategy: { OnPush: 0; Default: 1 };
  export function Component(meta: Record<string, unknown>): ClassDecorator;
  export function Input(): PropertyDecorator;
  export function input<T>(value: T): () => T;
}
