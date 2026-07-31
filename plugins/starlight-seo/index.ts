import { AstroError } from 'astro/errors';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { fileURLToPath } from 'node:url';
import { normalizeOptions } from './src/config/normalize.ts';
import { createAstroSeoIntegration } from './src/integrations/astro.ts';
import type { StarlightSeoOptions } from './src/types.ts';

export type {
	OpenGraphOptions,
	PageSeoFrontmatter,
	RobotsOptions,
	SocialImageFormat,
	StarlightSeoOptions,
	StructuredDataOptions,
	ThumbnailOptions,
	ThumbnailStyle,
	TwitterOptions,
} from './src/types.ts';
export { seoSchema } from './src/schemas/seo.ts';

const defaultHead = '@astrojs/starlight/components/Head.astro';

export default function starlightSeo(options: StarlightSeoOptions = {}): StarlightPlugin {
	return {
		name: 'starlight-seo',
		hooks: {
			'config:setup'({ astroConfig, config, updateConfig, addIntegration }) {
				if (!astroConfig.site) {
					throw new AstroError(
						'[starlight-seo] The Astro `site` option is required.',
						'Social images, canonical URLs, and structured data require an absolute production URL.'
					);
				}

				const configuredHead = config.components?.Head;
				const isCustomHead = configuredHead && configuredHead !== defaultHead && configuredHead !== 'starlight-seo/components/Head.astro';

				const runtimeConfig = normalizeOptions(options, {
					root: astroConfig.root,
					base: astroConfig.base,
					site: astroConfig.site,
					starlightTitle: typeof config.title === 'string'
						? config.title
						: Object.values(config.title)[0] ?? 'Documentation',
				});
				addIntegration(createAstroSeoIntegration(runtimeConfig));
				if (!isCustomHead) {
					updateConfig({
						components: {
							...(config.components ?? {}),
							Head: 'starlight-seo/components/Head.astro',
						},
					});
				}
			},
		},
	};
}
