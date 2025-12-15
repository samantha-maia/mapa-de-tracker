# Visão Geral do Sistema

O Sistema de Mapa de Trackers é um conjunto de aplicações para gerenciamento completo de projetos solares, incluindo criação de layouts, execução de tarefas em campo e inspeções.

## Arquitetura do Sistema

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
│ Campo/App    │  │ Dashboard/Admin  │  │ Mapa Visual  │
└──────────────┘  └──────────────────┘  └──────────────┘
```

## Estrutura de Dados

```
Field (Campo)
  └── Sections (Grupos/Seções)
      └── Rows (Fileiras)
          └── Rows_Trackers (Trackers na fileira)
              └── Rows_Stakes (Estacas do tracker)
```

## Fluxo de Dados entre Componentes

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

## Funcionalidades Principais

- **Criação e edição** de mapas de trackers com estrutura hierárquica (Groups → Rows → Trackers → Stakes)
- **Visualização** de mapas em modo somente leitura
- **Gerenciamento de inspeções** com aprovação/reprovação de trackers e estacas
- **Cálculo automático de status** baseado nas estacas de cada tracker
- **Sincronização em tempo real** entre aplicações via backend

## Próximos Passos

- [Componentes do Sistema](./02-componentes.md)
- [Integrações entre Aplicações](./03-integracoes.md)

