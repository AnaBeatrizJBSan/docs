# Thumbnails do Wired Club

`thumbnail-transform.ts` é o pós-processamento do site configurado em `astro.config.mjs`. O plugin `starlight-seo` fornece a imagem base e os dados validados da página; toda regra sobre Wired, Habbo e composição com `sharp` fica neste diretório.

Páginas com infobox Wired visível recebem o ícone calculado por `getFurniIcon`, a mesma função utilizada pelo Infobox. Páginas gerais e páginas sintéticas mantêm a imagem base. `iconScale` e `iconMargin` controlam a ampliação inteira (6×) e o afastamento do topo e da direita (60 px).

O download tem timeout de 10 segundos e cache em `.cache/seo-furni-icons/`, identificado pela URL completa, incluindo a revisão do mobi. Para atualizar um recurso que mudou sem trocar de URL, remova o PNG correspondente desse cache. A composição é recalculada após a leitura do cache da imagem base, portanto mudanças de escala, margem ou código não exigem limpar o cache do plugin.

Falhas de download ou composição geram um aviso e preservam a imagem base; downloads inválidos não são persistidos. PNG mantém as cores sem quantização, enquanto JPEG e WebP seguem a qualidade configurada no SEO.

Validação: `npm run test:seo`, `npm run check:seo`, `npm run test:thumbnail`, `npm run check:thumbnail` e `npm run build`.
