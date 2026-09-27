# Avaliação de segurança — Diary Tracker

> Avaliação estática baseada no código e nas migrações disponíveis. Ela não confirma configurações já aplicadas no painel remoto do Supabase, nem substitui um teste de invasão.

## Resumo

A aplicação possui uma base adequada para um diário pessoal: autenticação pelo Supabase, verificação de sessão nas páginas e Server Actions, além de Row Level Security (RLS) nas tabelas privadas. O risco mais relevante é uma senha ou sessão comprometida, pois uma pessoa autenticada consegue acessar a área administrativa e exportar o backup completo.

## Entrada e autenticação

- Com o Supabase configurado, a rota `/` chama `requireUser()` e redireciona pessoas sem sessão para `/login`.
- As páginas pessoais também chamam `requireUser()`.
- O login usa e-mail e senha do Supabase e exibe uma mensagem genérica em caso de falha, sem indicar se o e-mail existe.
- O `proxy.ts` renova a sessão; as verificações efetivas continuam em cada página, Action e endpoint, o que evita depender apenas de uma proteção visual.

## Endpoints e rotas

| Área | Proteção observada | Avaliação |
| --- | --- | --- |
| `/login` | Pública por necessidade; autenticação é delegada ao Supabase | Adequada, mas ainda sem MFA e CAPTCHA |
| Páginas do diário, tarefas, saúde e anotações | `requireUser()` antes de ler dados | Adequada |
| Server Actions | As ações de alteração verificam autenticação; consultas/mutações também passam pelo RLS | Adequada |
| `/api/backups/personal-data` | Confere sessão com `getClaims()`, consulta por `user_id`, usa `Cache-Control: no-store` e `X-Content-Type-Options: nosniff` | Boa, porém é um recurso muito sensível |
| `/api/diagnostics/client-error` | Exige origem igual ao host, código fixo permitido e sessão autenticada | Boa |
| `/admin/*` | Exige autenticação | Adequada somente enquanto existir realmente uma única conta |
| Arquivos em `public/` | Templates e ícones públicos; não contêm dados pessoais | Sem risco relevante observado |

## Banco de dados e RLS

- As tabelas pessoais de atividades, tarefas, saúde, protocolos, anotações, erros e log de segurança possuem RLS e políticas por `user_id`.
- As funções de protocolo e restauração usam `security invoker`, mantendo as permissões da pessoa autenticada.
- A função de restauração fixa o `user_id` a partir de `auth.uid()` e executa como transação: um backup incompatível não deve gravar alterações parciais.
- Categorias e classificações são globais deliberadamente. Qualquer usuário autenticado pode alterá-las; isso não expõe dados pessoais, mas uma conta indevida poderia mudar o catálogo.

## Backup e restauração

Pontos positivos:

- O download inclui somente registros da conta autenticada.
- Não inclui senha, sessão, chaves do Supabase ou dados de outras contas.
- A restauração valida o formato do arquivo, exige confirmação textual e oferece modos de mesclagem ou substituição.
- A operação do banco é atômica.

Riscos e observações:

- Uma sessão roubada permite baixar o JSON completo do diário.
- A confirmação `RESTAURAR` é uma proteção de interface: alguém com sessão válida poderia chamar a Action diretamente.
- O backup é baixado por `GET`. Um site externo não deve conseguir ler o conteúdo por causa da política de mesma origem, mas pode induzir o navegador autenticado a iniciar um download.
- O arquivo JSON baixado é sensível e deve ser guardado em local criptografado.

## Diagnóstico e log de segurança

- `app_error_events` guarda apenas horário, origem, código e gravidade; não armazena mensagem, stack trace, URL, payload ou conteúdo pessoal.
- O log de segurança registra login bem-sucedido e ações da área de backup.
- Ele pode guardar IP encaminhado, navegador, idioma, plataforma, dispositivo móvel, host e HTTPS.
- Senhas, cookies, tokens, dados de formulário e conteúdo do backup não são gravados.
- O log é privado por RLS e a interface não permite editar ou excluir eventos.
- O log não é forense/inviolável: uma pessoa autenticada pode inserir eventos próprios pela API do banco. IP e `User-Agent` também são metadados informativos, não prova absoluta de identidade.

