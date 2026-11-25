import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgentBar, AgentMode, AgentSwitch, PageHeader } from '@openstuff-dev/ui-angular';
import { CodeBlock } from '../example/code-block';
import { Example } from '../example/example';

const AGENT_SWITCH = `
  <button
    os-agent-switch
    type="button"
    [active]="agentMode.active()"
    tooltip="See the whole page in the phosphor terminal costume."
    (click)="agentMode.toggle()"
  >
    Agent mode
  </button>
`;

const AGENT_BAR = `
  <header os-agent-bar (exit)="agentMode.set(false)">
    <span os-agent-brand>OpenPurpose</span>
    <span>Agent in <strong>Acme</strong></span>
  </header>
`;

@Component({
  selector: 'docs-agent-switch-example',
  imports: [AgentSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: AGENT_SWITCH,
})
class AgentSwitchExample {
  protected readonly agentMode = inject(AgentMode);
}

@Component({
  selector: 'docs-agent-bar-example',
  imports: [AgentBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: AGENT_BAR,
})
class AgentBarExample {
  protected readonly agentMode = inject(AgentMode);
}

@Component({
  selector: 'docs-agent-mode-page',
  imports: [AgentBarExample, AgentSwitchExample, CodeBlock, Example, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      os-page-header
      title="Agent mode"
      description="The topbar switch, minimal agent bar, and terminal costume shared by OpenStuff apps."
    ></header>

    <div class="stack">
      <docs-code boxed language="TypeScript" [code]="usage" />
      <div class="prose">
        <p>
          Put <code>button[os-agent-switch]</code> at the end of <code>.os-shell-topbar</code> when
          an app offers an agent view. Calling <code>agentMode.set(true)</code> sets
          <code>data-agent-mode</code> on <code>&lt;html&gt;</code>, switching every token and
          component into the phosphor terminal look. Click the switch below to try it live.
        </p>
      </div>
      <docs-example [code]="switchCode"><docs-agent-switch-example /></docs-example>

      <div class="prose">
        <p>
          While agent mode is active, replace the regular sidebar shell with
          <code>[os-agent-shell]</code> and <code>header[os-agent-bar]</code> so the person sees
          only the agent's context and an Exit button.
        </p>
      </div>
      <docs-example [code]="barCode" [flush]="true"><docs-agent-bar-example /></docs-example>
    </div>
  `,
})
export class AgentModePage {
  protected readonly switchCode = AGENT_SWITCH;
  protected readonly barCode = AGENT_BAR;
  protected readonly usage = `import { AgentBar, AgentMode, AgentShell, AgentSwitch } from '@openstuff-dev/ui-angular';`;
}
