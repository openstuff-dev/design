import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computeAccessibleDescription, computeAccessibleName } from 'dom-accessibility-api';

/** The accessible name a screen reader announces for an element. */
export function accessibleName(element: Element): string {
  return computeAccessibleName(element);
}

/** The accessible description (from aria-describedby) of an element. */
export function accessibleDescription(element: Element): string {
  return computeAccessibleDescription(element);
}

/** The first element matching `selector`, checked to be a `type`. Fails the test otherwise. */
export function query<T extends Element>(
  root: ParentNode,
  selector: string,
  type: abstract new () => T,
): T {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`No ${type.name} matches ${selector}`);
  return element;
}

/** Dispatches a keydown, as a person pressing a key would, and returns the event. */
export function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

/** Renders a test host component and waits until it's stable. */
export async function render<T>(component: Type<T>) {
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}
