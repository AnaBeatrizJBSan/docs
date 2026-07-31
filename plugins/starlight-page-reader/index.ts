import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { PageReaderOptions } from './common/types.ts';

export type { PageReaderOptions } from './common/types.ts';

export default function starlightPageReader(options: PageReaderOptions = {}): StarlightPlugin {
	const pages = options.pages ?? true;
	return {
		name: 'starlight-page-reader',
			hooks: {
			'config:setup': ({ config, updateConfig, addIntegration }) => {
				const componentOverrides: typeof config.components = {};

				if (config.components?.PageSidebar && config.components.PageSidebar !== '@astrojs/starlight/components/PageSidebar.astro') {
					console.warn(
						'It looks like you already have a `PageSidebar` component override in your Starlight configuration.',
					);
					console.warn(
						'To use `starlight-page-reader`, either remove the override or manually render `starlight-page-reader/overrides/PageSidebar.astro`.',
					);
				} else {
					componentOverrides.PageSidebar = 'starlight-page-reader/overrides/PageSidebar.astro';
				}
				addIntegration({
					name: 'starlight-page-reader-config',
					hooks: {
						'astro:config:setup': ({ updateConfig: updateAstroConfig }) => {
							updateAstroConfig({ vite: { define: { __STARLIGHT_PAGE_READER_PAGES__: JSON.stringify(pages) } } });
						},
					},
				});
					updateConfig({
						components: {
							...componentOverrides,
							...config.components,
						}
					});
			},
		},
	};
}
