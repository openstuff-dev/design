import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { accessibleName, query, render } from '../testing';
import { Cell, DataTable, StatTile, type Column } from './data-table';

interface Project {
  id: string;
  name: string;
  owner: string;
  rules: number;
}

@Component({
  imports: [Cell, DataTable, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-data-table caption="Projects" [columns]="columns" [rows]="rows()" rowKey="id">
      <ng-template os-cell="name" let-project>
        <a [href]="'/projects/' + project.id">{{ project.name }}</a>
      </ng-template>
    </os-data-table>
    <os-stat-tile label="Open findings" value="6" hint="2 need a decision" tone="warning" />
  `,
})
class Host {
  readonly columns: Column<Project>[] = [
    { key: 'name', label: 'Project' },
    { key: 'owner', label: 'Owner' },
    { key: 'rules', label: 'Rules', align: 'end' },
  ];

  readonly rows = signal<Project[]>([
    { id: 'design', name: 'Design', owner: 'Kim', rules: 12 },
    { id: 'op', name: 'OpenPurpose', owner: 'Alex', rules: 36 },
  ]);
}

describe('DataTable and StatTile', () => {
  it('names the table by its caption and keeps table roles for the stacked layout', async () => {
    const { root } = await render(Host);
    const table = query(root, 'table', HTMLTableElement);
    expect(accessibleName(table)).toBe('Projects');
    expect(table.getAttribute('role')).toBe('table');
    const headers = [...root.querySelectorAll('[role="columnheader"]')].map((th) => th.textContent.trim());
    expect(headers).toEqual(['Project', 'Owner', 'Rules']);
    const cells = [...root.querySelectorAll('tbody tr:first-child [role="cell"]')];
    expect(cells.map((td) => td.getAttribute('data-label'))).toEqual(['Project', 'Owner', 'Rules']);
    expect(cells.map((td) => td.textContent.trim())).toEqual(['Design', 'Kim', '12']);
    expect(cells[2].getAttribute('data-align')).toBe('end');
  });

  it('puts the row links in the tab order, and says when there are no rows', async () => {
    const { fixture, host, root } = await render(Host);
    const links = [...root.querySelectorAll('a')];
    expect(links.map((link) => accessibleName(link))).toEqual(['Design', 'OpenPurpose']);
    links[0].focus();
    expect(document.activeElement).toBe(links[0]);

    host.rows.set([]);
    await fixture.whenStable();
    expect(query(root, '.os-data-table-empty', HTMLElement).textContent.trim()).toBe('Nothing here yet.');
  });

  it('shows a stat with its label and toned hint', async () => {
    const { root } = await render(Host);
    const tile = query(root, 'os-stat-tile', HTMLElement);
    const parts = [...tile.children].map((part) => part.textContent.trim());
    expect(parts).toEqual(['Open findings', '6', '2 need a decision']);
    expect(query(tile, '.os-stat-hint', HTMLElement).dataset['tone']).toBe('warning');
  });
});
