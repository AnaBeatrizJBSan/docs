import { z } from 'astro/zod';

const rgbSchema = z.tuple([z.number().int().min(0).max(255), z.number().int().min(0).max(255), z.number().int().min(0).max(255)]);
const positionSchema = z.enum(['start', 'center', 'end']);
const fontWeightSchema = z.enum([
	'Invisible', 'Thin', 'ExtraLight', 'Light', 'Normal', 'Medium',
	'SemiBold', 'Bold', 'ExtraBold', 'Black', 'ExtraBlack',
]);

const fontConfigSchema = z.object({
	color: rgbSchema.optional(),
	size: z.number().positive().optional(),
	weight: fontWeightSchema.optional(),
	lineHeight: z.number().positive().optional(),
	families: z.array(z.string()).optional(),
});

const robotsSchema = z.object({
	index: z.boolean().optional(),
	follow: z.boolean().optional(),
	noarchive: z.boolean().optional(),
	nosnippet: z.boolean().optional(),
	noimageindex: z.boolean().optional(),
	maxSnippet: z.number().int().optional(),
	maxImagePreview: z.enum(['none', 'standard', 'large']).optional(),
	maxVideoPreview: z.number().int().optional(),
});

const structuredDataSchema = z.object({
	type: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
});

const thumbnailStyleSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	dir: z.enum(['ltr', 'rtl']).optional(),
	logo: z.union([
		z.literal(false),
		z.object({ path: z.string(), size: z.tuple([z.number().optional(), z.number().optional()]).optional() }),
	]).optional(),
	bgGradient: z.array(rgbSchema).min(1).optional(),
	bgImage: z.object({
		path: z.string(),
		fit: z.enum(['cover', 'contain', 'none', 'fill']).optional(),
		position: z.union([positionSchema, z.tuple([positionSchema, positionSchema])]).optional(),
	}).optional(),
	border: z.object({
		color: rgbSchema.optional(),
		width: z.number().nonnegative().optional(),
		side: z.enum(['block-start', 'inline-end', 'block-end', 'inline-start']).optional(),
	}).optional(),
	padding: z.number().nonnegative().optional(),
	font: z.object({ title: fontConfigSchema.optional(), description: fontConfigSchema.optional() }).optional(),
	fonts: z.array(z.string()).optional(),
});

/** Schema to merge into `docsSchema({ extend: ... })`. */
export const seoSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	canonical: z.string().optional(),
	image: z.union([z.string(), z.literal(false)]).optional(),
	imageAlt: z.string().optional(),
	type: z.string().optional(),
	keywords: z.union([z.string(), z.array(z.string())]).optional(),
	robots: z.union([z.string(), robotsSchema]).optional(),
	twitter: z.object({
		card: z.enum(['summary', 'summary_large_image']).optional(),
		site: z.string().optional(),
		creator: z.string().optional(),
		title: z.string().optional(),
		description: z.string().optional(),
		image: z.union([z.string(), z.literal(false)]).optional(),
		imageAlt: z.string().optional(),
	}).optional(),
	structuredData: z.union([z.boolean(), structuredDataSchema]).optional(),
	thumbnail: z.union([z.literal(false), thumbnailStyleSchema]).optional(),
});
