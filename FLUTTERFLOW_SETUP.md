# Configuração do FlutterFlow para Mapa de Tracker

## Problema Identificado

Na URL atual, o parâmetro `mode` está sendo enviado sem valor:
```
https://samantha-maia.github.io/mapa-de-tracker/?projectId=12&fieldId=0&authToken=...&mode&companyId=9
```

Isso acontece quando `widget.mode` está vazio ou null no FlutterFlow.

## Código FlutterFlow Atual (com problema)

```dart
final uri = Uri.parse(
  'https://samantha-maia.github.io/mapa-de-tracker/',
).replace(queryParameters: {
  'projectId': widget.projectsID.toString(),
  'fieldId': widget.fieldsID.toString(),
  'authToken': widget.authToken,
  'mode': widget.mode,  // ❌ Se widget.mode for null ou vazio, cria parâmetro sem valor
  'companyId': widget.companyID.toString(),
});
```

## Soluções

### Opção 1: Garantir que `mode` sempre tenha valor (RECOMENDADO)

Modifique o código FlutterFlow para garantir que `mode` sempre tenha um valor:

```dart
final uri = Uri.parse(
  'https://samantha-maia.github.io/mapa-de-tracker/',
).replace(queryParameters: {
  'projectId': widget.projectsID.toString(),
  'fieldId': widget.fieldsID.toString(),
  'authToken': widget.authToken,
  'mode': widget.mode ?? 'view',  // ✅ Usa 'view' como padrão se widget.mode for null
  'companyId': widget.companyID.toString(),
});
```

### Opção 2: Passar `fieldId` válido ao invés de 0

Se você quer abrir no modo view, passe um `fieldId` válido (não 0):

```dart
final uri = Uri.parse(
  'https://samantha-maia.github.io/mapa-de-tracker/',
).replace(queryParameters: {
  'projectId': widget.projectsID.toString(),
  'fieldId': widget.fieldsID.toString(),  // ✅ Certifique-se que fieldsID não seja 0 para modo view
  'authToken': widget.authToken,
  'mode': 'view',  // ✅ Sempre passa 'view' explicitamente
  'companyId': widget.companyID.toString(),
});
```

### Opção 3: Adicionar condição para não passar `mode` se for vazio

Se você quiser manter a flexibilidade, adicione uma condição:

```dart
final queryParams = <String, String>{
  'projectId': widget.projectsID.toString(),
  'fieldId': widget.fieldsID.toString(),
  'authToken': widget.authToken,
  'companyId': widget.companyID.toString(),
};

// Só adiciona mode se tiver valor
if (widget.mode != null && widget.mode!.isNotEmpty) {
  queryParams['mode'] = widget.mode!;
} else if (widget.fieldsID != 0) {
  // Se fieldId não for 0, assume modo view
  queryParams['mode'] = 'view';
}

final uri = Uri.parse(
  'https://samantha-maia.github.io/mapa-de-tracker/',
).replace(queryParameters: queryParams);
```

## Comportamento Esperado da Aplicação

### Quando `fieldId=0` e `mode` está presente (mesmo vazio):
- A aplicação detecta que `mode` está presente
- Não mostra a tela "Selecione um campo"
- Aguarda os campos serem carregados
- Seleciona automaticamente o primeiro campo disponível
- Redireciona para `/view` com o campo selecionado

### Quando `fieldId` é válido (não 0) e `mode=view`:
- A aplicação carrega o campo diretamente
- Redireciona para `/view`
- Exibe o mapa no modo visualização

## Recomendação Final

**Use a Opção 1** - é a mais simples e garante que sempre haverá um valor para `mode`:

```dart
'mode': widget.mode ?? 'view',
```

Isso garante que:
- Se `widget.mode` tiver valor, usa esse valor
- Se `widget.mode` for null ou vazio, usa 'view' como padrão
- O parâmetro sempre terá um valor válido na URL

