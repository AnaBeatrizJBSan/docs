# starlight-seo

Plugin local para ampliar o SEO do Starlight e gerar uma imagem social para cada documento com [`astro-og-canvas`](https://github.com/delucis/astro-og-canvas/tree/latest/packages/astro-og-canvas).

Ele fornece:

- tags Open Graph, Twitter Cards, canonical, robots e keywords;
- JSON-LD do tipo `TechArticle` (ou outro tipo configurável);
- thumbnails estáticas de 1200×630 em PNG, JPEG ou WebP;
- configuração global no `astro.config.mjs` e sobrescritas por página no frontmatter;
- cache opcional invalidado pelo SHA-256 do Markdown/MDX, das opções visuais e dos assets locais usados na imagem.

## Organização

```text
starlight-seo/
├── index.ts                    # API do plugin Starlight
├── src/
│   ├── components/Head.astro  # override isolado do <head>
│   ├── config/                 # defaults e normalização
│   ├── integrations/          # módulo virtual e rota Astro
│   ├── runtime/               # endpoint, metadados e geração/cache
│   ├── schemas/               # schema para o frontmatter
│   └── types.ts               # API pública e configuração serializada
└── test/                       # testes do contrato, metadados e cache
```

## Configuração global

O plugin deve vir depois de plugins que também alterem `components`, pois o Starlight não faz merge profundo dessa opção.

```js
// astro.config.mjs
import starlightSeo from 'starlight-seo';

starlight({
  // ...
  plugins: [
    // outros plugins primeiro
    starlightSeo({
      titleTemplate: '%s | Wired Club Docs',
      keywords: ['Wired', 'Habbo'],
      robots: { index: true, follow: true, maxImagePreview: 'large' },
      structuredData: true,
      thumbnails: {
        cache: true, // cria .cache/starlight-seo
        path: '_seo',
        format: 'png',
		// Rotas derivadas reutilizam a imagem do documento original.
		routeMappings: [{ from: 'mudancas-recentes' }],
		// Rotas sintéticas recebem sua própria imagem.
		additionalPages: {
		  '404': { title: 'Página não encontrada' },
		},
        quality: 90,
        logo: { path: './src/assets/logo.png', size: [300] },
        bgGradient: [[9, 13, 26], [37, 17, 71]],
        border: { color: [169, 112, 255], width: 12, side: 'inline-start' },
        fonts: ['./src/assets/fonts/NotoSans-Regular.ttf'],
        font: {
          title: { families: ['Noto Sans'], size: 68, weight: 'ExtraBold' },
          description: { families: ['Noto Sans'], size: 32 },
        },
      },
    }),
  ],
});
```

O cache é desligado por padrão. `cache: true` usa `.cache/starlight-seo`; também é possível usar `cache: { dir: '.cache/meu-diretorio' }`. Cada manifesto em `pages/` guarda `sourceHash` e `hash`. O conteúdo renderizado fica em `renders/<hash>/`, onde o próprio `astro-og-canvas` mantém seu cache determinístico.

`routeMappings` cobre páginas derivadas que não precisam duplicar imagens. Por exemplo, `mudancas-recentes/guia/inicio` pode apontar para a imagem já gerada de `guia/inicio`. Use `additionalPages` para rotas que não pertencem à coleção `docs`, como 404, páginas de busca ou índices criados por outros plugins.

## Schema do conteúdo

```ts
// src/content.config.ts
import { seoSchema } from 'starlight-seo/schema';

docsSchema({
  extend: z.object({
    seo: seoSchema.optional(),
  }),
});
```

## Configuração por página

```yaml
---
title: Primeiro sistema
description: Descrição padrão da página.
seo:
  title: Primeiro sistema Wired no Habbo
  description: Descrição específica para buscadores e redes sociais.
  canonical: /guias/primeiro-sistema/
  keywords: [Wired, tutorial]
  robots:
    index: true
    follow: true
  type: article
  imageAlt: Tutorial de sistema Wired
  structuredData:
    type: HowTo
    data:
      educationalLevel: beginner
  twitter:
    creator: wiredclub
  thumbnail:
    title: Monte seu primeiro Wired
    description: Um guia prático da Wired Club.
    bgGradient: [[13, 18, 36], [73, 35, 120]]
    border:
      color: [255, 198, 70]
      width: 16
---
```

Casos especiais:

- `seo.image: /minha-imagem.png` usa uma imagem pronta e não gera thumbnail para a página;
- `seo.image: false` remove as imagens Open Graph e Twitter;
- `seo.thumbnail: false` desliga somente a geração e usa `defaultImage`, se configurada globalmente;
- `seo.twitter.image` pode sobrescrever apenas a imagem do Twitter.

O campo `head` nativo do Starlight continua disponível para tags arbitrárias. Quando a mesma tag também é controlada por `seo`, o valor estruturado de `seo` prevalece.
