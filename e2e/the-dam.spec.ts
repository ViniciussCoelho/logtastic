import { expect, test, type Page } from '@playwright/test';

/** World size of The Dam; canvas clicks are mapped from world to screen pixels. */
const WORLD = { width: 1920, height: 1080 };

async function pickOption(page: Page, label: string) {
  // Options are styled radios; players click the visible tile label.
  await page.getByText(label, { exact: true }).click();
}

async function enterDam(page: Page, nickname = 'Chip') {
  await page.goto('/');
  await page.getByLabel('Nickname').fill(nickname);
  await page.getByRole('button', { name: 'Enter The Dam' }).click();
  // The HUD only appears once the scene has drawn the room and spawned everyone.
  await expect(page.getByText(/\d+ beavers here/)).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(() => window.__damDebug?.selfId() ?? null)).not.toBeNull();
}

const selfBubble = (page: Page) =>
  page.evaluate(() => {
    const debug = window.__damDebug;
    const id = debug?.selfId();
    return id ? debug!.bubble(id) : null;
  });

const selfPosition = (page: Page) =>
  page.evaluate(() => {
    const debug = window.__damDebug;
    const id = debug?.selfId();
    return id ? debug!.position(id) : null;
  });

test('a new player builds a beaver and enters The Dam', async ({ page }) => {
  await page.goto('/');
  const preview = page.getByRole('img', { name: /^Your beaver:/ });
  await expect(preview).toHaveAccessibleName(/classic brown fur, dots face, no hat/i);

  // Invalid nicknames keep the player on the character screen.
  await page.getByLabel('Nickname').fill('$');
  await page.getByRole('button', { name: 'Enter The Dam' }).click();
  await expect(page.getByText('Nicknames need at least 2 characters.')).toBeVisible();
  await page.getByLabel('Nickname').fill('Log$');
  await expect(page.getByText(/only letters, numbers/i)).toBeVisible();

  await page.getByLabel('Nickname').fill('Chip');
  await pickOption(page, 'Ash Gray');
  await pickOption(page, 'Cool');
  await pickOption(page, 'Straw hat');
  await expect(preview).toHaveAccessibleName(/ash gray fur, cool face, straw hat/i);

  await page.getByRole('button', { name: 'Enter The Dam' }).click();
  await expect(page.getByText(/\d+ beavers here/)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('Chip', { exact: true })).toBeVisible();
});

test.describe('in The Dam', () => {
  test.beforeEach(async ({ page }) => enterDam(page));

  test('clicking the deck walks the beaver there', async ({ page }) => {
    // Headless Chromium renders this canvas at only ~8 fps in software, and Phaser caps long
    // frames, so the beaver walks in slow motion here; give it time without loosening the check.
    test.slow();
    const target = { x: 1300, y: 820 };
    const box = await page.locator('canvas').boundingBox();
    if (!box) throw new Error('canvas not laid out');
    const screen = { x: box.x + (target.x / WORLD.width) * box.width, y: box.y + (target.y / WORLD.height) * box.height };

    // The room opens with an iris wipe; clicks only reach the canvas once it has fully opened.
    await expect
      .poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, screen))
      .toBe('CANVAS');
    await page.mouse.click(screen.x, screen.y);

    await expect
      .poll(async () => {
        const at = await selfPosition(page);
        return at ? Math.hypot(at.x - target.x, at.y - target.y) : Infinity;
      }, { timeout: 25_000 })
      .toBeLessThan(3);
  });

  test('a predefined message pops over the beaver and lands in the history', async ({ page }) => {
    await page.getByRole('button', { name: 'Quick messages' }).click();
    await page.getByRole('tab', { name: 'Social' }).click();
    await page.getByRole('button', { name: 'Nice hat!' }).click();

    await expect.poll(() => selfBubble(page)).toEqual({ kind: 'text', text: 'Nice hat!' });
    await page.getByRole('button', { name: /chat history/i }).click();
    await expect(page.getByRole('region', { name: 'Chat history' }).getByText('Nice hat!')).toBeVisible();
  });

  test('a typed message pops over the beaver', async ({ page }) => {
    const input = page.getByLabel('Type a message');
    await input.fill('  bora   construir a represa? ');
    await input.press('Enter');

    await expect.poll(() => selfBubble(page)).toEqual({ kind: 'text', text: 'bora construir a represa?' });
    await expect(input).toHaveValue('');
  });

  test('an emote pops over the beaver', async ({ page }) => {
    await page.getByRole('button', { name: 'Emotes' }).click();
    await page.getByRole('dialog', { name: 'Emotes' }).getByRole('button', { name: 'Party' }).click();

    await expect.poll(() => selfBubble(page)).toEqual({ kind: 'emote', emoteId: 'party' });
  });
});

test('the beaver and room settings are remembered after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nickname').fill('Pebble');
  await pickOption(page, 'Cream');
  await pickOption(page, 'Wink');
  await pickOption(page, 'Beanie');
  await page.getByRole('button', { name: 'Enter The Dam' }).click();
  await expect(page.getByText(/\d+ beavers here/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Old film look' }).uncheck({ force: true });

  await page.reload();
  await expect(page.getByLabel('Nickname')).toHaveValue('Pebble');
  await expect(page.getByRole('img', { name: /^Your beaver:/ })).toHaveAccessibleName(/cream fur, wink face, beanie/i);

  await page.getByRole('button', { name: 'Enter The Dam' }).click();
  await expect(page.getByText(/\d+ beavers here/)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: 'Old film look' })).not.toBeChecked();
});
