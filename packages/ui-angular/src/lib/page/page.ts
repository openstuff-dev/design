import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  Directive,
  input,
  numberAttribute,
} from '@angular/core';
import { uniqueId } from '../id';

/**
 * A page's content area, centred with a maximum width. It's a size container, so everything in
 * it adapts to the space the page gets, not to the window.
 *
 * ```html
 * <main os-page width="narrow">…</main>
 * ```
 */
@Directive({
  selector: '[os-page]',
  host: { class: 'os-page', '[attr.data-width]': 'width() === "default" ? null : width()' },
})
export class Page {
  readonly width = input<'default' | 'narrow' | 'full'>('default');
}

/**
 * The page's title, an optional description, and its main actions (projected content).
 *
 * ```html
 * <header os-page-header title="Projects" description="Everything your team works on.">
 *   <button os-button variant="primary">New project</button>
 * </header>
 * ```
 */
@Component({
  selector: 'header[os-page-header]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-page-header' },
  template: `
    <div>
      <h1 class="os-page-title">{{ title() }}</h1>
      @if (description()) {
        <p class="os-page-description">{{ description() }}</p>
      }
    </div>
    <div class="os-page-actions"><ng-content /></div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly description = input<string>();
}

/**
 * Where the page sits. Put an <ol> of links inside; mark the last item aria-current="page".
 *
 * ```html
 * <nav os-breadcrumbs>
 *   <ol>
 *     <li><a routerLink="/projects">Projects</a></li>
 *     <li><span aria-current="page">Design</span></li>
 *   </ol>
 * </nav>
 * ```
 */
@Directive({
  selector: 'nav[os-breadcrumbs]',
  host: { class: 'os-breadcrumbs', '[attr.aria-label]': 'label()' },
})
export class Breadcrumbs {
  readonly label = input('Breadcrumbs');
}

/**
 * A bordered section with an optional title, description and actions (`os-actions`).
 *
 * ```html
 * <section os-panel title="Members" description="People who can edit this project.">
 *   <button os-button os-actions size="sm">Invite</button>
 *   …
 * </section>
 * ```
 */
@Component({
  selector: '[os-panel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'os-panel', '[attr.aria-labelledby]': 'title() ? titleId : null' },
  template: `
    @if (title()) {
      <header class="os-panel-header">
        <div>
          <h2 role="heading" [attr.aria-level]="level()" [id]="titleId">{{ title() }}</h2>
          @if (description()) {
            <p>{{ description() }}</p>
          }
        </div>
        <ng-content select="[os-actions]" />
      </header>
    }
    <div class="os-panel-body" [attr.data-flush]="flush() ? '' : null"><ng-content /></div>
  `,
})
export class Panel {
  readonly title = input<string>();
  readonly description = input<string>();
  /** The title's heading level, to fit the page's outline. */
  readonly level = input(2, { transform: numberAttribute });
  /** No padding inside, for a table or list that runs edge to edge. */
  readonly flush = input(false, { transform: booleanAttribute });
  protected readonly titleId = uniqueId('panel-title');
}

/** A card. On an <a> or <button>, the whole card is clickable. */
@Directive({ selector: '[os-card]', host: { class: 'os-card' } })
export class Card {}

/** Lays out cards in as many columns as fit. */
@Directive({ selector: '[os-card-grid]', host: { class: 'os-card-grid' } })
export class CardGrid {}
