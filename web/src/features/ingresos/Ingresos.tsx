import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2, ChevronDown, ChevronRight, Camera, Eye, X, PieChart } from 'lucide-react'
import toast from 'react-hot-toast'
import { ingresosApi, splitsApi, Ingreso } from '../../services/api'

export default function Ingresos() {
  const queryClient = useQueryClient()
  const [tipoFilter, setTipoFilter] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [editingGroup, setEditingGroup] = useState<Ingreso[] | null>(null)
  const [detailsIngreso, setDetailsIngreso] = useState<Ingreso | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
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

  const { data: ingresosConSplitsData } = useQuery({
    queryKey: ['splits', 'ingresos-con-splits'],
    queryFn: () => splitsApi.getIngresosConSplits().then(r => r.data),
  })

  const ingresosConSplits = useMemo(() => {
    return new Set(ingresosConSplitsData?.data || [])
  }, [ingresosConSplitsData])

  const generarSplitsMutation = useMutation({
    mutationFn: (ingresoId: number) => splitsApi.generarPorIngreso(ingresoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      toast.success('Splits generados')
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Error al generar splits'
      toast.error(msg)
    },
  })

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

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar este ingreso?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (ingreso: Ingreso) => {
    const group = ingresos.filter(i => i.fecha_pago === ingreso.fecha_pago)
    setEditingGroup(group)
  }

  const toggleYear = (year: number) => {
    setCollapsedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  const handleSaveGroup = async (edits: Map<number, { monto_enteros: number; comentario: string; imagenFile: File | null }>, sharedFechaPago: string) => {
    try {
      for (const [id, data] of edits) {
        await ingresosApi.update(id, {
          fecha_pago: sharedFechaPago,
          monto_enteros: data.monto_enteros,
          comentario: data.comentario,
        })
        if (data.imagenFile) {
          await ingresosApi.upload(data.imagenFile, id)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      setEditingGroup(null)
      toast.success(`${edits.size} ingreso(s) actualizado(s)`)
    } catch {
      toast.error('Error al guardar')
    }
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
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((ing, idx) => {
                          const showDate = idx === 0 || items[idx - 1].fecha_pago !== ing.fecha_pago
                          const groupCount = items.filter(i => i.fecha_pago === ing.fecha_pago).length
                          const isLastInGroup = idx === items.length - 1 || items[idx + 1].fecha_pago !== ing.fecha_pago
                          const groupMonto = groupCount > 1 ? items.filter(i => i.fecha_pago === ing.fecha_pago).reduce((sum, i) => sum + i.monto_enteros, 0) : 0
                          return (
                            <>
                            <tr key={ing.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${groupCount > 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{ing.id}</td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {showDate ? (
                                  <span>
                                    {format(new Date(ing.fecha_pago.replace('T00:00:00Z', 'T00:00:00')), 'dd/MM/yyyy')}
                                    {groupCount > 1 && (
                                      <span className="ml-1 text-xs text-gray-400">({groupCount})</span>
                                    )}
                                  </span>
                                ) : ''}
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
                              <td className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setDetailsIngreso(ing)}
                                    className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                                    title="Detalles"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(ing)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {!ingresosConSplits.has(ing.id) && (
                                    <button
                                      onClick={() => generarSplitsMutation.mutate(ing.id)}
                                      className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded"
                                      title="Agregar a splits"
                                    >
                                      <PieChart className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(ing.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isLastInGroup && groupCount > 1 && (
                              <tr className="bg-gray-100 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                                <td colSpan={3} className="px-4 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                                  Subtotal ({groupCount} ingresos)
                                </td>
                                <td className="px-4 py-1.5 text-sm font-semibold text-green-700 dark:text-green-300">
                                  {(groupMonto / 100).toFixed(2)} BOB
                                </td>
                                <td colSpan={2}></td>
                              </tr>
                            )}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSave={handleSaveGroup}
        />
      )}

      {/* Details Modal */}
      {detailsIngreso && (
        <DetallesModal
          ingreso={detailsIngreso}
          onClose={() => setDetailsIngreso(null)}
          onImageClick={(src) => setLightboxImage(src)}
        />
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            alt="Comprobante"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function EditGroupModal({ group, onClose, onSave }: {
  group: Ingreso[]
  onClose: () => void
  onSave: (edits: Map<number, { monto_enteros: number; comentario: string; imagenFile: File | null }>, sharedFechaPago: string) => void
}) {
  const sharedDate = group[0].fecha_pago.replace('T00:00:00Z', '').split('T')[0]
  const [fechaPago, setFechaPago] = useState(sharedDate)
  const [isSaving, setIsSaving] = useState(false)

  // Individual state per ingreso
  const [edits, setEdits] = useState<Map<number, {
    monto: string
    comentario: string
    imagenFile: File | null
    imagenPreview: string | null
  }>>(() => {
    const map = new Map()
    for (const ing of group) {
      map.set(ing.id, {
        monto: (ing.monto_enteros / 100).toString(),
        comentario: ing.comentario || '',
        imagenFile: null,
        imagenPreview: null,
      })
    }
    return map
  })

  const updateField = (id: number, field: string, value: any) => {
    setEdits(prev => {
      const next = new Map(prev)
      const current = next.get(id)!
      next.set(id, { ...current, [field]: value })
      return next
    })
  }

  const handleImageSelect = (id: number, file: File) => {
    const url = URL.createObjectURL(file)
    updateField(id, 'imagenFile', file)
    updateField(id, 'imagenPreview', url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const payload = new Map<number, { monto_enteros: number; comentario: string; imagenFile: File | null }>()
    for (const [id, data] of edits) {
      const montoBOB = parseFloat(data.monto)
      if (isNaN(montoBOB) || montoBOB <= 0) {
        toast.error(`Monto inválido en ingreso #${id}`)
        setIsSaving(false)
        return
      }
      payload.set(id, {
        monto_enteros: Math.round(montoBOB * 100),
        comentario: data.comentario,
        imagenFile: data.imagenFile,
      })
    }

    await onSave(payload, fechaPago)
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar Ingresos — {group.length} registro{group.length > 1 ? 's' : ''}
            </h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Pago (compartida)</label>
              <input
                type="date"
                value={fechaPago}
                onChange={e => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Ingresos list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {group.map(ing => {
              const data = edits.get(ing.id)!
              return (
                <div key={ing.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ingreso #{ing.id}
                      <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        ing.tipo === 'qr'
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      }`}>
                        {ing.tipo === 'qr' ? 'QR' : 'Efectivo'}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">
                      {ing.fechas_trabajo?.length || 0} día(s) trabajo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Monto */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monto (BOB)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={data.monto}
                        onChange={e => updateField(ing.id, 'monto', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        required
                      />
                    </div>

                    {/* Imagen */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Imagen</label>
                      {data.imagenPreview ? (
                        <div className="flex items-center gap-2">
                          <img src={data.imagenPreview} className="h-10 w-10 object-cover rounded" alt="" />
                          <button
                            type="button"
                            onClick={() => { updateField(ing.id, 'imagenFile', null); updateField(ing.id, 'imagenPreview', null) }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : ing.imagen_ruta ? (
                        <div className="flex items-center gap-2">
                          <img src={ing.imagen_ruta} className="h-10 w-10 object-cover rounded" alt="" />
                          <span className="text-xs text-gray-400">Existente</span>
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-gray-500 dark:text-gray-400">
                          <Camera className="w-4 h-4" />
                          <span>+ Imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleImageSelect(ing.id, file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Comentario */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario</label>
                    <input
                      type="text"
                      value={data.comentario}
                      onChange={e => updateField(ing.id, 'comentario', e.target.value)}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
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
              {isSaving ? 'Guardando...' : `Guardar ${group.length} ingreso(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DetallesModal({ ingreso, onClose, onImageClick }: {
  ingreso: Ingreso
  onClose: () => void
  onImageClick: (src: string) => void
}) {
  const fechaPagoDate = new Date(ingreso.fecha_pago.replace('T00:00:00Z', 'T00:00:00'))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Detalles — Ingreso #{ingreso.id}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              ingreso.tipo === 'qr'
                ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
            }`}>
              {ingreso.tipo === 'qr' ? 'QR' : 'Efectivo'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Pago: {format(fechaPagoDate, 'dd/MM/yyyy')}</span>
            <span className="font-medium text-green-600 dark:text-green-400">{ingreso.monto_display}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Work days list */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Días trabajados ({ingreso.fechas_trabajo?.length || 0})
            </h4>
            <div className="space-y-1">
              {(ingreso.fechas_trabajo || []).map(ft => {
                const fecha = new Date(ft.fecha.replace('T00:00:00Z', 'T00:00:00'))
                return (
                  <div key={ft.fecha} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{format(fecha, 'dd/MM/yyyy (EEEE)', { locale: es })}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{ft.monto_display}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comentario */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ingreso.comentario || 'Ingreso sin comentarios'}</p>
          </div>

          {/* Image */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comprobante</h4>
            {ingreso.imagen_ruta ? (
              <button
                onClick={() => onImageClick(ingreso.imagen_ruta!)}
                className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
              >
                <img src={ingreso.imagen_ruta} className="max-h-48 object-contain" alt="Comprobante" />
              </button>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">Ingreso sin comprobante</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
