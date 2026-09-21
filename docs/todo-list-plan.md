# Plano — TODO List do Diary Tracker

## Objetivo

Criar um módulo de tarefas simples e independente do registro de atividades e tempo. A TODO List serve somente para registrar o que precisa ser feito e marcar o que foi concluído.

Ela não terá ligação com atividades, horários, duração ou classificações de tempo.

## Estrutura de páginas

| Página | Finalidade |
| --- | --- |
| **TODO List** | Lista geral de tarefas pendentes e concluídas. |
| **Rotina diária** | Lista exclusiva de tarefas que se repetem todos os dias. |
| **Concluídas no mês** | Consulta de tarefas gerais concluídas em um mês. |

TODO List e Rotina diária são páginas separadas. Uma tarefa diária não aparece na TODO List geral.

## TODO List — página geral

### Informações de uma tarefa

Uma tarefa geral terá somente as informações abaixo:

| Informação | Obrigatória | Observação |
| --- | --- | --- |
| Título | Sim | Nome da tarefa. |
| Categoria | Não | Categoria global opcional para organização. |
| Estado | Sim | Pendente ou concluída. |
| Criada em | Automática | Data e hora registradas pelo sistema. |
| Concluída em | Automática | Data e hora registradas ao marcar como concluída. |

O estado será pendente enquanto `completed_at` estiver vazio e concluído quando essa data existir. Não haverá tipos de tarefa, prazo, meta, descrição, subtarefa ou relação com tempo nesta primeira versão.

### Comportamento

- O formulário de criação terá apenas título e categoria opcional.
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
- Seletor de categoria opcional.
- Checkbox grande e confortável para toque.
- Lista limpa: pendentes primeiro, concluídas depois.
- Estados vazios claros quando não houver tarefas.

## Rotina diária — página separada

### Objetivo

Mostrar apenas tarefas recorrentes que precisam ser feitas todos os dias. Essa página é separada da TODO List geral para manter o uso simples.

### Informações de uma tarefa diária

| Informação | Obrigatória | Observação |
| --- | --- | --- |
| Título | Sim | Nome da rotina. |
| Categoria | Não | Categoria global opcional. |
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

## Concluídas no mês

Página de consulta das tarefas gerais concluídas.

- Lista tarefas da TODO List geral cujo `completed_at` pertence ao mês selecionado.
- Mostra título, categoria, data de criação e data de conclusão.
- Permite trocar o mês visualizado.
- Tarefas diárias não aparecem nessa tela; elas terão histórico próprio no futuro.

## Dados no Supabase

### Tabela `tasks`

| Coluna | Tipo | Finalidade |
| --- | --- | --- |
| `id` | UUID | Identificador estável. |
| `user_id` | UUID | Dono da tarefa e proteção dos dados pessoais. |
| `title` | Texto | Nome da tarefa. |
| `category_id` | UUID opcional | Referência à categoria global. |
| `is_daily` | Booleano | Define se a tarefa pertence à Rotina diária. |
| `created_at` | Data/hora | Criação automática. |
| `completed_at` | Data/hora opcional | Conclusão da tarefa geral. Não é usado por tarefas diárias. |
| `updated_at` | Data/hora | Última alteração. |

Regras:

- `is_daily = false`: pertence à TODO List geral; `completed_at` representa pendente/concluída.
- `is_daily = true`: pertence à Rotina diária; o estado de cada dia fica em `daily_task_completions`.
- `title`, categoria e estado são os únicos dados funcionais da tarefa geral.

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
- Categorias continuam globais, conforme a decisão de aplicativo para uma única pessoa.
- Cada Server Action exige autenticação antes de criar, concluir ou reabrir tarefas.

## Fluxos principais

### Criar uma tarefa geral

1. Abrir **TODO List**.
2. Tocar em **Nova tarefa**.
3. Digitar o título.
4. Escolher uma categoria, se desejar.
5. Salvar; a tarefa entra como pendente.

### Concluir uma tarefa geral

1. Abrir **TODO List**.
2. Tocar no checkbox da tarefa.
3. O sistema salva `completed_at`.
4. A tarefa vai para o fim da lista e aparece em Concluídas no mês.

### Criar uma tarefa diária

1. Abrir **Rotina diária**.
2. Tocar em **Adicionar tarefa diária**.
3. Informar título e, opcionalmente, categoria.
4. Salvar; ela aparece pendente hoje e nos próximos dias.

### Concluir uma tarefa diária

1. Abrir **Rotina diária**.
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
2. Criar formulário com título e categoria opcional.
3. Exibir pendentes e concluídas.
4. Implementar concluir e reabrir.

### Etapa 3 — Rotina diária

1. Criar rota `/routine`.
2. Criar formulário específico de rotina diária.
3. Implementar conclusão por data no fuso `America/Sao_Paulo`.
4. Reordenar visualmente concluídas e mostrar progresso do dia.

### Etapa 4 — consulta e acabamento

1. Criar rota `/tasks/completed` com filtro mensal.
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
- Histórico detalhado da rotina diária.

## Premissas para avaliação

- TODO List geral contém tarefas simples: título, categoria opcional e estado pendente/concluído.
- Datas de criação e conclusão são sempre registradas, mas não ficam visíveis na lista principal.
- Rotina diária é uma página separada e possui conclusão por dia.
- A aplicação continua usando `America/Sao_Paulo` como fuso de referência.
