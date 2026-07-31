import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import config from 'virtual:starlight-seo/config';
import { renderPageThumbnail, type ThumbnailPage } from './thumbnail.ts';
import type { PageSeoFrontmatter } from '../types.ts';

interface EndpointProps { page: ThumbnailPage }

export const prerender = true;

export const getStaticPaths = (async () => {
	if (!config.thumbnails.enabled) return [];
	const entries = await getCollection('docs', ({ data }) => !data.draft);
	const docsPaths = entries
		.map((entry) => ({
			id: entry.id,
			filePath: entry.filePath,
			data: entry.data as typeof entry.data & { seo?: PageSeoFrontmatter },
		}))
		.filter(({ data }) => data.seo?.thumbnail !== false && typeof data.seo?.image !== 'string' && data.seo?.image !== false)
		.map(({ id, filePath, data }) => ({
			params: { slug: id },
			props: { page: { id, title: data.title, description: data.description, filePath, seo: data.seo } } satisfies EndpointProps,
		}));
	const additionalPaths = Object.entries(config.thumbnails.additionalPages).map(([id, page]) => ({
		params: { slug: id },
		props: {
			page: {
				id,
				title: page.title,
				description: page.description,
				seo: { thumbnail: page },
			},
		} satisfies EndpointProps,
	}));
	return [...docsPaths, ...additionalPaths];
}) satisfies GetStaticPaths;

export const GET: APIRoute<EndpointProps> = async ({ props }) => {
	const result = await renderPageThumbnail(props.page, config);
	return new Response(result.body, {
		headers: {
			'Content-Type': config.thumbnails.format === 'png'
				? 'image/png'
				: config.thumbnails.format === 'jpeg' ? 'image/jpeg' : 'image/webp',
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Starlight-SEO-Cache': result.cache,
			'X-Starlight-SEO-Source-Hash': result.sourceHash,
		},
	});
};
