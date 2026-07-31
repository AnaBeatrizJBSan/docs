import { generateOpenGraphImage, type OGImageOptions } from 'astro-og-canvas';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { PageSeoFrontmatter, RuntimeSeoConfig, ThumbnailStyle } from '../types.ts';

const cacheVersion = '1';

export interface ThumbnailPage {
	id: string;
	title: string;
	description?: string;
	filePath?: string;
	seo?: PageSeoFrontmatter;
}

export interface ThumbnailResult {
	body: BodyInit;
	hash: string;
	sourceHash: string;
	cache: 'disabled' | 'hit' | 'miss';
}

/** Render with astro-og-canvas and scope its cache to a hash of the source file. */
export async function renderPageThumbnail(
	page: ThumbnailPage,
	config: RuntimeSeoConfig
): Promise<ThumbnailResult> {
	const imageOptions = toOgImageOptions(page, config);
	const { hash, sourceHash } = await pageHashes(page, imageOptions);

	if (!config.thumbnails.cache) {
		return {
			body: await generateOpenGraphImage({ ...imageOptions, cacheDir: false }),
			hash,
			sourceHash,
			cache: 'disabled',
		};
	}

	const cacheRoot = config.thumbnails.cache.dir;
	const renderDir = path.join(cacheRoot, 'renders', hash);
	const metadataPath = path.join(cacheRoot, 'pages', `${safeCacheName(page.id)}.json`);
	const cacheHit = await hasValidCache(metadataPath, renderDir, hash, config.thumbnails.format);
	const body = await generateOpenGraphImage({ ...imageOptions, cacheDir: renderDir });

	await mkdir(path.dirname(metadataPath), { recursive: true });
	await atomicWrite(metadataPath, JSON.stringify({
		version: cacheVersion,
		page: page.id,
		source: page.filePath ? path.relative(config.root, page.filePath).replace(/\\/g, '/') : null,
		sourceHash,
		hash,
		renderDirectory: path.relative(cacheRoot, renderDir).replace(/\\/g, '/'),
	}, null, 2));

	return { body, hash, sourceHash, cache: cacheHit ? 'hit' : 'miss' };
}

export function toOgImageOptions(page: ThumbnailPage, config: RuntimeSeoConfig): OGImageOptions {
	const pageStyle: ThumbnailStyle = typeof page.seo?.thumbnail === 'object'
		? page.seo.thumbnail
		: {};
	const globalStyle = config.thumbnails;
	const logo = pageStyle.logo === false
		? undefined
		: pageStyle.logo ?? (globalStyle.logo === false ? undefined : globalStyle.logo);
	const bgImage = pageStyle.bgImage ?? globalStyle.bgImage;
	const fonts = pageStyle.fonts ?? globalStyle.fonts;

	return {
		title: pageStyle.title ?? page.seo?.title ?? page.title,
		description: pageStyle.description ?? page.seo?.description ?? page.description,
		dir: pageStyle.dir ?? globalStyle.dir,
		logo: logo ? { ...logo, path: resolveAssetPath(logo.path, config.root) } : undefined,
		bgGradient: pageStyle.bgGradient ?? globalStyle.bgGradient,
		bgImage: bgImage ? { ...bgImage, path: resolveAssetPath(bgImage.path, config.root) } : undefined,
		border: { ...globalStyle.border, ...pageStyle.border },
		padding: pageStyle.padding ?? globalStyle.padding,
		font: {
			title: { ...globalStyle.font?.title, ...pageStyle.font?.title },
			description: { ...globalStyle.font?.description, ...pageStyle.font?.description },
		},
		fonts: fonts?.map((font) => resolveAssetPath(font, config.root)),
		format: globalStyle.canvasFormat,
		quality: globalStyle.quality,
	};
}

async function pageHashes(
	page: ThumbnailPage,
	imageOptions: OGImageOptions
): Promise<{ sourceHash: string; hash: string }> {
	const source = page.filePath ? await readFile(page.filePath) : Buffer.from(JSON.stringify(page));
	const sourceHash = createHash('sha256').update(source).digest('hex');
	const hash = createHash('sha256');
	hash.update(`starlight-seo:${cacheVersion}\0${page.id}\0${sourceHash}\0`);
	hash.update(stableStringify({ ...imageOptions, cacheDir: undefined }));

	for (const asset of localAssets(imageOptions)) {
		hash.update('\0');
		hash.update(asset);
		hash.update('\0');
		hash.update(await readFile(asset));
	}
	return { sourceHash, hash: hash.digest('hex') };
}

function localAssets(options: OGImageOptions): string[] {
	return [options.logo?.path, options.bgImage?.path, ...(options.fonts ?? [])]
		.filter((asset): asset is string => typeof asset === 'string' && !/^https?:\/\//i.test(asset));
}

function resolveAssetPath(asset: string, root: string): string {
	if (/^(?:https?:\/\/|file:)/i.test(asset)) return asset;
	if (path.isAbsolute(asset)) return asset;
	return asset.startsWith('/')
		? path.join(root, 'public', asset.replace(/^\/+/, ''))
		: path.resolve(root, asset);
}

async function hasValidCache(
	metadataPath: string,
	renderDir: string,
	hash: string,
	format: RuntimeSeoConfig['thumbnails']['format']
): Promise<boolean> {
	try {
		const metadata = JSON.parse(await readFile(metadataPath, 'utf8')) as { hash?: string };
		if (metadata.hash !== hash) return false;
		const extension = format === 'jpeg' ? '.jpeg' : `.${format}`;
		return (await readdir(renderDir)).some((file) => file.endsWith(extension));
	} catch (error) {
		if (isMissingFile(error) || error instanceof SyntaxError) return false;
		throw error;
	}
}

function safeCacheName(id: string): string {
	const readable = id.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'index';
	return `${readable.slice(0, 80)}-${createHash('sha1').update(id).digest('hex').slice(0, 10)}`;
}

async function atomicWrite(filePath: string, contents: string): Promise<void> {
	const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(temporary, contents);
	try {
		await rename(temporary, filePath);
	} catch {
		// Windows cannot always replace an existing file atomically.
		await writeFile(filePath, contents);
	}
}

function stableStringify(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.entries(value)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
			.join(',')}}`;
	}
	return JSON.stringify(value) ?? 'undefined';
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
