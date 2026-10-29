import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Button,
  CommandPalette,
  Icon,
  Kbd,
  PageHeader,
  Toaster,
  type Command,
} from '@openstuff-dev/ui-angular';
import { FilePlus, Inbox, Search, Settings } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const PALETTE = `
  <button os-button type="button" (click)="open.set(true)">
    <svg os-icon [icon]="search"></svg> Search <kbd os-kbd>Ctrl K</kbd>
  </button>
  <os-command-palette [(open)]="open" [commands]="commands" (run)="ran($event)" />
`;

@Component({
  selector: 'docs-palette',
  imports: [Button, CommandPalette, Icon, Kbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.control.k)': 'openFromKey($event)' },
  template: PALETTE,
})
class Palette {
  private readonly toaster = inject(Toaster);
  protected readonly search = Search;
  protected readonly open = signal(false);
  protected readonly commands: Command[] = [
    { id: 'inbox', label: 'Inbox', group: 'Pages', icon: Inbox },
    { id: 'findings', label: 'Findings', group: 'Pages', keywords: ['bugs', 'issues'] },
    { id: 'settings', label: 'Settings', group: 'Pages', icon: Settings },
    { id: 'new', label: 'New project', group: 'Actions', hint: 'N', icon: FilePlus },
    { id: 'invite', label: 'Invite a member', group: 'Actions' },
  ];

  protected ran(command: Command): void {
    this.toaster.show(`Ran “${command.label}”`);
  }

  protected openFromKey(event: Event): void {
    event.preventDefault();
    this.open.set(true);
  }
}

@Component({
  selector: 'docs-command-palette-page',
  imports: [CodeBlock, Example, PageHeader, Palette],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Command palette"
      description="Search pages and actions from anywhere, with the keyboard."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          Every word typed has to start a word of the label or its <code>keywords</code>: “new pro”
          finds “New project”, “bugs” finds “Findings”. Arrow keys move, Enter runs, Escape closes.
          Commands with the same <code>group</code> are listed together.
        </p>
        <p>Try it with <kbd>Ctrl</kbd> <kbd>K</kbd> on this page.</p>
      </div>
      <docs-example [code]="palette"><docs-palette /></docs-example>
    </div>
  `,
})
export class CommandPalettePage {
  protected readonly palette = PALETTE;
  protected readonly usage = `import { CommandPalette, type Command } from '@openstuff-dev/ui-angular';

protected readonly commands: Command[] = [
  { id: 'inbox', label: 'Inbox', group: 'Pages', icon: Inbox },
  { id: 'new', label: 'New project', group: 'Actions', hint: 'N' },
];`;
}
