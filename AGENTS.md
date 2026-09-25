<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Diary Tracker — contexto do projeto

## Propósito

Aplicação pessoal, em português do Brasil, para registrar e consultar:

- atividades temporizadas do diário;
- tarefas gerais e tarefas diárias recorrentes;
- peso e medidas corporais;
- protocolos ordenados e anotações em Markdown.

O projeto é pensado para uma única pessoa. A interface deve continuar simples, responsiva e adequada ao uso rápido no celular.

## Stack e comandos

- Next.js 16, React 19, TypeScript estrito e Tailwind CSS 4;
- Supabase para autenticação, banco de dados e RLS;
- App Router em `src/app`; imports usam o alias `@/*`;
- `react-markdown` e `remark-gfm` renderizam as notas Markdown.

```bash
npm run dev      # desenvolvimento
npm run lint     # ESLint
npm run build    # build de produção
npm run start    # servir o build
```

Antes de alterar código Next.js, leia a documentação relevante instalada em `node_modules/next/dist/docs/`, conforme o bloco obrigatório acima. Em particular, preserve os padrões atuais de Server Components, Server Actions e `proxy.ts` — esta versão do Next tem convenções diferentes.

## Estrutura relevante

```text
src/app/
  actions.ts                       # ações de autenticação, tempo e tarefas
  today/                           # diário de atividades temporizadas
  categories/                      # catálogo de categorias/classificações de tempo
  tasks/                           # TODO List e relatório mensal
  diary-task/                      # tarefas recorrentes diárias e relatórios
  health-data/                     # peso, medidas e importação CSV
  annotations/                     # protocolos e notas Markdown
src/lib/
  supabase/                        # clientes, ambiente e renovação de sessão
  auth.ts                          # requireUser()
  diary.ts, tasks.ts, health.ts    # tipos e utilitários de domínio
  time-reports.ts, annotations.ts  # agregações e tipos
src/components/                    # navegação, gráfico de saúde e renderizador Markdown
supabase/migrations/               # esquema, RLS, funções e evolução do banco
docs/                              # documentação de produto e roadmap
```

## Rotas e módulos entregues

| Rota | Responsabilidade |
| --- | --- |
| `/` | painel inicial dos módulos e estado de configuração do Supabase |
| `/login` | login por e-mail e senha |
| `/today` | atividades do dia do diário; iniciar, encerrar, inserir manualmente, editar e excluir |
| `/today/categories` | consultar categorias fixas e criar/editar/vincular classificações |
| `/today/reports/[period]` | relatórios de tempo por dia, semana, mês, ano e total |
| `/tasks` | TODO List com abas, descrição/ordem de abas, prioridade e conclusão |
| `/tasks/reports` | tarefas gerais concluídas por mês (redireciona para a rota canônica) |
| `/diary-task` | tarefas recorrentes por data, com conclusão independente para cada dia |
| `/diary-task/reports/[period]` | frequência e matriz de conclusões diárias |
| `/health-data` | entrada do módulo Saúde |
| `/health-data/weight` | registro diário de peso e histórico recente |
| `/health-data/weight/reports` | evolução, métricas e gráfico de peso |
| `/health-data/measurements` | sessão de medidas por data |
| `/health-data/measurements/types` | cadastro de partes do corpo, instruções e unidades |
| `/health-data/measurements/reports` | evolução e estatísticas por parte do corpo |
| `/health-data/measurements/import` | importação de CSV e modelo em `public/templates/` |
| `/annotations` | entrada de protocolos e anotações |
| `/annotations/protocols` | protocolos com demandas ordenáveis |
| `/annotations/notes` | notas livres em Markdown |

Redirecionamentos legados estão em `next.config.ts`: `/categories` → `/today/categories`, `/reports/*` → `/today/reports/*` e `/tasks/completed` → `/tasks/reports`.

## Domínios e regras importantes

### Atividades temporizadas

