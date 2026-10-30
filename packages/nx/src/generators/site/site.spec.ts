/// <reference lib="dom" />
import { type Tree, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { syncSites } from '../../utils/site';
import { GLYPHS, siteGenerator, splitName } from './site';

describe('site generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('writes the page with the project name, links and mark', async () => {
    await siteGenerator(tree, {
      name: 'OpenLedger',
      tagline: 'Books that balance.',
      repository: 'https://github.com/openstuff-dev/open-ledger',
      appUrl: 'https://ledger.openstuff.app/',
      glyph: 'hexagon',
    });

    const page = tree.read('site/index.html', 'utf8') ?? '';
    expect(page).toContain('<title>OpenLedger: Books that balance.</title>');
    expect(page).toContain('<link rel="canonical" href="https://ledger.openstuff.dev/">');
    expect(page).toContain('Open<b>Ledger</b>');
    expect(page).toContain('href="https://ledger.openstuff.app/sign-up"');
    expect(page).toContain('docker pull ghcr.io/openstuff-dev/open-ledger');
    expect(page).not.toContain('<%');
    expect(tree.read('site/assets/logo.svg', 'utf8')).toContain(GLYPHS.hexagon);
    expect(tree.exists('site/.nojekyll')).toBe(true);
    expect(tree.exists('site/CNAME')).toBe(false);
    expect(tree.read('.github/workflows/pages.yml', 'utf8')).toContain('path: site');
  });

  it('writes SVGs that browsers can parse', async () => {
    await siteGenerator(tree, { name: 'OpenLedger' });

    for (const path of ['site/favicon.svg', 'site/assets/logo.svg', 'site/assets/og.svg']) {
      const svg = new DOMParser().parseFromString(tree.read(path, 'utf8') ?? '', 'image/svg+xml');
      expect(svg.querySelector('parsererror'), path).toBeNull();
    }
  });

  it('points the buttons at self-hosting when there is no hosted app', async () => {
    await siteGenerator(tree, { name: 'OpenDesk' });

    const page = tree.read('site/index.html', 'utf8') ?? '';
    expect(page).not.toContain('Try it free');
    expect(page).not.toContain('Sign in');
    expect(page).toContain('Self-host it');
  });

  it("takes the colour from the web app's tokens.config.json", async () => {
    writeJson(tree, 'apps/web/tokens.config.json', { primaryColor: '#0f9d58' });

    await siteGenerator(tree, { name: 'OpenLedger' });

    expect(tree.read('site/openstuff-site.json', 'utf8')).toContain('#0f9d58');
    expect(tree.read('site/favicon.svg', 'utf8')).toContain('fill="#0f9d58"');
  });

  it('copies the toolkit into one stylesheet, the script and the fonts', async () => {
    await siteGenerator(tree, { name: 'OpenLedger', primaryColor: '#0f9d58' });

    const css = tree.read('site/assets/os/toolkit.css', 'utf8') ?? '';
    expect(css).toMatch(/@layer os\.reset, os\.tokens/);
    expect(css).not.toMatch(/^@import/m);
    expect(css).toContain('.os-button');
    expect(css).toContain('.os-tile');
    expect(css).toContain("font-family: 'Geist Variable'");
    expect(css).toMatch(/@layer os\.tokens \{\s+:root \{\s+color-scheme: light dark;\s+--os-/);
    expect(css).toContain('primaryColor #0f9d58');
    expect(tree.read('site/assets/os/marketing.js', 'utf8')).toContain('startMarketingPage');
    expect(tree.read('site/assets/os/fonts/Geist-Variable.woff2')?.subarray(0, 4).toString()).toBe(
      'wOF2',
    );
  });

  it('refuses a folder that already has a page', async () => {
    tree.write('site/index.html', '<!doctype html>');
    await expect(siteGenerator(tree, { name: 'OpenLedger' })).rejects.toThrow('already exists');
  });

  it('rejects a colour that is not hex', async () => {
    await expect(siteGenerator(tree, { name: 'OpenLedger', primaryColor: 'blue' })).rejects.toThrow(
      'hex colour',
    );
  });

  it('lets sync refresh the toolkit copy with a new colour', async () => {
    await siteGenerator(tree, { name: 'OpenLedger', directory: 'web/site' });
    writeJson(tree, 'web/site/openstuff-site.json', { primaryColor: '#d93f0b' });
    tree.write('web/site/assets/os/toolkit.css', 'stale');

    expect(await syncSites(tree)).toEqual(['web/site']);

    expect(tree.read('web/site/assets/os/toolkit.css', 'utf8')).toContain('primaryColor #d93f0b');
  });
});

describe('splitName', () => {
  it('splits Open from the rest', () => {
    expect(splitName('OpenLedger')).toEqual({ open: 'Open', rest: 'Ledger' });
    expect(splitName('Ledger')).toEqual({ open: '', rest: 'Ledger' });
  });
});
