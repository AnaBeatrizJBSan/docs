import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { generatedImagePath, normalizeOptions } from '../src/config/normalize.ts';

test('normalizes the route, site and optional cache directory', () => {
	const root = `${process.cwd()}${path.sep}`;
	const config = normalizeOptions({
		thumbnails: {
			path: '/social/', format: 'webp', cache: true,
			routeMappings: [{ from: '/history/' }],
			additionalPages: { '404': { title: 'Not found' } },
		},
	}, {
		root: pathToFileURL(root),
		base: '/docs/',
		site: 'https://example.com/docs/',
		starlightTitle: 'Example Docs',
	});

	assert.equal(config.site, 'https://example.com/docs/');
	assert.equal(config.thumbnails.path, 'social');
	assert.equal(config.thumbnails.canvasFormat, 'WEBP');
	assert.equal(config.thumbnails.cache && config.thumbnails.cache.dir, path.join(root, '.cache/starlight-seo'));
	assert.equal(generatedImagePath('guide/start', config), '/docs/social/guide/start.webp');
	assert.equal(generatedImagePath('history/guide/start', config), '/docs/social/guide/start.webp');
	assert.equal(config.thumbnails.additionalPages['404']?.title, 'Not found');
});
