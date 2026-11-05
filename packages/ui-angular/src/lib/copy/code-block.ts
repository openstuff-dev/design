import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { SegmentedControl } from '../segmented/segmented-control';
import { CopyButton } from './copy-button';

export interface CodeVariant {
  label: string;
  code: string;
}

/**
 * A command or snippet with a copy button. Give `variants` to let people pick one, such as a
 * package manager; a person's choice is kept in `variant`.
 *
 * ```html
 * <os-code-block code="npx nx build" what="command" />
 * <os-code-block what="install command" variantsLabel="Package manager" [variants]="[
 *   { label: 'npm', code: 'npm install x' }, { label: 'pnpm', code: 'pnpm add x' },
 * ]" />
 * ```
 */
@Component({
  selector: 'os-code-block',
  imports: [CopyButton, SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-code-block', '[attr.data-wrap]': 'wrap() ? "" : null' },
  template: `
    @if (variants().length) {
      <div class="os-code-block-head">
        <os-segmented-control
          size="sm"
          [label]="variantsLabel()"
          [options]="options()"
          [value]="current()?.label"
          (valueChange)="variant.set($event)"
        />
      </div>
    }
    <div class="os-code-block-body">
      <pre
        [attr.tabindex]="wrap() ? null : 0"
        [attr.role]="wrap() ? null : 'group'"
        [attr.aria-label]="wrap() ? null : what()"
      ><code>{{ shown() }}</code></pre>
      <os-copy-button class="os-code-block-copy" [text]="shown()" [what]="what()" />
    </div>
  `,
})
export class CodeBlock {
  /** The text, when there are no variants. */
  readonly code = input('');
  readonly variants = input<readonly CodeVariant[]>([]);
  /** The chosen variant's label. Defaults to the first. */
  readonly variant = model<string>();
  /** Names the variant switch for screen readers. */
  readonly variantsLabel = input('Variant');
  /** What's copied, for the button's name and the toast: "install command". */
  readonly what = input('code');
  /** Wraps long lines instead of scrolling, for a key or token you want to see whole. */
  readonly wrap = input(false, { transform: booleanAttribute });

  protected readonly options = computed(() =>
    this.variants().map(({ label }) => ({ value: label, label })),
  );

  protected readonly current = computed((): CodeVariant | undefined => {
    const variants = this.variants();
    return variants.find(({ label }) => label === this.variant()) ?? variants[0];
  });

  protected readonly shown = computed(() => this.current()?.code ?? this.code());
}
