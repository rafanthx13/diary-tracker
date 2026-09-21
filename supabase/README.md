# Configuração do Supabase

## 1. Criar o projeto

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor** e execute as migrações em ordem de nome: `20260920163000`, `20260920170000` e `20260920180000`.
3. Em **Authentication > Providers > Email**, desative novos cadastros públicos (Allow new users to sign up). Isso mantém o aplicativo privado.
4. Em **Authentication > Users**, crie manualmente a sua conta com e-mail e senha.

### Catálogo único

O Diary Tracker foi modelado para uma única conta. Por isso, **categorias e classificações não possuem `user_id`**: há apenas um catálogo compartilhado pela aplicação. Os registros de atividades continuam com `user_id`, garantindo que o diário só possa ser acessado depois do login.

### Se aparecer o erro `42501`

Se a aplicação mostrar `permission denied`, execute a migração mais recente de permissões no **SQL Editor**: `migrations/20260921010000_fix_activity_permissions.sql`. Ela permite registrar atividades para usuários autenticados e mantém o RLS, que limita cada atividade à própria conta.

### Aplicar a mudança de catálogo único em um projeto já criado

Execute `migrations/20260920180000_make_catalog_global.sql` no **SQL Editor**. Ela preserva os nomes atuais, remove os vínculos `user_id` de categorias e classificações e adiciona as classificações padrão que estiverem faltando.

### Ativar a TODO List

Execute `migrations/20260920190000_create_tasks.sql` no **SQL Editor**. Ela cria as tabelas de tarefas gerais e conclusões diárias, junto com as regras de segurança necessárias.

### Atualizar o catálogo de tempo

Execute `migrations/20260921000000_time_catalog_only.sql` depois das migrações anteriores. Ela prepara as categorias de tempo **TEMPO PERDIDO** e **WORK**, preenche a lista de classificações informada e remove categorias das tarefas.

### Corrigir permissões de atividades

Execute `migrations/20260921010000_fix_activity_permissions.sql` depois das demais migrações. Ela recria as permissões e políticas da tabela `activities` para que a conta autenticada possa criar, ler, editar e encerrar somente as próprias atividades.

### Ativar abas da TODO List

Execute `migrations/20260921020000_add_task_lists.sql` depois das demais migrações. Ela adiciona abas personalizadas para organizar tarefas gerais, sem ligação com o registro de tempo ou a rotina diária.

### Adicionar a categoria ROTINA QUARTO

Em instalações novas, execute `migrations/20260921030000_add_room_routine_category.sql`. Se você já executou a versão anterior dessa migração, execute `migrations/20260921040000_normalize_time_categories.sql` para corrigir o catálogo. Depois disso, use `/today/categories` para mover classificações existentes para **ROTINA QUARTO**.

### Ordenar abas e destacar tarefas importantes

Execute `migrations/20260921050000_task_priorities.sql`. Ela adiciona descrição e ordem manual às abas da TODO List e permite marcar tarefas gerais como importantes.

### Ativar Dados de Saúde

Execute `migrations/20260921060000_health_data.sql`. Ela cria os registros diários de peso, sessões de medidas corporais, partes do corpo personalizáveis e as respectivas regras de segurança.

### Importar medidas antigas do Excel

Na tela **Dados de Saúde > Minhas medidas corporais > Importar**, baixe o modelo CSV. O formato usa uma linha por medida: `date;body_part;value;unit;instructions`. Datas podem estar em `DD/MM/AAAA` ou `AAAA-MM-DD`; uma linha cuja parte do corpo seja `Peso` alimenta o histórico de peso em kg. Salve a planilha como CSV antes de enviá-la.

## 2. Configurar o ambiente local

1. Copie `.env.example` para `.env.local` na raiz do projeto.
2. No diálogo **Connect** do Supabase, copie o Project URL e a Publishable key.
3. Preencha as duas variáveis em `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Nunca use uma `service_role` ou Secret key no navegador, no `.env.example` ou em um commit.

## 3. Publicar na Vercel

No projeto da Vercel, crie as mesmas duas variáveis em **Settings > Environment Variables** para Production e Preview. Depois faça o deploy.

## Segurança aplicada

- Todas as tabelas usam Row Level Security (RLS).
- É necessário estar autenticado para acessar o catálogo e as atividades.
- Categorias e classificações são globais, pois a aplicação possui uma única conta.
- Atividades continuam vinculadas à conta autenticada.
- As Server Actions confirmam a identidade antes de alterar dados.
- A sessão é validada e renovada pelo `src/proxy.ts`.
