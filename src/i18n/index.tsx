import React, { createContext, useContext, useMemo } from 'react'

type LocaleKey = 'en' | 'pt' | 'es'

type Translations = Record<string, string>

const translations: Record<LocaleKey, Translations> = {
  en: {
    'header.title.view': 'View Tracker Map',
    'header.title.edit': 'Edit Tracker Map',
    'header.title.create': 'Create Tracker Map',
    'header.desc.view': "View the project's tracker map. Read-only mode.",
    'header.desc.edit':
      'Edit and manage the lots in your project. Each lot includes trackers and modules.',
    'header.desc.create':
      'Create and manage the lots in your project. Each lot includes trackers and modules.',
    'header.actions.viewMap': 'View Map',
    'header.actions.edit': 'Edit',
    'fieldSelector.empty.title': 'Select a field to start',
    'fieldSelector.empty.subtitle': 'Choose an existing field or create a new one',
    'fieldSelector.routerError': 'Error: Router not available',
    'fieldSelector.alert.nameRequired': 'Please enter a field name',
    'fieldSelector.alert.createInfo':
      'To create a new field, use "Create new field" and then save the map',
    'fieldSelector.alert.invalidFieldId': 'Invalid fieldId',
    'fieldSelector.alert.updateError': 'Error updating field',
    'fieldSelector.alert.deleteError': 'Could not delete the field',
    'fieldSelector.alert.deleteUnexpected': 'Unexpected error deleting the field',
    'fieldSelector.input.placeholder': 'Field name',
    'fieldSelector.button.saveTitle': 'Save field name',
    'fieldSelector.button.save': 'Save',
    'fieldSelector.button.saving': 'Saving...',
    'fieldSelector.button.cancel': 'Cancel',
    'fieldSelector.modal.deleteTitle': 'Delete field?',
    'fieldSelector.select.placeholder': 'Select a field',
    'fieldSelector.select.create': '+ Create new field',
    'fieldSelector.button.editTitle': 'Edit selected field',
    'fieldSelector.button.viewTitle': 'View selected field',
    'fieldSelector.button.view': 'View',
    'fieldSelector.button.deleteTitle': 'Delete selected field',
    'fieldSelector.button.delete': 'Delete',
    'fieldSelector.button.createTitle': 'Create new field',
    'fieldSelector.button.create': 'Create field',
  },
  pt: {
    'header.title.view': 'Visualizar Mapa de Tracker',
    'header.title.edit': 'Editar Mapa de Tracker',
    'header.title.create': 'Criar Mapa de Tracker',
    'header.desc.view': 'Visualize o mapa de trackers do projeto. Modo somente leitura.',
    'header.desc.edit':
      'Edite e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.',
    'header.desc.create':
      'Crie e administre os lotes que fazem parte do seu projeto. Cada lote abarca trackers e módulos.',
    'header.actions.viewMap': 'Visualizar Mapa',
    'header.actions.edit': 'Editar',
    'fieldSelector.empty.title': 'Selecione um campo para começar',
    'fieldSelector.empty.subtitle': 'Escolha um campo existente ou crie um novo campo',
    'fieldSelector.routerError': 'Erro: Router não disponível',
    'fieldSelector.alert.nameRequired': 'Por favor, insira um nome para o campo',
    'fieldSelector.alert.createInfo':
      'Para criar um novo campo, use "Criar novo campo" e depois salve o mapa',
    'fieldSelector.alert.invalidFieldId': 'FieldId inválido',
    'fieldSelector.alert.updateError': 'Erro ao atualizar campo',
    'fieldSelector.alert.deleteError': 'Não foi possível excluir o campo',
    'fieldSelector.alert.deleteUnexpected': 'Erro inesperado ao excluir campo',
    'fieldSelector.input.placeholder': 'Nome do campo',
    'fieldSelector.button.saveTitle': 'Salvar nome do campo',
    'fieldSelector.button.save': 'Salvar',
    'fieldSelector.button.saving': 'Salvando...',
    'fieldSelector.button.cancel': 'Cancelar',
    'fieldSelector.modal.deleteTitle': 'Excluir campo?',
    'fieldSelector.select.placeholder': 'Selecione um campo',
    'fieldSelector.select.create': '+ Criar novo campo',
    'fieldSelector.button.editTitle': 'Editar campo selecionado',
    'fieldSelector.button.viewTitle': 'Visualizar campo selecionado',
    'fieldSelector.button.view': 'Visualizar',
    'fieldSelector.button.deleteTitle': 'Excluir campo selecionado',
    'fieldSelector.button.delete': 'Excluir',
    'fieldSelector.button.createTitle': 'Criar novo campo',
    'fieldSelector.button.create': 'Criar campo',
  },
  es: {
    'header.title.view': 'Ver mapa de trackers',
    'header.title.edit': 'Editar mapa de trackers',
    'header.title.create': 'Crear mapa de trackers',
    'header.desc.view': 'Visualiza el mapa de trackers del proyecto. Modo solo lectura.',
    'header.desc.edit':
      'Edita y administra los lotes de tu proyecto. Cada lote incluye trackers y módulos.',
    'header.desc.create':
      'Crea y administra los lotes de tu proyecto. Cada lote incluye trackers y módulos.',
    'header.actions.viewMap': 'Ver mapa',
    'header.actions.edit': 'Editar',
    'fieldSelector.empty.title': 'Seleccione un campo para empezar',
    'fieldSelector.empty.subtitle': 'Elige un campo existente o crea uno nuevo',
    'fieldSelector.routerError': 'Error: Router no disponible',
    'fieldSelector.alert.nameRequired': 'Por favor, ingrese un nombre para el campo',
    'fieldSelector.alert.createInfo':
      'Para crear un nuevo campo, use "Crear nuevo campo" y luego guarde el mapa',
    'fieldSelector.alert.invalidFieldId': 'FieldId inválido',
    'fieldSelector.alert.updateError': 'Error al actualizar el campo',
    'fieldSelector.alert.deleteError': 'No se pudo eliminar el campo',
    'fieldSelector.alert.deleteUnexpected': 'Error inesperado al eliminar el campo',
    'fieldSelector.input.placeholder': 'Nombre del campo',
    'fieldSelector.button.saveTitle': 'Guardar nombre del campo',
    'fieldSelector.button.save': 'Guardar',
    'fieldSelector.button.saving': 'Guardando...',
    'fieldSelector.button.cancel': 'Cancelar',
    'fieldSelector.modal.deleteTitle': '¿Eliminar campo?',
    'fieldSelector.select.placeholder': 'Seleccione un campo',
    'fieldSelector.select.create': '+ Crear nuevo campo',
    'fieldSelector.button.editTitle': 'Editar campo seleccionado',
    'fieldSelector.button.viewTitle': 'Ver campo seleccionado',
    'fieldSelector.button.view': 'Ver',
    'fieldSelector.button.deleteTitle': 'Eliminar campo seleccionado',
    'fieldSelector.button.delete': 'Eliminar',
    'fieldSelector.button.createTitle': 'Crear nuevo campo',
    'fieldSelector.button.create': 'Crear campo',
  },
}