- `activities` pertence ao usuário autenticado e uma pessoa só pode ter uma atividade em andamento.
- Períodos encerrados não podem se sobrepor; preserve o tratamento dos erros PostgreSQL para esses casos.
- O fuso é `America/Sao_Paulo`. O dia do diário vira às **05:00**: atividades iniciadas entre 00:00 e 04:59 usam o `diary_date` do dia anterior.
- Categorias e classificações pertencem apenas a este módulo. Categorias são globais/fixas; classificações podem ficar sem categoria e podem ser criadas ou reorganizadas na interface.
- Os relatórios somam apenas atividades encerradas, por atividade, classificação e categoria.

### Tarefas

- `tasks.is_daily = false` representa a TODO List. Pode ter `task_list_id`, importância e `completed_at`.
- `task_lists` organiza apenas tarefas gerais. Cada aba é privada por usuário e possui nome, descrição e `sort_order`.
- `tasks.is_daily = true` representa uma rotina. A conclusão não fica em `tasks.completed_at`, mas em `daily_task_completions`, única por `(task_id, completed_on)`.
- Datas futuras não podem receber conclusão diária. A conclusão usa a data de São Paulo.
- Não misture categorias/classificações de tempo com tarefas.

### Saúde

- Há no máximo um registro de peso por usuário e data (`health_weight_entries`). Salvar a mesma data atualiza o registro.
- Uma sessão de medidas (`body_measurement_sessions`) também é única por data; seus valores ficam em `body_measurement_values`.
- Tipos de medida são privados por usuário e guardam nome, instrução, unidade e ordem.
- A importação aceita CSV de até 2 MB, com `date;body_part;value;unit;instructions`; `Peso` é direcionado ao histórico de peso. Mantenha as validações de datas e decimais.

### Anotações

- Protocolos e suas demandas são privados por usuário. Criação e atualização usam as RPCs transacionais `create_protocol_with_demands` e `update_protocol_with_demands`.
- A ordem das demandas é significativa; o formulário permite reorganização por arrastar ou pelo campo numérico.
- Notas têm título e conteúdo Markdown. A exibição passa por `MarkdownContent`; ao ampliar o Markdown, considere segurança de links e conteúdo não confiável.

## Dados, autenticação e segurança

- As variáveis obrigatórias são `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use `.env.example` como referência; nunca exponha uma chave `service_role`.
- `hasSupabaseEnv()` permite renderizar a tela de configuração quando o ambiente ainda não foi preparado.
- Páginas protegidas chamam `requireUser()`. As mutações são Server Actions e também verificam a identidade.
- `src/proxy.ts` delega a renovação da sessão para `src/lib/supabase/proxy.ts`; não remova essa integração ao mexer em autenticação.
- RLS é obrigatório em todas as tabelas privadas. Categorias e classificações são exceções deliberadas: o catálogo é global, mas disponível apenas a pessoas autenticadas.
- Mudanças de banco devem ser novas migrações incrementais em `supabase/migrations/`; não edite migrações já aplicadas. Atualize `supabase/README.md` se houver novo passo de configuração.

## Convenções de implementação

- Prefira Server Components para busca de dados e Server Actions para mutações. Componentes com estado de navegador começam com `"use client"`.
- Após uma mutação, revalide todas as rotas afetadas com `revalidatePath`; reutilize os helpers de revalidação existentes quando possível.
- Valide `FormData` no servidor, filtre mutações por `user_id` e mantenha os limites de tamanho presentes nas ações.
- O projeto usa data/hora ISO no banco e formatação `pt-BR` na interface. Não crie cálculos de data com o fuso local implícito quando houver um helper em `src/lib/`.
- Preserve a acessibilidade existente: `label`, `aria-label`, estados vazios e confirmações antes de exclusões.
- Não introduza dependências, serviços externos ou mudanças de escopo sem necessidade explícita.

## Verificação

- Para alterações de TypeScript/React, execute ao menos `npm run lint`; execute `npm run build` quando a mudança afetar rotas, tipos do Next, configuração ou build.
- Para alterações de esquema, revise a migração, as políticas RLS, os índices e os caminhos de erro da interface. A aplicação de migrações no projeto Supabase é uma etapa externa e manual.
- Consulte `docs/ROADMAP.md` para o retrato de funcionalidades já entregues e ideias ainda não implementadas. `docs/todo-list-plan.md` é um documento histórico de planejamento do módulo de tarefas; o código e as migrações são a fonte de verdade do estado atual.
