import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { ScaleName } from '@openstuff-dev/tokens';
import { PageHeader, Panel } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { ThemeService } from '../theme';

interface Group {
  name: string;
  description: string;
  match: (token: string) => boolean;
  /** Text tokens show as text, the rest as fills. */
  text?: boolean;
}

const STATUS = /^(danger|warning|success|info)-/;

const GROUPS: Group[] = [
  { name: 'Backgrounds', description: 'Pages, surfaces that sit on them, and controls.',
    match: (t) => t.startsWith('bg-') || t === 'backdrop' },
  { name: 'Text', description: 'Each passes 4.5:1 on every background, except muted (3:1).',
    match: (t) => t.startsWith('fg-'), text: true },
  { name: 'Borders', description: 'Dividers, cards and the edges of controls.',
    match: (t) => t.startsWith('border-') },
  { name: 'Brand', description: 'Generated from the primary colour. Ink is text on the brand fill.',
    match: (t) => t.startsWith('brand-') || t === 'focus-ring' },
  { name: 'Status', description: 'Fixed hues, so a red brand doesn\'t turn errors green.',
    match: (t) => STATUS.test(t) },
  { name: 'Identity', description: 'Eight colours spread around the primary, e.g. one per organization.',
    match: (t) => t.startsWith('identity-') },
];

@Component({
  selector: 'docs-colors',
  imports: [CodeBlock, PageHeader, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Colours"
      [description]="
        'Every colour below comes from one primary colour, now ' +
        theme.primary() +
        '. Change it with the Theme button.'
      "
    ></header>

    <div class="stack">
      <div class="prose">
        <p>
          Components only use the <strong>semantic tokens</strong>, such as
          <code>--os-bg-surface-100</code>. Each is a <code>light-dark()</code> pair, so the theme
          follows <code>color-scheme</code> without a second set of variables. Set
          <code>data-theme="light"</code> or <code>"dark"</code> on <code>&lt;html&gt;</code> to
          force one.
        </p>
      </div>
      <docs-code boxed language="TypeScript" [code]="usage" />

      @for (group of groups(); track group.name) {
        <section os-panel [title]="group.name" [description]="group.description">
          <ul class="tokens" role="list">
            @for (token of group.tokens; track token.name) {
              <li class="token">
                @if (group.text) {
                  <span class="sample-text" [style.color]="'var(--os-' + token.name + ')'">Aa</span>
                } @else {
                  <span class="sample" [style.background]="'var(--os-' + token.name + ')'"></span>
                }
                <code class="name">--os-{{ token.name }}</code>
                <span class="value">Light {{ token.light }}<br />Dark {{ token.dark }}</span>
              </li>
            }
          </ul>
        </section>
      }

      <section
        os-panel
        title="Scales"
        description="The 12 steps behind the semantic tokens, light on top and dark below. They aren't CSS variables: use the semantic tokens."
      >
        @for (scale of scales(); track scale.name) {
          <div class="scale">
            <span class="scale-name">{{ scale.name }}</span>
            @for (scheme of scale.schemes; track $index) {
              <div
                class="steps"
                role="img"
                [attr.aria-label]="scale.name + ' scale, ' + ($index ? 'dark' : 'light')"
              >
                @for (step of scheme; track $index) {
                  <span [style.background]="step" [title]="step"></span>
                }
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    .tokens {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
      gap: var(--os-space-3);
    }

    .token {
      display: grid;
      grid-template-columns: 2.5rem 1fr;
      gap: 0 var(--os-space-3);
      align-items: center;
      min-inline-size: 0;
    }

    .sample,
    .sample-text {
      display: grid;
      grid-row: span 2;
      place-items: center;
      block-size: 2.5rem;
      border-radius: var(--os-radius-md);
      box-shadow: inset 0 0 0 1px var(--os-border-default);
      background: var(--os-bg-default);
      font-weight: var(--os-font-weight-semibold);
    }

    .name {
      overflow: hidden;
      font-size: var(--os-text-sm);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .value {
      overflow: hidden;
      color: var(--os-fg-lighter);
      font-family: var(--os-font-mono);
      font-size: var(--os-text-xs);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .scale {
      display: grid;
      grid-template-columns: 5rem 1fr;
      gap: var(--os-space-1) var(--os-space-3);
      align-items: center;
    }

    .scale + .scale {
      margin-block-start: var(--os-space-4);
    }

    .scale-name {
      grid-row: span 2;
      font-size: var(--os-text-sm);
      font-weight: var(--os-font-weight-medium);
      text-transform: capitalize;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 2px;
    }

    .steps span {
      block-size: 1.75rem;
      border-radius: var(--os-radius-sm);
    }
  `,
})
export class Colors {
  protected readonly theme = inject(ThemeService);

  protected readonly groups = computed(() => {
    const colors = Object.entries(this.theme.theme().colors);
    return GROUPS.map((group) => ({
      ...group,
      tokens: colors
        .filter(([name]) => group.match(name))
        .map(([name, pair]) => ({ name, ...pair })),
    }));
  });

  protected readonly scales = computed(() => {
    const { scales } = this.theme.theme();
    return (Object.keys(scales) as ScaleName[]).map((name) => ({
      name,
      schemes: [scales[name].light, scales[name].dark],
    }));
  });

  protected readonly usage = `// tokens.config.json, built with npx os-tokens
{ "primaryColor": "#2d5bff" }

// Or in the browser, for part of a page (an organization's own colour, say):
import { applyTheme, generateTheme } from '@openstuff-dev/tokens';

applyTheme(element, generateTheme('#3ecf8e'));`;
}
