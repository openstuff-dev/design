import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Button, EmptyState, Kbd, PageHeader, Skeleton } from '@openstuff-dev/ui-angular';
import { Inbox } from 'lucide';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const EMPTY = `
  <os-empty-state title="No proposals yet" [icon]="inbox" bordered>
    When an agent suggests a rule, it shows up here for you to review.
    <button os-button os-actions variant="primary" type="button">Write a rule</button>
  </os-empty-state>
`;

@Component({
  selector: 'docs-empty',
  imports: [Button, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: EMPTY,
})
class Empty {
  protected readonly inbox = Inbox;
}

const LOADING = `
  <div class="loading" [attr.aria-busy]="loading()">
    @if (loading()) {
      <os-skeleton shape="circle" />
      <os-skeleton [lines]="3" />
    } @else {
      <p>Kim approved 3 rules in Design.</p>
    }
  </div>
  <button os-button type="button" size="sm" (click)="loading.set(!loading())">
    {{ loading() ? 'Finish loading' : 'Load again' }}
  </button>
`;

@Component({
  selector: 'docs-loading',
  imports: [Button, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: LOADING,
  styles: `
    :host {
      display: grid;
      gap: var(--os-space-4);
      justify-items: start;
    }

    .loading {
      display: grid;
      grid-template-columns: 2.5rem minmax(0, 1fr);
      gap: var(--os-space-3);
      inline-size: 100%;
    }
  `,
})
class Loading {
  protected readonly loading = signal(true);
}

const KEYS = `
  <p>Press <kbd os-kbd>⌘</kbd> <kbd os-kbd>K</kbd> to search, or <kbd os-kbd>?</kbd> for shortcuts.</p>
`;

@Component({
  selector: 'docs-keys',
  imports: [Kbd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: KEYS,
})
class Keys {}

@Component({
  selector: 'docs-empty-state-page',
  imports: [CodeBlock, Empty, Example, Keys, Loading, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Empty state and skeleton"
      description="What a page shows before there's anything in it, and while it loads."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />

      <section class="prose" aria-labelledby="empty">
        <h2 id="empty">Empty state</h2>
        <p>
          Say what will show up here and how to get it there. <code>bordered</code> outlines it
          inside a page; <code>level</code> sets the title's heading level (3 by default).
        </p>
      </section>
      <docs-example [code]="empty"><docs-empty /></docs-example>

      <section class="prose" aria-labelledby="skeleton">
        <h2 id="skeleton">Skeleton</h2>
        <p>
          Skeletons are hidden from screen readers. Set <code>aria-busy</code> on the region that's
          loading, so they know to wait.
        </p>
      </section>
      <docs-example [code]="loading"><docs-loading /></docs-example>

      <section class="prose" aria-labelledby="kbd">
        <h2 id="kbd">Keyboard keys</h2>
      </section>
      <docs-example [code]="keys"><docs-keys /></docs-example>
    </div>
  `,
})
export class EmptyStatePage {
  protected readonly empty = EMPTY;
  protected readonly loading = LOADING;
  protected readonly keys = KEYS;
  protected readonly usage = `import { EmptyState, Kbd, Skeleton } from '@openstuff-dev/ui-angular';`;
}
