import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { OcrReceiptData } from '../../services/ocrService'

interface OcrConfirmationProps {
  data: OcrReceiptData
  imagenPreview: string
  fuentesList: { id: number; nombre: string }[]
  onConfirm: (data: {
    monto: string
    fechaPago: string
    fechasTrabajo: string[]
    comentario: string
    fuenteId: number | null
  }) => void
  onCancel: () => void
}

export default function OcrConfirmationModal({ data, imagenPreview, fuentesList, onConfirm, onCancel }: OcrConfirmationProps) {
  const [monto, setMonto] = useState(data.monto?.toString() || '')
  const [fechaPago, setFechaPago] = useState(data.fechaPago || '')
  const [fechasTrabajo, setFechasTrabajo] = useState<string[]>(data.fechasTrabajo)
  const [comentario, setComentario] = useState(data.referencia || '')
  const [fuenteId, setFuenteId] = useState<number | null>(null)
  const [newDate, setNewDate] = useState('')

  const addDate = () => {
    if (newDate && !fechasTrabajo.includes(newDate)) {
      setFechasTrabajo(prev => [...prev, newDate].sort())
      setNewDate('')
    }
  }

  const removeDate = (date: string) => {
    setFechasTrabajo(prev => prev.filter(d => d !== date))
  }

  const handleConfirm = () => {
    onConfirm({
      monto,
      fechaPago,
      fechasTrabajo,
      comentario,
      fuenteId,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comprobante detectado
              </h3>
            </div>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Verifica los datos extraídos del comprobante
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <img src={imagenPreview} alt="Comprobante" className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-600" />
          </div>

          {/* Fechas de trabajo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fechas de trabajo ({fechasTrabajo.length})
            </label>
            <div className="space-y-1">
              {fechasTrabajo.map(date => {
                const d = new Date(date + 'T00:00:00')
                return (
                  <div key={date} className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {format(d, 'dd/MM/yyyy (EEEE)', { locale: es })}
                    </span>
                    <button onClick={() => removeDate(date)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={addDate}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Fecha de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de pago
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={e => setFechaPago(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto (BOB)
            </label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Fuente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuente
            </label>
            <select
              value={fuenteId ?? ''}
              onChange={e => setFuenteId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Sin fuente</option>
              {fuentesList.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Comentario
            </label>
            <input
              type="text"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Raw text (collapsible) */}
          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Ver texto OCR original
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
              {data.rawText}
            </pre>
          </details>

          {/* Warning if no data extracted */}
          {(!data.monto && !data.fechaPago && fechasTrabajo.length === 0) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                No se pudieron extraer datos del comprobante. Puedes ingresar los datos manualmente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={fechasTrabajo.length === 0 || !monto || !fechaPago}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
          >
            Aceptar y registrar
          </button>
        </div>
      </div>
    </div>
  )
}
