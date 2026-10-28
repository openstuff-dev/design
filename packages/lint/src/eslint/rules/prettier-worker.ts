import { format, type Options } from 'prettier';
import { runAsWorker } from 'synckit';

/**
 * Formats one inline template the way Prettier formats it inside a component file,
 * which keeps `<pre>` and other whitespace-sensitive content as it is. `depth` is how
 * many blocks the decorator sits in (0 at the top of a file).
 */
async function formatTemplate(raw: string, depth: number, options: Options): Promise<string> {
  const open = '{\n'.repeat(depth);
  const close = '}\n'.repeat(depth);
  const snippet = `${open}@Component({\n  template: \`${raw}\`,\n})\nclass X {}\n${close}`;
  const output = await format(snippet, { ...options, parser: 'typescript' });
  return output.slice(output.indexOf('`') + 1, output.lastIndexOf('`'));
}

// ESLint rules are synchronous and Prettier 3 is not, so synckit runs this in a worker.
runAsWorker(formatTemplate);
