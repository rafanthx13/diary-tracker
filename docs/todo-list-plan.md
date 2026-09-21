# Plano — TODO List do Diary Tracker

## Objetivo

Criar um módulo de tarefas simples e independente do registro de atividades e tempo. A TODO List serve somente para registrar o que precisa ser feito e marcar o que foi concluído.

Ela não terá ligação com atividades, horários, duração ou classificações de tempo.

## Estrutura de páginas

| Página | Finalidade |
| --- | --- |
| **TODO List** | Tarefas gerais em cards; abre em TODAS e permite filtrar por Pendente ou abas personalizadas. |
| **Diary Task** | Lista exclusiva de tarefas que se repetem todos os dias, em `/diary-task`. |
| **Relatório do Diary Task** | Frequência e dias concluídos por tarefa, em dia, semana, mês, ano ou acumulado. |
| **Relatório da TODO List** | Consulta em `/tasks/reports` das tarefas gerais concluídas em cada mês. |

TODO List e Rotina diária são páginas separadas. Uma tarefa diária não aparece na TODO List geral.

## TODO List — página geral

### Informações de uma tarefa

Uma tarefa geral terá somente as informações abaixo:

| Informação | Obrigatória | Observação |
| --- | --- | --- |
| Título | Sim | Nome da tarefa. |
| Aba | Não | A lista Pendente é o padrão; abas personalizadas organizam tarefas gerais. |
| Estado | Sim | Pendente ou concluída. |
| Criada em | Automática | Data e hora registradas pelo sistema. |
| Concluída em | Automática | Data e hora registradas ao marcar como concluída. |

O estado será pendente enquanto `completed_at` estiver vazio e concluído quando essa data existir. Não haverá tipos de tarefa, prazo, meta, descrição, subtarefa ou relação com tempo nesta primeira versão.

### Comportamento

- O formulário de criação terá apenas o título.
- A tarefa entra na aba selecionada; sem aba selecionada, entra em **Pendente**.
- É possível criar abas personalizadas, como Projetos ou Estudos. Elas não são categorias de tempo.
- A primeira aba é **TODAS** e reúne as tarefas pendentes de todas as abas.
- A visão TODAS não cria tarefas; é preciso abrir Pendente ou uma aba personalizada antes de adicionar.
- Toda tarefa nova começa pendente.
- O checkbox altera a tarefa entre pendente e concluída.
- Ao concluir, o sistema salva a data e a hora em `completed_at`.
- Ao reabrir, `completed_at` é removido e a tarefa volta às pendentes.
- Tarefas pendentes aparecem primeiro; concluídas ficam no final da lista, com aparência mais discreta.
- A data de criação e de conclusão não aparecem na lista principal.
- Ao abrir os detalhes de uma tarefa, as duas datas são exibidas.
- A exclusão definitiva fica fora da primeira entrega para preservar o histórico.

### Experiência de uso

- Botão **Nova tarefa** sempre visível.
- Campo de título direto, para registrar uma tarefa em poucos segundos no celular.
- Checkbox grande e confortável para toque.
- Cards em grade, lado a lado no notebook e empilhados no celular.
- Abas rápidas para TODAS, Pendente e abas personalizadas, além do relatório mensal.
- Estados vazios claros quando não houver tarefas.

## Diary Task — página separada

### Objetivo

Mostrar apenas tarefas recorrentes que precisam ser feitas todos os dias. Essa página fica em `/diary-task`, é separada da TODO List geral e permite navegar por datas anteriores.

### Informações de uma tarefa diária

| Informação | Obrigatória | Observação |
| --- | --- | --- |
| Título | Sim | Nome da rotina. |
| Criada em | Automática | Data e hora de criação da rotina. |
| Conclusão do dia | Automática | Registro separado para cada data. |

### Comportamento

- A tarefa diária é criada uma única vez.
- Ela fica pendente no início de cada novo dia.
- Marcar o checkbox cria uma conclusão somente para a data atual.
- A tarefa concluída desce para o fim da lista, mas continua visível.
- Desmarcar remove somente a conclusão do dia atual.
- No dia seguinte, a mesma tarefa reaparece pendente automaticamente.
- A página exibe o progresso do dia: concluídas de um total de tarefas diárias.
- É possível consultar um dia anterior e marcar ou desmarcar a conclusão daquela data; datas futuras não podem ser marcadas.
- O relatório do Diary Task lista quantas vezes cada tarefa foi feita e os dias registrados para dia, semana, mês, ano e acumulado.

## Relatório da TODO List

Página `/tasks/reports` de consulta das tarefas gerais concluídas.

- Lista tarefas da TODO List geral cujo `completed_at` pertence ao mês selecionado.
- Mostra título, data de criação e data de conclusão.
- Permite trocar o mês visualizado.
- Tarefas diárias não aparecem nessa tela; elas terão histórico próprio no futuro.

