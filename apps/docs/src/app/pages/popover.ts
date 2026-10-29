import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  PageHeader,
  Popover,
  PopoverTrigger,
  Toaster,
  Tooltip,
} from '@openstuff-dev/ui-angular';
import { Copy, EllipsisVertical, Link } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const POPOVER = `
  <div class="row">
    <button os-button type="button" [os-popover-trigger]="share">Share</button>
    <button os-button type="button" [os-popover-trigger]="above">Above</button>
  </div>
  <div os-popover #share="osPopover" aria-label="Share">
    Anyone in your organization with the link can view this project.
  </div>
  <div os-popover #above="osPopover" placement="top" aria-label="Details">
    Placed above its button.
  </div>
`;

@Component({
  selector: 'docs-popover-basic',
  imports: [Button, Popover, PopoverTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: POPOVER,
})
class Basic {}

const MENU = `
  <div class="end">
    <button os-icon-button type="button" label="Project actions" [os-popover-trigger]="actions">
      <svg os-icon [icon]="more"></svg>
    </button>
  </div>
  <div os-menu #actions="osPopover" align="end" aria-label="Project actions">
    <div os-menu-label>Design</div>
    <button os-menu-item type="button" (click)="toast('Renamed')">Rename</button>
    <button os-menu-item type="button" (click)="toast('Duplicated')">Duplicate</button>
    <hr os-menu-separator />
    <button os-menu-item type="button" tone="danger" (click)="toast('Deleted')">Delete</button>
  </div>
`;

@Component({
  selector: 'docs-menu-basic',
  imports: [Icon, IconButton, Menu, MenuItem, MenuLabel, MenuSeparator, PopoverTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: MENU,
  styles: `
    .end {
      display: flex;
      justify-content: end;
    }
  `,
})
class MenuExample {
  private readonly toaster = inject(Toaster);
  protected readonly more = EllipsisVertical;

  protected toast(message: string): void {
    this.toaster.show(message);
  }
}

const TOOLTIP = `
  <div class="row">
    <button os-icon-button type="button" label="Copy link" os-tooltip="Copy link">
      <svg os-icon [icon]="link"></svg>
    </button>
    <button os-icon-button type="button" label="Duplicate" os-tooltip="Duplicate" placement="bottom">
      <svg os-icon [icon]="copy"></svg>
    </button>
    <button os-button type="button" os-tooltip="Saves without publishing">Save draft</button>
  </div>
`;

@Component({
  selector: 'docs-tooltip-basic',
  imports: [Button, Icon, IconButton, Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TOOLTIP,
})
class TooltipExample {
  protected readonly link = Link;
  protected readonly copy = Copy;
}

@Component({
  selector: 'docs-popover-page',
  imports: [Basic, CodeBlock, Example, MenuExample, PageHeader, TooltipExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Popover, menu and tooltip"
      description="Built on the Popover API and CSS anchor positioning. Escape and a click outside close them."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="popover">
        <h2 id="popover">Popover</h2>
        <p>
          A trigger opens it next to itself. <code>placement</code> is <code>bottom</code> (the
          default), <code>top</code>, <code>start</code> or <code>end</code>; it flips when there's
          no room. Give it an <code>aria-label</code>.
        </p>
      </section>
      <docs-example [code]="popover"><docs-popover-basic /></docs-example>

      <section class="prose" aria-labelledby="menu">
        <h2 id="menu">Menu</h2>
        <p>
          Arrow keys, Home and End move through the items, and typing a letter jumps to an item.
          <code>align="end"</code> lines it up with a trigger at the end of a row.
        </p>
      </section>
      <docs-example [code]="menu"><docs-menu-basic /></docs-example>

      <section class="prose" aria-labelledby="tooltip">
        <h2 id="tooltip">Tooltip</h2>
        <p>
          Shows on hover and keyboard focus (<code>interestfor</code>). Keep it to a few words, and
          never put something only there: touch screens don't hover.
        </p>
      </section>
      <docs-example [code]="tooltip"><docs-tooltip-basic /></docs-example>
    </div>
  `,
})
export class PopoverPage {
  protected readonly popover = POPOVER;
  protected readonly menu = MENU;
  protected readonly tooltip = TOOLTIP;
  protected readonly usage = `import {
  Menu, MenuItem, MenuLabel, MenuSeparator, Popover, PopoverTrigger, Tooltip,
} from '@openstuff-dev/ui-angular';`;
}
