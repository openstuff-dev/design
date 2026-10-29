import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, EmptyState } from '@openstuff-dev/ui-angular';

@Component({
  selector: 'docs-not-found',
  imports: [Button, EmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <os-empty-state title="There's no page here" [level]="1">
      The link may be old. Every page is listed in the menu.
      <a os-button os-actions routerLink="/">Go to the introduction</a>
    </os-empty-state>
  `,
})
export class NotFound {}
