import { generatedImagePath } from '../config/normalize.ts';
import type {
	PageSeoFrontmatter,
	RobotsOptions,
	RuntimeSeoConfig,
	StructuredDataOptions,
} from '../types.ts';

type HeadEntry = {
	tag: 'title' | 'base' | 'link' | 'style' | 'meta' | 'script' | 'noscript' | 'template';
	attrs?: Record<string, string | boolean | undefined>;
	content?: string;
};
type Head = HeadEntry[];

export interface SeoPageData {
	id: string;
	title: string;
	description?: string;
	lang: string;
	pathname: string;
	seo?: PageSeoFrontmatter;
}

/** Merge generated SEO metadata over Starlight's defaults and user-provided `head` tags. */
export function createSeoHead(currentHead: Head, page: SeoPageData, config: RuntimeSeoConfig): Head {
	let head = [...currentHead];
	const seo = page.seo ?? {};
	const pageTitle = seo.title ?? page.title;
	const description = seo.description ?? page.description ?? metaContent(head, 'name', 'description');
	const canonical = absoluteUrl(seo.canonical ?? page.pathname, config.site) ?? page.pathname;
	const image = resolveImage(page, config);
	const twitterImage = seo.twitter?.image === false
		? undefined
		: absoluteUrl(typeof seo.twitter?.image === 'string' ? seo.twitter.image : image, config.site);

	if (config.titleTemplate || seo.title) {
		const title = config.titleTemplate?.includes('%s')
			? config.titleTemplate.replaceAll('%s', pageTitle)
			: pageTitle;
		head = upsert(head, { tag: 'title', content: title });
	}

	head = upsert(head, { tag: 'link', attrs: { rel: 'canonical', href: canonical } });
	head = upsert(head, { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' } });
	head = upsertMeta(head, 'name', 'theme-color', '#0b1530');
	head = upsert(head, { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' } });
	head = upsertMeta(head, 'property', 'og:title', pageTitle);
	head = upsertMeta(head, 'property', 'og:type', seo.type ?? config.openGraph?.type ?? 'article');
	head = upsertMeta(head, 'property', 'og:url', canonical);
	head = upsertMeta(head, 'property', 'og:site_name', config.siteName);
	if (description) {
		head = upsertMeta(head, 'name', 'description', description);
		head = upsertMeta(head, 'property', 'og:description', description);
	}

	const imageAlt = seo.imageAlt ?? config.openGraph?.imageAlt ?? config.defaultImageAlt ?? pageTitle;
	if (image) {
		head = upsertMeta(head, 'property', 'og:image', image);
		head = upsertMeta(head, 'property', 'og:image:secure_url', image);
		head = upsertMeta(head, 'property', 'og:image:type', mimeType(config.thumbnails.format));
		head = upsertMeta(head, 'property', 'og:image:width', '1200');
		head = upsertMeta(head, 'property', 'og:image:height', '630');
		head = upsertMeta(head, 'property', 'og:image:alt', imageAlt);
	} else {
		head = removeMetaPrefix(head, 'property', 'og:image');
	}

	const twitter = { ...config.twitter, ...seo.twitter };
	head = upsertMeta(head, 'name', 'twitter:card', twitter.card ?? (twitterImage ? 'summary_large_image' : 'summary'));
	head = upsertMeta(head, 'name', 'twitter:title', twitter.title ?? pageTitle);
	if (description || twitter.description) {
		head = upsertMeta(head, 'name', 'twitter:description', twitter.description ?? description ?? '');
	}
	if (twitter.site) head = upsertMeta(head, 'name', 'twitter:site', normalizeHandle(twitter.site));
	if (twitter.creator) head = upsertMeta(head, 'name', 'twitter:creator', normalizeHandle(twitter.creator));
	if (twitterImage) {
		head = upsertMeta(head, 'name', 'twitter:image', twitterImage);
		head = upsertMeta(head, 'name', 'twitter:image:alt', twitter.imageAlt ?? imageAlt);
	} else {
		head = removeMetaPrefix(head, 'name', 'twitter:image');
	}

	const keywords = seo.keywords ?? config.keywords;
	if (keywords) {
		head = upsertMeta(head, 'name', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
	}
	const robots = robotsContent(seo.robots ?? config.robots);
	if (robots) head = upsertMeta(head, 'name', 'robots', robots);

	head = removeStructuredData(head);
	const structuredData = resolveStructuredData(seo.structuredData, config.structuredData);
	if (structuredData) {
		const value = {
			'@context': 'https://schema.org',
			'@type': structuredData.type ?? 'TechArticle',
			headline: pageTitle,
			...(description ? { description } : {}),
			url: canonical,
			...(image ? { image } : {}),
			inLanguage: page.lang,
			isPartOf: { '@type': 'WebSite', name: config.siteName, url: config.site },
			...structuredData.data,
		};
		head.push({
			tag: 'script',
			attrs: { type: 'application/ld+json', 'data-starlight-seo': true },
			content: JSON.stringify(value).replace(/</g, '\\u003c'),
		});
	}
	return head;
}

function resolveImage(page: SeoPageData, config: RuntimeSeoConfig): string | undefined {
	if (page.seo?.image === false) return undefined;
	if (typeof page.seo?.image === 'string') return absoluteUrl(page.seo.image, config.site);
	if (config.thumbnails.enabled && page.seo?.thumbnail !== false) {
		return absoluteUrl(generatedImagePath(page.id, config), config.site);
	}
	return absoluteUrl(config.defaultImage, config.site);
}

function resolveStructuredData(
	pageValue: PageSeoFrontmatter['structuredData'],
	globalValue: RuntimeSeoConfig['structuredData']
): StructuredDataOptions | undefined {
	const selected = pageValue ?? globalValue;
	if (!selected) return undefined;
	const globalOptions = typeof globalValue === 'object' ? globalValue : {};
	const pageOptions = typeof pageValue === 'object' ? pageValue : {};
	return { ...globalOptions, ...pageOptions, data: { ...globalOptions.data, ...pageOptions.data } };
}

export function robotsContent(value: string | RobotsOptions | undefined): string | undefined {
	if (!value || typeof value === 'string') return value;
	const directives = [
		value.index === false ? 'noindex' : value.index === true ? 'index' : undefined,
		value.follow === false ? 'nofollow' : value.follow === true ? 'follow' : undefined,
		value.noarchive ? 'noarchive' : undefined,
		value.nosnippet ? 'nosnippet' : undefined,
		value.noimageindex ? 'noimageindex' : undefined,
		value.maxSnippet !== undefined ? `max-snippet:${value.maxSnippet}` : undefined,
		value.maxImagePreview ? `max-image-preview:${value.maxImagePreview}` : undefined,
		value.maxVideoPreview !== undefined ? `max-video-preview:${value.maxVideoPreview}` : undefined,
	].filter((item): item is string => Boolean(item));
	return directives.length > 0 ? directives.join(', ') : undefined;
}

function absoluteUrl(value: string | undefined, site: string): string | undefined {
	if (!value) return undefined;
	try { return new URL(value, site).href; } catch { return value; }
}

function mimeType(format: RuntimeSeoConfig['thumbnails']['format']): string {
	return format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
}

function normalizeHandle(value: string): string { return value.startsWith('@') ? value : `@${value}`; }

function metaContent(head: Head, key: 'name' | 'property', value: string): string | undefined {
	const content = head.find(({ tag, attrs }) => tag === 'meta' && attrs?.[key] === value)?.attrs?.content;
	return typeof content === 'string' ? content : undefined;
}

function upsertMeta(head: Head, key: 'name' | 'property', value: string, content: string): Head {
	return upsert(head, { tag: 'meta', attrs: { [key]: value, content } });
}

function upsert(head: Head, entry: HeadEntry): Head {
	return [...head.filter((current) => !sameIdentity(current, entry)), entry];
}

function sameIdentity(left: HeadEntry, right: HeadEntry): boolean {
	if (left.tag !== right.tag) return false;
	if (left.tag === 'title') return true;
	if (left.tag === 'link' && right.tag === 'link') {
		return left.attrs?.rel === right.attrs?.rel;
	}
	if (left.tag === 'meta' && right.tag === 'meta') {
		return ['name', 'property', 'http-equiv'].some((key) =>
			left.attrs?.[key] !== undefined && left.attrs?.[key] === right.attrs?.[key]
		);
	}
	return false;
}

function removeMetaPrefix(head: Head, key: 'name' | 'property', prefix: string): Head {
	return head.filter(({ tag, attrs }) =>
		tag !== 'meta' || typeof attrs?.[key] !== 'string' || !attrs[key].startsWith(prefix)
	);
}

function removeStructuredData(head: Head): Head {
	return head.filter(({ tag, attrs }) => tag !== 'script' || attrs?.['data-starlight-seo'] !== true);
}
