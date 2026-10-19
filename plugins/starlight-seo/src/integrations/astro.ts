import type { AstroIntegration } from 'astro';
import path from 'node:path';
import type { RuntimeSeoConfig } from '../types.ts';

/** Astro-side integration: expose serializable config and inject the static image endpoint. */
export function createAstroSeoIntegration(config: RuntimeSeoConfig): AstroIntegration {
	const virtualModuleId = 'virtual:starlight-seo/config';
	const resolvedVirtualModuleId = `\0${virtualModuleId}`;
	return {
		name: 'starlight-seo',
		hooks: {
			'astro:config:setup'({ injectRoute, updateConfig }) {
				updateConfig({
					vite: {
						plugins: [{
							name: 'vite-plugin-starlight-seo-config',
							resolveId(id) {
								if (id === virtualModuleId) return resolvedVirtualModuleId;
							},
							load(id) {
								if (id !== resolvedVirtualModuleId) return;
								const transform = config.thumbnails.transform;
								const transformExport = transform
									? `export { default as transformThumbnail } from ${JSON.stringify(path.resolve(config.root, transform).replace(/\\/g, '/'))};`
									: 'export const transformThumbnail = undefined;';
								return `export default ${JSON.stringify(config)};\n${transformExport}`;
							},
						}],
					},
				});

				if (config.thumbnails.enabled) {
					injectRoute({
						pattern: `/${config.thumbnails.path}/[...slug].${config.thumbnails.format}`,
						entrypoint: new URL('../runtime/endpoint.ts', import.meta.url),
						prerender: true,
					});
				}
			},
		},
	};
}
