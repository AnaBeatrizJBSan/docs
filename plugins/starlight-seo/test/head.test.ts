import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeoHead } from '../src/runtime/head.ts';
import type { RuntimeSeoConfig } from '../src/types.ts';

const config: RuntimeSeoConfig = {
	root: process.cwd(),
	base: '/',
	site: 'https://example.com/',
	siteName: 'Example Docs',
	titleTemplate: '%s | Example Docs',
	keywords: ['docs', 'example'],
	robots: { index: true, follow: true },
	structuredData: true,
	thumbnails: {
		enabled: true,
		path: '_seo',
		format: 'png',
		canvasFormat: 'PNG',
		quality: 90,
		cache: false,
		additionalPages: {},
		routeMappings: [],
	},
};

test('creates absolute social metadata and JSON-LD', () => {
	const head = createSeoHead([], {
		id: 'guide/start',
		title: 'Start',
		description: 'Default description',
		lang: 'pt-BR',
		pathname: '/guide/start/',
		seo: { title: 'Custom start', description: 'Search description' },
	}, config);

	assert.equal(content(head, 'property', 'og:image'), 'https://example.com/_seo/guide/start.png');
	assert.equal(content(head, 'name', 'description'), 'Search description');
	assert.equal(content(head, 'name', 'twitter:title'), 'Custom start');
	assert.equal(content(head, 'name', 'robots'), 'index, follow');
	assert.match(head.find((entry) => entry.tag === 'script')?.content ?? '', /"@type":"TechArticle"/);
});

test('removes image metadata when a page opts out', () => {
	const head = createSeoHead([
		{ tag: 'meta', attrs: { property: 'og:image', content: 'old.png' } },
		{ tag: 'meta', attrs: { name: 'twitter:image', content: 'old.png' } },
	], {
		id: 'private', title: 'Private', lang: 'pt-BR', pathname: '/private/', seo: { image: false },
	}, config);
	assert.equal(content(head, 'property', 'og:image'), undefined);
	assert.equal(content(head, 'name', 'twitter:image'), undefined);
});

function content(head: ReturnType<typeof createSeoHead>, key: 'name' | 'property', value: string) {
	const result = head.find((entry) => entry.tag === 'meta' && entry.attrs?.[key] === value)?.attrs?.content;
	return typeof result === 'string' ? result : undefined;
}
