# Esquema Geral do Banco de Dados

## Estrutura Hierárquica

```
Field (Campo)
  └── Sections (Grupos/Seções)
      └── Rows (Fileiras)
          └── Rows_Trackers (Trackers na fileira)
              └── Rows_Stakes (Estacas do tracker)
```

## Tabelas Principais

- `fields` - Campos do projeto
- `sections` - Grupos/seções dentro de um campo
- `rows` - Fileiras dentro de uma seção
- `rows_trackers` - Trackers posicionados em uma fileira
- `rows_stakes` - Estacas associadas a um tracker
- `projects_backlogs` - Tarefas geradas automaticamente
- `sprints_tasks` - Tarefas de inspeção
- `quality_status` - Status de qualidade (aprovada/reprovada)

## Próximos Passos

- [Tabelas Principais](./02-tabelas-principais.md)
- [Relacionamentos](./03-relacionamentos.md)

