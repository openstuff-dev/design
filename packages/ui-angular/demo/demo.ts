import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { iconSearch, iconX } from '@openstuff-dev/ui';
import {
  Badge,
  Button,
  Callout,
  Cell,
  Chip,
  CommandPalette,
  ConfirmDialog,
  Control,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  EmptyState,
  Field,
  FormActions,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Page,
  PageHeader,
  Panel,
  Popover,
  PopoverTrigger,
  SegmentedControl,
  SettingCard,
  SettingCardFooter,
  SettingRow,
  StatTile,
  StatusDot,
  Switch,
  Tab,
  Tabs,
  Toaster,
  Tooltip,
  type Column,
  type Command,
} from '../src/index';

interface Project {
  id: string;
  name: string;
  owner: string;
  rules: number;
}

/** Every Angular component on one page, to try them in a real browser. */
@Component({
  selector: 'os-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Badge, Button, Callout, Cell, Chip, CommandPalette, Control, DataTable, Dialog, DialogBody,
    DialogClose, DialogFooter, DialogHeader, DialogTitle, Drawer, EmptyState, Field, FormActions,
    Icon, IconButton, Menu, MenuItem, MenuSeparator, Page, PageHeader, Panel, Popover,
    PopoverTrigger, SegmentedControl, SettingCard, SettingCardFooter, SettingRow, StatTile,
    StatusDot, Switch, Tab, Tabs, Tooltip,
  ],
  host: { '(document:keydown.control.k)': 'openPalette($event)' },
  template: `
    <main os-page>
      <header os-page-header title="Angular components" description="The same CSS, with behaviour.">
        <button os-button type="button" (click)="palette.set(true)">
          <svg os-icon [icon]="iconSearch"></svg> Search
        </button>
        <button os-button type="button" variant="primary" (click)="dialog.set(true)">
          New project
        </button>
      </header>

      <section os-panel title="Primitives">
        <div class="row">
          <span os-badge tone="success">Live</span>
          <span os-chip removable (removed)="toast('Removed web/**')">web/**</span>
          <span os-status-dot tone="warning" pulse>Deploying</span>
          <button os-button type="button" [loading]="saving()" (click)="save()">Save</button>
          <button os-icon-button type="button" label="Close" os-tooltip="Close">
            <svg os-icon [icon]="iconX"></svg>
          </button>
          <button os-button type="button" os-tooltip="Saves a draft">Draft</button>
          <os-segmented-control label="View" [options]="views" [(value)]="view" />
        </div>
      </section>

      <os-callout tone="warning" title="Read-only"
        >You can view this project but not change it.</os-callout
      >

      <section os-panel title="Overlays">
        <div class="row">
          <button os-button type="button" (click)="drawer.set(true)">Drawer</button>
          <button os-button type="button" (click)="confirmDelete()">Delete…</button>
          <button os-button type="button" [os-popover-trigger]="actions">Actions</button>
          <button os-button type="button" [os-popover-trigger]="share">Share</button>
          <button os-button type="button" (click)="toast('Saved your changes')">Toast</button>
        </div>
        <div os-menu #actions="osPopover" aria-label="Actions">
          <button os-menu-item type="button" (click)="toast('Renamed')">Rename</button>
          <button os-menu-item type="button" (click)="toast('Duplicated')">Duplicate</button>
          <hr os-menu-separator />
          <button os-menu-item type="button" tone="danger" (click)="confirmDelete()">Delete</button>
        </div>
        <div os-popover #share="osPopover" aria-label="Share">Anyone with the link can view.</div>
      </section>

      <os-tabs label="Project">
        <ng-template os-tab="overview" label="Overview">
          <div class="os-stat-grid">
            <os-stat-tile
              label="Requests today"
              value="1,284"
              hint="+12% on yesterday"
              tone="success"
            />
            <os-stat-tile label="Open findings" value="6" hint="2 need a decision" tone="warning" />
          </div>
        </ng-template>
        <ng-template os-tab="projects" label="Projects">
          <os-data-table caption="Projects" [columns]="columns" [rows]="projects" rowKey="id">
            <ng-template os-cell="name" let-project>
              <a href="#">{{ project.name }}</a>
            </ng-template>
          </os-data-table>
        </ng-template>
        <ng-template os-tab="empty" label="Proposals">
          <os-empty-state title="No proposals yet" bordered>
            When an agent suggests a rule, it shows up here.
          </os-empty-state>
        </ng-template>
      </os-tabs>

      <section os-setting-card title="Profile" description="How others see you.">
        <os-setting-row label="Name" description="Shown to your team.">
          <input os-input value="Design" />
        </os-setting-row>
        <os-setting-row label="Agent mode" description="Shows what agents read." inline>
          <input type="checkbox" os-switch checked />
        </os-setting-row>
        <footer os-setting-card-footer>
          <div os-form-actions>
            <button os-button type="button">Cancel</button>
            <button os-button type="button" variant="primary">Save</button>
          </div>
        </footer>
      </section>
    </main>

    <dialog os-dialog [(open)]="dialog">
      <header os-dialog-header><h2 os-dialog-title>New project</h2></header>
      <div os-dialog-body>
        <os-field label="Name" hint="Up to 40 characters."><input os-input /></os-field>
      </div>
      <footer os-dialog-footer>
        <button os-button os-dialog-close type="button">Cancel</button>
        <button os-button type="button" variant="primary" (click)="dialog.set(false)">
          Create
        </button>
      </footer>
    </dialog>

    <dialog os-drawer [(open)]="drawer">
      <header os-dialog-header>
        <h2 os-dialog-title>Finding</h2>
        <button os-icon-button os-dialog-close type="button" variant="ghost" label="Close">
          <svg os-icon [icon]="iconX"></svg>
        </button>
      </header>
      <div os-dialog-body><p>Buttons are 118 hand-written class combinations.</p></div>
    </dialog>

    <os-command-palette
      [(open)]="palette"
      [commands]="commands"
      (run)="toast('Ran ' + $event.label)"
    />
  `,
})
export class Demo {
  private readonly toaster = inject(Toaster);
  private readonly confirmer = inject(ConfirmDialog);

