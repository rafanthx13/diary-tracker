# Roadmap — Diary Tracker

Este documento registra o estado observado no código e nas migrações do projeto. As ideias da última seção são somente possibilidades de produto; não estão planejadas nem implementadas.

## Funcionalidades entregues

### Fundação e segurança

- Aplicação em Next.js, TypeScript e Tailwind CSS, com App Router e interface em português do Brasil.
- Autenticação por e-mail e senha no Supabase, logout e renovação de sessão pelo proxy.
- Proteção de páginas e Server Actions por usuário autenticado.
- Row Level Security nas tabelas privadas e migrações versionadas para o banco.
- Tela de orientação quando as variáveis públicas do Supabase não estão configuradas.

### Diário de atividades e tempo

- Registro rápido de uma atividade em andamento, com título e classificação.
- Encerramento da atividade atual e garantia de apenas uma atividade em andamento por usuário.
- Registro manual de períodos passados, inclusive para datas anteriores.
- Edição de título, classificação, início e fim; exclusão com confirmação.
- Proteção no banco contra períodos encerrados sobrepostos.
- Navegação por dias e seleção de data, sem permitir dias futuros.
- Dia do diário com virada às 05:00 no fuso `America/Sao_Paulo`.
- Categorias de tempo fixas, classificações editáveis e possibilidade de classificação sem categoria.
- Restauração do catálogo inicial de tempo quando necessário.
- Resumo do dia por categoria.
- Relatórios de tempo por dia, semana, mês, ano e acumulado, agrupados por atividade, classificação e categoria.

### TODO List

- Tarefas gerais separadas do registro de tempo e da rotina diária.
- Abas personalizadas com nome, descrição e ordenação manual.
- Visões de todas as pendências, pendências sem aba e pendências de uma aba específica.
- Criação, edição de título e exclusão de tarefas.
- Marcação de importância e ordenação visual das tarefas importantes.
- Conclusão e reabertura de tarefas, com armazenamento de data/hora.
- Relatório mensal de tarefas concluídas, mostrando datas de criação e conclusão.

### Diary Task (rotina diária)

- Cadastro de tarefas que se repetem diariamente, em módulo separado da TODO List.
- Navegação e consulta por data passada; datas futuras são bloqueadas.
- Conclusão independente por tarefa e por dia, com possibilidade de desfazer.
- Progresso diário e separação entre tarefas pendentes e concluídas.
- Relatórios por dia, semana, mês, ano e acumulado.
- Matriz visual de conclusões por tarefa e data, além de frequência e lista de dias concluídos.

### Dados de saúde

- Registro diário de peso, com observações e atualização do registro existente na mesma data.
- Histórico recente de peso e relatório de evolução com menor valor, maior valor, variação e gráfico de linha.
- Cadastro e edição de partes do corpo, instruções de medição e unidades.
- Sessões de medidas corporais por data, com valores opcionais por parte do corpo e observações.
- Relatórios de medidas por parte do corpo, com último valor, evolução, mínimo, máximo, histórico e gráfico de linha.
- Importação de dados históricos via CSV, com modelo para download.
- Criação automática de tipos de medida desconhecidos durante a importação e tratamento de `Peso` como histórico de peso.

### Anotações

- Módulo central para protocolos estruturados e notas livres.
- Protocolos com título e demandas numeradas.
- Criação e edição atômica de protocolos e demandas por funções do banco.
- Reordenação de demandas por arrastar/soltar ou alteração numérica da posição.
- Visualização de protocolos com a sequência preservada.
- Notas com título e conteúdo Markdown.
- Visualização formatada de títulos, listas, tabelas, links, citações e blocos de código em Markdown.
- Edição de notas e listagem por atualização mais recente.

## Ideias de novas funcionalidades

As opções abaixo são hipóteses para discussão. Elas não devem ser interpretadas como tarefa de implementação.

### Diário e produtividade

- Painel semanal que combine horas registradas, conclusões da rotina e tarefas gerais concluídas.
- Metas opcionais de tempo por classificação ou categoria, comparadas com o realizado no relatório.
- Templates para iniciar atividades frequentes em um toque.
- Busca e filtros por texto, classificação e intervalo de datas no histórico de atividades.
- Exportação dos registros de tempo e das tarefas para CSV.

### Tarefas

- Arquivamento em vez de exclusão definitiva, preservando histórico sem poluir a lista ativa.
- Prazos, lembretes e uma visão de tarefas atrasadas ou próximas do vencimento.
- Subtarefas e progresso para tarefas maiores.
- Reordenação manual das tarefas dentro de cada aba.
- Meta semanal de consistência para cada Diary Task.

### Saúde

- Registro de outros indicadores, como sono, treino, humor ou ingestão de água.
- Comparação de medidas e peso entre duas datas escolhidas.
- Exportação e backup dos dados de saúde.
- Gráficos com faixa de meta e médias móveis para reduzir ruído nas tendências.

### Anotações

- Etiquetas, busca textual e favoritos para protocolos e notas.
- Relações entre uma nota, um protocolo, uma tarefa ou uma atividade do diário.
- Histórico de versões e restauração de conteúdo anterior.
- Exportação de notas em Markdown e protocolos em formatos compartilháveis.

### Plataforma

- Testes automatizados para regras de datas, cálculos de relatório e Server Actions.
- Fluxo de backup/restauração de todos os dados pessoais.
- Auditoria de acessibilidade e suporte aprimorado a navegação por teclado.
- Tema escuro e preferências de interface por usuário.
- Monitoramento de erros e uma página de diagnóstico administrativo, sem expor dados pessoais.
