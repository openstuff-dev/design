import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CopyButton } from '../copy/copy-button';
import { uniqueId } from '../id';

/**
 * The group names to create in OpenAnnounce, so a message can be aimed at one tenant, one role,
 * or one role in one tenant. Put it inside the OpenAnnounce `os-server-connection-card`. The app
 * passes the names, such as `announceGroups(tenant, role)` from `@openstuff-dev/server` for each
 * tenant and role; one button copies them all, one per line.
 *
 * ```html
 * <os-server-connection-card [connection]="announce" [client]="client">
 *   <os-announce-groups [groups]="groups()" />
 * </os-server-connection-card>
 * ```
 */
@Component({
  selector: 'os-announce-groups',
  imports: [CopyButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="os-announce-groups" [attr.aria-labelledby]="titleId">
      <div class="os-announce-groups-head">
        <p class="os-announce-groups-title" [id]="titleId">Groups to create in OpenAnnounce</p>
        @if (groups().length) {
          <os-copy-button [text]="all()" what="group names" />
        }
      </div>
      <p class="os-server-connection-note">
        Aim a message at one of these to reach only that {{ tenant() }}, that role, or that role in
        that {{ tenant() }}. A message with no group reaches everyone.
      </p>
      @if (groups().length) {
        <ul class="os-announce-groups-list">
          @for (group of groups(); track group) {
            <li>
              <code>{{ group }}</code>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class AnnounceGroups {
  readonly groups = input.required<readonly string[]>();
  /** What the app calls a tenant, lower case, such as network, team or organization. */
  readonly tenant = input('tenant');

  protected readonly titleId = uniqueId('announce-groups');
  protected readonly all = computed(() => this.groups().join('\n'));
}
