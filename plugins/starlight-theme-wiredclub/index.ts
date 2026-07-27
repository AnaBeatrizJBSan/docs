import type { StarlightPlugin } from '@astrojs/starlight/types';

/**
 * Wired Club's private Starlight theme.
 *
 * Keeping the theme behind a plugin makes its cascade order predictable and
 * leaves the documentation config free of presentation-specific details.
 */
export default function starlightThemeWiredClub(): StarlightPlugin {
	return {
		name: 'starlight-theme-wiredclub',
		hooks: {
			'config:setup'({ config, updateConfig }) {
				updateConfig({
					customCss: [...(config.customCss ?? []), 'starlight-theme-wiredclub/styles.css'],
				});
			},
		},
	};
}
