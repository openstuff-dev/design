import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button, PageHeader, Toaster } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';
import { dedent } from '../example/markup';

const TOASTS = `
  <div class="row">
    <button os-button type="button" (click)="saved()">Save</button>
    <button os-button type="button" (click)="deleted()">Delete with undo</button>
    <button os-button type="button" (click)="failed()">Fail</button>
  </div>
`;

const TOASTS_CODE = `${dedent(TOASTS)}

// In the component
private readonly toaster = inject(Toaster);

deleted() {
  this.toaster.show('Draft deleted', {
    action: { label: 'Undo', run: () => this.restore() },
  });
}`;

@Component({
  selector: 'docs-toasts',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TOASTS,
})
class Toasts {
  private readonly toaster = inject(Toaster);

  protected saved(): void {
    this.toaster.show('Saved your changes', { tone: 'success' });
  }

  protected deleted(): void {
    this.toaster.show('Draft deleted', {
      action: { label: 'Undo', run: () => this.toaster.show('Draft restored', { tone: 'success' }) },
    });
  }

  protected failed(): void {
    this.toaster.show('Couldn\'t save. Check your connection and try again.', { tone: 'danger' });
  }
}

@Component({
  selector: 'docs-toast-page',
  imports: [CodeBlock, Example, PageHeader, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Toast"
      description="A short message after something happened. It goes away on its own."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          Screen readers announce it (<code>role="status"</code>, or <code>alert</code> for
          <code>danger</code>). It stays 5 seconds, 10 with an action, and pauses while the pointer
          is on it. At most four show at once. Don't put anything only in a toast that people need
          later: use a callout for that.
        </p>
      </div>
      <docs-example [code]="toasts"><docs-toasts /></docs-example>
    </div>
  `,
})
export class ToastPage {
  protected readonly toasts = TOASTS_CODE;
  protected readonly usage = `import { Toaster } from '@openstuff-dev/ui-angular';`;
}
