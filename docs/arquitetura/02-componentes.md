# Componentes do Sistema

## 1. Editor Web de Mapas (`mapa-de-tracker`)

**Localização:** `/Users/samanthamaia/development/mapa-de-tracker`

- **Tecnologia:** React + TypeScript + Vite
- **Função:** Editor visual interativo para criar e editar layouts de trackers
- **Funcionalidades:**
  - Criação e edição de mapas com estrutura hierárquica (Groups → Rows → Trackers → Stakes)
  - Visualização de mapas em modo somente leitura
  - Manipulação visual do canvas (arrastar, agrupar, alinhar)
  - Cálculo automático de status baseado nas estacas de cada tracker
  - Integração com FlutterFlow via URL parameters

### Estrutura de Arquivos

```
mapa-de-tracker/
├── src/
│   ├── components/        # Componentes React
│   │   ├── Canvas.tsx     # Editor principal
│   │   ├── ViewCanvas.tsx # Visualização somente leitura
│   │   ├── FieldSelector.tsx
│   │   └── ...
│   ├── store/             # Estado global (Zustand)
│   │   ├── layoutStore.ts
│   │   └── fieldsStore.ts
│   ├── services/          # APIs
│   │   └── apiClient.ts
│   └── utils/             # Utilitários
│       └── trackerStatusColor.ts
└── ...
```

## 2. App Móvel (`parque_solar_app`)

**Localização:** `/Users/samanthamaia/development/parque_solar_app`

- **Tecnologia:** Flutter (FlutterFlow)
- **Função:** Aplicativo para operadores em campo
- **Funcionalidades:**
  - Visualização de tarefas atribuídas
  - Execução de tarefas (RDO - Registro de Obra)
  - **Inspeções:** Aprovação/reprovação de trackers e estacas
  - QR Code para identificação rápida
  - Sincronização offline/online

### Estrutura de Arquivos

```
parque_solar_app/
├── lib/
│   ├── components/
│   │   └── modal_inspecao_widget.dart  # Modal de inspeção
│   ├── pages/
│   │   ├── home_page_tarefas/          # Lista de tarefas
│   │   └── rdo/                        # Registro de obra
│   └── backend/
│       └── api_requests/
│           └── api_calls.dart          # Chamadas de API
└── ...
```

## 3. Painel Web Administrativo (`parque_solar`)

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

### Estrutura de Arquivos

```
parque_solar/
├── lib/
│   ├── flows/
│   │   ├── modulos_trackers_map/      # Módulo de mapas
│   │   └── projeto/
│   │       └── mapa_de_trackers/       # Gestão de mapas
│   └── components/
│       └── ...
└── ...
```

## 4. Backend (`xano_sunview`)

**Localização:** `/Users/samanthamaia/development/xano_sunview`

- **Tecnologia:** Xano (PostgreSQL + APIs REST)
- **Função:** Backend centralizado para todas as aplicações
- **Componentes:**
  - **APIs REST:** Endpoints para todas as operações
  - **Banco de Dados:** PostgreSQL com schema completo
  - **Lógica de Negócio:** Arquivos `.xs` (Xano Script)

### Estrutura de Arquivos

```
xano_sunview/
├── apis/
│   ├── trackers_map/      # APIs de mapas
│   │   ├── 358_trackers_map_GET.xs
│   │   ├── 359_trackers_map_POST.xs
│   │   └── 366_trackers_map_PUT.xs
│   └── sprints/
│       └── 308_update_inspection_POST.xs
├── tables/                # Definições de tabelas
│   ├── 14_fields.xs
│   ├── 25_sections.xs
│   └── ...
└── ...
```

## Próximos Passos

- [Integrações entre Aplicações](./03-integracoes.md)
- [Voltar para Visão Geral](./01-visao-geral.md)

