import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Breadcrumbs,
  Button,
  Card,
  CardGrid,
  Page,
  PageHeader,
  Panel,
} from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const PAGE = `
  <div os-page>
    <nav os-breadcrumbs>
      <ol>
        <li><a href="#page">OpenStuff</a></li>
        <li><span aria-current="page">Projects</span></li>
      </ol>
    </nav>
    <header os-page-header title="Projects" description="Everything your team works on.">
      <button os-button type="button">Import</button>
      <button os-button type="button" variant="primary">New project</button>
    </header>
    <section os-panel title="Members" description="People who can edit these projects." [level]="2">
      <button os-button os-actions type="button" size="sm">Invite</button>
      <p>Kim, Alex and 4 others.</p>
    </section>
    <div os-card-grid>
      <a os-card href="#page"><strong>Design</strong> <span>12 rules</span></a>
      <a os-card href="#page"><strong>OpenPurpose</strong> <span>36 rules</span></a>
      <a os-card href="#page"><strong>Billing</strong> <span>8 rules</span></a>
    </div>
  </div>
`;

@Component({
  selector: 'docs-page-example',
  imports: [Breadcrumbs, Button, Card, CardGrid, Page, PageHeader, Panel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: PAGE,
})
class PageExample {}

@Component({
  selector: 'docs-page-layout-page',
  imports: [CodeBlock, Example, PageExample, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Page, header and panel"
      description="The frame of a page: where it sits, what it's called and its main actions."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          <code>os-page</code> centres the content (72rem wide, or <code>width="narrow"</code> for
          forms) and is a size container: drag the corner below and the header's actions move under
          the title, and the cards drop to one column. Put it on the page's
          <code>&lt;main&gt;</code>.
        </p>
        <p>
          The header's title is the page's <code>h1</code>. Panels group a section with a title, a
          description and actions marked <code>os-actions</code>; set <code>level</code> to fit the
          page's outline. A card on an <code>&lt;a&gt;</code> or <code>&lt;button&gt;</code>
          is clickable as a whole.
        </p>
      </div>
      <docs-example [code]="page" [flush]="true"><docs-page-example /></docs-example>
    </div>
  `,
})
export class PageLayoutPage {
  protected readonly page = PAGE;
  protected readonly usage = `import {
  Breadcrumbs, Card, CardGrid, Page, PageHeader, Panel,
} from '@openstuff-dev/ui-angular';`;
}
