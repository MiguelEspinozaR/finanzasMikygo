import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Table, Database } from 'lucide-react'
import toast from 'react-hot-toast'
import { sqlApi, SQLExecuteResponse } from '../../services/api'

export default function SQLTab() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SQLExecuteResponse | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const { data: schema } = useQuery({
    queryKey: ['sql', 'schema'],
    queryFn: () => sqlApi.getSchema(),
  })

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error('Escribe una consulta SQL')
      return
    }

    setIsExecuting(true)
    try {
      const response = await sqlApi.execute(query)
      setResult(response.data)
      toast.success(`Consulta ejecutada en ${response.data.time}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al ejecutar consulta')
      setResult(null)
    } finally {
      setIsExecuting(false)
    }
  }

  const formatCell = (value: unknown) => {
    if (typeof value === 'string' && value.includes('BOB')) return value
    return String(value ?? '')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">SQL Console</h2>
        <p className="text-gray-500 dark:text-gray-400">Ejecuta consultas SQL directamente (solo desarrollo)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Consulta SQL</label>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                {isExecuting ? 'Ejecutando...' : 'Ejecutar'}
              </button>
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="SELECT * FROM ingresos LIMIT 10;"
              rows={8}
              className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resultados ({result.rows?.length || 0} filas)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {result.time}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      {result.columns?.map(col => (
                        <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {result.rows?.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                            {formatCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Schema */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Esquema de Tablas</h3>
          </div>

          <div className="space-y-4">
            {schema?.data?.tables?.map(table => (
              <div key={table.name}>
                <div className="flex items-center gap-2 mb-2">
                  <Table className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{table.name}</span>
                </div>
                <div className="ml-6 space-y-1">
                  {table.columns?.map(col => (
                    <div key={col.name} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{col.name}</span>
                      <span className="text-gray-400 dark:text-gray-500">{col.type}</span>
                      {col.nullable === 'YES' && (
                        <span className="text-yellow-500">?</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
