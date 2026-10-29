import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PageHeader, Panel } from '@openstuff-dev/ui-angular';
import { ThemeService } from '../theme';

const PREFIXES = ['text-', 'font-weight-', 'leading-', 'font-'];

@Component({
  selector: 'docs-typography',
  imports: [PageHeader, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Typography"
      description="Geist when it's installed, otherwise the system font. Body text is 14px; rem tokens stay relative to the browser's 16px."
    ></header>

    <div class="stack">
      <section os-panel title="Sizes">
        <ul class="list" role="list">
          @for (token of sizes(); track token.name) {
            <li class="type-row">
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
              <span class="sample" [style.font-size]="'var(--os-' + token.name + ')'">
                Plain words for a busy reader
              </span>
            </li>
          }
        </ul>
      </section>

      <section os-panel title="Weights">
        <ul class="list" role="list">
          @for (token of weights(); track token.name) {
            <li class="type-row">
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
              <span class="sample" [style.font-weight]="'var(--os-' + token.name + ')'">
                Saved your changes
              </span>
            </li>
          }
        </ul>
      </section>

      <section os-panel title="Line height">
        <ul class="list" role="list">
          @for (token of leading(); track token.name) {
            <li class="type-row">
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
              <p class="paragraph" [style.line-height]="'var(--os-' + token.name + ')'">
                Each project solves one real problem well, runs on your own server and keeps your
                data yours. Projects share one toolkit, so they look and behave alike.
              </p>
            </li>
          }
        </ul>
      </section>

      <section os-panel title="Families">
        <ul class="list" role="list">
          @for (token of families(); track token.name) {
            <li class="type-row">
              <code>--os-{{ token.name }}</code>
              <span class="value family">{{ token.value }}</span>
              <span class="sample" [style.font-family]="'var(--os-' + token.name + ')'">
                0123456789 AaBbCc {{ '{ }' }}
              </span>
            </li>
          }
        </ul>
      </section>
    </div>
  `,
  styles: `
    .list {
      display: grid;
      gap: var(--os-space-4);
    }

    .type-row {
      display: grid;
      grid-template-columns: 11rem 6rem minmax(0, 1fr);
      gap: var(--os-space-2) var(--os-space-4);
      align-items: baseline;
    }

    @container (width < 36rem) {
      .type-row {
        grid-template-columns: 1fr auto;
      }

      .sample,
      .paragraph {
        grid-column: 1 / -1;
      }
    }

    code {
      font-size: var(--os-text-sm);
    }

    .value {
      color: var(--os-fg-lighter);
      font-family: var(--os-font-mono);
      font-size: var(--os-text-xs);
    }

    .family {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .paragraph {
      max-inline-size: 36rem;
    }
  `,
})
export class Typography {
  private readonly theme = inject(ThemeService);
  private readonly values = computed(() =>
    Object.entries(this.theme.theme().values).map(([name, value]) => ({ name, value })),
  );

  protected readonly sizes = computed(() => this.pick(PREFIXES[0]));
  protected readonly weights = computed(() => this.pick(PREFIXES[1]));
  protected readonly leading = computed(() => this.pick(PREFIXES[2]));
  protected readonly families = computed(() =>
    this.values().filter((token) => ['font-sans', 'font-mono'].includes(token.name)),
  );

  private pick(prefix: string) {
    return this.values().filter((token) => token.name.startsWith(prefix));
  }
}
