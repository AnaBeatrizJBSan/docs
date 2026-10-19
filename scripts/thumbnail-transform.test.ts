import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import transform from '../src/seo/thumbnail-transform.ts';
import type { ThumbnailTransformContext } from '../plugins/starlight-seo/src/types.ts';

const iconUrl = 'https://images.habbo.com/dcr/hof_furni/50950/wf_trg_at_given_time_icon.png';
const infobox = { type: 'Ativador', classname: 'wf_trg_at_given_time', revision: 50950 };
const base = () => sharp({ create: { width: 1200, height: 630, channels: 4, background: '#000000' } }).png().toBuffer();
// Four distinct pixels expose accidental smoothing when enlarged.
const icon = () => sharp(Buffer.from([255, 0, 0, 0, 0, 255, 255, 255, 0, 255, 255, 255]),
	{ raw: { width: 2, height: 2, channels: 3 } }).png().toBuffer();

test('leaves overview, hidden and non-Wired pages unchanged', async () => {
	const image = await base();
	for (const data of [undefined, {}, { infobox: { ...infobox, hide: true } }, { infobox: { classname: 'chair', revision: 1 } }]) {
		const result = await transform({ image, page: { id: 'overview', title: 'Overview', data }, root: process.cwd(), format: 'png', quality: 90 });
		assert.deepEqual(result, image);
	}
});

test('places the icon at the top right with crisp pixels and reuses its disk cache', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'wired-thumbnail-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const pixels = await icon();
	t.mock.method(globalThis, 'fetch', async (url: string) => {
		assert.equal(url, iconUrl);
		return new Response(Uint8Array.from(pixels));
	});
	const context: ThumbnailTransformContext = {
		image: await base(), page: { id: 'wired', title: 'Wired', data: { infobox } }, root, format: 'png', quality: 90,
	};
	const result = await transform(context);
	const { data, info } = await sharp(result).removeAlpha().raw().toBuffer({ resolveWithObject: true });
	const pixel = (x: number, y: number) => Array.from(data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3));
	assert.equal(info.width, 1200);
	assert.equal(info.height, 630);
	assert.deepEqual(pixel(1128, 60), [255, 0, 0]);
	assert.deepEqual(pixel(1133, 65), [255, 0, 0]);
	assert.deepEqual(pixel(1134, 60), [0, 0, 255]);
	assert.deepEqual(pixel(1128, 66), [255, 255, 0]);
	assert.deepEqual(pixel(1127, 60), [0, 0, 0]);
	assert.deepEqual(pixel(1140, 60), [0, 0, 0]);
	t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must use the disk cache'); });
	assert.deepEqual(await transform(context), result);
});

test('keeps the base on download failure and retries instead of caching the failure', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'wired-thumbnail-failure-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	t.mock.method(console, 'warn', () => {});
	t.mock.method(globalThis, 'fetch', async () => new Response('Missing', { status: 404 }));
	const context: ThumbnailTransformContext = {
		image: await base(), page: { id: 'wired', title: 'Wired', data: { infobox } }, root, format: 'png', quality: 90,
	};
	assert.deepEqual(await transform(context), context.image);
	const pixels = await icon();
	t.mock.method(globalThis, 'fetch', async () => new Response(Uint8Array.from(pixels)));
	assert.equal(Buffer.from(await transform(context)).equals(context.image), false);
});

for (const format of ['jpeg', 'webp'] as const) {
	test(`preserves the requested ${format} output format`, async (t) => {
		const root = await mkdtemp(path.join(os.tmpdir(), 'wired-thumbnail-format-'));
		t.after(() => rm(root, { recursive: true, force: true }));
		const pixels = await icon();
		t.mock.method(globalThis, 'fetch', async () => new Response(Uint8Array.from(pixels)));
		const image = await sharp(await base()).toFormat(format).toBuffer();
		const output = await transform({ image, page: { id: 'wired', title: 'Wired', data: { infobox } }, root, format, quality: 90 });
		assert.equal((await sharp(output).metadata()).format, format);
	});
}
