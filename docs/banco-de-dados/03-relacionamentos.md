# Relacionamentos entre Tabelas

## Hierarquia Principal

```
projects
  └── fields (1:N)
      └── sections (1:N)
          └── rows (1:N)
              └── rows_trackers (1:N)
                  └── rows_stakes (1:N)
```

## Relacionamentos de Tarefas

```
projects_backlogs (N:1) → fields, sections, rows, rows_trackers, rows_stakes
sprints_tasks (N:1) → projects_backlogs, subtasks
subtasks (N:1) → projects_backlogs
```

## Diagrama de Relacionamentos

```
┌─────────────┐
│  projects   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│   fields    │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│  sections   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│    rows     │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐      ┌─────────────┐
│rows_trackers│──────│  trackers   │
└──────┬──────┘ N:1  └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐      ┌─────────────┐
│ rows_stakes │──────│   stakes    │
└─────────────┘ N:1  └─────────────┘

┌──────────────────┐
│projects_backlogs │
└────────┬─────────┘
         │
         ├──→ fields (N:1)
         ├──→ sections (N:1)
         ├──→ rows (N:1)
         ├──→ rows_trackers (N:1)
         └──→ rows_stakes (N:1)

┌─────────────┐
│sprints_tasks│
└──────┬──────┘
       │
       ├──→ projects_backlogs (N:1)
       └──→ subtasks (N:1)
```

## Chaves Estrangeiras Principais

### Tabela `fields`
- `projects_id` → `projects.id`

### Tabela `sections`
- `fields_id` → `fields.id`

### Tabela `rows`
- `sections_id` → `sections.id`

### Tabela `rows_trackers`
- `rows_id` → `rows.id`
- `trackers_id` → `trackers.id`
- `rows_trackers_statuses_id` → `rows_trackers_statuses.id`

### Tabela `rows_stakes`
- `rows_trackers_id` → `rows_trackers.id`
- `stakes_id` → `stakes.id`
- `stakes_statuses_id` → `stakes_statuses.id`

### Tabela `projects_backlogs`
- `projects_id` → `projects.id`
- `fields_id` → `fields.id`
- `sections_id` → `sections.id`
- `rows_id` → `rows.id`
- `rows_trackers_id` → `rows_trackers.id`
- `rows_stakes_id` → `rows_stakes.id`
- `tasks_template_id` → `tasks_template.id`
- `projects_backlogs_statuses_id` → `projects_backlogs_statuses.id`
- `quality_status_id` → `quality_status.id`

### Tabela `sprints_tasks`
- `projects_backlogs_id` → `projects_backlogs.id`
- `subtasks_id` → `subtasks.id`
- `sprints_id` → `sprints.id`
- `teams_id` → `teams.id`
- `sprints_tasks_statuses_id` → `sprints_tasks_statuses.id`

### Tabela `subtasks`
- `projects_backlogs_id` → `projects_backlogs.id`
- `quality_status_id` → `quality_status.id`

## Soft Delete

Todas as tabelas principais implementam **soft delete** através do campo `deleted_at`:
- Quando `deleted_at` é `null`, o registro está ativo
- Quando `deleted_at` tem um valor timestamp, o registro está deletado (mas mantido no banco)

Isso permite:
- Recuperação de dados deletados acidentalmente
- Histórico completo de alterações
- Integridade referencial mantida

## Próximos Passos

- [Voltar para Esquema Geral](./01-esquema-geral.md)
- [Ver Tabelas Principais](./02-tabelas-principais.md)

