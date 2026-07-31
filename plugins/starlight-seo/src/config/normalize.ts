import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultThumbnailOptions } from './defaults.ts';
import type { RuntimeSeoConfig, SocialImageFormat, StarlightSeoOptions, ThumbnailOptions } from '../types.ts';

const canvasFormats = { png: 'PNG', jpeg: 'JPEG', webp: 'WEBP' } as const;

export function normalizeOptions(
	options: StarlightSeoOptions,
	context: { root: URL; base: string; site: URL | string; starlightTitle: string }
): RuntimeSeoConfig {
	const root = fileURLToPath(context.root);
	const site = context.site instanceof URL ? context.site.href : new URL(context.site).href;
	const thumbnailInput: ThumbnailOptions = typeof options.thumbnails === 'object'
		? options.thumbnails
		: { enabled: options.thumbnails !== false };
	const format: SocialImageFormat = thumbnailInput.format ?? defaultThumbnailOptions.format;
	const siteName = options.siteName ?? context.starlightTitle;

	return {
		...options,
		root,
		base: normalizeBase(context.base),
		site,
		siteName,
		thumbnails: {
			...defaultThumbnailOptions,
			...thumbnailInput,
			font: mergeFontOptions(defaultThumbnailOptions.font, thumbnailInput.font),
			border: { ...defaultThumbnailOptions.border, ...thumbnailInput.border },
			enabled: thumbnailInput.enabled ?? true,
			path: normalizeRoutePath(thumbnailInput.path ?? defaultThumbnailOptions.path),
			format,
			canvasFormat: canvasFormats[format],
			quality: thumbnailInput.quality ?? defaultThumbnailOptions.quality,
			cache: normalizeCache(thumbnailInput.cache, root),
			additionalPages: normalizeAdditionalPages(thumbnailInput.additionalPages),
			routeMappings: (thumbnailInput.routeMappings ?? []).map(({ from, to = '' }) => ({
				from: normalizeRoutePath(from),
				to: to ? normalizeRoutePath(to) : '',
			})),
		},
	};
}

function mergeFontOptions(base: ThumbnailOptions['font'], override: ThumbnailOptions['font']) {
	return {
		title: { ...base?.title, ...override?.title },
		description: { ...base?.description, ...override?.description },
	};
}

function normalizeCache(cache: ThumbnailOptions['cache'], root: string): false | { dir: string } {
	if (!cache) return false;
	const configuredDir = typeof cache === 'object' ? cache.dir : undefined;
	return { dir: path.resolve(root, configuredDir ?? '.cache/starlight-seo') };
}

export function normalizeRoutePath(value: string): string {
	const normalized = value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
	if (!normalized || normalized.split('/').includes('..')) {
		throw new Error('[starlight-seo] `thumbnails.path` must be a non-empty URL path without `..`.');
	}
	return normalized;
}

export function normalizeBase(base: string): string {
	return base === '/' ? '/' : `/${base.replace(/^\/+|\/+$/g, '')}/`;
}

export function generatedImagePath(id: string, config: RuntimeSeoConfig): string {
	const normalizedId = thumbnailIdForPage(id, config);
	const base = config.base === '/' ? '/' : config.base;
	return `${base}${config.thumbnails.path}/${normalizedId}.${config.thumbnails.format}`.replace(/\/{2,}/g, '/');
}

export function thumbnailIdForPage(id: string, config: RuntimeSeoConfig): string {
	let normalizedId = id.replace(/^\/+|\/+$/g, '') || 'index';
	for (const mapping of config.thumbnails.routeMappings) {
		if (!normalizedId.startsWith(`${mapping.from}/`)) continue;
		const suffix = normalizedId.slice(mapping.from.length + 1);
		normalizedId = mapping.to ? `${mapping.to}/${suffix}` : suffix;
		break;
	}
	return normalizedId || 'index';
}

function normalizeAdditionalPages(pages: ThumbnailOptions['additionalPages']) {
	return Object.fromEntries(Object.entries(pages ?? {}).map(([id, page]) => [normalizeRoutePath(id), page]));
}