## Pontos positivos observados

- Uso de `getClaims()` em vez de confiar apenas em dados locais de sessão.
- RLS em tabelas privadas e filtros adicionais por `user_id` nas consultas.
- Variáveis de ambiente ignoradas pelo Git; nenhum arquivo de segredo rastreado foi encontrado.
- A chave usada pela aplicação é a Publishable key, não uma `service_role`.
- O Markdown não habilita HTML bruto e os links externos usam `rel="noreferrer noopener"`.
- Server Actions mantêm a proteção padrão de origem do Next.js; nenhuma origem externa adicional foi configurada.

## Prioridades recomendadas

### 1. MFA e reautenticação para backup

Implementar MFA TOTP e exigir um segundo fator, ou reentrada recente da senha, para:

- entrar em `/admin`;
- baixar backup;
- restaurar backup.

Essa é a melhoria de maior impacto, porque reduz a consequência de senha ou sessão comprometida.

### 2. Confirmar a configuração do Supabase

No painel do projeto, revisar:

- novos cadastros desativados;
- login anônimo desativado;
- somente provedores de login necessários ativos;
- confirmação de e-mail habilitada;
- URLs de redirecionamento restritas ao domínio real;
- política de senha forte e bloqueio de senhas vazadas;
- rate limits de autenticação reduzidos;
- CAPTCHA/Cloudflare Turnstile no login.

### 3. Separar explicitamente o único administrador

Criar uma regra explícita para o único `user_id` autorizado a acessar administração, backup, restauração e alteração do catálogo global. Hoje qualquer conta autenticada teria esse acesso.

### 4. Reforçar o endpoint de backup

- Preferir exportação por `POST` com confirmação, em vez de link `GET`.
- Pedir reautenticação recente ou MFA antes de exportar/restaurar.
- Considerar uma confirmação adicional e registrar toda operação administrativa.

### 5. Adicionar headers de segurança

Configurar e testar no `next.config.ts`:

- `Strict-Transport-Security` em produção HTTPS;
- `X-Frame-Options: DENY` ou CSP com `frame-ancestors 'none'`;
- `X-Content-Type-Options: nosniff` global;
- `Referrer-Policy: strict-origin-when-cross-origin` ou mais restrita;
- `Permissions-Policy` mínima;
- Content Security Policy (CSP) compatível com Supabase e fontes usadas pela aplicação.

### 6. Política de retenção e backup seguro

- Definir retenção de 90 ou 180 dias para IP e `User-Agent` no log de segurança.
- Guardar os backups JSON em armazenamento criptografado.
- Testar periodicamente a restauração em ambiente separado, usando uma cópia sem dados reais quando possível.

### 7. Auditoria contínua

- Executar o Security Advisor do Supabase depois de cada migração relevante.
- Criar testes de RLS para usuário proprietário e usuário não proprietário.
- Configurar auditoria de dependências em CI (`npm audit` ou serviço equivalente).
- Manter Next.js e dependências atualizados.

## Pontos que precisam de verificação externa

O repositório não permite confirmar:

- se todas as migrações foram aplicadas no Supabase remoto;
- se novos cadastros e login anônimo estão desativados;
- se há contas além da conta pessoal esperada;
- a configuração de HTTPS, domínio, WAF e rate limiting do ambiente publicado;
- as configurações de MFA e sessão do Supabase;
- vulnerabilidades atuais de dependências — a tentativa de `npm audit` local não concluiu por bloqueio de rede.

## Referências oficiais

- [Autenticação e autorização — Next.js](https://nextjs.org/docs/app/guides/authentication)
- [Server Actions — Next.js](https://nextjs.org/docs/app/getting-started/mutating-data)
- [Headers de segurança — Next.js](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers)
- [RLS — Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Security Advisor — Supabase](https://supabase.com/docs/guides/database/database-advisors?lint=0016_materialized_view_in_api&queryGroups=lint)
- [Rate limits — Supabase Auth](https://supabase.com/docs/guides/auth/rate-limits)
- [MFA TOTP — Supabase](https://supabase.com/docs/guides/auth/auth-mfa/totp)