// RowGroup / grupos
const rowGroupTranslations = {
  en: {
    'rowGroup.section': 'Section',
    'rowGroup.toolbar.open': 'Open section tools',
    'rowGroup.toolbar.dragOn': 'Disable drag',
    'rowGroup.toolbar.dragOff': 'Enable drag',
    'rowGroup.toolbar.reset': 'Reset horizontal positions',
    'rowGroup.toolbar.remove': 'Remove group',
    'rowGroup.empty': 'Empty group - drag rows here',
    'rowGroup.horizontal.dragTitle': 'Drag to adjust horizontal position',
    'rowGroup.row.removeTooltip': 'Remove row from group',
    'rowGroup.row.removeLabel': 'Remove row',
  },
  pt: {
    'rowGroup.section': 'Seção',
    'rowGroup.toolbar.open': 'Abrir ferramentas da seção',
    'rowGroup.toolbar.dragOn': 'Desativar arrasto',
    'rowGroup.toolbar.dragOff': 'Ativar arrasto',
    'rowGroup.toolbar.reset': 'Resetar posições horizontais',
    'rowGroup.toolbar.remove': 'Remover grupo',
    'rowGroup.empty': 'Grupo vazio - arraste fileiras para cá',
    'rowGroup.horizontal.dragTitle': 'Arraste para ajustar posição horizontal',
    'rowGroup.row.removeTooltip': 'Remover fileira do grupo',
    'rowGroup.row.removeLabel': 'Remover Row',
  },
  es: {
    'rowGroup.section': 'Sección',
    'rowGroup.toolbar.open': 'Abrir herramientas de la sección',
    'rowGroup.toolbar.dragOn': 'Desactivar arrastre',
    'rowGroup.toolbar.dragOff': 'Activar arrastre',
    'rowGroup.toolbar.reset': 'Reiniciar posiciones horizontales',
    'rowGroup.toolbar.remove': 'Eliminar grupo',
    'rowGroup.empty': 'Grupo vacío - arrastre filas aquí',
    'rowGroup.horizontal.dragTitle': 'Arrastre para ajustar posición horizontal',
    'rowGroup.row.removeTooltip': 'Eliminar fila del grupo',
    'rowGroup.row.removeLabel': 'Eliminar fila',
  },
} as const

