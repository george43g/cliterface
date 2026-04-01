import { describe, expect, h, it, render } from '@stencil/vitest';

describe('my-component', () => {
  it('renders', async () => {
    const { root } = await render(<my-component></my-component>);
    await expect(root).toEqualHtml(`
      <my-component class="hydrated">
        <mock:shadow-root>
          <div>
             undefined undefined undefined
          </div>
        </mock:shadow-root>
      </my-component>
    `);
  });

  it('renders with values', async () => {
    const { root } = await render(<my-component first="Stencil" middle="framework" last="JS"></my-component>);
    await expect(root).toEqualHtml(`
      <my-component class="hydrated">
        <mock:shadow-root>
          <div>
            Stencil framework JS
          </div>
        </mock:shadow-root>
      </my-component>
    `);
  });
});