  protected readonly iconSearch = iconSearch;
  protected readonly iconX = iconX;
  protected readonly dialog = signal(false);
  protected readonly drawer = signal(false);
  protected readonly palette = signal(false);
  protected readonly saving = signal(false);
  protected readonly view = signal('list');
  protected readonly views = [
    { value: 'list', label: 'List' },
    { value: 'grid', label: 'Grid' },
  ];

  protected readonly columns: Column<Project>[] = [
    { key: 'name', label: 'Project' },
    { key: 'owner', label: 'Owner' },
    { key: 'rules', label: 'Rules', align: 'end' },
  ];

  protected readonly projects: Project[] = [
    { id: 'design', name: 'Design', owner: 'Kim', rules: 12 },
    { id: 'op', name: 'OpenPurpose', owner: 'Alex', rules: 36 },
  ];

  protected readonly commands: Command[] = [
    { id: 'inbox', label: 'Inbox', group: 'Pages' },
    { id: 'findings', label: 'Findings', group: 'Pages', keywords: ['bugs'] },
    { id: 'new', label: 'New project', group: 'Actions', hint: 'N' },
  ];

  protected toast(message: string): void {
    this.toaster.show(message, { tone: 'success' });
  }

  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toast('Saved');
    }, 1500);
  }

  protected async confirmDelete(): Promise<void> {
    const confirmed = await this.confirmer.confirm({
      title: 'Delete project?',
      message: 'Its rules and history are deleted. You can\'t undo this.',
      confirmLabel: 'Delete project',
      danger: true,
    });
    if (confirmed) this.toaster.show('Project deleted', { tone: 'danger' });
  }

  protected openPalette(event: Event): void {
    event.preventDefault();
    this.palette.set(true);
  }
}
