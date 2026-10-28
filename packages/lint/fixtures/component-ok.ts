import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'os-greeting',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (name()) {
      <p>Hello {{ name() }}</p>
    }
  `,
})
export class Greeting {
  readonly name = input('');
}
