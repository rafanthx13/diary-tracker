# Implementação feita pela IA — administração, backup e segurança

## Objetivo solicitado

Foram implementados um fluxo de backup/restauração dos registros pessoais, monitoramento privado de erros e uma trilha de segurança para logins e ações da área de backup.

## O que foi criado

### Área privada de administração

- Rota `/admin` com acesso autenticado.
- Rota `/admin/data` para download e restauração de backups.
- Rota `/admin/diagnostics` para diagnóstico técnico sem dados pessoais.
- Rota `/admin/security` para revisar a trilha de acessos sensíveis.
- Link **Admin** na barra de navegação.

### Backup e restauração

- Endpoint autenticado `/api/backups/personal-data` que baixa um arquivo JSON.
- O backup inclui os registros pessoais de atividades, tarefas, rotina diária, peso, medidas, protocolos e anotações.
- Senha, sessão, chaves do Supabase, `user_id` e dados de outras contas não entram no arquivo.
- O backup traz uma versão e listas esperadas, validadas antes da restauração.
- A importação aceita arquivos de até 8 MB; o limite de Server Actions foi configurado para 9 MB, considerando o overhead do envio de arquivo.
- Há dois modos de restauração:
  - **Mesclar dados:** adiciona ou atualiza registros do backup e preserva os demais dados atuais.
  - **Substituir todos os dados pessoais:** remove os registros atuais antes de restaurar, após confirmação textual `RESTAURAR`.
- A rotina SQL de restauração é transacional: se ocorrer incompatibilidade ou erro de integridade, nenhuma alteração parcial é gravada.
- O catálogo de categorias/classificações de tempo não é exportado porque é global na aplicação; ele deve existir no ambiente antes de restaurar um backup.

### Diagnóstico de erros

- Nova tabela `app_error_events`, protegida por RLS, para eventos técnicos.
- Armazena apenas horário, origem, código e gravidade.
- Não armazena mensagem de erro, stack trace, payload, URL, identidade ou conteúdo pessoal.
- Error boundaries do Next (`src/app/error.tsx` e `src/app/global-error.tsx`) registram erros de renderização por digest/código.
- `src/instrumentation-client.ts` registra erros globais do navegador e promessas rejeitadas com códigos fixos, sem enviar o texto do erro.
- A tela de diagnóstico mostra os 50 eventos mais recentes e agregados simples.

### Log de segurança

- Nova tabela `security_access_events`, com RLS e sem permissão de update/delete para usuários autenticados.
- Eventos registrados nesta primeira etapa:
  - login bem-sucedido;
  - abertura da área de backup;
  - download de backup;
  - início, sucesso ou falha de uma restauração.
- Para esses eventos, são guardados: data/hora, IP encaminhado pelo provedor, user-agent, idioma aceito, plataforma/navegador informado, indicação de dispositivo móvel, host e indicação de HTTPS.
- Não são guardados: senha, cookie, token, dados preenchidos no formulário, conteúdo do backup ou URL com parâmetros.
- A trilha é exibida somente em `/admin/security`, para a conta autenticada.

## Migrações que precisam ser aplicadas no Supabase

Execute na ordem indicada:

1. `supabase/migrations/20260925010000_add_observability_and_backup_restore.sql`
2. `supabase/migrations/20260925020000_add_security_access_log.sql`

As instruções também foram acrescentadas em `supabase/README.md`.

## Arquivos principais alterados ou adicionados

- `src/app/admin/` — páginas e Server Action de restauração.
- `src/app/api/backups/personal-data/route.ts` — download do backup.
- `src/app/api/diagnostics/client-error/route.ts` — registro controlado de erros de navegador.
- `src/lib/personal-backup.ts` — formato, limite e validação do backup.
- `src/lib/diagnostics.ts` — persistência sem dados pessoais.
- `src/lib/security-access-log.ts` — persistência limitada de eventos de acesso.
- `src/app/error.tsx`, `src/app/global-error.tsx` e `src/instrumentation-client.ts` — captura de erros.
- `supabase/migrations/20260925010000_add_observability_and_backup_restore.sql` — banco para diagnóstico/restauração.
- `supabase/migrations/20260925020000_add_security_access_log.sql` — banco para log de segurança.

## Verificação realizada

- ESLint executado com o binário local do projeto.
- TypeScript executado sem emissão.
- `next build` concluído com sucesso.
