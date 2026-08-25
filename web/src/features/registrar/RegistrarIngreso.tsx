import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Briefcase, CreditCard, X, CheckCircle, Upload, Trash2, Plus, List } from 'lucide-react'
import toast from 'react-hot-toast'
import { ingresosApi, fuentesApi } from '../../services/api'
import { recognizeReceipt, OcrReceiptData } from '../../services/ocrService'
import OcrConfirmationModal from './OcrConfirmationModal'

type Tool = 'trabajo' | 'pago' | 'quitar'

interface QueueItem {
  id: number
  fuente_id: number | null
  monto: string
  tipo: 'qr' | 'efectivo'
}

export default function RegistrarIngreso() {
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeTool, setActiveTool] = useState<Tool>('trabajo')
  const [selectedWorkDays, setSelectedWorkDays] = useState<string[]>([])
  const [selectedPaymentDay, setSelectedPaymentDay] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [tipo, setTipo] = useState<'qr' | 'efectivo'>('qr')
  const [comentario, setComentario] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [ocrResult, setOcrResult] = useState<OcrReceiptData | null>(null)
  const [showOcrModal, setShowOcrModal] = useState(false)
  const [isOcrProcessing, setIsOcrProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [fuenteId, setFuenteId] = useState<number | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [nextQueueId, setNextQueueId] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const ocrTriggeredRef = useRef(false)

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const { data: fechasOcupadas } = useQuery({
    queryKey: ['fechasOcupadas', month, year],
    queryFn: () => ingresosApi.getFechasOcupadas(month, year),
  })

  const { data: fuentes } = useQuery({
    queryKey: ['fuentes'],
    queryFn: () => fuentesApi.getAll(),
  })

  const fuentesList = fuentes?.data?.data || []

  const resetForm = () => {
    setMonto('')
    setComentario('')
    setImagen(null)
    setImagenPreview(null)
    setFuenteId(null)
  }

  const resetAll = () => {
    setSelectedWorkDays([])
    setSelectedPaymentDay(null)
    setQueue([])
    resetForm()
  }

  const addToQueue = () => {
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setQueue(prev => [...prev, {
      id: nextQueueId,
      fuente_id: fuenteId,
      monto,
      tipo,
    }])
    setNextQueueId(n => n + 1)
    setMonto('')
    setFuenteId(null)
    toast.success('Agregado a la lista')
  }

  const removeFromQueue = (id: number) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  const getDaysInMonth = useCallback(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')

    if (activeTool === 'trabajo') {
      setSelectedWorkDays(prev =>
        prev.includes(dateStr)
          ? prev.filter(d => d !== dateStr)
          : [...prev, dateStr]
      )
    } else if (activeTool === 'pago') {
      setSelectedPaymentDay(prev => prev === dateStr ? null : dateStr)
    } else if (activeTool === 'quitar') {
      setSelectedWorkDays(prev => prev.filter(d => d !== dateStr))
      if (selectedPaymentDay === dateStr) setSelectedPaymentDay(null)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImagen(file)
      const reader = new FileReader()
      reader.onload = () => setImagenPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImagen(file)
      const reader = new FileReader()
      reader.onload = () => setImagenPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      toast.error('Solo se permiten archivos de imagen')
    }
  }

  const removeImage = () => {
    setImagen(null)
    setImagenPreview(null)
    setOcrResult(null)
    setShowOcrModal(false)
    ocrTriggeredRef.current = false
  }

  useEffect(() => {
    if (!imagenPreview || ocrTriggeredRef.current) return
    ocrTriggeredRef.current = true
    setIsOcrProcessing(true)
    setOcrProgress(0)
    recognizeReceipt(imagenPreview, setOcrProgress)
      .then(result => {
        setOcrResult(result)
        setShowOcrModal(true)
      })
      .catch(() => {
        toast.error('No se pudo leer el comprobante')
      })
      .finally(() => {
        setIsOcrProcessing(false)
      })
  }, [imagenPreview])

  const handleOcrConfirm = (data: { monto: string; fechaPago: string; fechasTrabajo: string[]; comentario: string }) => {
    setMonto(data.monto)
    setSelectedPaymentDay(data.fechaPago)
    setSelectedWorkDays(data.fechasTrabajo)
    setComentario(data.comentario)
    setShowOcrModal(false)
    toast.success('Datos del comprobante aplicados')
  }

  const handleOcrCancel = () => {
    setShowOcrModal(false)
  }

  const handleSubmit = async () => {
    if (selectedWorkDays.length === 0) {
      toast.error('Selecciona al menos un día de trabajo')
      return
    }
    if (!selectedPaymentDay) {
      toast.error('Selecciona un día de pago')
      return
    }
    if (queue.length === 0) {
      toast.error('Agrega al menos un ingreso a la lista')
      return
    }

    setIsSubmitting(true)
    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i]
        const montoEnteros = Math.round(parseFloat(item.monto) * 100)
        const response = await ingresosApi.create({
          fecha_pago: selectedPaymentDay,
          monto_enteros: montoEnteros,
          tipo: item.tipo,
          comentario: comentario || undefined,
          fuente_id: item.fuente_id,
          fechas_trabajo: selectedWorkDays.sort().map(f => ({ fecha: f })),
        })
        if (i === 0 && imagen) {
          await ingresosApi.upload(imagen, response.data.id)
        }
      }
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      queryClient.invalidateQueries({ queryKey: ['fechasOcupadas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`${queue.length} ingreso(s) registrado(s)`)
      resetAll()
    } catch (error) {
      toast.error('Error al registrar ingresos')
    } finally {
      setIsSubmitting(false)
    }
  }

  const days = getDaysInMonth()
  const firstDayOfWeek = startOfMonth(currentDate).getDay()

  const getDayClass = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const ocupada = fechasOcupadas?.data?.[dateStr] || []
    const isSelectedWork = selectedWorkDays.includes(dateStr)
    const isSelectedPayment = selectedPaymentDay === dateStr

    const hasTrabajo = ocupada.includes('trabajo')
    const hasPago = ocupada.includes('pago')

    if (hasTrabajo && hasPago) return 'bg-blue-200 dark:bg-blue-800 border-2 border-green-500 text-blue-800 dark:text-blue-200'
    if (hasTrabajo) return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
    if (hasPago) return activeTool === 'trabajo' ? 'border-2 border-green-500 text-green-600 dark:text-green-400 cursor-not-allowed' : 'border-2 border-green-500 text-green-600 dark:text-green-400'

    if (isSelectedWork && isSelectedPayment) return 'bg-green-500 text-white border-2 border-blue-500'
    if (isSelectedWork) return 'border-2 border-blue-500 text-blue-600 dark:text-blue-400'
    if (isSelectedPayment) return 'bg-green-500 text-white'

    return 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
  }

  const tools = [
    { id: 'trabajo' as Tool, label: 'Trabajo', icon: Briefcase, color: 'blue' },
    { id: 'pago' as Tool, label: 'Pago', icon: CreditCard, color: 'green' },
    { id: 'quitar' as Tool, label: 'Quitar', icon: X, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registrar Ingreso</h2>
        <p className="text-gray-500 dark:text-gray-400">Selecciona los días de trabajo y pago en el calendario</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          {/* Tool Selector */}
          <div className="flex gap-2 mb-6">
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTool === tool.id
                    ? tool.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : tool.color === 'green'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <tool.icon className="w-4 h-4" />
                {tool.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Trabajo (seleccionado)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Pago (seleccionado)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border-2 border-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Trabajo + Pago</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Trabajo (registrado)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Pago (registrado)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 border-2 border-green-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Trabajo + Pago (registrado)</span>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDayClick(date)}
                disabled={activeTool === 'trabajo' && (fechasOcupadas?.data?.[format(date, 'yyyy-MM-dd')] || []).includes('pago')}
                className={`aspect-square p-2 rounded-lg text-sm font-medium transition-all ${getDayClass(date)}`}
              >
                {format(date, 'd')}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Datos del Ingreso</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Días seleccionados
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedWorkDays.length > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    {selectedWorkDays.length} día(s) de trabajo
                  </span>
                ) : (
                  'Ningún día seleccionado'
                )}
                {selectedPaymentDay && (
                  <span className="text-green-600 dark:text-green-400 ml-2">
                    · Pago: {format(new Date(selectedPaymentDay + 'T00:00:00'), 'dd/MM')}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de ingreso
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'qr' | 'efectivo')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="qr">QR</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fuente de ingreso
              </label>
              <select
                value={fuenteId ?? ''}
                onChange={e => setFuenteId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sin fuente</option>
                {fuentesList.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto (BOB)
              </label>
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Imagen del comprobante (opcional)
              </label>
              {imagenPreview ? (
                <div className="relative">
                  <img src={imagenPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isOcrProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                      <div className="text-white text-sm mb-2">Leyendo comprobante...</div>
                      <div className="w-3/4 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                      <div className="text-white text-xs mt-1">{ocrProgress}%</div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input-registrar')?.click()}
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                  }`}
                >
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </span>
                  <input
                    id="file-input-registrar"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <button
              onClick={addToQueue}
              disabled={!monto || parseFloat(monto) <= 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar a la lista
            </button>

            {/* Queue */}
            {queue.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Cola: {queue.length} ingreso(s)
                  </p>
                  <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                    {queue.reduce((sum, item) => sum + parseFloat(item.monto), 0).toFixed(2)} BOB
                  </p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {queue.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        item.tipo === 'qr'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {item.tipo === 'qr' ? 'QR' : 'Efe'}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {fuentesList.find(f => f.id === item.fuente_id)?.nombre || 'Sin fuente'}
                      </span>
                      <span className="ml-auto font-mono text-sm text-gray-900 dark:text-white">
                        {parseFloat(item.monto).toFixed(2)} BOB
                      </span>
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? (
                    'Registrando...'
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Registrar {queue.length} ingreso(s)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
       </div>
      </div>

      {showOcrModal && ocrResult && imagenPreview && (
        <OcrConfirmationModal
          data={ocrResult}
          imagenPreview={imagenPreview}
          onConfirm={handleOcrConfirm}
          onCancel={handleOcrCancel}
        />
      )}
    </div>
  )
}
