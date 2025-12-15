# Documentação do Sistema de Mapa de Trackers

Bem-vindo à documentação completa do Sistema de Mapa de Trackers. Esta documentação cobre todos os aspectos do sistema, desde a arquitetura até os fluxos detalhados.

## 📚 Estrutura da Documentação

### [Arquitetura](./arquitetura/)
- [Visão Geral do Sistema](./arquitetura/01-visao-geral.md)
- [Componentes do Sistema](./arquitetura/02-componentes.md)
- [Integrações entre Aplicações](./arquitetura/03-integracoes.md)

### [Banco de Dados](./banco-de-dados/)
- [Esquema Geral](./banco-de-dados/01-esquema-geral.md)
- [Tabelas Principais](./banco-de-dados/02-tabelas-principais.md)
- [Relacionamentos](./banco-de-dados/03-relacionamentos.md)

### [Fluxos](./fluxos/)
- [Fluxo 1: Criação de Campo/Mapa (POST)](./fluxos/01-criacao-campo-mapa.md)
- [Fluxo 2: Edição de Campo/Mapa (PUT)](./fluxos/02-edicao-campo-mapa.md)
- [Fluxo 3: Visualização de Campo/Mapa (GET)](./fluxos/03-visualizacao-campo-mapa.md)
- [Fluxo 4: Inspeção (update_inspection)](./fluxos/04-inspecao.md)
- [Fluxo 5: Seleção de Campo (FieldSelector)](./fluxos/05-selecao-campo.md)
- [Fluxo 6: Manipulação do Canvas](./fluxos/06-manipulacao-canvas.md)
- [Fluxo 7: Cálculo de Status e Cores](./fluxos/07-calculo-status-cores.md)
- [Fluxo 8: Integração App Móvel - Inspeção](./fluxos/08-integracao-app-inspecao.md)
- [Fluxo 9: Integração Painel Web - Visualização](./fluxos/09-integracao-painel-visualizacao.md)

### [APIs](./apis/)
- [Endpoints Principais](./apis/01-endpoints-principais.md)
- [Autenticação](./apis/02-autenticacao.md)

## 🚀 Início Rápido

### Para Desenvolvedores

1. **Comece pela Arquitetura**: Entenda a estrutura geral do sistema
2. **Explore o Banco de Dados**: Familiarize-se com o esquema
3. **Estude os Fluxos**: Compreenda os processos principais

### Para Novos Membros da Equipe

1. Leia a [Visão Geral](./arquitetura/01-visao-geral.md)
2. Entenda os [Componentes do Sistema](./arquitetura/02-componentes.md)
3. Explore os [Fluxos Principais](./fluxos/)

## 📁 Estrutura do Projeto

```
mapa-de-tracker/          # Editor Web (React)
├── docs/                 # Esta documentação
├── src/                  # Código fonte
└── ...

parque_solar_app/         # App Móvel (Flutter)
└── ...

parque_solar/             # Painel Web (Flutter Web)
└── ...

xano_sunview/             # Backend (Xano)
└── ...
```

## 🔗 Links Úteis

- **Backend:** `/Users/samanthamaia/development/xano_sunview`
- **Editor Web:** `/Users/samanthamaia/development/mapa-de-tracker`
- **App Móvel:** `/Users/samanthamaia/development/parque_solar_app`
- **Painel Web:** `/Users/samanthamaia/development/parque_solar`

## 📝 Convenções

- **Fluxogramas**: Descritos em formato texto com símbolos `[INÍCIO]`, `[PROCESSO]`, `{DECISÃO}`, `→`
- **Código**: Referências incluem caminhos completos dos arquivos
- **APIs**: Documentadas com método HTTP, endpoint e exemplos

## 🤝 Contribuindo

Ao adicionar nova documentação:

1. Siga a estrutura de pastas existente
2. Use o mesmo formato de fluxogramas
3. Inclua referências aos arquivos de código
4. Atualize este README com links para novos documentos

