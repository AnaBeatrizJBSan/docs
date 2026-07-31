import type { ThumbnailOptions } from '../types.ts';

export const defaultThumbnailOptions = {
	enabled: true,
	path: '_seo',
	format: 'png',
	quality: 90,
	bgGradient: [[9, 13, 26], [37, 17, 71]],
	border: { color: [169, 112, 255], width: 12, side: 'inline-start' },
	padding: 72,
	font: {
		title: { color: [255, 255, 255], size: 68, weight: 'ExtraBold', lineHeight: 1.05 },
		description: { color: [210, 201, 229], size: 32, weight: 'Normal', lineHeight: 1.3 },
	},
} satisfies ThumbnailOptions;
