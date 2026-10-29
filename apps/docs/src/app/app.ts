import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  Button,
  DialogBody,
  DialogClose,
  DialogHeader,
  DialogTitle,
  Drawer,
  Icon,
  IconButton,
  Page,
} from '@openstuff-dev/ui-angular';
import { ExternalLink, Menu as MenuIcon, X } from 'lucide';
import { filter } from 'rxjs';
import { GROUPS, PAGES } from './pages';
import { ThemePicker } from './theme-picker';

@Component({
  selector: 'docs-root',
  imports: [
    NgTemplateOutlet, RouterOutlet, RouterLink, RouterLinkActive, Button, DialogBody, DialogClose,
    DialogHeader, DialogTitle, Drawer, Icon, IconButton, Page, ThemePicker,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.layout.css',
  template: `
    <a class="skip-link" href="#content">Skip to content</a>
    <header class="topbar">
      <button
        os-icon-button
        class="menu-button"
        type="button"
        variant="ghost"
        label="Pages"
        (click)="navOpen.set(true)"
      >
        <svg os-icon [icon]="menuIcon"></svg>
      </button>
      <a class="brand" routerLink="/">
        <span class="brand-mark" aria-hidden="true"></span>
        OpenStuff <span class="brand-light">Design</span>
      </a>
      <div class="topbar-actions">
        <docs-theme-picker />
        <a
          os-button
          variant="ghost"
          size="sm"
          href="https://github.com/openstuff-dev/design"
          target="_blank"
          rel="noopener"
        >
          GitHub <svg os-icon size="sm" [icon]="externalIcon"></svg>
        </a>
      </div>
    </header>

    <div class="layout">
      <nav class="sidebar" aria-label="Pages">
        <ng-container [ngTemplateOutlet]="nav" />
      </nav>
      <main id="content" os-page tabindex="-1">
        <router-outlet />
      </main>
    </div>

    <dialog os-drawer side="start" aria-label="Pages" [(open)]="navOpen">
      <header os-dialog-header>
        <h2 os-dialog-title>Pages</h2>
        <button os-icon-button os-dialog-close type="button" variant="ghost" label="Close">
          <svg os-icon [icon]="closeIcon"></svg>
        </button>
      </header>
      <div os-dialog-body>
        <ng-container [ngTemplateOutlet]="nav" />
      </div>
    </dialog>

    <ng-template #nav>
      @for (group of groups; track group) {
        <section class="nav-group">
          <h2 class="nav-heading">{{ group.name }}</h2>
          <ul role="list">
            @for (page of group.pages; track page.path) {
              <li>
                <a
                  class="nav-link"
                  [routerLink]="'/' + page.path"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  [routerLinkActiveOptions]="{ exact: true }"
                  >{{ page.title }}</a
                >
              </li>
            }
          </ul>
        </section>
      }
    </ng-template>
  `,
})
export class App {
  protected readonly menuIcon = MenuIcon;
  protected readonly closeIcon = X;
  protected readonly externalIcon = ExternalLink;
  protected readonly navOpen = signal(false);
  protected readonly groups = GROUPS.map((name) => ({
    name,
    pages: PAGES.filter((page) => page.group === name),
  }));

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.navOpen.set(false);
      });
  }
}
