# Tabelas Principais do Banco de Dados

Este documento detalha todas as tabelas principais do sistema. Para informações sobre relacionamentos, veja [Relacionamentos](./03-relacionamentos.md).

## Tabelas de Estrutura do Mapa

### Tabela: `fields`
Campos do projeto onde os trackers são instalados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `name` | text | Nome do campo |
| `section_quantity` | int | Quantidade de seções |
| `projects_id` | int | Referência ao projeto (FK) |
| `map_texts` | json | Textos adicionais do mapa |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/14_fields.xs`

### Tabela: `sections`
Seções (grupos) dentro de um campo.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `section_number` | int | Número da seção |
| `fields_id` | int | Referência ao campo (FK) |
| `x` | int | Posição X no canvas |
| `y` | int | Posição Y no canvas |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/25_sections.xs`

### Tabela: `rows`
Fileiras dentro de uma seção.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `row_number` | int | Número da fileira |
| `sections_id` | int | Referência à seção (FK) |
| `x` | int | Posição X no canvas |
| `y` | int | Posição Y no canvas |
| `groupOffsetX` | int | Offset horizontal quando dentro de grupo |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/19_rows.xs`

### Tabela: `rows_trackers`
Relacionamento entre fileiras e trackers (trackers posicionados em uma fileira).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `position` | text | Posição do tracker na fileira |
| `rows_id` | int | Referência à fileira (FK) |
| `trackers_id` | int | Referência ao tracker (FK) |
| `rows_trackers_statuses_id` | int | Status do tracker (FK) |
| `rowY` | int | Ajuste vertical do tracker na fileira |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/20_rows_trackers.xs`

### Tabela: `rows_stakes`
Estacas associadas a um tracker em uma fileira.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `rows_trackers_id` | int | Referência ao tracker na fileira (FK) |
| `stakes_id` | int | Referência à estaca (FK) |
| `stakes_statuses_id` | int | Status da estaca (FK) |
| `position` | text | Posição da estaca no tracker |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/38_rows_stakes.xs`

## Tabelas de Tarefas e Status

### Tabela: `projects_backlogs`
Tarefas do backlog do projeto, geradas automaticamente ao criar trackers.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `projects_id` | int | Referência ao projeto (FK) |
| `tasks_template_id` | int | Referência ao template de tarefa (FK) |
| `projects_backlogs_statuses_id` | int | Status da tarefa (FK, default: 1) |
| `fields_id` | int | Referência ao campo (FK) |
| `sections_id` | int | Referência à seção (FK) |
| `rows_id` | int | Referência à fileira (FK) |
| `rows_trackers_id` | int | Referência ao tracker (FK) |
| `rows_stakes_id` | int | Referência à estaca (FK) |
| `equipaments_types_id` | int | Tipo de equipamento (1=Tracker, 3=Estaca) |
| `is_inspection` | bool | Se é uma tarefa de inspeção |
| `projects_backlogs_id` | int | Referência à tarefa inspecionada (FK) |
| `subtasks_id` | int | Referência à subtarefa (FK) |
| `quality_status_id` | int | Status de qualidade (FK, default: 1) |
| `description` | text | Descrição da tarefa |
| `quantity` | decimal | Quantidade |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/36_projects_backlogs.xs`

### Tabela: `sprints_tasks`
Tarefas dentro de uma sprint (inclui tarefas de inspeção).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `projects_backlogs_id` | int | Referência ao backlog (FK) |
| `subtasks_id` | int | Referência à subtarefa (FK) |
| `sprints_id` | int | Referência à sprint (FK) |
| `teams_id` | int | Referência à equipe (FK) |
| `sprints_tasks_statuses_id` | int | Status da tarefa (FK) |
| `scheduled_for` | date | Data agendada |
| `executed_at` | date | Data de execução |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/24_sprints_tasks.xs`

### Tabela: `subtasks`
Subtarefas criadas dentro do painel.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `projects_backlogs_id` | int | Referência ao backlog (FK) |
| `description` | text | Descrição da subtarefa |
| `quantity` | decimal | Quantidade total |
| `quantity_done` | decimal | Quantidade concluída |
| `is_inspection` | bool | Se é uma inspeção |
| `quality_status_id` | int | Status de qualidade (FK, default: 1) |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/50_subtasks.xs`

## Tabelas de Status

### Tabela: `rows_trackers_statuses`
Status possíveis para trackers em fileiras.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `status` | text | Nome do status |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Valores conhecidos:**
- 1: Aguardando estacas
- 2: Problema, mas não impede a montagem do módulo
- 3: Impedido para montagem do tracker
- 4: Liberado para montagem do tracker
- 5: Tracker e módulos instalados
- 6: Liberado para montagem do módulos
- 7: Aguardando inspeção
- 8: Inspeção reprovada

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/21_rows_trackers_statuses.xs`

### Tabela: `stakes_statuses`
Status possíveis para estacas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `status` | text | Nome do status |
| `created_at` | timestamp | Data de criação |
| `updated_at` | timestamp | Data de atualização |
| `deleted_at` | timestamp | Soft delete |

**Valores conhecidos:**
- 1: Não cravada
- 2: Cravada com Sucesso
- 3: Cravada com problema mas sem impeditivo para montagem do tracker
- 4: Problema que impede a montagem do tracker
- 5: Módulos montados
- 6: Aguardando inspeção
- 7: Inspeção reprovada

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/28_stakes_statuses.xs`

### Tabela: `quality_status`
Status de qualidade para inspeções.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | int | ID único (PK) |
| `status` | text | Nome do status |
| `created_at` | timestamp | Data de criação |

**Valores conhecidos:**
- 1: (padrão/indefinido)
- 2: Inspeção aprovada
- 3: Inspeção reprovada

**Localização:** `/Users/samanthamaia/development/xano_sunview/tables/48_quality_status.xs`

## Próximos Passos

- [Relacionamentos](./03-relacionamentos.md)
- [Voltar para Esquema Geral](./01-esquema-geral.md)

