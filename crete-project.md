# Diary Tracker — visão do projeto

## Objetivo

O **Diary Tracker** é uma aplicação pessoal, responsiva e fácil de usar no celular e no notebook. Ela substitui o caderno e as planilhas mensais usados para registrar atividades, tempo gasto, tarefas e anotações.

O objetivo principal é registrar o dia com poucos toques, preservar o histórico e gerar uma visão clara de como o tempo foi usado — sem precisar criar ou organizar uma nova planilha todo mês.

## Problema atual

Hoje, o registro acontece em dois lugares:

- No caderno, para anotar as atividades e perceber quanto tempo foi gasto nelas.
- No Excel/Google Sheets, para guardar o histórico e organizar os dados.

Esse processo repete dados, gasta folhas e exige manutenção mensal da planilha. Depois de anotado no papel, o registro não oferece outros benefícios além da consciência do tempo utilizado.

## Usuário e dispositivos

- Uso pessoal, por uma única pessoa.
- A aplicação ficará online, mas o acesso será privado e restrito ao dono da conta.
- Uso prioritário no **celular**, para registro rápido ao longo do dia.
- Uso também no **notebook**, para escrever, consultar o histórico e organizar informações.
- A experiência deve funcionar bem em telas pequenas e grandes, sem depender de mouse ou teclado.

## Princípios de UX e usabilidade

- Registrar uma atividade deve exigir o mínimo de passos possível.
- Horário de fim de uma atividade deve sugerir/preencher automaticamente o início da próxima.
- Os dados importantes do momento atual devem estar visíveis sem procurar em menus.
- Botões e campos devem ser confortáveis para toque no celular.
- A interface deve ser simples, com poucos elementos por tela e textos claros.
- Alterar o nome de uma classificação ou categoria não pode quebrar o histórico nem os cálculos.

## Seções principais

### 1. Registro de atividades e tempo

Uma tela semelhante à tabela usada hoje na planilha. Cada registro representa um período do dia.

| Campo | Descrição |
| --- | --- |
| Atividade | Texto livre descrevendo o que foi feito, por exemplo: “Academia” ou “Arrumar quarto”. |
| Início | Horário em que a atividade começou. |
| Fim | Horário em que a atividade terminou. |
| Duração | Calculada automaticamente a partir do início e fim. |
| Classificação | Tipo específico da atividade, por exemplo: “Academia”, “Arrumação Quarto”, “Sair Casa”. |
| Categoria | Grupo mais amplo usado para organização e relatórios, por exemplo: TASK, Relax, Arrumação ou Comer. |

#### Regras esperadas

- O fim de uma atividade deve ser usado como início sugerido da próxima.
- A duração deve ser calculada pelo sistema, sem precisar ser digitada.
- O sistema deve suportar atividades que passam da meia-noite.
- A classificação será identificada internamente por um **ID estável**. Assim, o nome pode ser alterado depois sem modificar a lógica, os vínculos ou os dados já registrados.
- A categoria também terá um ID estável e poderá agrupar várias classificações.
- Quando o nome de uma classificação mudar, os registros antigos devem mostrar o **nome novo**.
- Além do cadastro manual de início e fim, deve ser possível iniciar uma atividade rapidamente e encerrá-la depois com um botão.

#### Exemplo de um dia

| Atividade | Início | Fim | Duração | Classificação |
| --- | ---: | ---: | ---: | --- |
| Arrumar quarto e preparar para sair | 18:13 | 18:45 | 0:32:00 | Arrumação Quarto |
| Academia | 18:45 | 20:00 | 1:15:00 | Academia |
| Sair de casa, banho e mercado | 20:00 | 21:20 | 1:20:00 | Sair Casa |
| Relaxar | 21:20 | 21:50 | 0:30:00 | Relax or Games |
| Re:Zero e jantar | 21:50 | 22:30 | 0:40:00 | Jantar |
| Jogar | 22:30 | 23:30 | 1:00:00 | Relax or Games |
| Tarefa: X Saves | 00:15 | 01:34 | 1:19:00 | TASK |
| Planejar o próximo dia | 02:27 | 03:20 | 0:53:00 | Next Day |

### 2. Lista de tarefas

Uma lista de tarefas com agrupamento por horizonte ou tipo:

- **Diárias**: tarefas que precisam ser realizadas todos os dias.
- **Do dia**: tarefas específicas para uma data.
- **Semana**: tarefas que devem ser feitas durante a semana.
- **Mês**: tarefas com objetivo mensal.
- **Longas**: atividades ou projetos contínuos, quase intermináveis.
- **Desejos**: coisas que a pessoa quer fazer, mas sem prazo obrigatório.

Cada tarefa deve poder ter, ao menos:

- título;
- descrição opcional;
- tipo/horizonte;
- estado (pendente ou concluída);
- data de criação e, quando aplicável, data-alvo;
- data de conclusão, quando concluída;
- categoria opcional.

Para tarefas semanais, mensais e longas, o funcionamento será semelhante a um checkbox: elas não terão meta de quantidade nem de horas. As datas de criação e conclusão serão guardadas, mas ficarão visíveis somente ao abrir os detalhes da tarefa.

Uma tela específica deve listar as tarefas concluídas no mês, mostrando também as datas de criação e conclusão.

### 3. Rotina diária

Uma página focada somente nas tarefas diárias.

- Mostra as atividades que precisam ser feitas naquele dia.
- Permite marcar uma atividade como concluída rapidamente.
- Ao ser concluída, a atividade vai para o final/fundo da lista, deixando as pendentes em destaque.
- No dia seguinte, as tarefas diárias voltam a ficar disponíveis para marcação.

### 4. Anotações em Markdown

Uma área para escrever informações livres em Markdown.

- Editor de texto Markdown.
- Pré-visualização renderizada do Markdown.
- Notas soltas, cada uma com um título.

## Dados principais (modelo conceitual)

| Entidade | Finalidade |
| --- | --- |
| Usuário | Dono dos registros e dados pessoais. |
| Categoria | Grupo amplo, como TASK, Relax, Arrumação e Comer. |
| Classificação | Tipo específico de atividade, ligado a uma categoria. |
| Registro de atividade | Atividade realizada, com início, fim, duração e classificação. |
| Tarefa | Item da lista de tarefas com tipo, estado e datas. |
| Conclusão diária | Registro de que uma tarefa diária foi concluída em determinada data. |
| Nota | Conteúdo em Markdown, título e datas. |

## Fluxos mais importantes

### Registrar o tempo de uma atividade

1. Abrir a tela do dia atual.
2. Tocar em “nova atividade” ou na atividade atual.
3. Informar o nome e selecionar uma classificação.
4. O início vem preenchido com o fim da atividade anterior (ou com o horário atual, quando não houver anterior).
5. Ao informar o fim, o sistema calcula a duração.
6. Salvar; a próxima atividade já recebe o horário sugerido.

### Concluir uma tarefa diária

1. Abrir a página de rotina diária.
2. Tocar no checkbox da tarefa.
3. A tarefa fica visualmente concluída e desce para o fim da lista.
4. A conclusão fica registrada apenas para aquela data.

## Fases sugeridas de desenvolvimento

### Fase 1 — base útil

- Autenticação privada, com acesso restrito à sua conta.
- Categorias e classificações.
- Registro de atividades com início, fim e duração, incluindo início/finalização rápida.
- Visualização diária no celular e notebook.

### Fase 2 — organização pessoal

- Lista de tarefas por tipo.
- Rotina diária com check de conclusão por data.
- Notas em Markdown com pré-visualização.

### Fase 3 — ganhos da digitalização

- Relatórios por categoria/classificação e período.
- Resumo semanal e mensal do tempo gasto.
- Filtros, busca e edição de registros antigos.
- Atalhos e melhorias para registro ainda mais rápido no celular.

## Decisões confirmadas

- O sistema terá login, mas será privado e usado exclusivamente pelo dono da conta.
- Renomear uma classificação atualiza o nome exibido também nos registros antigos.
- O registro de atividade terá dois modos: rápido (iniciar/parar) e manual (informar início/fim).
- Tarefas semanais, mensais e longas não terão metas de quantidade ou horas; serão concluídas por checkbox.
- Datas de criação e conclusão das tarefas serão guardadas e mostradas nos detalhes e na listagem mensal de concluídas.
- Notas serão itens soltos com título e conteúdo Markdown.
- O histórico começará do zero, sem importação das planilhas antigas.