Object.assign(translations.en, rowGroupTranslations.en)
Object.assign(translations.pt, rowGroupTranslations.pt)
Object.assign(translations.es, rowGroupTranslations.es)

// Palette / Trackers disponíveis
const paletteTranslations = {
  en: {
    'palette.title': 'Available Trackers',
    'palette.select': 'Select tracker',
    'palette.close': 'Close list',
    'palette.available': 'available',
    'palette.search.placeholder': 'Search by name, manufacturer, stakes...',
    'palette.loading': 'Loading trackers...',
    'palette.error': 'Error loading',
    'palette.empty': 'No trackers found',
    'palette.count': 'of trackers',
  },
  pt: {
    'palette.title': 'Trackers disponíveis',
    'palette.select': 'Selecionar tracker',
    'palette.close': 'Fechar lista',
    'palette.available': 'disponíveis',
    'palette.search.placeholder': 'Buscar por nome, fabricante, estacas...',
    'palette.loading': 'Carregando trackers...',
    'palette.error': 'Erro ao carregar',
    'palette.empty': 'Nenhum tracker encontrado',
    'palette.count': 'de trackers',
  },
  es: {
    'palette.title': 'Trackers disponibles',
    'palette.select': 'Seleccionar tracker',
    'palette.close': 'Cerrar lista',
    'palette.available': 'disponibles',
    'palette.search.placeholder': 'Buscar por nombre, fabricante, estacas...',
    'palette.loading': 'Cargando trackers...',
    'palette.error': 'Error al cargar',
    'palette.empty': 'No se encontraron trackers',
    'palette.count': 'de trackers',
  },
} as const

// StatusLegend / Legenda de Status
const statusLegendTranslations = {
  en: {
    'statusLegend.title': 'Status Legend',
    'statusLegend.close': 'Close legend',
    'statusLegend.status.1': 'Not pinned',
    'statusLegend.status.2': 'Pinned with Success',
    'statusLegend.status.3': 'Pinned with problem but no impediment for tracker assembly',
    'statusLegend.status.4': 'Problem that prevents tracker assembly',
    'statusLegend.status.5': 'Modules assembled',
    'statusLegend.status.6': 'Awaiting inspection',
    'statusLegend.status.7': 'Inspection failed',
  },
  pt: {
    'statusLegend.title': 'Legenda de Status',
    'statusLegend.close': 'Fechar legenda',
    'statusLegend.status.1': 'Não cravada',
    'statusLegend.status.2': 'Cravada com Sucesso',
    'statusLegend.status.3': 'Cravada com problema mas sem impeditivo para montagem do tracker',
    'statusLegend.status.4': 'Problema que impede a montagem do tracker',
    'statusLegend.status.5': 'Módulos montados',
    'statusLegend.status.6': 'Aguardando inspeção',
    'statusLegend.status.7': 'Inspeção reprovada',
  },
  es: {
    'statusLegend.title': 'Leyenda de Estado',
    'statusLegend.close': 'Cerrar leyenda',
    'statusLegend.status.1': 'No fijada',
    'statusLegend.status.2': 'Fijada con Éxito',
    'statusLegend.status.3': 'Fijada con problema pero sin impedimento para montaje del tracker',
    'statusLegend.status.4': 'Problema que impide el montaje del tracker',
    'statusLegend.status.5': 'Módulos montados',
    'statusLegend.status.6': 'Esperando inspección',
    'statusLegend.status.7': 'Inspección reprobada',
  },
} as const

