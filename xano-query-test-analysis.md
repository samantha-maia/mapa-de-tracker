# Análise do JSON de Teste e Correções Finais

## JSON de Teste Analisado:

```json
{
  "json_map": {
    "groups": [{
      "id": 58,  // Section existente (número)
      "rows": [
        {
          "id": 656,  // Row existente (número)
          "trackers": [
            {"id": 939, ...},      // Tracker existente (número)
            {"id": "t_8", ...}     // Tracker novo (string)
          ]
        },
        {
          "id": "row_7",  // Row novo (string)
          "trackers": [
            {"id": "t_5", ...},    // Tracker novo (string)
            {"id": "t_6", ...}     // Tracker novo (string)
          ]
        }
      ]
    }]
  }
}
```

## Problemas Adicionais Encontrados e Corrigidos:

### 1. **Delete de Rows estava dentro do loop** ❌
   - **Problema**: A query de delete de rows estava dentro do `foreach ($sections.rows)`, o que causava:
     - Executar a query múltiplas vezes (uma para cada row)
     - Usar `$sections.rows.id` que pega TODOS os IDs de rows de TODAS as sections
   - **Correção**: Movido para FORA do loop, antes de processar as rows, usando `$sections.rows.id` (apenas da section atual)

### 2. **Delete de Trackers estava dentro do loop** ❌
   - **Problema**: Similar ao anterior, estava dentro do `foreach ($rows.trackers)`, causando:
     - Executar a query múltiplas vezes
     - Usar `$rows.trackers.id` que pega todos os trackers de todas as rows
   - **Correção**: Movido para FORA do loop de trackers, antes de processar, usando `$rows.trackers.id` (apenas da row atual)

## Fluxo Corrigido da Query:

### Para o JSON de exemplo:

1. **Atualiza field** (fields_id: 20)
   - Atualiza `section_quantity: 1`
   - Atualiza `map_texts`

2. **Delete de sections antigas**
   - Busca todas as sections do field_id 20
   - Compara com `[58]` (IDs do input)
   - Deleta sections que não estão mais no input

3. **Processa Section 58** (existe)
   - `$section_exists = true` (58 é número)
   - **Edita** section 58 com novos x, y

4. **Delete de rows antigas da section 58**
   - Busca todas as rows da section 58
   - Compara com `[656, "row_7"]` (IDs do input)
   - Deleta rows que não estão mais no input
   - ⚠️ **Nota**: Se houver rows antigas (ex: id 655), serão deletadas

5. **Processa Row 656** (existe)
   - `$exist_rows = true` (656 é número)
   - **Edita** row 656 com novos x, y, groupOffsetX

6. **Delete de trackers antigos da row 656**
   - Busca todos os trackers da row 656
   - Compara com `[939, "t_8"]` (IDs do input)
   - Deleta trackers que não estão mais no input

7. **Processa Tracker 939** (existe)
   - `$exit_tracker = true` (939 é número)
   - **Edita** tracker 939 com novo rowY

8. **Processa Tracker "t_8"** (novo)
   - `$exit_tracker = false` ("t_8" não é número)
   - **Cria** novo tracker
   - Cria stakes associados
   - Cria backlogs

9. **Processa Row "row_7"** (novo)
   - `$exist_rows = false` ("row_7" não é número)
   - **Cria** nova row com section_id = 58

10. **Delete de trackers antigos da row "row_7"**
    - Como é row nova, não há trackers antigos
    - Nada a deletar

11. **Processa Trackers "t_5" e "t_6"** (novos)
    - Ambos criam novos trackers
    - Criam stakes e backlogs

## Verificações Importantes:

✅ **is_int funciona corretamente**:
- `58|is_int` = true (número)
- `"row_7"|is_int` = false (string)

✅ **diff funciona corretamente**:
- Arrays de números vs strings são comparados corretamente
- IDs numéricos do banco vs strings do input funcionam

✅ **Variáveis de escopo**:
- `$sections1.id` existe após o conditional (tanto no if quanto no else)
- `$rows1.id` existe após o conditional
- Todas as referências estão corretas

## Possíveis Melhorias Futuras:

1. **Cascade delete**: Se uma row é deletada, os trackers deveriam ser deletados automaticamente (via banco ou query)

2. **Validação de tipos**: Verificar se `tracker.ext.id` existe antes de usar

3. **Tratamento de erros**: Adicionar validações para campos obrigatórios

