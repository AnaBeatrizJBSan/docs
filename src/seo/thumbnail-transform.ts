import type { ThumbnailTransform } from 'starlight-seo';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { getFurniIcon } from '../utils/furniImages.ts';

// Site presentation rules: preserve the original pixel art at an integer scale.
const iconScale = 6;
const iconMargin = 60;
const pendingIcons = new Map<string, Promise<Buffer>>();

const transform: ThumbnailTransform = async ({ image, page, root, format, quality }) => {
	const infobox = page.data?.infobox;
	if (!infobox || typeof infobox !== 'object' || !('type' in infobox)
		|| ('hide' in infobox && infobox.hide)
		|| !('classname' in infobox) || typeof infobox.classname !== 'string' || !infobox.classname
		|| !('revision' in infobox) || typeof infobox.revision !== 'number' || !Number.isInteger(infobox.revision)) return image;

	const url = getFurniIcon(infobox.classname, infobox.revision);
	try {
		const icon = await loadIcon(url, root);
		const { width, height } = await sharp(icon).metadata();
		if (!width || !height) throw new Error('O ícone não possui dimensões válidas.');
		const overlay = await sharp(icon).resize(width * iconScale, height * iconScale, { kernel: 'nearest' }).png().toBuffer();
		const base = sharp(image);
		const { width: baseWidth } = await base.metadata();
		const composed = base.composite([{
			input: overlay, top: iconMargin, left: baseWidth! - iconMargin - width * iconScale,
		}]);
		// PNG's quality option enables palette quantization, which alters pixel colors.
		return await (format === 'png' ? composed.png() : composed.toFormat(format, { quality })).toBuffer();
	} catch (error) {
		console.warn(`[seo-thumbnail] Não foi possível sobrepor o ícone de ${page.id}:`, error);
		return image;
	}
};

async function loadIcon(url: string, root: string): Promise<Buffer> {
	const file = path.join(root, '.cache', 'seo-furni-icons', `${createHash('sha256').update(url).digest('hex')}.png`);
	const existing = pendingIcons.get(file);
	if (existing) return existing;
	const pending = readOrDownloadIcon(url, file);
	pendingIcons.set(file, pending);
	try {
		return await pending;
	} finally {
		pendingIcons.delete(file);
	}
}

async function readOrDownloadIcon(url: string, file: string): Promise<Buffer> {
	try {
		return await readFile(file);
	} catch (error) {
		if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
	}
	const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	if (!response.ok) throw new Error(`HTTP ${response.status} ao baixar ${url}`);
	const image = Buffer.from(await response.arrayBuffer());
	// Do not persist HTML error pages or malformed images as successful downloads.
	await sharp(image).metadata();
	await mkdir(path.dirname(file), { recursive: true });
	const temporary = `${file}.${randomUUID()}.tmp`;
	try {
		await writeFile(temporary, image);
		await rename(temporary, file);
	} finally {
		await rm(temporary, { force: true });
	}
	return image;
}

export default transform;