// Canvas / Menu lateral
const canvasTranslations = {
  en: {
    'canvas.create': 'Create',
    'canvas.rows': 'Rows',
    'canvas.createRow': 'Create row',
    'canvas.groupInRow': 'Group in Row',
    'canvas.sections': 'Sections',
    'canvas.createSection': 'Create Section',
    'canvas.groupInSection': 'Group in Section',
    'canvas.text': 'Text',
    'canvas.addText': 'Add Text',
    'canvas.edit': 'Edit',
    'canvas.duplicate': 'Duplicate',
    'canvas.alignment': 'Alignment',
    'canvas.alignLeft': 'Align left',
    'canvas.alignCenter': 'Center horizontally',
    'canvas.alignRight': 'Align right',
    'canvas.alignTop': 'Align to top',
    'canvas.alignMiddle': 'Center vertically',
    'canvas.alignBottom': 'Align to base',
    'canvas.distribute': 'Distribute',
    'canvas.distributeHorizontal': 'Distribute horizontally',
    'canvas.distributeVertical': 'Distribute vertically',
    'canvas.info': 'Information',
    'canvas.shortcuts': 'Shortcuts',
    'canvas.shortcut.pan': 'Pan',
    'canvas.shortcut.zoom': 'Zoom',
    'canvas.shortcut.vertical': 'Vertical',
    'canvas.shortcut.select': 'Select',
    'canvas.shortcut.duplicate': 'Duplicate',
    'canvas.shortcut.clear': 'Clear',
    'canvas.shortcut.remove': 'Remove',
    'canvas.file': 'File',
    'canvas.save': 'Save',
    'canvas.saving': 'Saving...',
    'canvas.groupSelectLoose': 'Select loose trackers to group',
    'canvas.groupSelectLooseTooltip': 'Groups selected loose trackers into a row',
    'canvas.error.groupLoose': 'Select trackers that are loose on the canvas (not inside rows) to group into a row.',
  },
  pt: {
    'canvas.create': 'Criar',
    'canvas.rows': 'Fileiras',
    'canvas.createRow': 'Criar fileira',
    'canvas.groupInRow': 'Agrupar em Fileira',
    'canvas.sections': 'Seções',
    'canvas.createSection': 'Criar Seção',
    'canvas.groupInSection': 'Agrupar em Seção',
    'canvas.text': 'Texto',
    'canvas.addText': 'Adicionar Texto',
    'canvas.edit': 'Editar',
    'canvas.duplicate': 'Duplicar',
    'canvas.alignment': 'Alinhamento',
    'canvas.alignLeft': 'Alinhar à esquerda',
    'canvas.alignCenter': 'Centralizar horizontalmente',
    'canvas.alignRight': 'Alinhar à direita',
    'canvas.alignTop': 'Alinhar ao topo',
    'canvas.alignMiddle': 'Centralizar verticalmente',
    'canvas.alignBottom': 'Alinhar à base',
    'canvas.distribute': 'Distribuir',
    'canvas.distributeHorizontal': 'Distribuir horizontalmente',
    'canvas.distributeVertical': 'Distribuir verticalmente',
    'canvas.info': 'Informações',
    'canvas.shortcuts': 'Atalhos',
    'canvas.shortcut.pan': 'Pan',
    'canvas.shortcut.zoom': 'Zoom',
    'canvas.shortcut.vertical': 'Vertical',
    'canvas.shortcut.select': 'Selecionar',
    'canvas.shortcut.duplicate': 'Duplicar',
    'canvas.shortcut.clear': 'Limpar',
    'canvas.shortcut.remove': 'Remover',
    'canvas.file': 'Arquivo',
    'canvas.save': 'Salvar',
    'canvas.saving': 'Salvando...',
    'canvas.groupSelectLoose': 'Selecione trackers soltos para agrupar',
    'canvas.groupSelectLooseTooltip': 'Agrupa trackers soltos selecionados em uma fileira',
    'canvas.error.groupLoose': 'Selecione trackers que estão soltos no canvas (não dentro de fileiras) para agrupar em uma fileira.',
  },
  es: {
    'canvas.create': 'Crear',
    'canvas.rows': 'Filas',
    'canvas.createRow': 'Crear fila',
    'canvas.groupInRow': 'Agrupar en Fila',
    'canvas.sections': 'Secciones',
    'canvas.createSection': 'Crear Sección',
    'canvas.groupInSection': 'Agrupar en Sección',
    'canvas.text': 'Texto',
    'canvas.addText': 'Agregar Texto',
    'canvas.edit': 'Editar',
    'canvas.duplicate': 'Duplicar',
    'canvas.alignment': 'Alineación',
    'canvas.alignLeft': 'Alinear a la izquierda',
    'canvas.alignCenter': 'Centrar horizontalmente',
    'canvas.alignRight': 'Alinear a la derecha',
    'canvas.alignTop': 'Alinear arriba',
    'canvas.alignMiddle': 'Centrar verticalmente',
    'canvas.alignBottom': 'Alinear abajo',
    'canvas.distribute': 'Distribuir',
    'canvas.distributeHorizontal': 'Distribuir horizontalmente',
    'canvas.distributeVertical': 'Distribuir verticalmente',
    'canvas.info': 'Información',
    'canvas.shortcuts': 'Atajos',
    'canvas.shortcut.pan': 'Pan',
    'canvas.shortcut.zoom': 'Zoom',
    'canvas.shortcut.vertical': 'Vertical',
    'canvas.shortcut.select': 'Seleccionar',
    'canvas.shortcut.duplicate': 'Duplicar',
    'canvas.shortcut.clear': 'Limpiar',
    'canvas.shortcut.remove': 'Eliminar',
    'canvas.file': 'Archivo',
    'canvas.save': 'Guardar',
    'canvas.saving': 'Guardando...',
    'canvas.groupSelectLoose': 'Seleccione trackers sueltos para agrupar',
    'canvas.groupSelectLooseTooltip': 'Agrupa trackers sueltos seleccionados en una fila',
    'canvas.error.groupLoose': 'Seleccione trackers que están sueltos en el canvas (no dentro de filas) para agrupar en una fila.',
  },
} as const

