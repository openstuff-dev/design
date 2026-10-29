import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageHeader } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';

@Component({
  selector: 'docs-getting-started',
  imports: [CodeBlock, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Getting started"
      description="Start a new project in one command, or add the toolkit to an app you already have."
    ></header>

    <div class="stack">
      <section class="prose" aria-labelledby="new">
        <h2 id="new">Start a new project</h2>
        <p>
          It asks for a name, what you're building (a web app and server, a web app or a package)
          and a primary colour. You get an Nx workspace with the toolkit, lint, CI, a Dockerfile, an
          MIT licence and instructions for coding agents.
        </p>
      </section>
      <docs-code boxed language="shell" [code]="create" />
      <div class="prose">
        <p>
          Older projects catch up with new defaults through
          <code>npx nx g &#64;openstuff-dev/nx:sync</code>. It adds what's missing and lists the
          files you changed instead of overwriting them.
        </p>
      </div>

      <section class="prose" aria-labelledby="existing">
        <h2 id="existing">Add it to an Angular app</h2>
        <p>1. Install the packages:</p>
      </section>
      <docs-code boxed language="shell" [code]="install" />
      <div class="prose">
        <p>
          2. Put your colour in <code>tokens.config.json</code> and run
          <code>npx os-tokens</code> before every build. It writes <code>tokens.css</code>, typed
          <code>tokens.js</code> and <code>tokens.json</code> (design tokens for other tools).
        </p>
      </div>
      <docs-code boxed language="JSON" [code]="config" />
      <div class="prose"><p>3. Import the CSS and then your theme, in this order:</p></div>
      <docs-code boxed language="CSS" [code]="css" />
      <div class="prose">
        <p>4. Load the polyfills before the app starts. Browsers that don't need them skip it.</p>
      </div>
      <docs-code boxed language="TypeScript" [code]="main" />
      <div class="prose">
        <p>5. Import each component where you use it:</p>
      </div>
      <docs-code boxed language="TypeScript" [code]="component" />

      <section class="prose" aria-labelledby="css-only">
        <h2 id="css-only">Without Angular</h2>
        <p>
          <code>&#64;openstuff-dev/ui</code> is plain CSS. Every example on this site has an
          <strong>HTML</strong> tab with the markup to write. Dialogs, menus and tooltips work
          through <code>commandfor</code>, <code>popovertarget</code> and <code>interestfor</code>;
          keyboard handling beyond that is yours to add.
        </p>
      </section>

      <section class="prose" aria-labelledby="lint">
        <h2 id="lint">Lint like the other projects</h2>
      </section>
      <docs-code boxed language="JavaScript" [code]="lint" />
    </div>
  `,
})
export class GettingStarted {
  protected readonly create = `npm create @openstuff-dev/app my-app
cd my-app
npx nx serve web`;

  protected readonly install = `npm i @openstuff-dev/ui @openstuff-dev/ui-angular @openstuff-dev/tokens @angular/aria @angular/cdk`;

  protected readonly config = `{
  "primaryColor": "#2d5bff",
  "outDir": "src/tokens"
}`;

  protected readonly css = `/* styles.css */
@import '@openstuff-dev/ui/ui.css';
@import './tokens/tokens.css' layer(os.tokens);`;

  protected readonly main = `// main.ts
import { loadPolyfills } from '@openstuff-dev/ui/polyfills';

await loadPolyfills();
await bootstrapApplication(App, appConfig);`;

  protected readonly component = `import { Button, Field, Control } from '@openstuff-dev/ui-angular';

@Component({
  imports: [Button, Field, Control],
  template: \`
    <os-field label="Name"><input os-input /></os-field>
    <button os-button variant="primary">Save</button>
  \`,
})
export class Profile {}`;

  protected readonly lint = `// eslint.config.mjs
export { default } from '@openstuff-dev/lint/eslint/angular';

// stylelint.config.mjs
export default { extends: ['@openstuff-dev/lint/stylelint'] };

// package.json
"prettier": "@openstuff-dev/lint/prettier"`;
}
