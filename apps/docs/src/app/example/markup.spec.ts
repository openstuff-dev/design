import { dedent, toMarkup } from './markup';

function render(html: string): Element {
  return new DOMParser().parseFromString(html, 'text/html').body;
}

describe('toMarkup', () => {
  it('drops Angular attributes, comments and selector attributes', () => {
    const root = render(
      '<!--container--><button _ngcontent-ng-c1="" os-button="" class="os-button" ' +
      'data-variant="primary" ng-reflect-variant="primary">Save</button>',
    );
    expect(toMarkup(root)).toBe('<button class="os-button" data-variant="primary">Save</button>');
  });

  it('drops inputs from component hosts but keeps their HTML attributes', () => {
    const root = render(
      '<button os-button="" label="Close" tone="danger" type="button" class="os-button" ' +
      'aria-label="Close" data-variant="ghost">x</button><input os-input="" size="sm" ' +
      'data-size="sm" class="os-input"><input size="4">',
    );
    expect(toMarkup(root)).toBe(
      [
        '<button type="button" class="os-button" aria-label="Close" data-variant="ghost">x</button>',
        '<input data-size="sm" class="os-input">',
        '<input size="4">',
      ].join('\n'),
    );
  });

  it('writes what an example component renders, not the component', () => {
    const root = render('<docs-demo><p>One</p><p>Two</p></docs-demo>');
    expect(toMarkup(root)).toBe('<p>One</p>\n<p>Two</p>');
  });

  it('writes component hosts as divs', () => {
    const root = render('<os-callout class="os-callout" data-tone="info"><p>Hi</p></os-callout>');
    expect(toMarkup(root)).toBe(
      ['<div class="os-callout" data-tone="info">', '  <p>Hi</p>', '</div>'].join('\n'),
    );
  });

  it('indents nested elements and keeps short leaves on one line', () => {
    const root = render(
      '<div class="row"><button class="os-button">One</button>\n  <button class="os-button">Two</button></div>',
    );
    expect(toMarkup(root)).toBe(
      [
        '<div class="row">',
        '  <button class="os-button">One</button>',
        '  <button class="os-button">Two</button>',
        '</div>',
      ].join('\n'),
    );
  });

  it('keeps void elements and boolean attributes short', () => {
    const root = render('<input class="os-input" disabled="">');
    expect(toMarkup(root)).toBe('<input class="os-input" disabled>');
  });
});

describe('dedent', () => {
  it('removes the shared indentation', () => {
    expect(dedent('\n    <a>\n      <b></b>\n    </a>\n  ')).toBe('<a>\n  <b></b>\n</a>');
  });
});
