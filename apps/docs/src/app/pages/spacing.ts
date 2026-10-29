import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Button, PageHeader, Panel } from '@openstuff-dev/ui-angular';
import { ThemeService } from '../theme';

@Component({
  selector: 'docs-spacing',
  imports: [Button, PageHeader, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Space, radius and motion"
      description="A 4px grid, four corner sizes, four shadows and three speeds."
    ></header>

    <div class="stack">
      <section os-panel title="Space" description="--os-space-4 is 1rem (16px).">
        <ul class="list" role="list">
          @for (token of pick('space-'); track token.name) {
            <li class="row-token">
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
              <span class="bar" [style.inline-size]="'var(--os-' + token.name + ')'"></span>
            </li>
          }
        </ul>
      </section>

      <section
        os-panel
        title="Radius"
        description="generateTheme(primary, { radius: 0 }) gives square corners."
      >
        <ul class="boxes" role="list">
          @for (token of pick('radius-'); track token.name) {
            <li class="box-token">
              <span class="box" [style.border-radius]="'var(--os-' + token.name + ')'"></span>
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
            </li>
          }
        </ul>
      </section>

      <section
        os-panel
        title="Shadows"
        description="Darker in dark mode, where surfaces need more to stand apart."
      >
        <ul class="boxes" role="list">
          @for (name of shadows(); track name) {
            <li class="box-token">
              <span class="box raised" [style.box-shadow]="'var(--os-shadow-' + name + ')'"></span>
              <code>--os-shadow-{{ name }}</code>
            </li>
          }
        </ul>
      </section>

      <section
        os-panel
        title="Motion"
        description="Turned off for people who ask for reduced motion."
      >
        <ul class="list" role="list">
          @for (token of motion(); track token.name) {
            <li class="row-token">
              <code>--os-{{ token.name }}</code>
              <span class="value">{{ token.value }}</span>
              <span class="track">
                <span
                  class="dot"
                  [class.moved]="moved()"
                  [style.transition-duration]="
                    token.name.startsWith('duration')
                      ? 'var(--os-' + token.name + ')'
                      : 'var(--os-duration-slow)'
                  "
                  [style.transition-timing-function]="
                    token.name.startsWith('ease') ? 'var(--os-' + token.name + ')' : null
                  "
                ></span>
              </span>
            </li>
          }
        </ul>
        <button os-button type="button" size="sm" class="play" (click)="moved.set(!moved())">
          Play
        </button>
      </section>
    </div>
  `,
  styles: `
    .list {
      display: grid;
      gap: var(--os-space-3);
    }

    .row-token {
      display: grid;
      grid-template-columns: 11rem 9rem minmax(0, 1fr);
      gap: var(--os-space-2) var(--os-space-4);
      align-items: center;
    }

    @container (width < 36rem) {
      .row-token {
        grid-template-columns: 1fr auto;
      }

      .bar,
      .track {
        grid-column: 1 / -1;
      }
    }

    code {
      font-size: var(--os-text-sm);
    }

    .value {
      overflow: hidden;
      color: var(--os-fg-lighter);
      font-family: var(--os-font-mono);
      font-size: var(--os-text-xs);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .bar {
      block-size: 0.75rem;
      border-radius: var(--os-radius-sm);
      background: var(--os-brand-default);
    }

    .boxes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
      gap: var(--os-space-6) var(--os-space-4);
    }

    .box-token {
      display: grid;
      gap: var(--os-space-1);
      justify-items: start;
    }

    .box {
      inline-size: 4.5rem;
      block-size: 4.5rem;
      margin-block-end: var(--os-space-2);
      border: 1px solid var(--os-border-strong);
      background: var(--os-brand-soft);
    }

    .raised {
      border-color: var(--os-border-default);
      border-radius: var(--os-radius-lg);
      background: var(--os-bg-overlay);
    }

    .track {
      position: relative;
      block-size: 1rem;
      border-radius: var(--os-radius-full);
      background: var(--os-bg-surface-200);
    }

    .dot {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: 1rem;
      block-size: 1rem;
      border-radius: var(--os-radius-full);
      background: var(--os-brand-default);
      transition-property: inset-inline-start, translate;
    }

    .dot.moved {
      inset-inline-start: 100%;
      translate: -100%;
    }

    .play {
      margin-block-start: var(--os-space-4);
    }
  `,
})
export class Spacing {
  private readonly theme = inject(ThemeService);
  private readonly values = computed(() =>
    Object.entries(this.theme.theme().values).map(([name, value]) => ({ name, value })),
  );

  protected readonly shadows = computed(() => Object.keys(this.theme.theme().shadows));
  protected readonly motion = computed(() =>
    this.values().filter((t) => t.name.startsWith('duration-') || t.name.startsWith('ease-')),
  );

  protected readonly moved = signal(false);

  protected pick(prefix: string) {
    return this.values().filter((token) => token.name.startsWith(prefix));
  }
}
