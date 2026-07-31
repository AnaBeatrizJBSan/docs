import type { OGImageOptions } from 'astro-og-canvas';

export type SocialImageFormat = 'png' | 'jpeg' | 'webp';
export type RobotsValue = string | RobotsOptions;
export type StructuredDataValue = boolean | StructuredDataOptions;

export interface RobotsOptions {
	index?: boolean;
	follow?: boolean;
	noarchive?: boolean;
	nosnippet?: boolean;
	noimageindex?: boolean;
	maxSnippet?: number;
	maxImagePreview?: 'none' | 'standard' | 'large';
	maxVideoPreview?: number;
}

export interface StructuredDataOptions {
	/** Schema.org type. Defaults to `TechArticle`. */
	type?: string;
	/** Extra JSON-LD properties. These override generated properties. */
	data?: Record<string, unknown>;
}

/** Visual options passed through to `astro-og-canvas`. */
export interface ThumbnailStyle {
	title?: string;
	description?: string;
	dir?: OGImageOptions['dir'];
	logo?: OGImageOptions['logo'] | false;
	bgGradient?: OGImageOptions['bgGradient'];
	bgImage?: OGImageOptions['bgImage'];
	border?: OGImageOptions['border'];
	padding?: OGImageOptions['padding'];
	font?: OGImageOptions['font'];
	fonts?: OGImageOptions['fonts'];
}

export interface AdditionalThumbnailPage extends ThumbnailStyle {
	title: string;
	description?: string;
}

export interface ThumbnailRouteMapping {
	/** Route ID prefix to replace, e.g. `mudancas-recentes`. */
	from: string;
	/** Replacement prefix. Omit to point derived routes at the original page image. */
	to?: string;
}

export interface ThumbnailOptions extends ThumbnailStyle {
	enabled?: boolean;
	/** URL path without the Astro base. Defaults to `_seo`. */
	path?: string;
	format?: SocialImageFormat;
	quality?: number;
	/** Synthetic Starlight pages that are not part of the docs collection. */
	additionalPages?: Record<string, AdditionalThumbnailPage>;
	/** Reuse images for derived routes by mapping their route ID to a docs entry ID. */
	routeMappings?: ThumbnailRouteMapping[];
	/**
	 * Set to `true` to use `.cache/starlight-seo`, or provide a custom directory.
	 * No cache directory is created when this is `false` or omitted.
	 */
	cache?: boolean | { dir?: string };
}

export interface TwitterOptions {
	card?: 'summary' | 'summary_large_image';
	site?: string;
	creator?: string;
}

export interface OpenGraphOptions {
	type?: string;
	imageAlt?: string;
}

export interface StarlightSeoOptions {
	/** Site name used by Open Graph and JSON-LD. Defaults to the Starlight title. */
	siteName?: string;
	/** HTML title template. `%s` is replaced by the page title. Omit to keep Starlight's title. */
	titleTemplate?: string;
	defaultImage?: string;
	defaultImageAlt?: string;
	keywords?: string[];
	robots?: RobotsValue;
	twitter?: TwitterOptions;
	openGraph?: OpenGraphOptions;
	structuredData?: StructuredDataValue;
	thumbnails?: boolean | ThumbnailOptions;
}

export interface PageTwitterOptions extends TwitterOptions {
	title?: string;
	description?: string;
	image?: string | false;
	imageAlt?: string;
}

export interface PageSeoFrontmatter {
	title?: string;
	description?: string;
	canonical?: string;
	image?: string | false;
	imageAlt?: string;
	type?: string;
	keywords?: string | string[];
	robots?: RobotsValue;
	twitter?: PageTwitterOptions;
	structuredData?: StructuredDataValue;
	thumbnail?: false | ThumbnailStyle;
}

export interface NormalizedThumbnailOptions extends ThumbnailStyle {
	enabled: boolean;
	path: string;
	format: SocialImageFormat;
	canvasFormat: 'PNG' | 'JPEG' | 'WEBP';
	quality: number;
	cache: false | { dir: string };
	additionalPages: Record<string, AdditionalThumbnailPage>;
	routeMappings: Required<ThumbnailRouteMapping>[];
}

export interface RuntimeSeoConfig extends Omit<StarlightSeoOptions, 'thumbnails'> {
	root: string;
	base: string;
	site: string;
	siteName: string;
	thumbnails: NormalizedThumbnailOptions;
}
