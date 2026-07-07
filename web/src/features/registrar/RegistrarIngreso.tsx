import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Briefcase, CreditCard, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ingresosApi, CreateIngresoRequest } from '../../services/api'

type Tool = 'trabajo' | 'pago' | 'quitar'

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

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  const { data: fechasOcupadas } = useQuery({
    queryKey: ['fechasOcupadas', month, year],
    queryFn: () => ingresosApi.getFechasOcupadas(month, year),
  })

  const createMutation = useMutation({
    mutationFn: async (data: { request: CreateIngresoRequest; imagen?: File }) => {
      const response = await ingresosApi.create(data.request)
      if (data.imagen) {
        await ingresosApi.upload(data.imagen, response.data.id)
      }
      return response
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['ingresos'] })
      queryClient.invalidateQueries({ queryKey: ['fechasOcupadas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Ingreso registrado exitosamente')
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar ingreso')
    },
  })

  const resetForm = () => {
    setSelectedWorkDays([])
    setSelectedPaymentDay(null)
    setMonto('')
    setComentario('')
    setImagen(null)
    setImagenPreview(null)
  }

  const getDaysInMonth = useCallback(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const ocupada = fechasOcupadas?.data?.[dateStr]

    if (ocupada && ocupada.length > 0) return

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

  const handleSubmit = async () => {
    if (selectedWorkDays.length === 0) {
      toast.error('Selecciona al menos un día de trabajo')
      return
    }
    if (!selectedPaymentDay) {
      toast.error('Selecciona un día de pago')
      return
    }
    if (!monto || parseFloat(monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    const montoEnteros = Math.round(parseFloat(monto) * 100)

    createMutation.mutate({
      request: {
        fecha_pago: selectedPaymentDay,
        monto_enteros: montoEnteros,
        tipo,
        comentario: comentario || undefined,
        fechas_trabajo: selectedWorkDays.sort().map(f => ({ fecha: f })),
      },
      imagen: imagen || undefined,
    })
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

    if (hasTrabajo && hasPago) return 'bg-blue-200 dark:bg-blue-800 border-2 border-green-500 text-blue-800 dark:text-blue-200 cursor-not-allowed'
    if (hasTrabajo) return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 cursor-not-allowed'
    if (hasPago) return 'border-2 border-green-500 text-green-600 dark:text-green-400 cursor-not-allowed'

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
                disabled={(fechasOcupadas?.data?.[format(date, 'yyyy-MM-dd')] || []).length > 0}
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
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {imagenPreview && (
                <img src={imagenPreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
            >
              {createMutation.isPending ? (
                'Registrando...'
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Registrar Ingreso
                </>
              )}
            </button>
          </div>
       </div>
      </div>
    </div>
  )
}
