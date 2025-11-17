# Guia de Teste - Sistema de Mapa de Trackers

Este guia explica como usar todas as funcionalidades do sistema. Leia com atenção e teste cada item.

---

## 📌 SELEÇÃO DE ELEMENTOS

### Seleção Básica
- **Clique simples**: Clique em um tracker, fileira (row) ou grupo para selecioná-lo
- **Arraste para selecionar**: Clique e arraste na área vazia do canvas (não sobre os elementos) para criar uma caixa de seleção azul e selecionar vários elementos de uma vez
- **Seleção múltipla com Shift**: Mantenha a tecla **Shift** pressionada enquanto arrasta a caixa de seleção para ADICIONAR elementos à seleção atual (mantém os já selecionados)

### Como funciona a seleção com caixa (arrastar):
1. **Sem Shift**: Clique em uma área vazia do canvas e arraste. Você verá um rastro/retângulo azul. Todos os elementos dentro da caixa serão selecionados, SUBSTITUINDO a seleção anterior.

2. **Com Shift**: 
   - Mantenha a tecla **Shift** pressionada
   - Clique em uma área vazia e arraste para criar a caixa de seleção
   - Os elementos dentro da caixa serão ADICIONADOS à seleção atual (mantém os que já estavam selecionados)
   - Se a caixa passar por elementos que já estavam selecionados, eles serão mantidos na seleção

---

## 🖱️ MOVIMENTAÇÃO E NAVEGAÇÃO

### Arrastar Elementos
- **Tracker solto**: Clique e arraste um tracker que está solto no canvas para movê-lo
- **Fileira (Row)**: Clique e arraste uma fileira inteira para movê-la
- **Grupo**: Clique e arraste um grupo completo para movê-lo com todas as fileiras dentro

### Navegar pelo Canvas
- **Rolar o mouse**: Use a roda do mouse para mover a visualização (pan) em todas as direções
- **Ctrl + Rolar**: Mantenha **Ctrl** (ou **Cmd** no Mac) pressionado e role o mouse para dar zoom in/out
- **Espaço + Arrastar**: Mantenha a tecla **Espaço** pressionada e arraste com o mouse para mover a visualização (pan)
- **Duplo clique no canvas**: Dê dois cliques rápidos em uma área vazia para resetar o zoom e a posição ao centro

---

## ⌨️ ATALHOS DE TECLADO

### Navegação
- **Scroll**: Move a visualização (pan) em todas as direções
- **Ctrl + Scroll** (ou **Cmd + Scroll** no Mac): Zoom in/out
- **Espaço + Arrastar**: Mantenha a tecla **Espaço** pressionada e arraste com o mouse para mover a visualização (pan)
- **Double-click no canvas**: Reseta o zoom e a posição ao centro

### Seleção
- **Ctrl + A** (ou **Cmd + A** no Mac): Seleciona todos os elementos visíveis no canvas
- **Escape**: Limpa a seleção atual
- **Shift + Arrastar caixa de seleção**: Adiciona elementos à seleção atual (mantém os já selecionados)

### Manipulação
- **Ctrl + Z** (ou **Cmd + Z** no Mac): Desfaz a última ação
- **Ctrl + Shift + Z** (ou **Cmd + Shift + Z** no Mac): Refaz a última ação
- **Ctrl + V** (ou **Cmd + V** no Mac): Duplica os elementos selecionados
- **Delete** ou **Backspace**: Remove os elementos selecionados (trackers, fileiras ou grupos)
- **Alt + Arrastar**: Quando aplicado em um tracker dentro de uma fileira, permite ajustar a posição vertical do tracker (apenas para cima ou para baixo)

---

## ➕ ADICIONAR ELEMENTOS

### Adicionar Trackers
1. Na **Paleta** (barra lateral esquerda), você verá uma lista de tipos de trackers disponíveis
2. Clique e arraste um tracker da paleta para:
   - **Área vazia do canvas**: Cria um tracker solto
   - **Dentro de uma fileira**: Adiciona o tracker àquela fileira
   - **Próximo a outro tracker**: Insere o tracker na posição desejada

