import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { cuentasApi, Cuenta } from '../../services/api'
import CuentaModal from './CuentaModal'

const tipoBadgeColor: Record<string, string> = {
  ahorro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  corriente: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  virtual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  fisica: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function CuentasTab() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null)

  const { data: cuentasData, isLoading } = useQuery({
    queryKey: ['cuentas'],
    queryFn: () => cuentasApi.getAll().then(r => r.data),
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

  const cuentas = cuentasData?.data || []

  const handleDelete = (cuentaId: number) => {
    if (confirm('¿Eliminar esta cuenta? Los splits pendientes se eliminarán.')) {
      deleteCuenta.mutate(cuentaId)
    }
  }

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['cuentas'] })
    queryClient.invalidateQueries({ queryKey: ['splits', 'config'] })
    queryClient.invalidateQueries({ queryKey: ['splits'] })
    setShowModal(false)
    setEditingCuenta(null)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cuentas</h3>
        <button
          onClick={() => { setEditingCuenta(null); setShowModal(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva cuenta
        </button>
      </div>

      {cuentas.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay cuentas registradas
        </div>
      ) : (
        <div className="space-y-2">
          {cuentas.map(cuenta => (
            <div key={cuenta.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{cuenta.alias}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeColor[cuenta.tipo] || ''}`}>
                    {cuenta.tipo}
                  </span>
                </div>
                {cuenta.banco && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{cuenta.banco}</span>
                )}
              </div>
              <button
                onClick={() => { setEditingCuenta(cuenta); setShowModal(true) }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(cuenta.id)}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CuentaModal
          cuenta={editingCuenta}
          onClose={() => { setShowModal(false); setEditingCuenta(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
