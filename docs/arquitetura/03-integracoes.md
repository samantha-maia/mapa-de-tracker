# Integrações entre Aplicações

## Fluxo de Integração Painel Web → Editor Web

### Criação de Novo Campo

```
Painel Web (Flutter)
  └─→ Usuário clica em "Criar Campo"
  └─→ Abre modal ModalNovoCampoWidget
  └─→ Navega para Editor Web com parâmetros:
      URL: /?fieldId=0&mode=create&projectId=X&companyId=Y&authToken=Z
      
Editor Web (React)
  └─→ Detecta fieldId=0 e mode=create
  └─→ Inicia canvas vazio
  └─→ Usuário cria layout
  └─→ Salva via POST /trackers-map
  └─→ Backend cria campo e tarefas
```

### Edição de Campo Existente

```
Painel Web (Flutter)
  └─→ Usuário seleciona campo
  └─→ Clica em "Editar"
  └─→ Navega para Editor Web:
      URL: /?fieldId=X&mode=edit&projectId=Y&companyId=Z&authToken=W
      
Editor Web (React)
  └─→ Carrega mapa existente via GET /trackers-map
  └─→ Permite edição
  └─→ Salva via PUT /trackers-map
```

### Visualização de Campo

```
Painel Web (Flutter)
  └─→ Usuário seleciona campo
  └─→ Clica em "Visualizar"
  └─→ Navega para Editor Web:
      URL: /view?fieldId=X&mode=view&projectId=Y&companyId=Z&authToken=W
      
Editor Web (React)
  └─→ Carrega mapa via GET /trackers-map
  └─→ Renderiza em modo somente leitura
```

## Fluxo de Integração App Móvel → Backend

### Inspeção de Tracker/Estaca

```
App Móvel (Flutter)
  └─→ Operador visualiza tarefa de inspeção
  └─→ Abre ModalInspecaoWidget
  └─→ Seleciona "Aprovada" ou "Reprovada"
  └─→ Chama API:
      POST /update_inspection
      Body: {
        sprints_tasks_id: X,
        quality_status_id: 2 ou 3
      }
      
Backend (Xano)
  └─→ Processa inspeção (ver Fluxo 4)
  └─→ Atualiza status de tracker/estaca
  └─→ Retorna sucesso
      
App Móvel (Flutter)
  └─→ Atualiza interface
  └─→ Marca tarefa como concluída
```

## Parâmetros de URL para Integração

### Editor Web - Parâmetros Aceitos

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `fieldId` | string | ID do campo (0 para criar) | `0` ou `123` |
| `mode` | string | Modo: create, edit, view | `create` |
| `projectId` | string | ID do projeto | `456` |
| `companyId` | string | ID da empresa | `789` |
| `authToken` | string | Token de autenticação | `abc123...` |

### Exemplos de URLs

**Criar novo campo:**
```
/?fieldId=0&mode=create&projectId=1&companyId=2&authToken=xyz
```

**Editar campo existente:**
```
/?fieldId=123&mode=edit&projectId=1&companyId=2&authToken=xyz
```

**Visualizar campo:**
```
/view?fieldId=123&mode=view&projectId=1&companyId=2&authToken=xyz
```

## Sincronização de Dados

### Fluxo de Sincronização

```
1. OPERADOR (App Móvel)
   └─→ Executa tarefa
   └─→ Atualiza status local
   └─→ Sincroniza com backend
   
2. BACKEND
   └─→ Atualiza banco de dados
   └─→ Propaga mudanças
   
3. ADMINISTRADOR (Painel Web)
   └─→ Recarrega dados
   └─→ Visualiza atualizações
   
4. ADMINISTRADOR (Editor Web)
   └─→ Recarrega mapa
   └─→ Visualiza novos status (cores atualizadas)
```

## APIs de Integração

### Principais Endpoints

| Endpoint | Método | Descrição | Usado Por |
|----------|--------|-----------|-----------|
| `/trackers-map` | GET | Buscar mapa | Editor Web, Painel Web |
| `/trackers-map` | POST | Criar mapa | Editor Web |
| `/trackers-map` | PUT | Atualizar mapa | Editor Web |
| `/update_inspection` | POST | Atualizar inspeção | App Móvel |
| `/fields` | GET | Listar campos | Painel Web, Editor Web |

## Próximos Passos

- [Voltar para Visão Geral](./01-visao-geral.md)
- [Ver Fluxos de Integração](../fluxos/08-integracao-app-inspecao.md)
- [Ver Fluxos de Integração](../fluxos/09-integracao-painel-visualizacao.md)

