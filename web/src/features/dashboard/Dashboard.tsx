import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ReferenceLine } from 'recharts'
import { TrendingUp, Calendar, DollarSign, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears, startOfWeek, getWeek, getYear } from 'date-fns'
import { es } from 'date-fns/locale'
import { dashboardApi } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'

export default function Dashboard() {
  const { darkMode } = useTheme()
  const now = new Date()

  // Navigation states (independent)
  const [weekDate, setWeekDate] = useState(now)
  const [monthDate, setMonthDate] = useState(now)
  const [yearDate, setYearDate] = useState(now)

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 })
  const weekYear = getYear(weekStart)
  const weekNum = getWeek(weekStart, { weekStartsOn: 1 })
  const currentMonth = monthDate.getMonth() + 1
  const currentYear = yearDate.getFullYear()

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary', currentMonth, monthDate.getFullYear()],
    queryFn: () => dashboardApi.getSummary(currentMonth, monthDate.getFullYear()),
  })

  const { data: weekly } = useQuery({
    queryKey: ['dashboard', 'weekly', weekStart.toISOString()],
    queryFn: () => dashboardApi.getWeekly(weekStart.toISOString().split('T')[0]),
  })

  const { data: monthly } = useQuery({
    queryKey: ['dashboard', 'monthly', currentMonth, monthDate.getFullYear()],
    queryFn: () => dashboardApi.getMonthly(currentMonth, monthDate.getFullYear()),
  })

  const { data: yearly } = useQuery({
    queryKey: ['dashboard', 'yearly', currentYear],
    queryFn: () => dashboardApi.getYearly(currentYear),
  })

  const { data: history } = useQuery({
    queryKey: ['dashboard', 'history'],
    queryFn: () => dashboardApi.getHistory(),
  })

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      borderRadius: '8px',
      color: darkMode ? '#f3f4f6' : '#111827',
    },
  }

  const weeklyStats = useMemo(() => {
    const data = weekly?.data
    if (!data || data.length === 0) return { total: 0, promedio: 0 }
    const total = data.reduce((sum, d) => sum + d.monto, 0)
    return { total, promedio: total / data.length }
  }, [weekly])

  const monthlyStats = useMemo(() => {
    const data = monthly?.data
    if (!data || data.length === 0) return { total: 0, promedio: 0 }
    const total = data.reduce((sum, d) => sum + d.monto, 0)
    return { total, promedio: total / data.length }
  }, [monthly])

  const yearlyStats = useMemo(() => {
    const data = yearly?.data
    if (!data || data.length === 0) return { total: 0, promedio: 0 }
    const total = data.reduce((sum, d) => sum + d.monto, 0)
    return { total, promedio: total / data.length }
  }, [yearly])

  const historyGlobalAvg = useMemo(() => {
    const data = history?.data
    if (!data || data.length === 0) return 0
    const total = data.reduce((sum, d) => sum + d.monto, 0)
    return total / data.length
  }, [history])

  const formatMonto = (monto: number) => {
    return `${(monto / 100).toFixed(2)} BOB`
  }

  const NavArrows = ({ onPrev, onNext, label }: { onPrev: () => void; onNext: () => void; label: string }) => (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onPrev} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button onClick={onNext} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400">Resumen de tus ingresos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Días Trabajados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.data?.dias_trabajados?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Días de Pago</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.data?.dias_pago?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Semanal</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMonto(weeklyStats.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Mensual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMonto(monthlyStats.total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Ingresos Semanales
          </h3>
          <NavArrows
            onPrev={() => setWeekDate(d => subWeeks(d, 1))}
            onNext={() => setWeekDate(d => addWeeks(d, 1))}
            label={`Sem ${weekNum} · ${weekYear}`}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Promedio: {formatMonto(weeklyStats.promedio)}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="dia" stroke={darkMode ? '#9ca3af' : '#6b7280'} tickFormatter={(v: string) => format(new Date(v + 'T00:00:00'), 'dd/MM')} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip {...tooltipStyle} formatter={(value: number) => formatMonto(value)} />
              <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Ingresos Mensuales
          </h3>
          <NavArrows
            onPrev={() => setMonthDate(d => subMonths(d, 1))}
            onNext={() => setMonthDate(d => addMonths(d, 1))}
            label={format(monthDate, 'MMMM yyyy', { locale: es })}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Promedio: {formatMonto(monthlyStats.promedio)}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="semana" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip {...tooltipStyle} formatter={(value: number) => formatMonto(value)} />
              <Bar dataKey="monto" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Yearly Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Ingresos Anuales
          </h3>
          <NavArrows
            onPrev={() => setYearDate(d => subYears(d, 1))}
            onNext={() => setYearDate(d => addYears(d, 1))}
            label={String(currentYear)}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Promedio: {formatMonto(yearlyStats.promedio)}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yearly?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="mes" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip {...tooltipStyle} formatter={(value: number) => formatMonto(value)} />
              <Bar dataKey="monto" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* History Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Histórico de Ingresos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Promedio global: {formatMonto(historyGlobalAvg)}
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="fecha" stroke={darkMode ? '#9ca3af' : '#6b7280'} tickFormatter={(v: string) => format(new Date(v + 'T00:00:00'), 'dd/MM/yy')} />
              <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
              <Tooltip {...tooltipStyle} formatter={(value: number) => formatMonto(value)} />
              <Legend />
              <ReferenceLine y={historyGlobalAvg} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Promedio', fill: '#10b981', fontSize: 12 }} />
              <Line type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={2} name="Ingresos" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
