import type { AstroIntegration } from 'astro';
import type RecentChangesOptions from '../common/types.js';


export default function starlightRecentChangesIntegration(options: RecentChangesOptions = {}): AstroIntegration {
	const pluginConfig = {
		routeSlug: 'recent-changes',
		...options
	};

	const virtualModuleId = 'virtual:starlight-recent-changes-config';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	return {
		name: 'starlight-recent-changes-plugin',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectRoute }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'vite-plugin-starlight-recent-changes-config',
								resolveId(id) {
									if (id === virtualModuleId || id === 'virtual:starlight-recent-changes/config') {
										return resolvedVirtualModuleId;
									}
								},
								load(id) {
									if (id === resolvedVirtualModuleId) {
										return `export const config = ${JSON.stringify(pluginConfig)}; export default config;`;
									}
								},
							},
						],
					},
				});

				injectRoute({
					pattern: `/${pluginConfig.routeSlug}`,
					entrypoint: 'starlight-recent-changes/pages/RecentChanges.astro',
				})

				injectRoute({
					pattern: `/${pluginConfig.routeSlug}/[...page]`,
					entrypoint: 'starlight-recent-changes/pages/PageHistory.astro',
				})
			}
		}
	};
}
