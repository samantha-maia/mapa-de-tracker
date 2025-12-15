# Fluxos do Sistema

Esta seção documenta todos os fluxos principais do sistema de mapa de trackers.

## Fluxos Disponíveis

### Editor Web

1. [Fluxo 1: Criação de Campo/Mapa (POST)](./01-criacao-campo-mapa.md)
2. [Fluxo 2: Edição de Campo/Mapa (PUT)](./02-edicao-campo-mapa.md)
3. [Fluxo 3: Visualização de Campo/Mapa (GET)](./03-visualizacao-campo-mapa.md)
4. [Fluxo 5: Seleção de Campo (FieldSelector)](./05-selecao-campo.md)
5. [Fluxo 6: Manipulação do Canvas](./06-manipulacao-canvas.md)
6. [Fluxo 7: Cálculo de Status e Cores](./07-calculo-status-cores.md)

### Inspeções

4. [Fluxo 4: Inspeção (update_inspection)](./04-inspecao.md)

### Integrações

8. [Fluxo 8: Integração App Móvel - Inspeção](./08-integracao-app-inspecao.md)
9. [Fluxo 9: Integração Painel Web - Visualização](./09-integracao-painel-visualizacao.md)

## Documentação Completa

Para uma versão completa e consolidada de todos os fluxos, consulte:
- [Documentação Completa](../DOCUMENTACAO_FLUXOS_COMPLETA.md)

## Convenções dos Fluxogramas

Os fluxogramas usam a seguinte notação:

- `[INÍCIO]` / `[FIM]` - Início e fim do fluxo
- `[PROCESSO: descrição]` - Processo/operação
- `{DECISÃO: condição?}` - Decisão/condicional
- `→` - Fluxo/sequência
- `[LOOP: ...]` - Loop/iteração
- `[ERRO]` - Tratamento de erro

## Próximos Passos

- [Voltar para Documentação Principal](../README.md)
- [Ver Arquitetura](../arquitetura/01-visao-geral.md)
- [Ver Banco de Dados](../banco-de-dados/01-esquema-geral.md)

