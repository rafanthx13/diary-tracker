# Configuração do Supabase

## 1. Criar o projeto

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor** e execute as migrações em ordem de nome: `20260920163000`, `20260920170000` e `20260920180000`.
3. Em **Authentication > Providers > Email**, desative novos cadastros públicos (Allow new users to sign up). Isso mantém o aplicativo privado.
4. Em **Authentication > Users**, crie manualmente a sua conta com e-mail e senha.

### Catálogo único

O Diary Tracker foi modelado para uma única conta. Por isso, **categorias e classificações não possuem `user_id`**: há apenas um catálogo compartilhado pela aplicação. Os registros de atividades continuam com `user_id`, garantindo que o diário só possa ser acessado depois do login.

### Se aparecer o erro `42501`

Se a aplicação mostrar `permission denied for table classifications`, execute também `migrations/20260920170000_grant_authenticated_access.sql` no **SQL Editor**. Essa correção concede acesso ao papel autenticado sem remover o RLS.

### Aplicar a mudança de catálogo único em um projeto já criado

Execute `migrations/20260920180000_make_catalog_global.sql` no **SQL Editor**. Ela preserva os nomes atuais, remove os vínculos `user_id` de categorias e classificações e adiciona as classificações padrão que estiverem faltando.

### Ativar a TODO List

Execute `migrations/20260920190000_create_tasks.sql` no **SQL Editor**. Ela cria as tabelas de tarefas gerais e conclusões diárias, junto com as regras de segurança necessárias.

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
