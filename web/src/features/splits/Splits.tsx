import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Settings, Check, Pencil, Trash2, ChevronDown, ChevronRight, QrCode, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { splitsApi, Split } from '../../services/api'
import ConfiguracionSplits from './ConfiguracionSplits'
import EditarSplitModal from './EditarSplitModal'

const tipoBadgeColor: Record<string, string> = {
  ahorro: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  corriente: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  virtual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  fisica: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
}

export default function Splits() {
  const queryClient = useQueryClient()
  const [showConfig, setShowConfig] = useState(false)
  const [editingSplit, setEditingSplit] = useState<Split | null>(null)
  const [qrSplit, setQrSplit] = useState<Split | null>(null)
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set())

  const { data: splitsData, isLoading } = useQuery({
    queryKey: ['splits'],
    queryFn: () => splitsApi.getAll().then(r => r.data),
  })

  const toggleRealizado = useMutation({
    mutationFn: ({ id, realizado }: { id: number; realizado: boolean }) =>
      splitsApi.marcarRealizado(id, realizado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
    },
  })

  const deleteSplit = useMutation({
    mutationFn: (id: number) => splitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] })
      toast.success('Split eliminado')
    },
    onError: () => toast.error('Error al eliminar split'),
  })

  const splits = useMemo(() => splitsData?.data || [], [splitsData])

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Split[]> = {}
    for (const split of splits) {
      const month = split.ingreso_fecha_pago.substring(0, 7)
      if (!groups[month]) groups[month] = []
      groups[month].push(split)
    }
    for (const month of Object.keys(groups)) {
      groups[month].sort((a, b) => b.ingreso_id - a.ingreso_id)
    }
    return groups
  }, [splits])

  const sortedMonths = useMemo(() => Object.keys(groupedByMonth).sort().reverse(), [groupedByMonth])

  const toggleMonth = (month: string) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-')
    const date = new Date(parseInt(year), parseInt(m) - 1, 1)
    return format(date, 'MMMM yyyy', { locale: es })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Cargando splits...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Splits</h2>
          <p className="text-gray-500 dark:text-gray-400">Reparto de ingresos en cuentas</p>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuración
        </button>
      </div>

      {splits.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay splits registrados</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Los splits se generan automáticamente al crear ingresos
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedMonths.map(month => {
            const monthSplits = groupedByMonth[month]
            const isCollapsed = collapsedMonths.has(month)
            const totalMonto = monthSplits.reduce((sum, s) => sum + s.monto_enteros, 0)
            const realizados = monthSplits.filter(s => s.realizado).length

            return (
              <div key={month} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleMonth(month)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {formatMonth(month)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({monthSplits.length} splits, {realizados} realizados)
                    </span>
                  </div>
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {(totalMonto / 100).toFixed(2)} BOB
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ingreso</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta</th>
                          <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {monthSplits.map(split => (
                          <tr key={split.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-900 dark:text-white">
                                #{split.ingreso_id}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {split.ingreso_fecha_pago}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-900 dark:text-white">{split.cuenta_alias}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeColor[split.cuenta_tipo] || ''}`}>
                                  {split.cuenta_tipo}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {split.porcentaje}%
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                              {split.monto_display}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {split.realizado ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <Check className="w-3 h-3" />
                                  {split.fecha_realizado ? format(parseISO(split.fecha_realizado), 'dd/MM/yy') : ''}
                                </span>
                              ) : (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => toggleRealizado.mutate({ id: split.id, realizado: !split.realizado })}
                                  disabled={split.realizado}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    split.realizado
                                      ? 'text-green-600 opacity-50 cursor-not-allowed'
                                      : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title={split.realizado && split.fecha_realizado
                                    ? `Realizado el ${format(parseISO(split.fecha_realizado), "dd/MM/yyyy 'a las' HH:mm")}`
                                    : 'Marcar como realizado'
                                  }
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                {split.qr_ruta && (
                                  <button
                                    onClick={() => setQrSplit(split)}
                                    className="p-1.5 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                                    title="Ver QR"
                                  >
                                    <QrCode className="w-4 h-4" />
                                  </button>
                                )}
                                {!split.realizado && (
                                  <>
                                    <button
                                      onClick={() => setEditingSplit(split)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('¿Eliminar este split?')) {
                                          deleteSplit.mutate(split.id)
                                        }
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
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

      {showConfig && <ConfiguracionSplits onClose={() => setShowConfig(false)} />}
      {editingSplit && <EditarSplitModal split={editingSplit} onClose={() => setEditingSplit(null)} />}
      {qrSplit && <QrModal split={qrSplit} onClose={() => setQrSplit(null)} />}
    </div>
  )
}

function QrModal({ split, onClose }: { split: Split; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR — {split.cuenta_alias}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <img
            src={`/uploads/${split.qr_ruta}`}
            alt={`QR ${split.cuenta_alias}`}
            className="w-[650px] h-[650px] object-contain rounded-lg border border-gray-200 dark:border-gray-600"
          />
          <div className="text-center">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tipoBadgeColor[split.cuenta_tipo] || ''}`}>
              {split.cuenta_tipo}
            </span>
          </div>
          <div className="w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monto a transferir</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{split.monto_display}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
