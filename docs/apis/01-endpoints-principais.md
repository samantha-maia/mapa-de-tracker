# Endpoints Principais

## APIs de Mapas de Trackers

### GET /trackers-map
Buscar mapa de trackers de um campo.

**Parâmetros:**
- `projects_id` (int, obrigatório) - ID do projeto
- `fields_id` (int, opcional) - ID do campo

**Resposta:**
```json
{
  "mapa": [...],  // Array de sections com rows e trackers
  "campo": {...}  // Informações do campo
}
```

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/358_trackers_map_GET.xs`

### POST /trackers-map
Criar novo campo com mapa completo.

**Body:**
```json
{
  "json_map": {...},      // Estrutura do mapa
  "projects_id": 1,      // ID do projeto
  "name": "Campo 1",     // Nome do campo
  "map_texts": {...}     // Textos adicionais (opcional)
}
```

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/359_trackers_map_POST.xs`

### PUT /trackers-map
Atualizar campo existente.

**Body:**
```json
{
  "json_map": {...},      // Nova estrutura do mapa
  "projects_id": 1,      // ID do projeto
  "fields_id": 123,      // ID do campo
  "map_texts": {...}     // Textos adicionais (opcional)
}
```

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/366_trackers_map_PUT.xs`

## APIs de Inspeção

### POST /update_inspection
Atualizar resultado de inspeção.

**Body:**
```json
{
  "sprints_tasks_id": 123,    // ID da tarefa de inspeção
  "quality_status_id": 2     // 2 = Aprovada, 3 = Reprovada
}
```

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/sprints/308_update_inspection_POST.xs`

## APIs de Campos

### GET /fields
Listar campos de um projeto.

**Parâmetros:**
- `company_id` (int, obrigatório) - ID da empresa
- `projects_id` (int, query) - ID do projeto

### PUT /field_name
Atualizar nome do campo.

**Body:**
```json
{
  "fieldId": 123,
  "name": "Novo Nome"
}
```

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/367_field_name_PUT.xs`

### DELETE /fields/{fieldId}
Deletar campo (soft delete).

**Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/68_fields_fields_id_DELETE.xs`

## Base URL

**Produção:** `https://x4t7-ilri-ywed.n7d.xano.io`

**Endpoints:**
- Mapas: `/api:6L6t8cws/trackers-map`
- Campos: `/api:6L6t8cws/fields`
- Inspeção: `/api:6L6t8cws/update_inspection`

## Autenticação

A maioria dos endpoints requer autenticação via Bearer Token:

```
Authorization: Bearer {token}
```

## Próximos Passos

- [Autenticação](./02-autenticacao.md)
- [Voltar para Documentação Principal](../README.md)

