declare module 'virtual:starlight-seo/config' {
	const config: import('./types.ts').RuntimeSeoConfig;
	export const transformThumbnail: import('./types.ts').ThumbnailTransform | undefined;
	export default config;
}
