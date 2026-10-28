import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'os-greeting',
  changeDetection: ChangeDetectionStrategy.Default,
  template: `<p   *ngIf="name">Hello {{name}}</p>
<button (click)="name = ''">Clear</button>`,
})
export class Greeting {
  @Input() name = '';
}
