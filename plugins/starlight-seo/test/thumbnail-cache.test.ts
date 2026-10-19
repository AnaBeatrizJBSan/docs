import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { renderPageThumbnail } from '../src/runtime/thumbnail.ts';
import type { RuntimeSeoConfig } from '../src/types.ts';

test('reuses an unchanged source and invalidates cache after a file edit', async () => {
	const temporary = await mkdtemp(path.join(os.tmpdir(), 'starlight-seo-test-'));
	const source = path.join(temporary, 'page.md');
	await writeFile(source, '---\ntitle: Cache test\n---\nFirst version.\n');

	const config: RuntimeSeoConfig = {
		root: process.cwd(), base: '/', site: 'https://example.com/', siteName: 'Example',
		thumbnails: {
			enabled: true, path: '_seo', format: 'png', canvasFormat: 'PNG', quality: 90,
			cache: { dir: path.join(temporary, '.cache/starlight-seo') },
			additionalPages: {}, routeMappings: [],
			bgGradient: [[9, 13, 26], [37, 17, 71]],
			fonts: ['./node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff'],
			font: { title: { families: ['Noto Sans'] }, description: { families: ['Noto Sans'] } },
		},
	};
	const page = { id: 'cache-test', title: 'Cache test', description: 'Cache behavior', filePath: source };

	try {
		const first = await renderPageThumbnail(page, config);
		const second = await renderPageThumbnail(page, config);
		assert.equal(first.cache, 'miss');
		assert.equal(second.cache, 'hit');
		assert.equal(first.hash, second.hash);

		await writeFile(source, '---\ntitle: Cache test\n---\nSecond version.\n');
		const changed = await renderPageThumbnail(page, config);
		assert.equal(changed.cache, 'miss');
		assert.notEqual(changed.sourceHash, first.sourceHash);
		assert.notEqual(changed.hash, first.hash);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
});

for (const cache of [false, true]) {
	test(`applies a site transform to the rendered image with cache ${cache ? 'enabled' : 'disabled'}`, async () => {
		const temporary = await mkdtemp(path.join(os.tmpdir(), 'starlight-seo-transform-'));
		const config: RuntimeSeoConfig = {
			root: process.cwd(), base: '/', site: 'https://example.com/', siteName: 'Example',
			thumbnails: {
				enabled: true, path: '_seo', format: 'png', canvasFormat: 'PNG', quality: 90,
				cache: cache ? { dir: temporary } : false, additionalPages: {}, routeMappings: [],
				fonts: ['./node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff'],
			},
		};
		const page = { id: 'transform', title: 'Transform', data: { previewWidth: 12 } };
		try {
			const transform = async ({ image, page, format }: import('../src/types.ts').ThumbnailTransformContext) =>
				sharp(image).resize(Number(page.data?.previewWidth), 6).toFormat(format).toBuffer();
			const first = await renderPageThumbnail(page, config, transform);
			const second = await renderPageThumbnail(page, config, transform);
			for (const result of [first, second]) {
				const metadata = await sharp(result.body as Buffer).metadata();
				assert.equal(metadata.width, 12);
				assert.equal(metadata.height, 6);
				assert.equal(metadata.format, 'png');
			}
			assert.equal(second.cache, cache ? 'hit' : 'disabled');
			// A cached base image must not retain the previous transform's output.
			const changed = await renderPageThumbnail(page, config, async ({ image }) =>
				sharp(image).resize(24, 12).png().toBuffer());
			assert.equal((await sharp(changed.body as Buffer).metadata()).width, 24);
		} finally {
			await rm(temporary, { recursive: true, force: true });
		}
	});
}
