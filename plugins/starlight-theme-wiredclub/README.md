# starlight-theme-wiredclub

Tema privado do Starlight usado pela documentação do Wired Club. O plugin
aplica a identidade visual de [wiredclub.com.br](https://www.wiredclub.com.br/)
sem depender da estrutura ou do CSS Tailwind do site principal.

## Uso

```js
import starlightThemeWiredClub from 'starlight-theme-wiredclub';

starlight({
  plugins: [starlightThemeWiredClub()],
});
```

Os tokens `--wc-*` no início de `styles.css` são a fonte de verdade para a
paleta, superfícies, raios e sombras do tema.
