import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { ingresosApi, Ingreso } from '../../services/api'

export default function Ingresos() {
  const queryClient = useQueryClient()
  const [tipoFilter, setTipoFilter] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [editingIngreso, setEditingIngreso] = useState<Ingreso | null>(null)
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  const { data: response, isLoading } = useQuery({
    queryKey: ['ingresos', 'all', tipoFilter, fechaInicio, fechaFin],
    queryFn: () => {
      const params: Record<string, string | number> = { page: 1, page_size: 1000 }
      if (tipoFilter) params.tipo = tipoFilter
      if (fechaInicio) params.fecha_inicio = fechaInicio
      if (fechaFin) params.fecha_fin = fechaFin
      return ingresosApi.getAll(params).then(r => r.data)
    },
  })

  const ingresos = response?.data || []

  const groupedByYear = useMemo(() => {
    const map = new Map<number, Ingreso[]>()
    for (const ing of ingresos) {
      const year = new Date(ing.fecha_pago.replace('T00:00:00Z', 'T00:00:00')).getFullYear()
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(ing)
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [ingresos])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ingresosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      toast.success('Ingreso eliminado')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { monto_enteros: number; tipo: 'qr' | 'efectivo'; comentario: string } }) =>
      ingresosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      setEditingIngreso(null)
      toast.success('Ingreso actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este ingreso?')) {
      deleteMutation.mutate(id)
    }
  }

  const toggleYear = (year: number) => {
    setCollapsedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ingresos</h2>
        <p className="text-gray-500 dark:text-gray-400">{ingresos.length} registros</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="qr">QR</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => { setTipoFilter(''); setFechaInicio(''); setFechaFin('') }}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          Cargando...
        </div>
      ) : groupedByYear.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No hay ingresos registrados
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByYear.map(([year, items]) => {
            const collapsed = collapsedYears.has(year)
            const yearTotal = items.reduce((sum, i) => sum + i.monto_enteros, 0)
            const yearTotalBOB = (yearTotal / 100).toFixed(2)

            return (
              <div key={year} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Year header */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="font-semibold text-gray-900 dark:text-white">{year}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({items.length} ingresos)</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">{yearTotalBOB} BOB</span>
                </button>

                {/* Table */}
                {!collapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/30">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Pago</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Días Trabajo</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comentario</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map(ing => (
                          <tr key={ing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ing.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {format(new Date(ing.fecha_pago.replace('T00:00:00Z', 'T00:00:00')), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {ing.fechas_trabajo?.filter(Boolean).map(f => {
                                  const fecha = new Date(f.fecha.replace('T00:00:00Z', 'T00:00:00'))
                                  const dia = fecha.getDate()
                                  const mes = fecha.getMonth() + 1
                                  const monto = f.monto_display ? f.monto_display.replace(' BOB', '') : '?'
                                  return (
                                    <span key={f.fecha} className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded" title={`${monto} BOB`}>
                                      {dia}/{mes} ({monto})
                                    </span>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                              {ing.monto_display}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                ing.tipo === 'qr'
                                  ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                              }`}>
                                {ing.tipo === 'qr' ? 'QR' : 'Efectivo'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                              {ing.comentario || '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingIngreso(ing)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(ing.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingIngreso && (
        <EditModal
          ingreso={editingIngreso}
          onClose={() => setEditingIngreso(null)}
          onSave={(data) => updateMutation.mutate({ id: editingIngreso.id, data })}
          isSaving={updateMutation.isPending}
        />
      )}
    </div>
  )
}

function EditModal({ ingreso, onClose, onSave, isSaving }: {
  ingreso: Ingreso
  onClose: () => void
  onSave: (data: { monto_enteros: number; tipo: 'qr' | 'efectivo'; comentario: string }) => void
  isSaving: boolean
}) {
  const [monto, setMonto] = useState((ingreso.monto_enteros / 100).toString())
  const [tipo, setTipo] = useState<'qr' | 'efectivo'>(ingreso.tipo)
  const [comentario, setComentario] = useState(ingreso.comentario || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const montoBOB = parseFloat(monto)
    if (isNaN(montoBOB) || montoBOB <= 0) {
      toast.error('Monto inválido')
      return
    }
    onSave({
      monto_enteros: Math.round(montoBOB * 100),
      tipo,
      comentario,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar Ingreso #{ingreso.id}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto (BOB)</label>
              <input
                type="number"
                step="0.01"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'qr' | 'efectivo')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="qr">QR</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario</label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
