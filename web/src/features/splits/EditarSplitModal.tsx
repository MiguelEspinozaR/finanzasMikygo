import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { splitsApi, Split } from '../../services/api'

interface Props {
  split: Split
  onClose: () => void
}

export default function EditarSplitModal({ split, onClose }: Props) {
  const queryClient = useQueryClient()
  const [monto, setMonto] = useState((split.monto_enteros / 100).toFixed(2))

  const updateMutation = useMutation({
    mutationFn: ({ id, montoEnteros }: { id: number; montoEnteros: number }) =>
      splitsApi.updateMonto(id, montoEnteros),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      toast.success('Split actualizado')
      onClose()
    },
    onError: () => toast.error('Error al actualizar split'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum < 0) {
      toast.error('Monto inválido')
      return
    }
    const montoEnteros = Math.floor(montoNum * 100)
    updateMutation.mutate({ id: split.id, montoEnteros })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Editar Split
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ingreso:</span>
              <span className="text-gray-900 dark:text-white">#{split.ingreso_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cuenta:</span>
              <span className="text-gray-900 dark:text-white">{split.cuenta_alias}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Porcentaje:</span>
              <span className="text-gray-900 dark:text-white">{split.porcentaje}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto (BOB)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </form>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
