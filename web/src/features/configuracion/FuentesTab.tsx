import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { fuentesApi, Fuente, CreateFuenteRequest } from '../../services/api'

export default function FuentesTab() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingFuente, setEditingFuente] = useState<Fuente | null>(null)

  const { data: fuentesData, isLoading } = useQuery({
    queryKey: ['fuentes'],
    queryFn: () => fuentesApi.getAll(),
  })

  const deleteFuente = useMutation({
    mutationFn: (id: number) => fuentesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuentes'] })
      toast.success('Fuente eliminada')
    },
    onError: () => toast.error('Error al eliminar fuente'),
  })

  const fuentes = fuentesData?.data?.data || []

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar esta fuente de ingreso?')) {
      deleteFuente.mutate(id)
    }
  }

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['fuentes'] })
    setShowModal(false)
    setEditingFuente(null)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fuentes de ingreso</h3>
        <button
          onClick={() => { setEditingFuente(null); setShowModal(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva fuente
        </button>
      </div>

      {fuentes.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay fuentes registradas
        </div>
      ) : (
        <div className="space-y-2">
          {fuentes.map(fuente => (
            <div key={fuente.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: fuente.color || '#6366f1' }}
              />
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{fuente.nombre}</span>
              </div>
              <button
                onClick={() => { setEditingFuente(fuente); setShowModal(true) }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(fuente.id)}
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
        <FuenteModal
          fuente={editingFuente}
          onClose={() => { setShowModal(false); setEditingFuente(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function FuenteModal({ fuente, onClose, onSaved }: {
  fuente: Fuente | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(fuente?.nombre || '')
  const [color, setColor] = useState(fuente?.color || '#6366f1')

  const createMutation = useMutation({
    mutationFn: (data: CreateFuenteRequest) => fuentesApi.create(data),
    onSuccess: () => onSaved(),
    onError: () => toast.error('Error al crear fuente'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateFuenteRequest> }) =>
      fuentesApi.update(id, data),
    onSuccess: () => onSaved(),
    onError: () => toast.error('Error al actualizar fuente'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    const data: CreateFuenteRequest = { nombre: nombre.trim(), color }

    if (fuente) {
      updateMutation.mutate({ id: fuente.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {fuente ? 'Editar Fuente' : 'Nueva Fuente'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Quipus"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
