# Documentação de Fluxos - Sistema de Mapa de Trackers

## Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Fluxo 1: Criação de Campo/Mapa (POST)](#fluxo-1-criação-de-campomapa-post)
3. [Fluxo 2: Edição de Campo/Mapa (PUT)](#fluxo-2-edição-de-campomapa-put)
4. [Fluxo 3: Visualização de Campo/Mapa (GET)](#fluxo-3-visualização-de-campomapa-get)
5. [Fluxo 4: Inspeção (update_inspection)](#fluxo-4-inspeção-update_inspection)
6. [Fluxo 5: Seleção de Campo (FieldSelector)](#fluxo-5-seleção-de-campo-fieldselector)
7. [Fluxo 6: Manipulação do Canvas](#fluxo-6-manipulação-do-canvas)
8. [Fluxo 7: Cálculo de Status e Cores](#fluxo-7-cálculo-de-status-e-cores)

---

## Visão Geral do Sistema

O Sistema de Mapa de Trackers é um conjunto de aplicações para gerenciamento completo de projetos solares, incluindo criação de layouts, execução de tarefas em campo e inspeções. O sistema é composto por três aplicações principais:

### Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Xano)                           │
│  /Users/samanthamaia/development/xano_sunview               │
│  - APIs REST                                                │
│  - Banco de dados PostgreSQL                                │
│  - Lógica de negócio (arquivos .xs)                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  App Móvel   │  │  Painel Web      │  │  Editor Web  │
│  (Flutter)   │  │  (Flutter Web)   │  │  (React)     │
│              │  │                  │  │              │
│ Campo/App   │  │ Dashboard/Admin  │  │ Mapa Visual  │
└──────────────┘  └──────────────────┘  └──────────────┘
```

### Componentes do Sistema

#### 1. **Editor Web de Mapas** (`mapa-de-tracker`)
**Localização:** `/Users/samanthamaia/development/mapa-de-tracker`

- **Tecnologia:** React + TypeScript + Vite
- **Função:** Editor visual interativo para criar e editar layouts de trackers
- **Funcionalidades:**
  - Criação e edição de mapas com estrutura hierárquica (Groups → Rows → Trackers → Stakes)
  - Visualização de mapas em modo somente leitura
  - Manipulação visual do canvas (arrastar, agrupar, alinhar)
  - Cálculo automático de status baseado nas estacas de cada tracker
  - Integração com FlutterFlow via URL parameters

#### 2. **App Móvel** (`parque_solar_app`)
**Localização:** `/Users/samanthamaia/development/parque_solar_app`

- **Tecnologia:** Flutter (FlutterFlow)
- **Função:** Aplicativo para operadores em campo
- **Funcionalidades:**
  - Visualização de tarefas atribuídas
  - Execução de tarefas (RDO - Registro de Obra)
  - **Inspeções:** Aprovação/reprovação de trackers e estacas
  - QR Code para identificação rápida
  - Sincronização offline/online

#### 3. **Painel Web Administrativo** (`parque_solar`)
**Localização:** `/Users/samanthamaia/development/parque_solar`

- **Tecnologia:** Flutter Web (FlutterFlow)
- **Função:** Dashboard administrativo e gerenciamento de projetos
- **Funcionalidades:**
  - Gerenciamento de projetos, sprints e equipes
  - Visualização de mapas de trackers (integração com editor web)
  - Criação e edição de campos, seções e fileiras
  - Gestão de tarefas e backlog
  - Relatórios e gráficos de progresso
  - Gerenciamento de estoque

### Fluxo de Dados entre Componentes

```
1. ADMINISTRADOR (Painel Web)
   └─→ Cria projeto e campo
   └─→ Abre Editor Web para criar layout
       └─→ Editor salva mapa no backend (POST trackers-map)
       └─→ Backend cria tarefas automaticamente (projects_backlogs)

2. OPERADOR (App Móvel)
   └─→ Visualiza tarefas atribuídas
   └─→ Executa tarefas (cravamento de estacas, montagem)
   └─→ Realiza inspeções
       └─→ Chama API update_inspection
       └─→ Backend atualiza status de trackers/estacas

3. ADMINISTRADOR (Painel Web)
   └─→ Visualiza progresso atualizado
   └─→ Monitora status de trackers e estacas
   └─→ Gera relatórios
```

### Funcionalidades Principais

- **Criação e edição** de mapas de trackers com estrutura hierárquica (Groups → Rows → Trackers → Stakes)
- **Visualização** de mapas em modo somente leitura
- **Gerenciamento de inspeções** com aprovação/reprovação de trackers e estacas
- **Cálculo automático de status** baseado nas estacas de cada tracker
- **Sincronização em tempo real** entre aplicações via backend

### Estrutura de Dados

```
Field (Campo)
  └── Sections (Grupos/Seções)
      └── Rows (Fileiras)
          └── Rows_Trackers (Trackers na fileira)
              └── Rows_Stakes (Estacas do tracker)
```

### Tabelas Principais

- `fields` - Campos do projeto
- `sections` - Grupos/seções dentro de um campo
- `rows` - Fileiras dentro de uma seção
- `rows_trackers` - Trackers posicionados em uma fileira
- `rows_stakes` - Estacas associadas a um tracker
- `projects_backlogs` - Tarefas geradas automaticamente
- `sprints_tasks` - Tarefas de inspeção
- `quality_status` - Status de qualidade (aprovada/reprovada)

### Esquema Detalhado do Banco de Dados

#### Tabela: `fields`
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

#### Tabela: `sections`
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

#### Tabela: `rows`
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

#### Tabela: `rows_trackers`
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

#### Tabela: `rows_stakes`
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

#### Tabela: `projects_backlogs`
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

#### Tabela: `sprints_tasks`
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

#### Tabela: `rows_trackers_statuses`
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

#### Tabela: `stakes_statuses`
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

#### Tabela: `quality_status`
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

#### Tabela: `subtasks`
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

### Relacionamentos entre Tabelas

```
projects
  └── fields (1:N)
      └── sections (1:N)
          └── rows (1:N)
              └── rows_trackers (1:N)
                  └── rows_stakes (1:N)

projects_backlogs (N:1) → fields, sections, rows, rows_trackers, rows_stakes
sprints_tasks (N:1) → projects_backlogs, subtasks
subtasks (N:1) → projects_backlogs
```

### APIs Principais

**Backend Location:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/`

- `358_trackers_map_GET.xs` - Buscar mapa de trackers
- `359_trackers_map_POST.xs` - Criar novo mapa
- `366_trackers_map_PUT.xs` - Atualizar mapa existente
- `367_field_name_PUT.xs` - Atualizar nome do campo
- `68_fields_fields_id_DELETE.xs` - Deletar campo

---

## Fluxo 1: Criação de Campo/Mapa (POST)

**Endpoint:** `POST /api:6L6t8cws/trackers-map`  
**Arquivo Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/359_trackers_map_POST.xs`  
**Arquivo Local:** `post_trackers_map.xs` (cópia local)

### Descrição
Cria um novo campo com seu mapa completo de trackers, incluindo todas as estruturas hierárquicas e tarefas associadas.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ Recebe: json_map, projects_id, name, map_texts
  │
  ├─→ [INICIA TRANSAÇÃO]
  │
  ├─→ [PROCESSO: Calcula quantidade de seções]
  │     └─→ section_quantity = count(json_map.groups)
  │
  ├─→ [PROCESSO: Cria Field]
  │     └─→ db.add fields {
  │           name, section_quantity, projects_id, map_texts
  │         }
  │
  ├─→ [LOOP: Para cada group em json_map.groups]
  │     │
  │     ├─→ [PROCESSO: Cria Section]
  │     │     └─→ db.add sections {
  │     │           section_number, fields_id, x, y
  │     │         }
  │     │
  │     ├─→ [LOOP: Para cada row em section.rows]
  │     │     │
  │     │     ├─→ [PROCESSO: Cria Row]
  │     │     │     └─→ db.add rows {
  │     │     │           row_number, sections_id, x, y, groupOffsetX
  │     │     │         }
  │     │     │
  │     │     ├─→ [LOOP: Para cada tracker em row.trackers]
  │     │     │     │
  │     │     │     ├─→ [PROCESSO: Cria Row_Tracker]
  │     │     │     │     └─→ db.add rows_trackers {
  │     │     │     │           position, rows_id, trackers_id,
  │     │     │     │           rows_trackers_statuses_id: 1, rowY
  │     │     │     │         }
  │     │     │     │
  │     │     │     ├─→ [PROCESSO: Busca estacas do tracker]
  │     │     │     │     └─→ db.query stakes WHERE trackers_id
  │     │     │     │
  │     │     │     └─→ [LOOP: Para cada stake]
  │     │     │           └─→ [PROCESSO: Cria Row_Stake]
  │     │     │                 └─→ db.add rows_stakes {
  │     │     │                       rows_trackers_id, stakes_id,
  │     │     │                       stakes_statuses_id: 1, position
  │     │     │                     }
  │     │     │
  │     │     └─→ [FIM LOOP trackers]
  │     │
  │     └─→ [FIM LOOP rows]
  │
  ├─→ [PROCESSO: Criação de Tarefas (projects_backlogs)]
  │     │
  │     ├─→ [PROCESSO: Busca tasks_template fixas]
  │     │     └─→ db.query tasks_template WHERE is_fixed == true
  │     │
  │     └─→ [LOOP: Para cada task_template]
  │           │
  │           ├─→ {DECISÃO: equipaments_types_id == 1?}
  │           │     │ SIM (Tracker)
  │           │     └─→ [LOOP: Para cada section → row → rows_tracker]
  │           │           └─→ db.add projects_backlogs {
  │           │                 tasks_template_id, rows_trackers_id,
  │           │                 equipaments_types_id: 1
  │           │               }
  │           │
  │           ├─→ {DECISÃO: equipaments_types_id == 3?}
  │           │     │ SIM (Estaca)
  │           │     └─→ [LOOP: Para cada section → row → rows_tracker → rows_stake]
  │           │           └─→ db.add projects_backlogs {
  │           │                 tasks_template_id, rows_stakes_id,
  │           │                 equipaments_types_id: 3
  │           │               }
  │           │
  │           └─→ {CASO CONTRÁRIO}
  │                 └─→ [LOOP: Para cada section → row]
  │                       └─→ db.add projects_backlogs {
  │                             tasks_template_id, sections_id, rows_id
  │                           }
  │
  ├─→ [FIM TRANSAÇÃO]
  │
  └─→ [FIM] Retorna sections criadas
```

### Entradas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `json_map` | JSON | Estrutura completa do mapa (groups → rows → trackers) |
| `projects_id` | int | ID do projeto |
| `name` | text | Nome do campo |
| `map_texts` | JSON | Textos adicionais do mapa (opcional) |

### Saídas

- Campo criado com ID gerado
- Todas as seções, fileiras, trackers e estacas criadas
- Tarefas (projects_backlogs) geradas automaticamente

### Regras de Negócio

1. **Transação única**: Todo o processo ocorre em uma transação (rollback em caso de erro)
2. **Status inicial**: Todos os trackers começam com `rows_trackers_statuses_id: 1` (Aguardando estacas)
3. **Status inicial estacas**: Todas as estacas começam com `stakes_statuses_id: 1` (Não cravada)
4. **Tarefas automáticas**: Tarefas são criadas automaticamente baseadas em `tasks_template` com `is_fixed == true`
5. **Tipos de equipamento**:
   - `1` = Tracker
   - `3` = Estaca
   - Outros = Tarefas gerais

### Referências

- **Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/359_trackers_map_POST.xs`
- **Local:** `post_trackers_map.xs` (cópia local)
- **Frontend Store:** `src/store/layoutStore.ts` (método `saveToApi`)

---

## Fluxo 2: Edição de Campo/Mapa (PUT)

**Endpoint:** `PUT /api:6L6t8cws/trackers-map`  
**Arquivo Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/366_trackers_map_PUT.xs`  
**Arquivo Local:** `put_trackers_map.xs` (cópia local)

### Descrição
Atualiza um campo existente com novo layout, realizando sincronização incremental: cria novos elementos, atualiza existentes e remove elementos que não estão mais no payload.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ Recebe: json_map, projects_id, fields_id, map_texts
  │
  ├─→ [INICIA TRANSAÇÃO]
  │
  ├─→ [PROCESSO: Atualiza Field]
  │     └─→ db.edit fields {
  │           section_quantity, updated_at, map_texts
  │         }
  │
  ├─→ [PROCESSO: Remove Sections não presentes]
  │     │
  │     ├─→ [PROCESSO: Identifica sections a remover]
  │     │     └─→ sections_to_delete = old_sections_ids - new_sections_ids
  │     │
  │     └─→ [LOOP: Para cada section a remover]
  │           │
  │           ├─→ [PROCESSO: Marca section como deleted]
  │           │     └─→ db.edit sections { deleted_at: now }
  │           │
  │           └─→ [LOOP: Para cada row da section]
  │                 │
  │                 ├─→ [PROCESSO: Marca row como deleted]
  │                 │     └─→ db.edit rows { deleted_at: now }
  │                 │
  │                 └─→ [LOOP: Para cada tracker da row]
  │                       │
  │                       ├─→ [PROCESSO: Marca tracker como deleted]
  │                       │     └─→ db.edit rows_trackers { deleted_at: now }
  │                       │
  │                       ├─→ [LOOP: Para cada stake do tracker]
  │                       │     └─→ db.edit rows_stakes { deleted_at: now }
  │                       │
  │                       └─→ [LOOP: Para cada backlog do tracker]
  │                             └─→ db.edit projects_backlogs { deleted_at: now }
  │
  ├─→ [LOOP: Para cada group em json_map.groups]
  │     │
  │     ├─→ {DECISÃO: section.id existe?}
  │     │     │ SIM
  │     │     ├─→ [PROCESSO: Atualiza Section existente]
  │     │     │     └─→ db.edit sections {
  │     │     │           name, x, y, section_number, deleted_at: null
  │     │     │         }
  │     │     │
  │     │     └─→ NÃO
  │     │           └─→ [PROCESSO: Cria nova Section]
  │     │                 └─→ db.add sections { ... }
  │     │
  │     ├─→ [PROCESSO: Remove Rows não presentes]
  │     │     └─→ [LOOP: Para cada row antiga da section]
  │     │           ├─→ {DECISÃO: row existe no payload?}
  │     │           │     │ NÃO
  │     │           │     └─→ [PROCESSO: Remove row e dependências]
  │     │           │           └─→ (mesmo processo de remoção acima)
  │     │           │
  │     │           └─→ SIM → Continua
  │     │
  │     └─→ [LOOP: Para cada row em section.rows]
  │           │
  │           ├─→ {DECISÃO: row.id existe?}
  │           │     │ SIM
  │           │     ├─→ [PROCESSO: Atualiza Row existente]
  │           │     │     └─→ db.edit rows {
  │           │     │           row_number, x, y, groupOffsetX, deleted_at: null
  │           │     │         }
  │           │     │
  │           │     └─→ NÃO
  │           │           └─→ [PROCESSO: Cria nova Row]
  │           │                 └─→ db.add rows { ... }
  │           │
  │           ├─→ [PROCESSO: Remove Trackers não presentes]
  │           │     └─→ trackers_to_delete = existing_tracker_ids - payload_tracker_ids
  │           │     └─→ [LOOP: Remove cada tracker e dependências]
  │           │
  │           └─→ [LOOP: Para cada tracker em row.trackers]
  │                 │
  │                 ├─→ {DECISÃO: tracker.id existe?}
  │                 │     │ SIM
  │                 │     ├─→ [PROCESSO: Atualiza Tracker existente]
  │                 │     │     └─→ db.edit rows_trackers {
  │                 │     │           position, rowY, deleted_at: null
  │                 │     │         }
  │                 │     │
  │                 │     └─→ NÃO
  │                 │           ├─→ [PROCESSO: Cria novo Tracker]
  │                 │           │     └─→ db.add rows_trackers { ... }
  │                 │           │
  │                 │           ├─→ [PROCESSO: Cria estacas do tracker]
  │                 │           │     └─→ [LOOP: Para cada stake do modelo]
  │                 │           │           └─→ db.add rows_stakes { ... }
  │                 │           │
  │                 │           └─→ [PROCESSO: Cria tarefas para novo tracker]
  │                 │                 └─→ [LOOP: Para cada task_template]
  │                 │                       └─→ db.add projects_backlogs { ... }
  │                 │
  │                 └─→ [PROCESSO: Reordena estacas]
  │                       └─→ [LOOP: Atualiza position das estacas]
  │
  ├─→ [FIM TRANSAÇÃO]
  │
  └─→ [FIM] Retorna field atualizado
```

### Entradas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `json_map` | JSON | Nova estrutura do mapa |
| `projects_id` | int | ID do projeto |
| `fields_id` | int | ID do campo a atualizar |
| `map_texts` | JSON | Textos adicionais (opcional) |

### Saídas

- Campo atualizado
- Estrutura sincronizada (cria/atualiza/remove conforme necessário)

### Regras de Negócio

1. **Soft Delete**: Elementos removidos são marcados com `deleted_at` (não deletados fisicamente)
2. **Sincronização incremental**: Apenas diferenças são processadas
3. **Cascata de remoção**: Remover uma section remove todas as rows, trackers, stakes e backlogs associados
4. **Criação de tarefas**: Novos trackers geram automaticamente suas tarefas (projects_backlogs)
5. **Reordenação**: Estacas são reordenadas automaticamente após inserções

### Referências

- **Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/366_trackers_map_PUT.xs`
- **Local:** `put_trackers_map.xs` (cópia local)
- **Frontend Store:** `src/store/layoutStore.ts` (método `saveToApi`)

---

## Fluxo 3: Visualização de Campo/Mapa (GET)

**Endpoint:** `GET /api:6L6t8cws/trackers-map?projects_id=X&fields_id=Y`  
**Arquivo Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/358_trackers_map_GET.xs`  
**Arquivo Frontend:** `src/store/layoutStore.ts` (método `loadFromApi`)

### Descrição
Carrega um mapa existente do banco de dados e renderiza no canvas em modo somente leitura.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ Recebe: projects_id, fields_id da URL/contexto
  │
  ├─→ {DECISÃO: fieldId == 0?}
  │     │ SIM (Modo criação)
  │     └─→ [PROCESSO: Limpa canvas]
  │           └─→ loadFromJson('[]')
  │           └─→ [FIM]
  │
  └─→ NÃO (Modo visualização)
        │
        ├─→ [PROCESSO: Chama API]
        │     └─→ GET /trackers-map?projects_id=X&fields_id=Y
        │
        ├─→ {DECISÃO: Resposta recebida?}
        │     │ NÃO
        │     └─→ [ERRO] Retorna erro
        │
        └─→ SIM
              │
        ├─→ [PROCESSO: Processa resposta da API]
        │     │
        │     ├─→ Formato da resposta: { mapa: [...], campo: {...} }
        │     │
        │     ├─→ sectionsData = data.mapa (array de sections)
        │     │     └─→ Cada section contém:
        │     │           - id, section_number, x, y
        │     │           - rows[] (cada row contém list_rows_trackers[])
        │     │
        │     └─→ mapTexts = data.campo.map_texts (JSON com textos)
              │
              ├─→ [PROCESSO: Carrega layout]
              │     └─→ loadFromJson(JSON.stringify(sectionsData))
              │
              ├─→ [PROCESSO: Carrega textos]
              │     └─→ Se mapTexts existir, carrega textElements
              │
              └─→ [FIM] Canvas renderizado
```

### Fluxograma Detalhado - loadFromJson

```
[PROCESSO: loadFromJson]
  │
  ├─→ [PROCESSO: Parse JSON]
  │     └─→ parsedData = JSON.parse(jsonData)
  │
  ├─→ {DECISÃO: É estrutura de banco?}
  │     │ SIM
  │     ├─→ {DECISÃO: Formato sections com rows?}
  │     │     │ SIM
  │     │     └─→ [LOOP: Para cada section]
  │     │           ├─→ [PROCESSO: Cria RowGroup]
  │     │           │     └─→ rowGroup = {
  │     │           │           id, databaseId, x, y,
  │     │           │           name, sectionNumber, rowIds
  │     │           │         }
  │     │           │
  │     │           └─→ [LOOP: Para cada row da section]
  │     │                 ├─→ [PROCESSO: Cria Row]
  │     │                 │     └─→ row = { id, databaseId, x, y, trackerIds }
  │     │                 │
  │     │                 └─→ [LOOP: Para cada tracker da row]
  │     │                       ├─→ [PROCESSO: Cria Tracker]
  │     │                       │     └─→ tracker = {
  │     │                       │           id, databaseId, rowY, ext,
  │     │                       │           stakeStatusIds
  │     │                       │         }
  │     │                       │
  │     │                       └─→ [PROCESSO: Adiciona tracker à row]
  │     │
  │     └─→ NÃO (Formato antigo)
  │           └─→ [PROCESSO: Processa formato antigo]
  │
  └─→ [FIM] Layout carregado no store
```

### Entradas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `projects_id` | int | ID do projeto (da URL) |
| `fields_id` | int | ID do campo (da URL) |
| `authToken` | string | Token de autenticação (opcional) |

### Saídas

- Layout carregado no `layoutStore`
- Canvas renderizado em modo visualização (somente leitura)

### Regras de Negócio

1. **Modo criação**: Se `fieldId == 0`, limpa o canvas
2. **Proteção contra resposta atrasada**: Verifica se o `fieldId` atual ainda corresponde ao carregado
3. **Múltiplos formatos**: Suporta formato antigo e novo da API
4. **Status das estacas**: Carrega `stakeStatusIds` de cada tracker para cálculo de cores

### Estrutura da Resposta da API

A API retorna um objeto com a seguinte estrutura:

```json
{
  "mapa": [
    {
      "id": 1,
      "section_number": 1,
      "x": 0,
      "y": 0,
      "rows": [
        {
          "id": 1,
          "row_number": 1,
          "x": 0,
          "y": 0,
          "groupOffsetX": 0,
          "list_rows_trackers": [
            {
              "id": 1,
              "position": "1",
              "rowY": 0,
              "trackers": {
                "id": 1,
                "trackers_types": {...},
                "manufacturers": {...}
              },
              "list_trackers_stakes": [
                {
                  "id": 1,
                  "position": "1",
                  "stakes": {...},
                  "stakes_statuses": {
                    "status": "Cravada com Sucesso"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "campo": {
    "id": 1,
    "name": "Campo 1",
    "map_texts": {...}
  }
}
```

### Referências

- **Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/358_trackers_map_GET.xs`
- **Frontend:** `src/components/ViewCanvas.tsx`
- **Store:** `src/store/layoutStore.ts` (métodos `loadFromApi`, `loadFromJson`)

---

## Fluxo 4: Inspeção (update_inspection)

**Endpoint:** `POST /api:6L6t8cws/update_inspection`  
**Arquivo Backend:** `/Users/samanthamaia/development/xano_sunview/apis/sprints/308_update_inspection_POST.xs`  
**Arquivo Local:** `update_inspection.xs` (cópia local)

### Descrição
Atualiza o resultado de uma inspeção, modificando os status de trackers e estacas conforme o resultado (aprovada ou reprovada).

### Fluxograma

```
[INÍCIO]
  │
  ├─→ Recebe: sprints_tasks_id, quality_status_id
  │     │
  │     ├─→ quality_status_id == 2 → Inspeção Aprovada
  │     └─→ quality_status_id == 3 → Inspeção Reprovada
  │
  ├─→ [PROCESSO: Busca tarefa de inspeção]
  │     └─→ db.get sprints_tasks WHERE id = sprints_tasks_id
  │
  ├─→ [PROCESSO: Busca projects_backlogs da inspeção]
  │     └─→ db.get projects_backlogs WHERE id = sprints_tasks.projects_backlogs_id
  │
  ├─→ [VALIDAÇÃO: Verifica se é inspeção]
  │     └─→ {DECISÃO: is_inspection == true?}
  │           │ NÃO
  │           └─→ [ERRO] "Essa tarefa não é uma inspeção"
  │
  ├─→ [PROCESSO: Atualiza tarefa de inspeção]
  │     └─→ db.edit sprints_tasks {
  │           sprints_tasks_statuses_id: 3, executed_at: today
  │         }
  │
  ├─→ {DECISÃO: subtasks_id == null?}
  │     │ SIM (É task principal)
  │     │
  │     ├─→ [PROCESSO: Atualiza projects_backlogs da inspeção]
  │     │     └─→ db.edit projects_backlogs {
  │     │           projects_backlogs_statuses_id: 3
  │     │         }
  │     │
  │     ├─→ [PROCESSO: Atualiza tarefa inspecionada]
  │     │     └─→ db.edit projects_backlogs {
  │     │           quality_status_id: quality_status_id
  │     │         }
  │     │
  │     ├─→ {DECISÃO: equipaments_types_id == 3?}
  │     │     │ SIM (Estaca individual)
  │     │     │
  │     │     ├─→ {DECISÃO: quality_status_id == 2?}
  │     │     │     │ SIM (Aprovada)
  │     │     │     └─→ [PROCESSO: Atualiza estaca]
  │     │     │           └─→ db.edit rows_stakes {
  │     │     │                 stakes_statuses_id: 2 (Cravada com Sucesso)
  │     │     │               }
  │     │     │
  │     │     └─→ NÃO (Reprovada)
  │     │           └─→ [PROCESSO: Atualiza estaca]
  │     │                 └─→ db.edit rows_stakes {
  │     │                       stakes_statuses_id: 7 (Inspeção reprovada)
  │     │                     }
  │     │
  │     └─→ NÃO (Tracker)
  │           │
  │           ├─→ {DECISÃO: rows_trackers_id existe E rows_stakes_id == null?}
  │           │     │ SIM (Tracker completo, não estaca individual)
  │           │     │
  │           │     ├─→ {DECISÃO: quality_status_id == 2?}
  │           │     │     │ SIM (Aprovada)
  │           │     │     │
  │           │     │     ├─→ [PROCESSO: Busca todas as estacas do tracker]
  │           │     │     │     └─→ db.query rows_stakes WHERE rows_trackers_id
  │           │     │     │
  │           │     │     ├─→ [PROCESSO: Verifica se todas estão azuis]
  │           │     │     │     └─→ [LOOP: Para cada estaca]
  │           │     │     │           └─→ {DECISÃO: stakes_statuses_id == 2?}
  │           │     │     │                 │ NÃO
  │           │     │     │                 └─→ all_stakes_blue = false
  │           │     │     │
  │           │     │     ├─→ {DECISÃO: all_stakes_blue == true E count > 0?}
  │           │     │     │     │ SIM
  │           │     │     │     ├─→ [PROCESSO: Atualiza tracker]
  │           │     │     │     │     └─→ db.edit rows_trackers {
  │           │     │     │     │           rows_trackers_statuses_id: 5
  │           │     │     │     │           (Tracker e módulos instalados)
  │           │     │     │     │         }
  │           │     │     │     │
  │           │     │     │     └─→ [LOOP: Atualiza todas as estacas]
  │           │     │     │           └─→ db.edit rows_stakes {
  │           │     │     │                 stakes_statuses_id: 5
  │           │     │     │                 (Módulos montados)
  │           │     │     │               }
  │           │     │     │
  │           │     │     └─→ NÃO → Não atualiza (estacas não estão todas azuis)
  │           │     │
  │           │     └─→ NÃO (Reprovada)
  │           │           └─→ [PROCESSO: Atualiza apenas tracker]
  │           │                 └─→ db.edit rows_trackers {
  │           │                       rows_trackers_statuses_id: 8
  │           │                       (Inspeção reprovada)
  │           │                     }
  │           │                 └─→ [NOTA: NÃO altera status das estacas]
  │           │
  │           └─→ NÃO → Continua (estaca individual já tratada acima)
  │
  └─→ NÃO (É subtask)
        │
        └─→ [PROCESSO: Atualiza subtask]
              └─→ db.edit subtasks {
                    quantity_done: quantity
                  }
```

### Entradas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sprints_tasks_id` | int | ID da tarefa de inspeção |
| `quality_status_id` | int | Resultado da inspeção (2=aprovada, 3=reprovada) |

### Saídas

- Tarefa de inspeção marcada como executada
- Status de tracker/estaca atualizados conforme regras

### Regras de Negócio

#### Inspeção Aprovada (quality_status_id == 2)

1. **Estaca individual**:
   - Atualiza estaca para `stakes_statuses_id: 2` (Cravada com Sucesso)

2. **Tracker completo**:
   - Verifica se TODAS as estacas estão com status 2 (azul)
   - Se sim:
     - Atualiza tracker para `rows_trackers_statuses_id: 5` (Tracker e módulos instalados)
     - Atualiza todas as estacas para `stakes_statuses_id: 5` (Módulos montados)
   - Se não: Não atualiza (aguarda todas as estacas ficarem azuis)

#### Inspeção Reprovada (quality_status_id == 3)

1. **Estaca individual**:
   - Atualiza estaca para `stakes_statuses_id: 7` (Inspeção reprovada)

2. **Tracker completo**:
   - Atualiza APENAS o tracker para `rows_trackers_statuses_id: 8` (Inspeção reprovada)
   - **NÃO altera** o status das estacas individuais

### Status de Trackers (rows_trackers_statuses_id)

| ID | Descrição |
|----|-----------|
| 1 | Aguardando estacas |
| 2 | Problema, mas não impede a montagem do módulo |
| 3 | Impedido para montagem do tracker |
| 4 | Liberado para montagem do tracker |
| 5 | Tracker e módulos instalados |
| 6 | Liberado para montagem do módulos |
| 7 | Aguardando inspeção |
| 8 | Inspeção reprovada |

### Status de Estacas (stakes_statuses_id)

| ID | Descrição |
|----|-----------|
| 1 | Não cravada |
| 2 | Cravada com Sucesso |
| 3 | Cravada com problema mas sem impeditivo para montagem do tracker |
| 4 | Problema que impede a montagem do tracker |
| 5 | Módulos montados |
| 6 | Aguardando inspeção |
| 7 | Inspeção reprovada |

### Referências

- **Backend:** `/Users/samanthamaia/development/xano_sunview/apis/sprints/308_update_inspection_POST.xs`
- **Local:** `update_inspection.xs` (cópia local)

---

## Fluxo 5: Seleção de Campo (FieldSelector)

**Arquivo:** `src/components/FieldSelector.tsx`

### Descrição
Gerencia a seleção de campos, navegação entre modos (criação/edição/visualização) e operações CRUD de campos.

### Fluxograma - Carregamento Inicial

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Lê parâmetros da URL]
  │     └─→ projectId, companyId, fieldId, mode, authToken
  │
  ├─→ [PROCESSO: Lê contexto da aplicação]
  │     └─→ appParams (projectId, companyId, fieldId, authToken)
  │
  ├─→ {DECISÃO: projectId E companyId existem?}
  │     │ SIM
  │     └─→ [PROCESSO: Busca campos]
  │           └─→ fetchFields(projectId, companyId, authToken)
  │                 └─→ GET /fields?company_id=X&projects_id=Y
  │
  └─→ [PROCESSO: Determina fieldId a usar]
        ├─→ Prioridade: appParams.fieldId > urlFieldId
        └─→ Se fieldId == '0' E mode == 'create' → Modo criação
```

### Fluxograma - Auto-seleção

```
[PROCESSO: Auto-seleção de campo]
  │
  ├─→ {DECISÃO: Já existe fieldId válido?}
  │     │ SIM
  │     └─→ [FIM] Não faz auto-seleção
  │
  └─→ NÃO
        │
        ├─→ {DECISÃO: fieldId == '0' E mode == 'view'?}
        │     │ SIM (Aguardando seleção)
        │     └─→ [PROCESSO: Seleciona primeiro campo]
        │           ├─→ Ordena campos por created_at (mais antigo primeiro)
        │           ├─→ Seleciona primeiro campo
        │           └─→ Navega para /view?fieldId=X&mode=view
        │
        └─→ NÃO
              │
              └─→ {DECISÃO: Não há fieldId na URL nem no contexto?}
                    │ SIM
                    └─→ [PROCESSO: Seleciona primeiro campo]
                          └─→ (mesmo processo acima)
```

### Fluxograma - Mudança de Campo

```
[PROCESSO: Usuário seleciona campo no dropdown]
  │
  ├─→ [PROCESSO: Atualiza selectedFieldId]
  │
  ├─→ {DECISÃO: fieldId == ''?}
  │     │ SIM (Opção vazia)
  │     └─→ [PROCESSO: Limpa seleção]
  │           └─→ Remove fieldId da URL
  │           └─→ [FIM]
  │
  ├─→ {DECISÃO: fieldId == '0'?}
  │     │ SIM (Criar novo)
  │     └─→ [PROCESSO: Navega para modo criação]
  │           └─→ /?fieldId=0&mode=create
  │           └─→ [FIM]
  │
  └─→ NÃO (Campo existente)
        │
        ├─→ {DECISÃO: Rota atual == '/view'?}
        │     │ SIM
        │     └─→ [PROCESSO: Navega para visualização]
        │           └─→ /view?fieldId=X&mode=view
        │
        └─→ NÃO
              └─→ [PROCESSO: Navega para edição]
                    └─→ /?fieldId=X&mode=edit
```

### Fluxograma - Edição de Nome

```
[PROCESSO: Editar nome do campo]
  │
  ├─→ [PROCESSO: Usuário clica em editar]
  │     └─→ setIsEditingName(true)
  │
  ├─→ [PROCESSO: Usuário digita novo nome]
  │
  ├─→ {DECISÃO: Usuário salva (Enter ou botão)?}
  │     │ SIM
  │     ├─→ [PROCESSO: Valida nome]
  │     │     └─→ {DECISÃO: nome.trim() != ''?}
  │     │           │ NÃO
  │     │           └─→ [ERRO] "Por favor, insira um nome"
  │     │
  │     ├─→ SIM
  │     │     └─→ [PROCESSO: Atualiza nome via API]
  │     │           └─→ PUT /field_name { fieldId, name }
  │     │
  │     │           ├─→ {DECISÃO: Sucesso?}
  │     │           │     │ SIM
  │     │           │     ├─→ [PROCESSO: Recarrega lista de campos]
  │     │           │     │     └─→ fetchFields(...)
  │     │           │     │
  │     │           │     └─→ [PROCESSO: Fecha editor]
  │     │           │           └─→ setIsEditingName(false)
  │     │           │
  │     │           └─→ NÃO
  │     │                 └─→ [ERRO] Mostra mensagem de erro
  │     │
  │     └─→ NÃO (Cancelar)
  │           └─→ [PROCESSO: Restaura nome original]
  │                 └─→ setFieldName(field.name)
  │                 └─→ setIsEditingName(false)
```

### Fluxograma - Exclusão de Campo

```
[PROCESSO: Excluir campo]
  │
  ├─→ [PROCESSO: Usuário clica em excluir]
  │     └─→ Abre modal de confirmação
  │
  ├─→ {DECISÃO: Usuário confirma?}
  │     │ NÃO
  │     └─→ [FIM] Fecha modal
  │
  └─→ SIM
        │
        ├─→ [PROCESSO: Chama API de exclusão]
        │     └─→ DELETE /fields/{fieldId}
        │
        ├─→ {DECISÃO: Sucesso?}
        │     │ NÃO
        │     └─→ [ERRO] Mostra erro no modal
        │
        └─→ SIM
              │
              ├─→ [PROCESSO: Limpa seleção]
              │     └─→ setSelectedFieldId(null)
              │
              ├─→ [PROCESSO: Remove fieldId da URL]
              │
              └─→ [PROCESSO: Recarrega lista de campos]
                    └─→ fetchFields(...)
```

### Entradas

| Fonte | Campo | Descrição |
|-------|-------|-----------|
| URL | `projectId` | ID do projeto |
| URL | `companyId` | ID da empresa |
| URL | `fieldId` | ID do campo (ou '0' para criar) |
| URL | `mode` | Modo: 'create', 'edit', 'view' |
| URL | `authToken` | Token de autenticação |
| Contexto | `appParams` | Parâmetros da aplicação (FlutterFlow) |

### Saídas

- Campo selecionado e carregado
- Navegação para modo apropriado (criação/edição/visualização)
- Lista de campos atualizada

### Regras de Negócio

1. **Prioridade de fieldId**: `appParams.fieldId` > `urlFieldId`
2. **Modo criação**: `fieldId == '0'` + `mode == 'create'`
3. **Auto-seleção**: Se não há fieldId, seleciona o campo mais antigo (por `created_at`)
4. **Modo view com fieldId=0**: Tratado como aguardando seleção, faz auto-seleção
5. **Exclusão**: Remove campo e limpa seleção atual

### Referências

- Arquivo: `src/components/FieldSelector.tsx`
- Store: `src/store/fieldsStore.ts`

---

## Fluxo 6: Manipulação do Canvas

**Arquivo:** `src/components/Canvas.tsx`, `src/store/layoutStore.ts`

### Descrição
Gerencia todas as interações do usuário com o canvas: adicionar, mover, agrupar, alinhar, duplicar e remover elementos.

### Sub-fluxo 6.1: Adicionar Tracker

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário arrasta tracker da paleta]
  │
  ├─→ {DECISÃO: Soltar sobre canvas vazio?}
  │     │ SIM
  │     └─→ [PROCESSO: Adiciona tracker solto]
  │           └─→ addLooseTracker(type, x, y)
  │                 └─→ Cria tracker com x, y absolutos
  │
  └─→ NÃO (Sobre uma row)
        │
        └─→ [PROCESSO: Adiciona tracker à row]
              └─→ addTrackerToRow(type, rowId, index)
                    └─→ Cria tracker vinculado à row
                    └─→ Adiciona trackerId à row.trackerIds
```

### Sub-fluxo 6.2: Mover Elementos

```
[INÍCIO]
  │
  ├─→ {DECISÃO: Tipo de elemento?}
  │     │
  │     ├─→ Tracker solto
  │     │     ├─→ [PROCESSO: beginDragLoose(trackerId)]
  │     │     ├─→ [LOOP: Durante arraste]
  │     │     │     └─→ moveLooseTrackerByDelta(dx, dy, snap)
  │     │     └─→ [PROCESSO: endDragLoose()]
  │     │
  │     ├─→ Row
  │     │     ├─→ [PROCESSO: beginDragRow(rowId)]
  │     │     ├─→ [LOOP: Durante arraste]
  │     │     │     └─→ moveRowByDelta(dx, dy, snapX, snapY)
  │     │     └─→ [PROCESSO: endDragRow()]
  │     │
  │     ├─→ Group
  │     │     ├─→ [PROCESSO: beginDragGroup(groupId)]
  │     │     ├─→ [LOOP: Durante arraste]
  │     │     │     └─→ moveGroupByDelta(dx, dy, snap)
  │     │     └─→ [PROCESSO: endDragGroup()]
  │     │
  │     └─→ Tracker dentro de row (ajuste vertical)
  │           ├─→ [PROCESSO: beginVerticalDrag(trackerId)]
  │           ├─→ [LOOP: Durante arraste Alt+drag]
  │           │     └─→ Atualiza tracker.rowY
  │           └─→ [PROCESSO: endVerticalDrag()]
```

### Sub-fluxo 6.3: Agrupar Elementos

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário seleciona elementos]
  │
  ├─→ {DECISÃO: Tipo de elementos selecionados?}
  │     │
  │     ├─→ Trackers soltos
  │     │     └─→ [PROCESSO: Agrupa em Row]
  │     │           └─→ groupSelectedIntoRow()
  │     │                 ├─→ Cria nova row
  │     │                 ├─→ Move trackers para row
  │     │                 └─→ Remove trackers de looseIds
  │     │
  │     └─→ Rows
  │           └─→ [PROCESSO: Agrupa em Group]
  │                 └─→ groupSelectedRowsIntoGroup()
  │                       ├─→ Cria novo group
  │                       └─→ Adiciona rows ao group
```

### Sub-fluxo 6.4: Alinhar e Distribuir

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário seleciona 2+ elementos]
  │
  ├─→ [PROCESSO: Usuário clica em alinhar/distribuir]
  │
  ├─→ {DECISÃO: Tipo de alinhamento?}
  │     │
  │     ├─→ Horizontal (left, center, right)
  │     │     └─→ [PROCESSO: Calcula posição X comum]
  │     │           └─→ [LOOP: Para cada elemento]
  │     │                 └─→ Atualiza x = posição calculada
  │     │
  │     ├─→ Vertical (top, middle, bottom)
  │     │     └─→ [PROCESSO: Calcula posição Y comum]
  │     │           └─→ [LOOP: Para cada elemento]
  │     │                 └─→ Atualiza y = posição calculada
  │     │
  │     └─→ Distribuir (horizontal/vertical)
  │           └─→ [PROCESSO: Calcula espaçamento uniforme]
  │                 └─→ [LOOP: Distribui elementos]
```

### Sub-fluxo 6.5: Duplicar Elementos

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário seleciona elementos]
  │
  ├─→ [PROCESSO: Usuário pressiona Ctrl+V]
  │
  ├─→ [PROCESSO: Duplica elementos]
  │     └─→ duplicateSelected()
  │           ├─→ [LOOP: Para cada elemento selecionado]
  │           │     ├─→ Cria cópia com novo ID
  │           │     ├─→ Ajusta posição (offset)
  │           │     └─→ Adiciona ao store
  │           │
  │           └─→ [PROCESSO: Seleciona elementos duplicados]
```

### Sub-fluxo 6.6: Remover Elementos

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário seleciona elementos]
  │
  ├─→ [PROCESSO: Usuário pressiona Delete]
  │
  ├─→ [LOOP: Para cada elemento selecionado]
  │     │
  │     ├─→ {DECISÃO: Tipo de elemento?}
  │     │     │
  │     │     ├─→ Tracker
  │     │     │     ├─→ {DECISÃO: Está em uma row?}
  │     │     │     │     │ SIM
  │     │     │     │     │ └─→ [PROCESSO: Remove de row.trackerIds]
  │     │     │     │     │
  │     │     │     │     └─→ NÃO (soltos)
  │     │     │     │           └─→ [PROCESSO: Remove de looseIds]
  │     │     │     │
  │     │     │     └─→ [PROCESSO: Remove tracker do store]
  │     │     │
  │     │     ├─→ Row
  │     │     │     ├─→ [PROCESSO: Remove todos os trackers da row]
  │     │     │     ├─→ {DECISÃO: Row está em um group?}
  │     │     │     │     │ SIM
  │     │     │     │     │ └─→ [PROCESSO: Remove de group.rowIds]
  │     │     │     │     │
  │     │     │     │     └─→ NÃO
  │     │     │     │
  │     │     │     └─→ [PROCESSO: Remove row do store]
  │     │     │
  │     │     └─→ Group
  │     │           ├─→ [PROCESSO: Remove todas as rows do group]
  │     │           └─→ [PROCESSO: Remove group do store]
  │     │
  │     └─→ [PROCESSO: Limpa seleção]
```

### Sub-fluxo 6.7: Reordenar Trackers em Row

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Usuário arrasta tracker dentro de row]
  │
  ├─→ [PROCESSO: Detecta posição de destino]
  │
  ├─→ {DECISÃO: Mesma row?}
  │     │ SIM
  │     └─→ [PROCESSO: Reordena dentro da row]
  │           └─→ reorderWithinRow(rowId, activeId, overId)
  │                 └─→ Reordena trackerIds na row
  │
  └─→ NÃO
        │
        └─→ [PROCESSO: Move entre rows]
              └─→ moveBetweenRows(fromRowId, toRowId, trackerId, index)
                    ├─→ Remove tracker da row origem
                    └─→ Adiciona tracker à row destino
```

### Entradas

| Ação | Entrada | Descrição |
|------|---------|-----------|
| Adicionar tracker | Drag & drop da paleta | Tracker arrastado para canvas/row |
| Mover | Mouse drag | Elemento arrastado |
| Agrupar | Seleção + botão | Elementos selecionados |
| Alinhar | Seleção + botão | 2+ elementos selecionados |
| Duplicar | Ctrl+V | Elementos selecionados |
| Remover | Delete | Elementos selecionados |
| Reordenar | Drag dentro de row | Tracker arrastado |

### Saídas

- Estado do canvas atualizado
- Histórico de ações (undo/redo)

### Regras de Negócio

1. **Snap to grid**: Elementos se alinham automaticamente à grade
2. **Histórico**: Todas as ações são salvas para undo/redo
3. **Validação**: Algumas ações requerem seleção mínima (ex: alinhar precisa de 2+ elementos)
4. **Cascata**: Remover um group remove todas as rows e trackers

### Referências

- Arquivo: `src/components/Canvas.tsx`
- Store: `src/store/layoutStore.ts` (métodos de manipulação)

---

## Fluxo 7: Cálculo de Status e Cores

**Arquivo:** `src/utils/trackerStatusColor.ts`

### Descrição
Calcula a cor visual de um tracker baseado nos status das suas estacas, seguindo regras de prioridade.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ Recebe: stakeStatusIds[] (array de status das estacas)
  │
  ├─→ {DECISÃO: stakeStatusIds está vazio ou null?}
  │     │ SIM
  │     └─→ [RETORNA] { color: '#e5e7eb' (gray), status: 'default' }
  │
  └─→ NÃO
        │
        ├─→ [VERIFICAÇÃO 1: Estacas vermelhas escuras (status_id == 7)]
        │     └─→ {DECISÃO: Alguma estaca tem status 7?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#991b1b' (red-800), status: 'blocked' }
        │                 └─→ PRIORIDADE MÁXIMA
        │
        ├─→ [VERIFICAÇÃO 2: Estacas vermelhas (status_id == 4)]
        │     └─→ {DECISÃO: Alguma estaca tem status 4?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#dc2626' (red-600), status: 'blocked' }
        │
        ├─→ [VERIFICAÇÃO 3: Estacas amarelas (status_id == 3)]
        │     └─→ {DECISÃO: Alguma estaca tem status 3?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#eab308' (yellow-500), status: 'warning' }
        │
        ├─→ [VERIFICAÇÃO 4: Estacas roxas (status_id == 6)]
        │     └─→ {DECISÃO: Alguma estaca tem status 6?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#9333ea' (violet-600), status: 'warning' }
        │
        ├─→ [VERIFICAÇÃO 5: Todas as estacas azuis (status_id == 2)]
        │     └─→ {DECISÃO: TODAS as estacas têm status 2?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#3b82f6' (blue-600), status: 'ready' }
        │
        ├─→ [VERIFICAÇÃO 6: Todas as estacas verdes (status_id == 5)]
        │     └─→ {DECISÃO: TODAS as estacas têm status 5?}
        │           │ SIM
        │           └─→ [RETORNA] { color: '#059669' (emerald-600), status: 'ready' }
        │
        └─→ [CASO PADRÃO]
              └─→ [RETORNA] { color: '#e5e7eb' (gray-200), status: 'default' }
```

### Tabela de Mapeamento de Status

| Status da Estaca | Cor do Tracker | Prioridade | Significado |
|------------------|----------------|------------|-------------|
| 7 (Inspeção reprovada) | Vermelho escuro (#991b1b) | 1 (Máxima) | Bloqueado - Inspeção reprovada |
| 4 (Impede montagem) | Vermelho (#dc2626) | 2 | Bloqueado - Impedido para montagem |
| 3 (Problema sem impeditivo) | Amarelo (#eab308) | 3 | Atenção - Problema detectado |
| 6 (Aguardando inspeção) | Roxo (#9333ea) | 4 | Atenção - Aguardando inspeção |
| 2 (Todas cravadas) | Azul (#3b82f6) | 5 | Pronto - Liberado para montagem |
| 5 (Todas montadas) | Verde (#059669) | 6 | Pronto - Módulos montados |
| Outros/Misto | Cinza (#e5e7eb) | 7 | Padrão - Estado indefinido |

### Regras de Negócio

1. **Prioridade**: Status mais críticos têm prioridade maior (vermelho escuro > vermelho > amarelo > roxo > azul > verde)
2. **"Alguma estaca"**: Se pelo menos uma estaca tiver um status crítico, o tracker assume essa cor
3. **"Todas as estacas"**: Para azul e verde, TODAS as estacas devem ter o mesmo status
4. **Status misto**: Se houver estacas com status diferentes e nenhum crítico, usa cor padrão (cinza)

### Exemplos

**Exemplo 1: Tracker com estacas mistas**
- Estaca 1: status 2 (azul)
- Estaca 2: status 2 (azul)
- Estaca 3: status 4 (vermelho)
- **Resultado**: Tracker vermelho (status 4 tem prioridade)

**Exemplo 2: Tracker com todas as estacas azuis**
- Estaca 1: status 2
- Estaca 2: status 2
- Estaca 3: status 2
- **Resultado**: Tracker azul

**Exemplo 3: Tracker com uma estaca reprovada**
- Estaca 1: status 2
- Estaca 2: status 7 (reprovada)
- Estaca 3: status 2
- **Resultado**: Tracker vermelho escuro (prioridade máxima)

### Referências

- Arquivo: `src/utils/trackerStatusColor.ts`
- Componente: `src/components/Tracker.tsx` (usa a função para renderizar cor)

---

---

## Fluxo 8: Integração App Móvel - Inspeção

**Aplicação:** App Móvel (Flutter)  
**Localização:** `/Users/samanthamaia/development/parque_solar_app`

### Descrição
Fluxo completo de inspeção realizado pelo operador no campo através do app móvel, desde a visualização da tarefa até a atualização do status no backend.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Operador abre app móvel]
  │     └─→ Login e autenticação
  │
  ├─→ [PROCESSO: Visualiza lista de tarefas]
  │     └─→ GET /sprints_tasks (tarefas atribuídas)
  │
  ├─→ [PROCESSO: Seleciona tarefa de inspeção]
  │     └─→ Filtra por is_inspection == true
  │
  ├─→ [PROCESSO: Abre modal de inspeção]
  │     └─→ ModalInspecaoWidget
  │           └─→ Exibe: "Status da Inspeção"
  │           └─→ Descrição: "Selecione se a inspeção foi Aprovada ou Reprovada"
  │
  ├─→ {DECISÃO: Operador seleciona resultado?}
  │     │
  │     ├─→ APROVADA
  │     │     └─→ [PROCESSO: Chama API de atualização]
  │     │           └─→ POST /update_inspection
  │     │                 Body: {
  │     │                   sprints_tasks_id: X,
  │     │                   quality_status_id: 2
  │     │                 }
  │     │
  │     └─→ REPROVADA
  │           └─→ [PROCESSO: Chama API de atualização]
  │                 └─→ POST /update_inspection
  │                       Body: {
  │                         sprints_tasks_id: X,
  │                         quality_status_id: 3
  │                       }
  │
  ├─→ {DECISÃO: API retornou sucesso?}
  │     │ NÃO
  │     └─→ [ERRO] Exibe mensagem de erro
  │
  └─→ SIM
        │
        ├─→ [PROCESSO: Atualiza interface local]
        │     └─→ Marca tarefa como concluída
        │
        └─→ [FIM] Inspeção registrada
```

### Componentes do App Móvel

#### Modal de Inspeção
**Arquivo:** `/Users/samanthamaia/development/parque_solar_app/lib/components/modal_inspecao_widget.dart`

- **Botão Aprovada**: Chama API com `quality_status_id: 2`
- **Botão Reprovada**: Chama API com `quality_status_id: 3`
- **Fechamento**: Navega de volta à lista de tarefas

#### API Call
**Arquivo:** `/Users/samanthamaia/development/parque_solar_app/lib/backend/api_requests/api_calls.dart`

```dart
class UpdateInspectionCall {
  Future<ApiCallResponse> call({
    int? sprintsTasksId,
    int? qualityStatusId,
  }) async {
    return ApiManager.instance.makeApiCall(
      callName: 'Update inspection',
      apiUrl: '${baseUrl}/update_inspection',
      callType: ApiCallType.POST,
      body: {
        'sprints_tasks_id': sprintsTasksId,
        'quality_status_id': qualityStatusId,
      },
    );
  }
}
```

### Entradas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sprints_tasks_id` | int | ID da tarefa de inspeção |
| `quality_status_id` | int | 2 = Aprovada, 3 = Reprovada |

### Saídas

- Status atualizado no backend
- Tarefa marcada como concluída no app
- Status de tracker/estaca atualizado conforme regras

### Referências

- **App Móvel:** `/Users/samanthamaia/development/parque_solar_app/lib/components/modal_inspecao_widget.dart`
- **API Backend:** `/Users/samanthamaia/development/xano_sunview/apis/sprints/308_update_inspection_POST.xs`
- **Fluxo Backend:** Ver [Fluxo 4: Inspeção](#fluxo-4-inspeção-update_inspection)

---

## Fluxo 9: Integração Painel Web - Visualização de Mapa

**Aplicação:** Painel Web (Flutter Web)  
**Localização:** `/Users/samanthamaia/development/parque_solar`

### Descrição
Fluxo de visualização e gerenciamento de mapas de trackers no painel administrativo web, incluindo integração com o editor web.

### Fluxograma

```
[INÍCIO]
  │
  ├─→ [PROCESSO: Administrador acessa painel]
  │     └─→ Login e autenticação
  │
  ├─→ [PROCESSO: Navega para projeto]
  │     └─→ Seleciona projeto ativo
  │
  ├─→ [PROCESSO: Acessa módulo de mapas]
  │     └─→ ModulosTrackersMapWidget
  │
  ├─→ [PROCESSO: Carrega campos do projeto]
  │     └─→ GET /fields?projects_id=X
  │
  ├─→ [PROCESSO: Seleciona campo]
  │     └─→ Carrega seções e fileiras
  │
  ├─→ {DECISÃO: Ação do administrador?}
  │     │
  │     ├─→ CRIAR NOVO CAMPO
  │     │     └─→ [PROCESSO: Abre modal novo campo]
  │     │           └─→ ModalNovoCampoWidget
  │     │                 └─→ Abre Editor Web em modo criação
  │     │                       └─→ URL: /?fieldId=0&mode=create&projectId=X
  │     │
  │     ├─→ EDITAR CAMPO EXISTENTE
  │     │     └─→ [PROCESSO: Abre Editor Web em modo edição]
  │     │           └─→ URL: /?fieldId=X&mode=edit&projectId=Y
  │     │
  │     ├─→ VISUALIZAR CAMPO
  │     │     └─→ [PROCESSO: Abre Editor Web em modo visualização]
  │     │           └─→ URL: /view?fieldId=X&mode=view&projectId=Y
  │     │
  │     ├─→ ADICIONAR SEÇÃO
  │     │     └─→ [PROCESSO: Modal adicionar seção]
  │     │           └─→ ModalAddNovaSecaoWidget
  │     │
  │     ├─→ ADICIONAR FILEIRA
  │     │     └─→ [PROCESSO: Modal adicionar fileira]
  │     │           └─→ ModalAddFileiraWidget
  │     │
  │     └─→ FILTRAR STATUS
  │           └─→ [PROCESSO: Aplica filtros]
  │                 ├─→ FiltroStatusTrackersWidget
  │                 ├─→ FiltroStatusFundacaoWidget
  │                 └─→ FiltroTipoTrackerWidget
  │
  └─→ [FIM] Mapa atualizado/visualizado
```

### Componentes do Painel Web

#### Módulo de Mapas
**Arquivo:** `/Users/samanthamaia/development/parque_solar/lib/flows/modulos_trackers_map/modulos_trackers_map_widget.dart`

- **Visualização de seções e fileiras**
- **Integração com Editor Web** via URL parameters
- **Filtros de status** (trackers, fundação, tipo)
- **Modais de criação** (campo, seção, fileira)

#### Modais de Gerenciamento
**Localização:** `/Users/samanthamaia/development/parque_solar/lib/flows/projeto/mapa_de_trackers/`

- `modal_novo_campo/` - Criar novo campo
- `modal_add_nova_secao/` - Adicionar seção
- `modal_add_fileira/` - Adicionar fileira
- `modal_editar_lote_selecionado/` - Editar lote selecionado
- `modal_grafico_de_porcentagem/` - Gráficos de progresso

### Integração com Editor Web

O painel web integra com o editor web através de URL parameters:

```
Editor Web URL Pattern:
/?fieldId={id}&mode={create|edit|view}&projectId={id}&companyId={id}&authToken={token}
```

**Modos:**
- `create`: Criação de novo campo (fieldId=0)
- `edit`: Edição de campo existente
- `view`: Visualização somente leitura

### Referências

- **Painel Web:** `/Users/samanthamaia/development/parque_solar/lib/flows/modulos_trackers_map/`
- **Editor Web:** `/Users/samanthamaia/development/mapa-de-tracker/src/components/Canvas.tsx`
- **API Backend:** `/Users/samanthamaia/development/xano_sunview/apis/trackers_map/`

---

## Conclusão

Esta documentação cobre os principais fluxos do sistema completo de mapa de trackers, incluindo:

### Aplicações Documentadas

1. **Editor Web** (React) - Criação e edição visual de mapas
2. **App Móvel** (Flutter) - Execução de tarefas e inspeções em campo
3. **Painel Web** (Flutter Web) - Dashboard administrativo e gerenciamento

### Fluxos Documentados

- **Fluxo 1-3**: CRUD de mapas (POST, PUT, GET)
- **Fluxo 4**: Inspeção (update_inspection)
- **Fluxo 5**: Seleção de campo (FieldSelector)
- **Fluxo 6**: Manipulação do canvas (7 sub-fluxos)
- **Fluxo 7**: Cálculo de status e cores
- **Fluxo 8**: Integração App Móvel - Inspeção
- **Fluxo 9**: Integração Painel Web - Visualização

### Informações Incluídas

- **Fluxogramas descritivos** em formato texto
- **Entradas e saídas** claramente definidas
- **Regras de negócio** relevantes
- **Referências** aos arquivos de código (backend e frontend)
- **Esquema completo do banco de dados**
- **Arquitetura do sistema** e integrações

### Próximos Passos

Para expandir a documentação, considere adicionar:

- Fluxos de autenticação e autorização
- Fluxos de gerenciamento de sprints e equipes
- Fluxos de relatórios e dashboards
- Fluxos de estoque e inventário
- Fluxos de QR Code e identificação
- Fluxos de sincronização offline/online

