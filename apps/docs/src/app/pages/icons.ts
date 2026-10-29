import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  iconCheck,
  iconCircleAlert,
  iconCircleCheck,
  iconInfo,
  iconSearch,
  iconTriangleAlert,
  iconX,
} from '@openstuff-dev/ui';
import { Icon, PageHeader } from '@openstuff-dev/ui-angular';
import { ArrowRight, Bell } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const SIZES = `
  <div class="row">
    <svg os-icon size="sm" [icon]="bell"></svg>
    <svg os-icon [icon]="bell"></svg>
    <svg os-icon size="lg" [icon]="bell"></svg>
    <svg os-icon [icon]="arrow" [flipInRtl]="true"></svg>
  </div>
`;

@Component({
  selector: 'docs-icon-sizes',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: SIZES,
})
class Sizes {
  protected readonly bell = Bell;
  protected readonly arrow = ArrowRight;
}

@Component({
  selector: 'docs-icons',
  imports: [CodeBlock, Example, Icon, PageHeader, Sizes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Icons"
      description="Lucide icons, drawn with the current text colour and sized to the text around them."
    ></header>

    <div class="stack">
      <div class="prose">
        <p>
          Pass any icon from <code>lucide</code> to <code>svg[os-icon]</code>. Icons are decorative
          and hidden from screen readers: the button or text next to them says what they mean.
        </p>
      </div>
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="sizes">
        <h2 id="sizes">Sizes</h2>
        <p>
          <code>sm</code>, <code>md</code> (the default) and <code>lg</code>. Arrows can flip in
          right-to-left pages.
        </p>
      </section>
      <docs-example [code]="sizes"><docs-icon-sizes /></docs-example>

      <section class="prose" aria-labelledby="built-in">
        <h2 id="built-in">Built in</h2>
        <p>
          <code>&#64;openstuff-dev/ui</code> ships the few icons its own components use, so it
          doesn't depend on <code>lucide</code>. Without Angular,
          <code>createIcon(node)</code> returns the <code>&lt;svg&gt;</code>.
        </p>
      </section>
      <ul class="grid" role="list">
        @for (icon of builtIn; track icon.name) {
          <li class="cell">
            <svg os-icon size="lg" [icon]="icon.node"></svg>
            <code>{{ icon.name }}</code>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
      gap: var(--os-space-3);
    }

    .cell {
      display: grid;
      gap: var(--os-space-2);
      justify-items: center;
      padding: var(--os-space-4);
      border: 1px solid var(--os-border-default);
      border-radius: var(--os-radius-lg);
      font-size: var(--os-text-xs);
    }
  `,
})
export class Icons {
  protected readonly sizes = SIZES;
  protected readonly builtIn = [
    { name: 'iconCheck', node: iconCheck },
    { name: 'iconX', node: iconX },
    { name: 'iconSearch', node: iconSearch },
    { name: 'iconInfo', node: iconInfo },
    { name: 'iconCircleAlert', node: iconCircleAlert },
    { name: 'iconCircleCheck', node: iconCircleCheck },
    { name: 'iconTriangleAlert', node: iconTriangleAlert },
  ];

  protected readonly usage = `import { Icon } from '@openstuff-dev/ui-angular';
import { Folder } from 'lucide';

@Component({
  imports: [Icon],
  template: '<svg os-icon [icon]="folder"></svg> Projects',
})
export class Nav {
  protected readonly folder = Folder;
}`;
}
