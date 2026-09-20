# Meu Diário

Aplicação inicial para um diário pessoal. Ela foi criada com **Next.js**, **TypeScript** e **Tailwind CSS** e está preparada para receber o Supabase como banco de dados e autenticação no próximo passo.

## Tecnologias escolhidas

- **Next.js**: framework React que organiza páginas, rotas e renderização.
- **TypeScript**: adiciona tipos ao JavaScript e ajuda a evitar erros durante o desenvolvimento.
- **Tailwind CSS**: permite estilizar a interface com classes utilitárias diretamente nos componentes.
- **Supabase**: será usado depois para banco de dados, autenticação e armazenamento dos dados do diário.

## O que foi feito, passo a passo

1. Criei uma pasta vazia para o projeto, chamada `diary-tracker`.
2. Executei o gerador oficial do Next.js com este comando:

   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
   ```

3. O gerador criou a configuração do Next.js, TypeScript, ESLint e Tailwind CSS.
4. Escolhi o **App Router** (`--app`), a forma atual do Next.js de organizar rotas com arquivos e pastas.
5. Escolhi a pasta `src/` (`--src-dir`) para manter o código da aplicação separado das configurações do projeto.
6. Substituí a página padrão por uma tela inicial do “Meu Diário”, usando classes do Tailwind CSS.
7. Atualizei o título e a descrição da aba do navegador em `src/app/layout.tsx`.

## Como executar

Após a instalação das dependências terminar, execute:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador. Para encerrar o servidor, use `Ctrl + C` no terminal.

## Estrutura inicial

```text
src/
  app/
    globals.css      # estilos globais e Tailwind
    layout.tsx       # estrutura comum e metadados
    page.tsx         # página inicial
public/              # arquivos estáticos
```

## Próximo passo: conectar o Supabase

Para conectar o banco, será preciso criar (ou usar) um projeto no Supabase. Com a URL do projeto e a chave pública, podemos:

1. Instalar o cliente do Supabase: `npm install @supabase/supabase-js`.
2. Criar um arquivo `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Criar a tabela de entradas do diário.
4. Implementar login e salvamento das entradas.

> Nunca coloque a chave `service_role` do Supabase em arquivos expostos ao navegador ou no repositório.

## Comandos úteis

```bash
npm run dev    # inicia o ambiente de desenvolvimento
npm run lint   # verifica problemas de estilo e código
npm run build  # gera a versão de produção
npm run start  # executa a versão de produção após o build
```
