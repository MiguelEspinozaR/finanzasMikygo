import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, GripVertical, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { splitsApi, cuentasApi, SplitConfig, Cuenta } from '../../services/api'
import CuentaModal from './CuentaModal'

const tipoBadgeColor: Record<string, string> = {
  ahorro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  corriente: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  virtual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  fisica: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

interface Props {
  onClose: () => void
}

export default function ConfiguracionSplits({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [showCuentaModal, setShowCuentaModal] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null)
  const [aplicarAPendientes, setAplicarAPendientes] = useState(false)

  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ['splits', 'config'],
    queryFn: () => splitsApi.getConfig().then(r => r.data),
  })

  const { data: cuentasData } = useQuery({
    queryKey: ['cuentas'],
    queryFn: () => cuentasApi.getAll().then(r => r.data),
  })

  const updateConfig = useMutation({
    mutationFn: splitsApi.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      queryClient.invalidateQueries({ queryKey: ['splits', 'config'] })
      toast.success('Configuración actualizada')
      onClose()
    },
    onError: () => toast.error('Error al actualizar configuración'),
  })

  const deleteCuenta = useMutation({
    mutationFn: (id: number) => cuentasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cuentas'] })
      queryClient.invalidateQueries({ queryKey: ['splits', 'config'] })
      toast.success('Cuenta eliminada')
    },
    onError: () => toast.error('Error al eliminar cuenta'),
  })

  const configs = configData?.data || []

  const [localConfigs, setLocalConfigs] = useState<SplitConfig[]>([])

  const displayConfigs = localConfigs.length > 0 ? localConfigs : configs

  const totalPorcentaje = displayConfigs.reduce((sum, c) => sum + c.porcentaje, 0)
  const generalPorcentaje = Math.max(0, 100 - totalPorcentaje)

  const handlePorcentajeChange = (cuentaId: number, value: number) => {
    setLocalConfigs(prev => {
      const existing = prev.length > 0 ? prev : configs
      return existing.map(c =>
        c.cuenta_id === cuentaId ? { ...c, porcentaje: value } : c
      )
    })
  }

  const handleSave = () => {
    const configuraciones = displayConfigs.map(c => ({
      cuenta_id: c.cuenta_id,
      porcentaje: c.porcentaje,
      aplicar_a_pendientes: aplicarAPendientes,
    }))
    updateConfig.mutate({ configuraciones })
  }

  const handleDeleteCuenta = (cuentaId: number) => {
    if (confirm('¿Eliminar esta cuenta? Los splits pendientes se eliminarán.')) {
      deleteCuenta.mutate(cuentaId)
    }
  }

  const handleCuentaCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['cuentas'] })
    queryClient.invalidateQueries({ queryKey: ['splits', 'config'] })
    queryClient.invalidateQueries({ queryKey: ['splits'] })
    setShowCuentaModal(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de Splits
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingConfig ? (
            <div className="text-center py-8 text-gray-500">Cargando...</div>
          ) : (
            <>
              <div className="space-y-3">
                {displayConfigs.map(config => {
                  const cuenta = cuentasData?.find(c => c.id === config.cuenta_id)
                  return (
                    <div key={config.cuenta_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-move" />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{config.cuenta_alias}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeColor[config.cuenta_tipo] || ''}`}>
                          {config.cuenta_tipo}
                        </span>
                        <button
                          onClick={() => {
                            setEditingCuenta(cuenta || null)
                            setShowCuentaModal(true)
                          }}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={config.porcentaje}
                          onChange={(e) => handlePorcentajeChange(config.cuenta_id, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCuenta(config.cuenta_id)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  General (remainder)
                </span>
                <span className="text-sm font-mono text-blue-800 dark:text-blue-300">
                  {generalPorcentaje.toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aplicarPendientes"
                  checked={aplicarAPendientes}
                  onChange={(e) => setAplicarAPendientes(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="aplicarPendientes" className="text-sm text-gray-700 dark:text-gray-300">
                  Aplicar cambios a splits pendientes
                </label>
              </div>

              <button
                onClick={() => {
                  setEditingCuenta(null)
                  setShowCuentaModal(true)
                }}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-4 h-4" />
                Agregar cuenta
              </button>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateConfig.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {updateConfig.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {showCuentaModal && (
        <CuentaModal
          cuenta={editingCuenta}
          onClose={() => setShowCuentaModal(false)}
          onSaved={handleCuentaCreated}
        />
      )}
    </div>
  )
}
