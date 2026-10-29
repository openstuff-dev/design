import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Badge, Button, Chip, PageHeader, StatusDot } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const BADGES = `
  <div class="row">
    <span os-badge>Draft</span>
    <span os-badge tone="brand">New</span>
    <span os-badge tone="success">Live</span>
    <span os-badge tone="warning">Needs review</span>
    <span os-badge tone="danger">Failed</span>
    <span os-badge tone="info">Beta</span>
  </div>
`;

@Component({
  selector: 'docs-badges',
  imports: [Badge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: BADGES,
})
class Badges {}

const CHIPS = `
  <div class="row">
    @for (path of paths(); track path) {
      <span os-chip removable (removed)="remove(path)">{{ path }}</span>
    } @empty {
      <button os-button type="button" size="sm" (click)="reset()">Put them back</button>
    }
  </div>
`;

@Component({
  selector: 'docs-chips',
  imports: [Button, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: CHIPS,
})
class Chips {
  private readonly all = ['web/**', 'server/**', '*.md'];
  protected readonly paths = signal(this.all);

  protected remove(path: string): void {
    this.paths.update((paths) => paths.filter((p) => p !== path));
  }

  protected reset(): void {
    this.paths.set(this.all);
  }
}

const DOTS = `
  <div class="row">
    <span os-status-dot tone="success">Running</span>
    <span os-status-dot tone="warning" pulse>Deploying</span>
    <span os-status-dot tone="danger">Stopped</span>
    <span os-status-dot>Paused</span>
  </div>
`;

@Component({
  selector: 'docs-status-dots',
  imports: [StatusDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: DOTS,
})
class Dots {}

@Component({
  selector: 'docs-badge-page',
  imports: [Badges, Chips, CodeBlock, Dots, Example, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Badge, chip and status dot"
      description="Short labels for a state, a filter or a value."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="badge">
        <h2 id="badge">Badge</h2>
        <p>A state in one or two words. The colour repeats the word; it never replaces it.</p>
      </section>
      <docs-example [code]="badges"><docs-badges /></docs-example>

      <section class="prose" aria-labelledby="chip">
        <h2 id="chip">Chip</h2>
        <p>
          A value someone chose, like a filter or a path. <code>removable</code> adds a remove
          button named after the chip, and <code>(removed)</code> tells you when it's pressed.
        </p>
      </section>
      <docs-example [code]="chips"><docs-chips /></docs-example>

      <section class="prose" aria-labelledby="dot">
        <h2 id="dot">Status dot</h2>
        <p><code>pulse</code> marks something in progress, and stops for reduced motion.</p>
      </section>
      <docs-example [code]="dots"><docs-status-dots /></docs-example>
    </div>
  `,
})
export class BadgePage {
  protected readonly badges = BADGES;
  protected readonly chips = CHIPS;
  protected readonly dots = DOTS;
  protected readonly usage = `import { Badge, Chip, StatusDot } from '@openstuff-dev/ui-angular';`;
}
