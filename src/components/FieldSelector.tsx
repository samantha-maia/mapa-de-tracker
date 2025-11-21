import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useFieldsStore } from '../store/fieldsStore'
import { useAppParams } from '../context/AppParamsContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, Save } from 'lucide-react'
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'

export function FieldSelector() {
  const navigate = useNavigate()
  const location = useLocation()
  const appParams = useAppParams()
  const { fields, loading, fetchFields, updateFieldName } = useFieldsStore()
  
  // Debug: verificar se os hooks estão funcionando
  if (typeof navigate !== 'function' || !location) {
    console.error('FieldSelector: hooks do router não estão disponíveis')
    return <div className="w-full bg-white border-b border-[#daeef6] px-4 py-3 text-red-600">Erro: Router não disponível</div>
  }
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(appParams.fieldId)
  const [fieldName, setFieldName] = useState<string>('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const nameEditorSlot = typeof document !== 'undefined' ? document.getElementById('field-name-editor-slot') : null

  // Buscar campos quando o projectId estiver disponível
  useEffect(() => {
    if (appParams.projectId) {
      const projectIdNum = parseInt(appParams.projectId, 10)
      if (!isNaN(projectIdNum)) {
        fetchFields(projectIdNum, appParams.authToken).catch((err) => {
          console.error('Erro ao buscar campos:', err)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appParams.projectId, appParams.authToken])

  // Atualizar selectedFieldId quando appParams.fieldId mudar
  useEffect(() => {
    setSelectedFieldId(appParams.fieldId)
  }, [appParams.fieldId])

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


  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFieldId = e.target.value
    if (newFieldId === '') {
      // Se selecionar a opção vazia, limpar a seleção
      setSelectedFieldId(null)
      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      const queryString = params.toString()
      navigate(queryString ? `${location.pathname}?${queryString}` : location.pathname, { replace: true })
      return
    }
    
    setSelectedFieldId(newFieldId)
    // Ao selecionar um campo, não navega automaticamente - espera ação do usuário
  }

  const handleCreate = () => {
    // Navegar para criação de novo campo (fieldId = 0) no modo create
    const params = new URLSearchParams()
    if (appParams.projectId) params.set('projectId', appParams.projectId)
    params.set('fieldId', '0')
    params.set('mode', 'create')
    if (appParams.authToken) params.set('authToken', appParams.authToken)
    
    navigate(`/?${params.toString()}`, { replace: true })
  }

  const handleEdit = () => {
    if (selectedFieldId && selectedFieldId !== '0') {
      // Navegar para edição do campo selecionado no modo edit
      const params = new URLSearchParams()
      if (appParams.projectId) params.set('projectId', appParams.projectId)
      params.set('fieldId', selectedFieldId)
      params.set('mode', 'edit')
      if (appParams.authToken) params.set('authToken', appParams.authToken)
      
      navigate(`/?${params.toString()}`, { replace: true })
    }
  }

  const handleView = () => {
    if (selectedFieldId && selectedFieldId !== '0') {
      // Navegar para visualização do campo selecionado
      navigate(`/view?${new URLSearchParams({
        projectId: appParams.projectId || '',
        fieldId: selectedFieldId,
        authToken: appParams.authToken || '',
        mode: 'view'
      }).toString()}`, { replace: true })
    }
  }

  const handleSaveFieldName = async () => {
    if (!fieldName.trim()) {
      alert('Por favor, insira um nome para o campo')
      return
    }

    setIsSavingName(true)

    try {
      if (selectedFieldId === '0') {
        // Não pode criar campo aqui - campo é criado ao salvar o mapa na trackers-map
        alert('Para criar um novo campo, use o botão "Criar novo campo" e depois salve o mapa')
        setIsSavingName(false)
        return
      } else if (selectedFieldId) {
        // Atualizar campo existente
        const fieldIdNum = parseInt(selectedFieldId, 10)
        if (isNaN(fieldIdNum)) {
          alert('FieldId inválido')
          setIsSavingName(false)
          return
        }

        const result = await updateFieldName(fieldIdNum, fieldName.trim(), appParams.authToken)
        
        if (result.success) {
          setIsEditingName(false)
          // Recarregar a lista de campos
          if (appParams.projectId) {
            const projectIdNum = parseInt(appParams.projectId, 10)
            if (!isNaN(projectIdNum)) {
              await fetchFields(projectIdNum, appParams.authToken)
            }
          }
        } else {
          alert(`Erro ao atualizar campo: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar nome do campo:', error)
      alert('Erro ao salvar nome do campo')
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

  const hasFieldSelected = selectedFieldId !== null && selectedFieldId !== ''
  const canEditOrView = hasFieldSelected && selectedFieldId !== '0'
  const showNameInput = hasFieldSelected && isEditingName && selectedFieldId !== '0'

  const nameEditorContent = (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={fieldName}
        onChange={(e) => setFieldName(e.target.value)}
        placeholder="Nome do campo"
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
        title="Salvar nome do campo"
      >
        <Save size={14} />
        {isSavingName ? 'Salvando...' : 'Salvar'}
      </button>
      {selectedFieldId !== '0' && (
        <button
          onClick={handleCancelEditName}
          disabled={isSavingName}
          className="h-10 px-3 rounded-[12px] bg-gray-500 text-white text-xs font-medium hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Cancelar edição"
        >
          Cancelar
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

  return (
    <div className="w-full bg-white border-b border-[#daeef6] px-0 py-3">
      {nameEditorPortal}
      <div className="flex items-center gap-3">
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
            <option value="" disabled> Selecione um campo</option>
            <option value="0">+ Criar novo campo</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id.toString()}>
                {field.name || `Campo ${field.field_number || field.id}`}
              </option>
            ))}
          </select>
        </div>
        
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
                title="Editar campo selecionado"
              >
                <EditRoundedIcon style={{ fontSize: 18 }} className="text-[#1d5cc6] group-hover:text-white" />
              </button>
              <button
                onClick={handleView}
                className="h-10 px-4 rounded-[12px] bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                style={{
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: '#dadee6'
                }}
                title="Visualizar campo selecionado"
              >
                <Eye size={14} />
                Visualizar
              </button>
            </>
          )}
          <div className="h-6 w-px bg-[#dadee6] mx-2" />
          <button
            onClick={handleCreate}
            className="group flex items-center justify-center transition-colors bg-transparent hover:bg-[#487eda] hover:border-[#487eda]"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: '#dadee6'
            }}
            title="Criar novo campo"
          >
            <AddCircleRoundedIcon
              style={{ fontSize: 18 }}
              className="text-[#1d5cc6] group-hover:text-white"
            />
          </button>
        </div>
        
        {loading && (
          <div className="text-xs text-gray-500">
            Carregando...
          </div>
        )}
      </div>
    </div>
  )
}

