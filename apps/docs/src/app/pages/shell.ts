import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, NavLink, PageHeader } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const SHELL = `
  <div class="os-shell" [attr.data-open]="open() ? '' : null" style="--os-shell-height: 24rem">
    <nav class="os-shell-sidebar" id="shell-sidebar" aria-label="Main">
      <a class="os-shell-brand" href="#shell">OpenLedger</a>
      <a os-nav-link href="#shell" aria-current="page">Overview</a>
      <a os-nav-link href="#shell" [count]="3">Invoices</a>
    </nav>
    <div class="os-shell-content">
      <header class="os-shell-topbar">
        <button
          os-button
          size="sm"
          class="os-shell-menu"
          type="button"
          aria-controls="shell-sidebar"
          [attr.aria-expanded]="open()"
          (click)="open.set(!open())"
        >
          Menu
        </button>
        <button os-button size="sm" type="button">Search</button>
      </header>
      <main class="os-page">
        <header os-page-header title="Overview" description="The topbar's line runs on under the logo."></header>
      </main>
    </div>
  </div>
`;

@Component({
  selector: 'docs-shell-example',
  imports: [Button, NavLink, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SHELL,
})
class ShellExample {
  protected readonly open = signal(false);
}

@Component({
  selector: 'docs-shell-page',
  imports: [CodeBlock, Example, ShellExample, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="App shell"
      description="The frame around every page: a sidebar with the logo, and a topbar."
    ></header>

    <div class="stack">
      <docs-code boxed language="CSS" [code]="usage" />
      <div class="prose">
        <p>
          The logo sits in <code>os-shell-brand</code>, a row exactly as tall as the topbar with the
          same bottom border. Together they draw one line across the window, so the logo looks like
          it belongs to the bar. Keep that line unbroken in every OpenStuff app: don't pad the brand
          row or give the topbar a different height. To change both, set
          <code>--os-shell-bar-height</code> on <code>os-shell</code>.
        </p>
        <p>
          The shell is a size container. Below 52rem the sidebar becomes a drawer: show it with
          <code>data-open</code> on <code>os-shell</code>, and let the button with
          <code>os-shell-menu</code> (hidden on wide screens) toggle it. Drag the corner below to
          try it.
        </p>
        <p>
          Sidebar links are <code>a[os-nav-link]</code>, with an optional <code>icon</code> and
          <code>count</code>. They look the same as the Settings menu's links. Add the router's
          <code>routerLinkActive ariaCurrentWhenActive="page"</code> to mark the current page.
        </p>
      </div>
      <docs-example [code]="shell" [flush]="true"><docs-shell-example /></docs-example>
    </div>
  `,
})
export class ShellPage {
  protected readonly shell = SHELL;
  protected readonly usage = `@import '@openstuff-dev/ui/ui.css'; /* includes shell.css */`;
}
