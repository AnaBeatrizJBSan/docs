// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt'
import starlightScrollToTop from 'starlight-scroll-to-top'
import starlightRecentChanges from 'starlight-recent-changes';
import starlightPageReader from 'starlight-page-reader';
import starlightThemeWiredClub from 'starlight-theme-wiredclub';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.wiredclub.com.br',
	base: '/',
	integrations: [
		starlight({
			title: 'Wired Club Docs',
			logo: {
				src: './src/assets/new_logo.png',
				replacesTitle: true,
			},
			description: 'Documentação oficial da comunidade Wired Club, o maior portal Wired!',
			
			locales: {
				root: {
					label: 'Português (Brasil)',
					lang: 'pt-BR',
				},
				'pt-BR': {
					label: 'Português (Brasil)',
					lang: 'pt-BR',
				},
			},
			social: [
				{ icon: 'external', label: 'Website', href: 'https://wiredclub.com.br/' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/wiredclub' },
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/wiredclub/docs' },
			],
			sidebar: [
				{
					label: 'Vamos Começar',
					items: [{ autogenerate: { directory: 'vamos-comecar' } },],
				}, {
					label: 'Guias práticos',
					items: [{ autogenerate: { directory: 'guias-praticos' } },],
				}, {
					label: 'Referência',
					items: [
						{
							label: 'Glossário de Termos',
							slug: 'referencia/glossario',
							badge: {
								text: "Novo",
								variant: "tip"
							},
						},
						{
							label: 'Tipos de Wired',
							slug: 'referencia/tipos-de-wireds',
							badge: {
								text: "Novo",
								variant: "tip"
							},
						},
						{
							label: 'Configurando Wireds',
							slug: 'referencia/configurando-wireds',
							badge: {
								text: "Novo",
								variant: "tip"
							},
						},
						{
							label: 'Ativadores',
							items: [{ autogenerate: { directory: 'referencia/ativadores' } }],
							collapsed: true,
						},
						{
							label: 'Efeitos',
							items: [{ autogenerate: { directory: 'referencia/efeitos' } }],
							collapsed: true,
						},
						{
							label: 'Condições',
							items: [{ autogenerate: { directory: 'referencia/condicoes' } }],
							collapsed: true,
						},
						{
							label: 'Seletores',
							items: [{ autogenerate: { directory: 'referencia/seletores' } }],
							collapsed: true,
						},
						{
							label: 'Extras',
							items: [{ autogenerate: { directory: 'referencia/extras' } }],
							collapsed: true,
						},
						{
							label: 'Variáveis',
							items: [{ autogenerate: { directory: 'referencia/variaveis' } }],
							collapsed: true,
						},
						{
							label: 'Contratos',
							items: [{ autogenerate: { directory: 'referencia/contratos' } }],
							collapsed: true,
						},
						{
							label: 'Outros',
							items: [{ autogenerate: { directory: 'referencia/outros' } }],
							collapsed: true,
						},
						{
							label: 'PseudoWired',
							slug: 'referencia/pseudowired',
							badge: {
								text: "Novo",
								variant: "tip"
							},
						},
					],
				}, {
					label: 'Sobre Nós',
					items: [
						{
							label: 'Wired Club',
							slug: 'sobre-nos/wired-club',
						}, 
						{
							label: 'Contribuidores',
							slug: 'sobre-nos/contribuidores',
						},
						{
							label: 'Como contribuir',
							slug: 'sobre-nos/como-contribuir',
						}, 
						{
							label: 'Mudanças Recentes',
							link: '/mudancas-recentes',
							badge: {
								text: "Novo",
								variant: "tip"
							}
						}
					],
				}
			],
			customCss: ['./src/styles/global-style.css'],
			editLink: {
				baseUrl: 'https://github.com/wiredclub/docs/edit/main/',
			},
      		lastUpdated: true,
			plugins: [starlightThemeWiredClub(), starlightLlmsTxt(), starlightPageReader({ pages: true }), starlightScrollToTop({
				tooltipText: 'Voltar ao topo',
				showTooltip: true,
				borderRadius: '50',
				showProgressRing: true,
				progressRingColor: 'white',
			}), starlightRecentChanges({
				routeSlug: 'mudancas-recentes',
			})],
		}),
	],
});
