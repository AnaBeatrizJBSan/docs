# starlight-recent-changes

Além das páginas de histórico, `starlight-recent-changes/activity` exporta duas consultas genéricas para componentes do site:

- `getPageContributors(filePath, root?)`: pessoas que participaram do arquivo, com nome, login/perfil GitHub quando identificável, avatar e `lastContributedAt`. A ordem é da contribuição mais recente para a mais antiga. Coautorias são incluídas, bots são omitidos e renomeações são acompanhadas.
- `getRecentlyUpdatedPages(pages, { root?, limit? })`: recebe páginas elegíveis com `id` e `filePath`, retorna uma entrada por página com `id`, `date` e `kind` (`add` ou `edit`). A classificação vem do status do arquivo no Git. O site decide quais páginas são públicas e como apresentar os resultados.

O histórico é compartilhado com a listagem de mudanças existente. O snapshot é reutilizado entre páginas e atualizado quando o Git ou os arquivos de identidades mudam. O build precisa do histórico completo (`fetch-depth: 0` no checkout). Sem Git disponível, as consultas retornam listas vazias e registram um aviso.

Identidades usam `.mailmap`, `.all-contributorsrc` e os endereços GitHub noreply. Pessoas sem login identificável não recebem um link de perfil inventado. A aparência e os termos específicos do site ficam fora deste plugin.

Validação: `npm run test:activity` e `npm run check:activity`.