### Criar Fileiras (Rows)
1. Clique no botão **"+ Criar Row"** na barra lateral
2. Uma nova fileira vazia aparecerá no canvas
3. Você pode arrastar trackers da paleta ou trackers soltos para dentro dela

### Criar Grupos
1. Clique no botão **"+ Criar Grupo"** na barra lateral
2. Uma nova área de grupo aparecerá
3. Você pode arrastar fileiras para dentro do grupo

---

## 🔧 ORGANIZAR E AGRUPAR

### Agrupar em Fileira
1. Selecione vários trackers soltos (arraste uma caixa de seleção, ou use Shift + arrastar para adicionar à seleção)
2. Clique no botão **"Agrupar seleção em Row"**
3. Os trackers selecionados serão organizados em uma fileira horizontal

### Agrupar Fileiras
1. Selecione várias fileiras (arraste uma caixa de seleção, ou use Shift + arrastar para adicionar à seleção)
2. Clique no botão **"Agrupar fileiras selecionadas"**
3. As fileiras serão agrupadas juntas

### Adicionar Fileira a um Grupo Existente
1. Arraste uma fileira e solte dentro de um grupo
2. A fileira será automaticamente adicionada ao grupo

---

## 📐 ALINHAMENTO E DISTRIBUIÇÃO

### Alinhamento (aparece quando 2 ou mais elementos estão selecionados)
Use os botões na barra lateral para alinhar elementos selecionados:

**Horizontal:**
- **Alinhar à Esquerda**: Todos os elementos ficam alinhados pela borda esquerda
- **Centralizar**: Todos os elementos ficam centralizados horizontalmente
- **Alinhar à Direita**: Todos os elementos ficam alinhados pela borda direita

**Vertical:**
- **Alinhar ao Topo**: Todos os elementos ficam alinhados pela borda superior
- **Centralizar Verticalmente**: Todos os elementos ficam centralizados verticalmente
- **Alinhar à Base**: Todos os elementos ficam alinhados pela borda inferior

### Distribuição (aparece quando 3 ou mais elementos estão selecionados)
- **Distribuir Horizontalmente (H)**: Espaça os elementos igualmente na horizontal
- **Distribuir Verticalmente (V)**: Espaça os elementos igualmente na vertical

---

## 📋 DUPLICAR ELEMENTOS

### Duplicar Selecionados
1. Selecione um ou mais elementos (trackers, fileiras ou grupos)
2. Clique no botão **"📋 Duplicar Selecionados"** OU pressione **Ctrl + V**
3. Uma cópia será criada ligeiramente deslocada da original

---

## 🗑️ REMOVER ELEMENTOS

### Remover Item Selecionado
1. Selecione o elemento que deseja remover
2. Pressione **Delete** ou **Backspace** no teclado
3. O elemento será removido permanentemente

**Atenção**: Ao remover uma fileira, todos os trackers dentro dela também serão removidos. Ao remover um grupo, todas as fileiras e trackers dentro dele serão removidos.

---

## 🔍 ZOOM E VISUALIZAÇÃO

### Controles de Zoom
Na barra lateral, você encontrará os botões de zoom:
- **"-"**: Diminui o zoom (zoom out)
- **"+"**: Aumenta o zoom (zoom in)
- **"100%"**: Reseta o zoom para o tamanho normal

### Exibir Nível de Zoom
O nível atual de zoom é mostrado abaixo dos botões (ex: "120%" significa 20% de zoom aumentado)

---

## 💾 SALVAR E CARREGAR

### Salvar seu Trabalho
1. Clique no botão **"Salvar JSON"** na barra lateral
2. Um arquivo será baixado automaticamente com o nome "trackers-[data-hora].json"
3. Guarde este arquivo em um local seguro

### Carregar um Trabalho Salvo
1. Clique no botão **"Carregar JSON"** na barra lateral
2. Uma caixa de diálogo aparecerá
3. Cole o conteúdo do arquivo JSON que você salvou anteriormente
4. Clique em OK
5. Seu trabalho será restaurado

**Dica**: Para obter o conteúdo do JSON, abra o arquivo salvo em um editor de texto e copie todo o conteúdo.

---

## 🎯 FUNCIONALIDADES ESPECIAIS

