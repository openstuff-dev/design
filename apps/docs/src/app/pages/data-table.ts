import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Badge,
  Cell,
  DataTable,
  PageHeader,
  StatGrid,
  StatTile,
  type Column,
} from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';
import { dedent } from '../example/markup';

interface Project {
  id: string;
  name: string;
  owner: string;
  status: 'Live' | 'Draft';
  rules: number;
}

const TABLE = `
  <os-data-table caption="Projects" [columns]="columns" [rows]="projects" rowKey="id">
    <ng-template os-cell="name" let-project>
      <a href="#table">{{ project.name }}</a>
    </ng-template>
    <ng-template os-cell="status" let-project>
      <span os-badge [tone]="project.status === 'Live' ? 'success' : 'neutral'">{{ project.status }}</span>
    </ng-template>
  </os-data-table>
`;

const TABLE_CODE = `${dedent(TABLE)}

// In the component
protected readonly columns: Column<Project>[] = [
  { key: 'name', label: 'Project' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'rules', label: 'Rules', align: 'end' },
];`;

@Component({
  selector: 'docs-table-example',
  imports: [Badge, Cell, DataTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TABLE,
})
class TableExample {
  protected readonly columns: Column<Project>[] = [
    { key: 'name', label: 'Project' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status' },
    { key: 'rules', label: 'Rules', align: 'end' },
  ];

  protected readonly projects: Project[] = [
    { id: 'design', name: 'Design', owner: 'Kim', status: 'Live', rules: 12 },
    { id: 'op', name: 'OpenPurpose', owner: 'Alex', status: 'Live', rules: 36 },
    { id: 'billing', name: 'Billing', owner: 'Sam', status: 'Draft', rules: 8 },
  ];
}

const STATS = `
  <div os-stat-grid>
    <os-stat-tile label="Requests today" value="1,284" hint="+12% on yesterday" tone="success" />
    <os-stat-tile label="Open findings" value="6" hint="2 need a decision" tone="warning" />
    <os-stat-tile label="Projects" [value]="3" />
  </div>
`;

@Component({
  selector: 'docs-stats-example',
  imports: [StatGrid, StatTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: STATS,
})
class StatsExample {}

@Component({
  selector: 'docs-data-table-page',
  imports: [CodeBlock, Example, PageHeader, StatsExample, TableExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Data table and stat tile"
      description="Rows of records, and the few numbers that matter most."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="table">
        <h2 id="table">Data table</h2>
        <p>
          A real <code>&lt;table&gt;</code> with a caption. Columns show a property by default; an
          <code>os-cell</code> template renders it your way. In a narrow container each row becomes
          a stack of label and value: drag the corner to see it.
        </p>
      </section>
      <docs-example [code]="table"><docs-table-example /></docs-example>

      <section class="prose" aria-labelledby="stats">
        <h2 id="stats">Stat tile</h2>
        <p>
          A number, what it counts, and a hint about what changed. The grid fits as many as there's
          room for.
        </p>
      </section>
      <docs-example [code]="stats"><docs-stats-example /></docs-example>
    </div>
  `,
})
export class DataTablePage {
  protected readonly table = TABLE_CODE;
  protected readonly stats = STATS;
  protected readonly usage = `import {
  Cell, DataTable, StatGrid, StatTile, type Column,
} from '@openstuff-dev/ui-angular';`;
}