## Dados no Supabase

### Tabela `tasks`

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `id` | UUID | Identificador estável. |
| `user_id` | UUID | Dono da tarefa e proteção dos dados pessoais. |
| `title` | Texto | Nome da tarefa. |
| `task_list_id` | UUID opcional | Aba personalizada da tarefa geral. |
| `is_daily` | Booleano | Define se a tarefa pertence à Rotina diária. |
| `created_at` | Data/hora | Criação automática. |
| `completed_at` | Data/hora opcional | Conclusão da tarefa geral. Não é usado por tarefas diárias. |
| `updated_at` | Data/hora | Última alteração. |

Regras:

- `is_daily = false`: pertence à TODO List geral; `completed_at` representa pendente/concluída.
- `is_daily = true`: pertence ao Diary Task; o estado de cada dia fica em `daily_task_completions`.
- `title` e estado são os únicos dados funcionais da tarefa geral.
- `task_list_id` é apenas a organização visual da TODO List; tarefas diárias sempre ficam sem aba.

### Tabela `task_lists`

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `id` | UUID | Identificador estável da aba. |
| `user_id` | UUID | Dono da aba. |
| `name` | Texto | Nome exibido na TODO List. |
| `created_at` | Data/hora | Criação automática. |

### Tabela `daily_task_completions`

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `id` | UUID | Identificador da conclusão. |
| `task_id` | UUID | Tarefa diária concluída. |
| `user_id` | UUID | Dono da conclusão. |
| `completed_on` | Data | Dia da conclusão, no fuso de São Paulo. |
| `completed_at` | Data/hora | Momento em que o checkbox foi marcado. |

Uma restrição única em `(task_id, completed_on)` impede duas conclusões para a mesma tarefa no mesmo dia.

## Segurança

- Tarefas e conclusões diárias possuem `user_id` porque são dados privados.
- RLS permite que a conta autenticada leia e altere apenas as próprias tarefas.
- Abas personalizadas também são privadas e protegidas por RLS.
- Categorias e classificações pertencem exclusivamente ao registro de tempo; tarefas não as usam.
- Cada Server Action exige autenticação antes de criar, concluir ou reabrir tarefas.

## Fluxos principais

### Criar uma tarefa geral

1. Abrir **TODO List**.
2. Tocar em **Nova tarefa**.
3. Digitar o título.
4. Salvar; a tarefa entra na aba atual ou em Pendente.

### Concluir uma tarefa geral

1. Abrir **TODO List**.
2. Tocar no checkbox da tarefa.
3. O sistema salva `completed_at`.
4. A tarefa sai das pendências e aparece no relatório do mês em que foi concluída.

### Criar uma tarefa do Diary Task

1. Abrir **Diary Task**.
2. Tocar em **Adicionar tarefa diária**.
3. Informar o título.
4. Salvar; ela aparece pendente hoje e nos próximos dias.

### Concluir uma tarefa do Diary Task

1. Abrir **Diary Task**.
2. Tocar no checkbox.
3. O sistema registra a conclusão para a data atual.
4. A tarefa é movida para o fim da lista.

## Ordem de implementação

### Etapa 1 — banco e segurança

1. Criar `tasks` e `daily_task_completions`.
2. Criar índices, validações, RLS e políticas.
3. Validar que a conta só acessa os próprios dados.

### Etapa 2 — TODO List

1. Criar rota `/tasks`.
2. Criar abas personalizadas e vincular tarefas gerais a elas.
3. Exibir tarefas em cards lado a lado.
4. Implementar concluir e reabrir.

### Etapa 3 — Diary Task

1. Criar rota `/diary-task` com navegação por data.
2. Criar formulário específico de rotina diária.
3. Implementar conclusão por data no fuso `America/Sao_Paulo`.
4. Reordenar visualmente concluídas, mostrar progresso do dia e criar relatório de frequência.

### Etapa 4 — consulta e acabamento

1. Criar rota `/tasks/reports` com filtro mensal.
2. Criar detalhes da tarefa para mostrar criação e conclusão.
3. Ajustar estados vazios, feedback de sucesso/erro e navegação em celular.
4. Testar no celular e notebook.

## Fora da primeira entrega

- Integração com registro de atividades e tempo.
- Tipos de tarefa, prazos, metas e descrições.
- Subtarefas.
- Lembretes e notificações.
- Arrastar para reordenar.
- Exclusão definitiva.
- Histórico detalhado adicional do Diary Task.

## Premissas para avaliação

- TODO List geral contém tarefas simples em cards: título, aba opcional e estado pendente/concluído.
- Datas de criação e conclusão são sempre registradas, mas não ficam visíveis na lista principal.
- Diary Task é uma página separada, possui conclusão por dia e relatório de frequência.
- A aplicação continua usando `America/Sao_Paulo` como fuso de referência.