// ViewCanvas
const viewCanvasTranslations = {
  en: {
    'viewCanvas.zoom': 'Zoom',
    'viewCanvas.reset': 'Reset',
  },
  pt: {
    'viewCanvas.zoom': 'Zoom',
    'viewCanvas.reset': 'Reset',
  },
  es: {
    'viewCanvas.zoom': 'Zoom',
    'viewCanvas.reset': 'Reiniciar',
  },
} as const

Object.assign(translations.en, paletteTranslations.en)
Object.assign(translations.pt, paletteTranslations.pt)
Object.assign(translations.es, paletteTranslations.es)

Object.assign(translations.en, statusLegendTranslations.en)
Object.assign(translations.pt, statusLegendTranslations.pt)
Object.assign(translations.es, statusLegendTranslations.es)

Object.assign(translations.en, canvasTranslations.en)
Object.assign(translations.pt, canvasTranslations.pt)
Object.assign(translations.es, canvasTranslations.es)

Object.assign(translations.en, viewCanvasTranslations.en)
Object.assign(translations.pt, viewCanvasTranslations.pt)
Object.assign(translations.es, viewCanvasTranslations.es)

const fallbackLocale: LocaleKey = 'pt'

type I18nContextValue = {
  locale: LocaleKey
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: fallbackLocale,
  t: (key) => translations[fallbackLocale][key] ?? key,
})

const normalizeLocale = (raw?: string | null): LocaleKey => {
  if (!raw) return fallbackLocale
  const lowered = raw.toLowerCase()
  if (lowered.startsWith('en')) return 'en'
  if (lowered.startsWith('es')) return 'es'
  return 'pt'
}

export function I18nProvider({
  locale,
  children,
}: {
  locale?: string | null
  children: React.ReactNode
}) {
  const resolvedLocale = normalizeLocale(locale)

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string) => {
      return translations[resolvedLocale][key] ?? translations[fallbackLocale][key] ?? key
    }
    return { locale: resolvedLocale, t }
  }, [resolvedLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function supportedLocales(): LocaleKey[] {
  return Object.keys(translations) as LocaleKey[]
}

export function resolveLocale(input?: string | null): LocaleKey {
  return normalizeLocale(input)
}

