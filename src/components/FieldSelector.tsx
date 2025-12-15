import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useFieldsStore } from '../store/fieldsStore'
import type { Field } from '../store/fieldsStore'
import { useAppParams } from '../context/AppParamsContext'
import { useI18n } from '../i18n'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, Save, Trash2 } from 'lucide-react'
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { FaFileAlt } from 'react-icons/fa'

const parseNumericParam = (value: string | null) => {
  if (!value) return null
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const getCreatedAtValue = (field: Field) => {
  const createdAt = field.created_at
  if (createdAt === undefined || createdAt === null) {
    return Number.MAX_SAFE_INTEGER
  }
  if (typeof createdAt === 'number') {
    return createdAt
  }
  const parsed = parseInt(String(createdAt), 10)
  if (!Number.isNaN(parsed)) {
    return parsed
  }
  const timestamp = Date.parse(String(createdAt))
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

export function FieldSelector() {
  const navigate = useNavigate()
  const location = useLocation()
  const appParams = useAppParams()
  const { t } = useI18n()
  const { fields, loading, fetchFields, updateFieldName, deleteField } = useFieldsStore()
  
  // Debug: verificar se os hooks estão funcionando
  if (typeof navigate !== 'function' || !location) {
    console.error('FieldSelector: hooks do router não estão disponíveis')
    return <div className="w-full bg-white border-b border-[#daeef6] px-4 py-3 text-red-600">{t('fieldSelector.routerError')}</div>
  }
  
  // Inicializa selectedFieldId com appParams.fieldId ou com o parâmetro da URL como fallback
  const urlParams = new URLSearchParams(location.search)
  const urlFieldId = urlParams.get('fieldId')
  const initialFieldId = appParams.fieldId !== null ? appParams.fieldId : urlFieldId
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(initialFieldId)
  const [fieldName, setFieldName] = useState<string>('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingField, setIsDeletingField] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const autoSelectedFieldRef = useRef(false)
  const nameEditorSlot = typeof document !== 'undefined' ? document.getElementById('field-name-editor-slot') : null
  const modalContainer = typeof document !== 'undefined' ? document.body : null
  const projectIdNum = parseNumericParam(appParams.projectId)
  const companyIdNum = parseNumericParam(appParams.companyId)

  // Buscar campos quando o projectId estiver disponível
  useEffect(() => {
    if (projectIdNum !== null && companyIdNum !== null) {
      fetchFields(projectIdNum, companyIdNum, appParams.authToken).catch((err) => {
        console.error('Erro ao buscar campos:', err)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdNum, companyIdNum, appParams.authToken])

  // Atualizar selectedFieldId quando appParams.fieldId ou URL mudar
  useEffect(() => {
    const currentUrlParams = new URLSearchParams(location.search)
    const currentUrlFieldId = currentUrlParams.get('fieldId')
    const currentUrlMode = currentUrlParams.get('mode')

    // Em modo criação explícito (fieldId=0 + mode=create), sempre prioriza a URL
    // para evitar que o fieldId anterior do contexto "sobrescreva" o estado de criação.
    let fieldIdToUse: string | null
    if (currentUrlFieldId === '0' && currentUrlMode === 'create') {
      fieldIdToUse = '0'
    } else {
      fieldIdToUse = appParams.fieldId !== null ? appParams.fieldId : currentUrlFieldId
    }

    if (fieldIdToUse !== selectedFieldId) {
      setSelectedFieldId(fieldIdToUse)
    }
  }, [appParams.fieldId, location.search, selectedFieldId])

  useEffect(() => {
    const handleExternalEdit = () => {
      if (selectedFieldId) {
        setIsEditingName(true)
      }
    }
    window.addEventListener('field-selector-edit', handleExternalEdit)
    return () => window.removeEventListener('field-selector-edit', handleExternalEdit)
  }, [selectedFieldId])

  // Atualizar fieldName quando o campo selecionado mudar
  useEffect(() => {
    if (selectedFieldId && selectedFieldId !== '0') {
      const field = fields.find(f => f.id === parseInt(selectedFieldId, 10))
      if (field) {
        setFieldName(field.name || '')
        setIsEditingName(false)
      }
    } else if (selectedFieldId === '0') {
      // Modo criação: não abre o input automaticamente
      setFieldName('')
      setIsEditingName(false)
    } else {
      setFieldName('')
      setIsEditingName(false)
    }
  }, [selectedFieldId, fields])

  // Seleciona automaticamente o campo mais antigo (created_at) na inicialização
  // Também faz isso quando fieldId=0 mas mode=view está presente (trata como modo view)
  useEffect(() => {
    if (autoSelectedFieldRef.current) return
    if (loading) {
      console.log('[FieldSelector] aguardando carregamento dos campos', { loading })
      return
    }
    
    // Verifica se já há um fieldId na URL ou no contexto
    const currentUrlParams = new URLSearchParams(location.search)
    const urlFieldId = currentUrlParams.get('fieldId')
    const urlMode = currentUrlParams.get('mode')
    
    // Caso 1: fieldId=0 e mode=view - seleciona automaticamente o primeiro campo
    const isFieldZeroWithViewMode = urlFieldId === '0' && urlMode === 'view'
    
    // Caso 2: Não há fieldId na URL nem no contexto, e há campos disponíveis - seleciona o primeiro
    const hasFieldIdInUrl = urlFieldId !== null
    const hasFieldIdInContext = appParams.fieldId !== null
    const shouldAutoSelectDefault = !hasFieldIdInUrl && !hasFieldIdInContext && !selectedFieldId
    
    // Se já houver fieldId válido (não 0) na URL ou no contexto, não faz auto-select
    if ((hasFieldIdInUrl && urlFieldId !== '0') || (hasFieldIdInContext && appParams.fieldId !== '0' && appParams.fieldId !== null) || (selectedFieldId && selectedFieldId !== '0')) {
      console.log('[FieldSelector] auto-select abortado: já existe fieldId válido', {
        hasFieldIdInUrl,
        urlFieldId,
        hasFieldIdInContext,
        appFieldId: appParams.fieldId,
        selectedFieldId,
      })
      return
    }
    
    // Só faz auto-select se for um dos casos acima
    if (!isFieldZeroWithViewMode && !shouldAutoSelectDefault) {
      console.log('[FieldSelector] auto-select não aplicável', {
        isFieldZeroWithViewMode,
        shouldAutoSelectDefault,
      })
      return
    }
    
    if (fields.length === 0) {
      console.log('[FieldSelector] auto-select abortado: sem campos carregados')
      return
    }
    if (!appParams.projectId || !appParams.companyId) {
      console.log('[FieldSelector] auto-select abortado: faltam IDs', {
        projectId: appParams.projectId,
        companyId: appParams.companyId,
      })
      return
    }

    const firstField = [...fields].sort((a, b) => getCreatedAtValue(a) - getCreatedAtValue(b))[0]
    if (!firstField) {
      console.log('[FieldSelector] auto-select abortado: não encontrou primeiro campo após ordenar')
      return
    }

    autoSelectedFieldRef.current = true
    const firstFieldId = firstField.id.toString()
    setSelectedFieldId(firstFieldId)
    console.log('[FieldSelector] auto-select aplicado', {
      firstFieldId,
      firstFieldName: firstField.name,
      reason: isFieldZeroWithViewMode ? 'fieldId=0 + mode=view' : 'sem fieldId definido',
    })

    const params = new URLSearchParams()
    params.set('projectId', appParams.projectId)
    params.set('companyId', appParams.companyId)
    params.set('fieldId', firstFieldId)
    params.set('mode', 'view')
    if (appParams.authToken) params.set('authToken', appParams.authToken)
    if (appParams.locale) params.set('locale', appParams.locale)

    navigate(`/view?${params.toString()}`, { replace: true })
  }, [fields, selectedFieldId, appParams.projectId, appParams.companyId, appParams.fieldId, appParams.authToken, location.search, navigate, loading])


  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFieldId = e.target.value
    if (newFieldId === '') {
      // Se selecionar a opção vazia, limpar a seleção
      setSelectedFieldId(null)
      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      if (appParams.companyId) params.set('companyId', appParams.companyId)
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      if (appParams.locale) params.set('locale', appParams.locale)
      const queryString = params.toString()
      navigate(queryString ? `${location.pathname}?${queryString}` : location.pathname, { replace: true })
      return
    }
    
    setSelectedFieldId(newFieldId)
    
    // Atualiza a URL para que o Canvas recarregue automaticamente
    // Mantém a rota atual e o modo baseado na rota
    const params = new URLSearchParams()
    if (appParams.projectId) params.set('projectId', appParams.projectId)
    if (appParams.companyId) params.set('companyId', appParams.companyId)
    params.set('fieldId', newFieldId)
    if (appParams.authToken) params.set('authToken', appParams.authToken)
    if (appParams.locale) params.set('locale', appParams.locale)
    
    // Determina o modo e a rota baseado na rota atual
    const isViewMode = location.pathname === '/view'
    
    if (newFieldId === '0') {
      // Modo criação
      params.set('mode', 'create')
      navigate(`/?${params.toString()}`, { replace: true })
    } else if (isViewMode) {
      // Mantém modo view se estiver em /view
      params.set('mode', 'view')
      navigate(`/view?${params.toString()}`, { replace: true })
    } else {
      // Modo edição (padrão para /)
      params.set('mode', 'edit')
      navigate(`/?${params.toString()}`, { replace: true })
    }
  }

  const handleCreate = () => {
    // Navegar para criação de novo campo (fieldId = 0) no modo create
    // Também atualiza imediatamente o estado local para refletir o "novo campo"
    setSelectedFieldId('0')
    setFieldName('')
    setIsEditingName(false)

    const params = new URLSearchParams()
    if (appParams.projectId) params.set('projectId', appParams.projectId)
    if (appParams.companyId) params.set('companyId', appParams.companyId)
    params.set('fieldId', '0')
    params.set('mode', 'create')
    if (appParams.authToken) params.set('authToken', appParams.authToken)
    if (appParams.locale) params.set('locale', appParams.locale)
    
    navigate(`/?${params.toString()}`, { replace: true })
  }

  const handleEdit = () => {
    if (selectedFieldId && selectedFieldId !== '0') {
      // Navegar para edição do campo selecionado no modo edit
      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      if (appParams.companyId) params.set('companyId', appParams.companyId)
      params.set('fieldId', selectedFieldId)
      params.set('mode', 'edit')
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      if (appParams.locale) params.set('locale', appParams.locale)
      
      navigate(`/?${params.toString()}`, { replace: true })
    }
  }

  const handleView = () => {
    if (selectedFieldId && selectedFieldId !== '0') {
      // Navegar para visualização do campo selecionado
      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      if (appParams.companyId) params.set('companyId', appParams.companyId)
      params.set('fieldId', selectedFieldId)
      params.set('mode', 'view')
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      if (appParams.locale) params.set('locale', appParams.locale)
      navigate(`/view?${params.toString()}`, { replace: true })
    }
  }

  const handleSaveFieldName = async () => {
    if (!fieldName.trim()) {
      alert(t('fieldSelector.alert.nameRequired'))
      return
    }

    setIsSavingName(true)

    try {
      if (selectedFieldId === '0') {
        // Não pode criar campo aqui - campo é criado ao salvar o mapa na trackers-map
        alert(t('fieldSelector.alert.createInfo'))
        setIsSavingName(false)
        return
      } else if (selectedFieldId) {
        // Atualizar campo existente
        const fieldIdNum = parseInt(selectedFieldId, 10)
        if (isNaN(fieldIdNum)) {
          alert(t('fieldSelector.alert.invalidFieldId'))
          setIsSavingName(false)
          return
        }

        const result = await updateFieldName(fieldIdNum, fieldName.trim(), appParams.authToken)
        
        if (result.success) {
          setIsEditingName(false)
          // Recarregar a lista de campos
          if (projectIdNum !== null && companyIdNum !== null) {
            await fetchFields(projectIdNum, companyIdNum, appParams.authToken)
          } else {
            console.warn('Não foi possível recarregar campos: projectId ou companyId inválido')
          }
        } else {
          alert(`${t('fieldSelector.alert.updateError')}: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar nome do campo:', error)
      alert(t('fieldSelector.alert.updateError'))
    } finally {
      setIsSavingName(false)
    }
  }

  const handleCancelEditName = () => {
    if (selectedFieldId && selectedFieldId !== '0') {
      const field = fields.find(f => f.id === parseInt(selectedFieldId, 10))
      if (field) {
        setFieldName(field.name || '')
      }
    } else {
      setFieldName('')
    }
    setIsEditingName(false)
  }

  const selectedField = selectedFieldId ? fields.find(f => f.id === parseInt(selectedFieldId, 10)) : null
  const selectedFieldLabel = selectedField
    ? selectedField.name || `Campo ${selectedField.field_number || selectedField.id}`
    : t('fieldSelector.select.placeholder')
  const hasFieldSelected = selectedFieldId !== null && selectedFieldId !== ''
  const canEditOrView = hasFieldSelected && selectedFieldId !== '0'
  const showNameInput = hasFieldSelected && isEditingName && selectedFieldId !== '0'

  const handleDeleteClick = () => {
    if (!canEditOrView) return
    setDeleteError(null)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    if (isDeletingField) return
    setIsDeleteModalOpen(false)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!selectedFieldId || selectedFieldId === '0') return

    const fieldIdNum = parseInt(selectedFieldId, 10)
    if (isNaN(fieldIdNum)) {
      setDeleteError(t('fieldSelector.alert.invalidFieldId'))
      return
    }

    setIsDeletingField(true)
    setDeleteError(null)

    try {
      const result = await deleteField(fieldIdNum, appParams.authToken)
      if (!result.success) {
        setDeleteError(result.error || t('fieldSelector.alert.deleteError'))
        return
      }

      setIsDeleteModalOpen(false)
      setSelectedFieldId(null)
      setFieldName('')

      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      if (appParams.companyId) params.set('companyId', appParams.companyId)
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      const queryString = params.toString()
      navigate(queryString ? `${location.pathname}?${queryString}` : location.pathname, { replace: true })

      if (projectIdNum !== null && companyIdNum !== null) {
        await fetchFields(projectIdNum, companyIdNum, appParams.authToken)
      }
    } catch (error) {
      console.error('Erro ao excluir campo:', error)
      setDeleteError(t('fieldSelector.alert.deleteUnexpected'))
    } finally {
      setIsDeletingField(false)
    }
  }

  const nameEditorContent = (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={fieldName}
        onChange={(e) => setFieldName(e.target.value)}
        placeholder={t('fieldSelector.input.placeholder')}
        className="h-10 px-3 rounded-[12px] border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{
          width: '200px',
          backgroundColor: '#fafafa',
          borderColor: '#dadee6'
        }}
        disabled={isSavingName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSaveFieldName()
          } else if (e.key === 'Escape') {
            handleCancelEditName()
          }
        }}
      />
      <button
        onClick={handleSaveFieldName}
        disabled={isSavingName || !fieldName.trim()}
        className="h-10 px-3 rounded-[12px] bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('fieldSelector.button.saveTitle')}
      >
        <Save size={14} />
        {isSavingName ? t('fieldSelector.button.saving') : t('fieldSelector.button.save')}
      </button>
      {selectedFieldId !== '0' && (
        <button
          onClick={handleCancelEditName}
          disabled={isSavingName}
          className="h-10 px-3 rounded-[12px] bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('fieldSelector.button.cancel')}
        >
          {t('fieldSelector.button.cancel')}
        </button>
      )}
    </div>
  )

  const nameEditorPortal =
    showNameInput && nameEditorSlot
      ? createPortal(nameEditorContent, nameEditorSlot)
      : showNameInput
        ? nameEditorContent
        : null

  const deleteModalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">{t('fieldSelector.modal.deleteTitle')}</h3>
        <p className="mt-2 text-sm text-gray-600">
          Tem certeza de que deseja excluir{' '}
          <span className="font-medium text-gray-900">{selectedFieldLabel}</span>?
          {' '}Essa ação não pode ser desfeita.
        </p>
        {deleteError && (
          <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCloseDeleteModal}
            disabled={isDeletingField}
            className="h-10 px-4 rounded-[12px] border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('fieldSelector.button.cancel')}
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeletingField}
            className="h-10 px-4 rounded-[12px] bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            {isDeletingField ? t('fieldSelector.button.saving') : t('fieldSelector.button.delete')}
          </button>
        </div>
      </div>
    </div>
  )

  const deleteModal =
    isDeleteModalOpen && modalContainer
      ? createPortal(deleteModalContent, modalContainer)
      : isDeleteModalOpen
        ? deleteModalContent
        : null

  return (
    <div className="w-full bg-white border-b border-[#daeef6] px-0 py-3">
      {nameEditorPortal}
      {deleteModal}
      <div className="flex items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-3">
          <select
            id="field-select"
            value={selectedFieldId || ''}
            onChange={handleFieldChange}
            className="field-selector-dropdown rounded-[12px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1d5cc6] focus:border-transparent transition-all duration-200 cursor-pointer"
            style={{
              width: '260px',
              height: '40px',
              paddingLeft: '12px',
              paddingRight: '48px',
              backgroundColor: '#fafafa',
              borderColor: '#dadee6',
              borderWidth: '1px',
              borderStyle: 'solid',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            disabled={loading || isSavingName}
          >
            <option value="" disabled> {t('fieldSelector.select.placeholder')}</option>
            <option value="0">{t('fieldSelector.select.create')}</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id.toString()}>
                {field.name || `Campo ${field.field_number || field.id}`}
              </option>
            ))}
          </select>
          
          <div className="flex items-center gap-2">
            {canEditOrView && (
              <>
                <button
                  onClick={handleEdit}
                  className="group flex items-center justify-center transition-colors bg-transparent hover:bg-[#487eda] hover:border-[#487eda]"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#dadee6'
                  }}
                  title={t('fieldSelector.button.editTitle')}
                >
                  <EditRoundedIcon style={{ fontSize: 18 }} className="text-[#1d5cc6] group-hover:text-white" />
                </button>
                <button
                  onClick={() => {
                    // TODO: Implementar download de PDF
                    console.log('Download PDF')
                  }}
                  className="group flex items-center justify-center transition-colors bg-transparent hover:bg-[#487eda] hover:border-[#487eda]"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#dadee6'
                  }}
                  title="Baixar PDF"
                >
                  <FaFileAlt size={18} className="text-[#1d5cc6] group-hover:text-white" />
                </button>
                <button
                  onClick={handleView}
                  className="h-10 px-4 rounded-[12px] bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                  style={{
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: '#dadee6'
                  }}
                  title={t('fieldSelector.button.viewTitle')}
                >
                  <Eye size={14} />
                  {t('fieldSelector.button.view')}
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeletingField}
                  className="h-10 px-4 rounded-[12px] border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 hover:border-red-400 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('fieldSelector.button.deleteTitle')}
                >
                  <Trash2 size={14} />
                  {t('fieldSelector.button.delete')}
                </button>
              </>
            )}
          </div>
          
          {loading && (
            <div className="text-xs text-gray-500">
              {t('fieldSelector.button.saving')}
            </div>
          )}
        </div>
        
        <button
          onClick={handleCreate}
          className="group flex items-center justify-center gap-2 transition-colors bg-transparent hover:bg-[#487eda] hover:border-[#487eda]"
          style={{
            height: '40px',
            paddingLeft: '14px',
            paddingRight: '14px',
            borderRadius: '12px',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#dadee6'
          }}
          title={t('fieldSelector.button.createTitle')}
        >
          <AddCircleRoundedIcon
            style={{ fontSize: 18 }}
            className="text-[#1d5cc6] group-hover:text-white"
          />
          <span className="text-sm font-medium text-[#1d5cc6] group-hover:text-white">{t('fieldSelector.button.create')}</span>
        </button>
      </div>
    </div>
  )
}

