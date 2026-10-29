import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, Card, CardGrid, PageHeader } from '@openstuff-dev/ui-angular';

@Component({
  selector: 'docs-home',
  imports: [Button, Card, CardGrid, PageHeader, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="OpenStuff Design"
      description="The toolkit every OpenStuff project is built with. One primary colour gives a full light and dark theme, and the components look and behave the same in every app."
    >
      <a os-button variant="primary" routerLink="/getting-started">Get started</a>
      <a os-button routerLink="/button">See the components</a>
    </header>

    <div class="stack">
      <div class="prose">
        <p>
          Pick a colour with the <strong>Theme</strong> button at the top. Every page here, and
          every example, is themed from it in your browser, the same way <code>os-tokens</code>
          themes an app when it builds.
        </p>
      </div>

      <div os-card-grid>
        @for (pkg of packages; track pkg.name) {
          <a os-card class="package" [href]="pkg.href" target="_blank" rel="noopener">
            <code>{{ pkg.name }}</code>
            <span>{{ pkg.text }}</span>
          </a>
        }
      </div>

      <div class="prose">
        <h2>What it stands for</h2>
        <ul>
          <li>
            <strong>Native HTML first.</strong> Dialogs are <code>&lt;dialog&gt;</code>, menus and
            tooltips use the Popover API and anchor positioning. Polyfills load only in browsers
            that need them.
          </li>
          <li>
            <strong>Components fit their container,</strong> not the window. Drag the corner of any
            example to see it.
          </li>
          <li>
            <strong>One theme for light and dark.</strong> Every colour token is a
            <code>light-dark()</code> pair, and every text and background pair passes WCAG AA in
            both.
          </li>
          <li>
            <strong>CSS core, thin wrappers.</strong> <code>&#64;openstuff-dev/ui</code> is plain
            CSS that works with any framework. <code>&#64;openstuff-dev/ui-angular</code> renders
            the same markup and adds keyboard handling and ARIA.
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: `
    .package {
      display: grid;
      gap: var(--os-space-1);
      color: var(--os-fg-light);
      text-decoration: none;
    }

    .package:hover {
      border-color: var(--os-border-strong);
    }

    .package code {
      color: var(--os-fg-default);
      font-weight: var(--os-font-weight-medium);
    }
  `,
})
export class Home {
  private readonly repo = 'https://github.com/openstuff-dev/design/tree/main/packages';
  protected readonly packages = [
    { name: '@openstuff-dev/tokens', text: 'A light and dark theme from one primary colour.' },
    { name: '@openstuff-dev/ui', text: 'The components as CSS, and helpers for native overlays.' },
    { name: '@openstuff-dev/ui-angular', text: 'Angular components that render that CSS.' },
    { name: '@openstuff-dev/lint', text: 'ESLint, Stylelint and Prettier, set up the same way.' },
    { name: '@openstuff-dev/nx', text: 'Generators for apps, servers, packages and components.' },
    { name: '@openstuff-dev/create-app', text: 'A new project in one command.' },
  ].map((pkg) => ({ ...pkg, href: `${this.repo}/${pkg.name.split('/')[1]}` }));
}
