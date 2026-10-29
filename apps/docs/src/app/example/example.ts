import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { SegmentedControl, type SegmentOption } from '@openstuff-dev/ui-angular';
import { CodeBlock } from './code-block';
import { dedent, toMarkup } from './markup';

type View = 'angular' | 'html';

/**
 * A live example: the component in a container you can resize (so its container queries show),
 * and its code as an Angular template and as the plain HTML it renders.
 */
@Component({
  selector: 'docs-example',
  imports: [CodeBlock, SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './example.css',
  template: `
    <figure class="example" [attr.aria-label]="label()">
      <div class="stage" #stage [class.padded]="!flush()">
        <div class="frame" #frame><ng-content /></div>
      </div>
      <div class="toolbar">
        <os-segmented-control label="Code" size="sm" [options]="views" [(value)]="view" />
        <span class="width" aria-live="polite">
          @if (resized()) {
            {{ width() }} px wide ·
            <button type="button" class="reset" (click)="resetWidth()">Reset</button>
          } @else {
            <span class="hint">Drag the corner to resize</span>
          }
        </span>
      </div>
      <docs-code [code]="shown()" [language]="view() === 'angular' ? 'Angular' : 'HTML'" />
    </figure>
  `,
})
export class Example {
  /** The example's Angular template, usually the same string the example component uses. */
  readonly code = input.required<string>();
  readonly label = input<string>();
  /** No padding around the preview, for page-sized examples. */
  readonly flush = input(false);

  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');

  protected readonly views: SegmentOption<View>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'html', label: 'HTML' },
  ];

  protected readonly view = signal<View>('angular');
  protected readonly width = signal(0);
  protected readonly resized = signal(false);
  private readonly html = signal('');
  private fullWidth = 0;

  protected readonly shown = computed(() =>
    this.view() === 'angular' ? dedent(this.code()) : this.html(),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const frame = this.frame().nativeElement;
      const stage = this.stage().nativeElement;
      const update = () => {
        this.html.set(toMarkup(frame));
      };
      update();
      // Keeps the HTML current when the example changes, e.g. a toggled switch or an open menu.
      const mutations = new MutationObserver(update);
      mutations.observe(frame, { subtree: true, childList: true, attributes: true });
      const resize = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.borderBoxSize[0].inlineSize);
        this.width.set(width);
        if (!stage.style.width) this.fullWidth = width;
        this.resized.set(Boolean(stage.style.width) && width !== this.fullWidth);
      });
      resize.observe(stage);
      destroyRef.onDestroy(() => {
        mutations.disconnect();
        resize.disconnect();
      });
    });
  }

  protected resetWidth(): void {
    this.stage().nativeElement.style.removeProperty('width');
    this.resized.set(false);
  }
}