### Ajustar Posição Vertical de Trackers em Fileiras
1. Clique e segure a tecla **Alt**
2. Clique e arraste um tracker que está dentro de uma fileira
3. Você poderá mover o tracker apenas para cima ou para baixo (ajuste vertical)
4. Solte o mouse para confirmar a nova posição

**Observação**: Esta função só funciona para trackers que estão dentro de fileiras, não para trackers soltos.

### Reorganizar Trackers em uma Fileira
- Arraste um tracker dentro da mesma fileira para reorganizar a ordem horizontal
- Arraste um tracker de uma fileira para outra para movê-lo entre fileiras

---

## 📱 DICAS IMPORTANTES

1. **Grid (Grade)**: O canvas tem uma grade invisível que ajuda a alinhar elementos automaticamente
2. **Seleção Visual**: Elementos selecionados aparecem com uma borda azul destacada
3. **Informações do Tracker**: Passe o mouse sobre um tracker e você verá informações detalhadas (tipo, fabricante, quantidade de estacas, etc.)
4. **Botões Condicionais**: Alguns botões só aparecem quando você tem elementos selecionados ou quando certas condições são atendidas (ex: alinhamento só aparece com 2+ itens selecionados)
5. **Undo/Redo**: Use **Ctrl + Z** para desfazer e **Ctrl + Shift + Z** para refazer rapidamente

---

## ✅ CHECKLIST DE TESTE

Para garantir que tudo está funcionando, teste:

- [ ] Selecionar um elemento com clique simples
- [ ] Selecionar vários elementos arrastando uma caixa de seleção (sem Shift - substitui seleção)
- [ ] Selecionar múltiplos elementos com Shift + arrastar caixa de seleção (adiciona à seleção)
- [ ] Arrastar um tracker solto pelo canvas
- [ ] Arrastar uma fileira inteira
- [ ] Arrastar um grupo completo
- [ ] Usar Ctrl + Scroll para dar zoom
- [ ] Usar Scroll para mover a visualização
- [ ] Usar Espaço + Arrastar para navegar
- [ ] Adicionar tracker da paleta para o canvas
- [ ] Adicionar tracker da paleta para uma fileira
- [ ] Criar uma nova fileira vazia
- [ ] Criar um novo grupo
- [ ] Agrupar trackers selecionados em uma fileira
- [ ] Agrupar fileiras selecionadas em um grupo
- [ ] Alinhar elementos horizontalmente (esquerda, centro, direita)
- [ ] Alinhar elementos verticalmente (topo, meio, base)
- [ ] Distribuir elementos horizontalmente
- [ ] Distribuir elementos verticalmente
- [ ] Duplicar elementos com Ctrl + V
- [ ] Remover elementos com Delete
- [ ] Usar Alt + Arrastar para ajustar posição vertical de tracker em fileira
- [ ] Reorganizar ordem de trackers em uma fileira
- [ ] Mover tracker entre fileiras
- [ ] Salvar o trabalho em JSON
- [ ] Carregar um trabalho salvo anteriormente
- [ ] Ver informações de um tracker ao passar o mouse

---

## 🆘 RESOLUÇÃO DE PROBLEMAS

**Problema**: Não consigo selecionar múltiplos elementos
- **Solução**: Clique em uma área vazia do canvas (não sobre os elementos) e arraste para criar a caixa de seleção. Para adicionar à seleção atual, mantenha Shift pressionado enquanto arrasta.

**Problema**: Não consigo mover a visualização
- **Solução**: Use a roda do mouse ou mantenha Espaço pressionado enquanto arrasta

**Problema**: Zoom muito próximo ou muito distante
- **Solução**: Clique no botão "100%" para resetar, ou use Ctrl + Scroll para ajustar gradualmente

**Problema**: Elementos não estão alinhando corretamente
- **Solução**: Verifique se você selecionou pelo menos 2 elementos (para alinhamento) ou 3 elementos (para distribuição)

**Problema**: Não consigo adicionar tracker a uma fileira
- **Solução**: Arraste o tracker da paleta e solte dentro da área da fileira (não apenas próximo a ela)

---

**Boa sorte com os testes!** 🚀

