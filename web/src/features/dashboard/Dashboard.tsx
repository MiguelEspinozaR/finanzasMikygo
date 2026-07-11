import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine, ComposedChart } from 'recharts'
import { TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subMonths, addMonths, subYears, addYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { dashboardApi } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'

const DAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function Dashboard() {
  const { darkMode } = useTheme()
  const now = new Date()

  const [monthDate, setMonthDate] = useState(now)
  const [yearDate, setYearDate] = useState(now)

  const currentMonth = monthDate.getMonth() + 1
  const currentYear = yearDate.getFullYear()

  const { data: summary } = useQuery({
    queryKey: ['dashboard', 'summary', currentMonth, monthDate.getFullYear()],
    queryFn: () => dashboardApi.getSummary(currentMonth, monthDate.getFullYear()),
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
    return data[0]?.promedio_global || 0
  }, [history])

  const formatMonto = (monto: number) => {
    return `${(monto / 100).toFixed(2)} BOB`
  }

  // Transform monthly data for stacked chart
  const stackedData = useMemo(() => {
    const raw = monthly?.data
    if (!raw || raw.length === 0) return []

    // Collect all unique day dates across all weeks
    const allDays = new Map<string, number>() // fecha -> color index
    let dayIdx = 0
    for (const semana of raw) {
      if (semana.dias) {
        for (const dia of semana.dias) {
          if (!allDays.has(dia.fecha)) {
            allDays.set(dia.fecha, dayIdx % DAY_COLORS.length)
            dayIdx++
          }
        }
      }
    }

    // Build stacked rows
    return raw.map((semana) => {
      const row: Record<string, any> = { semana: semana.semana }
      if (semana.dias) {
        for (const dia of semana.dias) {
          const key = format(new Date(dia.fecha + 'T00:00:00'), 'dd/MM')
          row[key] = dia.monto
        }
      }
      return row
    })
  }, [monthly])

  // Get unique day labels (dd/MM) in order for the stacked bars
  const stackedDayKeys = useMemo(() => {
    const raw = monthly?.data
    if (!raw || raw.length === 0) return []
    const seen = new Set<string>()
    const keys: string[] = []
    for (const semana of raw) {
      if (semana.dias) {
        for (const dia of semana.dias) {
          const k = format(new Date(dia.fecha + 'T00:00:00'), 'dd/MM')
          if (!seen.has(k)) {
            seen.add(k)
            keys.push(k)
          }
        }
      }
    }
    return keys
  }, [monthly])

  // Assign colors to each unique day key based on weekday
  const dayColorMap = useMemo(() => {
    const raw = monthly?.data
    if (!raw) return {}
    const map: Record<string, string> = {}
    const seen = new Set<string>()
    let colorIdx = 0
    for (const semana of raw) {
      if (semana.dias) {
        for (const dia of semana.dias) {
          const k = format(new Date(dia.fecha + 'T00:00:00'), 'dd/MM')
          if (!seen.has(k)) {
            seen.add(k)
            map[k] = DAY_COLORS[colorIdx % DAY_COLORS.length]
            colorIdx++
          }
        }
      }
    }
    return map
  }, [monthly])

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Prom. Semanal</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMonto(monthlyStats.promedio)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Stacked Chart */}
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
          <BarChart data={stackedData}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="semana" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} tickFormatter={(v) => (v / 100).toFixed(0)} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => {
                if (typeof value === 'number' && value > 0) return formatMonto(value)
                return null
              }}
            />
            {stackedDayKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={dayColorMap[key] || '#6b7280'}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {stackedDayKeys.map((key) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: dayColorMap[key] }} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
            </div>
          ))}
        </div>
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
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} tickFormatter={(v) => (v / 100).toFixed(0)} />
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
          <ComposedChart data={history?.data || []} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              dataKey="mes"
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              tickFormatter={(v: string) => {
                const [y, m] = v.split('-')
                const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
                return `${monthNames[parseInt(m, 10) - 1]}/${y.slice(2)}`
              }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} tickFormatter={(v) => (v / 100).toFixed(0)} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number, name: string) => {
                if (name === 'promedio') return [formatMonto(value), 'Prom. mensual']
                return [formatMonto(value), 'Total mes']
              }}
              labelFormatter={(label: string) => {
                const [y, m] = label.split('-')
                const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                return `${monthNames[parseInt(m, 10) - 1]} ${y}`
              }}
            />
            <ReferenceLine y={historyGlobalAvg} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Prom. global', fill: '#10b981', fontSize: 11 }} />
            <Bar dataKey="monto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="promedio" stroke="#f59e0b" strokeWidth={2} dot={false} name="promedio" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
