import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface FechaTrabajo {
  fecha: string
  monto_enteros: number
  monto_display: string
}

export interface Ingreso {
  id: number
  fecha_pago: string
  monto_enteros: number
  monto_display: string
  tipo: 'diario' | 'semanal'
  comentario: string | null
  imagen_ruta: string | null
  fechas_trabajo: FechaTrabajo[]
  created_at: string
  updated_at: string
}

export interface IngresoListResponse {
  data: Ingreso[]
  total: number
  page: number
  page_size: number
}

export interface CreateIngresoRequest {
  fecha_pago: string
  monto_enteros: number
  tipo: 'diario' | 'semanal'
  comentario?: string
  imagen_ruta?: string
  fechas_trabajo: { fecha: string }[]
}

export interface DashboardSummaryResponse {
  dias_trabajados: string[]
  dias_pago: string[]
}

export interface DashboardWeeklyResponse {
  dia: string
  monto: number
  promedio: number
}

export interface DashboardMonthlyResponse {
  semana: string
  monto: number
  promedio: number
}

export interface DashboardYearlyResponse {
  mes: string
  monto: number
  promedio: number
}

export interface DashboardHistoryResponse {
  fecha: string
  monto: number
  promedio: number
}

export interface SQLExecuteResponse {
  columns: string[]
  rows: unknown[][]
  time: string
}

export interface SQLTableInfo {
  name: string
  columns: { name: string; type: string; nullable: string }[]
}

export interface SQLSchemaResponse {
  tables: SQLTableInfo[]
}

// Ingresos
export const ingresosApi = {
  create: (data: CreateIngresoRequest) => api.post<Ingreso>('/ingresos', data),
  getAll: (params?: Record<string, string | number>) => api.get<IngresoListResponse>('/ingresos', { params }),
  getById: (id: number) => api.get<Ingreso>(`/ingresos/${id}`),
  update: (id: number, data: Partial<CreateIngresoRequest>) => api.put<Ingreso>(`/ingresos/${id}`, data),
  delete: (id: number) => api.delete(`/ingresos/${id}`),
  getFechasOcupadas: (mes: number, anio: number) => api.get<Record<string, string[]>>('/ingresos/fechas-ocupadas', { params: { mes, anio } }),
  upload: (file: File, ingresoId?: number) => {
    const formData = new FormData()
    formData.append('file', file)
    if (ingresoId) {
      formData.append('ingreso_id', String(ingresoId))
    }
    return api.post<{ message: string }>('/ingresos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Dashboard
export const dashboardApi = {
  getSummary: (mes: number, anio: number) => api.get<DashboardSummaryResponse>('/dashboard/summary', { params: { mes, anio } }),
  getWeekly: (fecha?: string) => api.get<DashboardWeeklyResponse[]>('/dashboard/weekly', { params: { fecha } }),
  getMonthly: (mes: number, anio: number) => api.get<DashboardMonthlyResponse[]>('/dashboard/monthly', { params: { mes, anio } }),
  getYearly: (anio: number) => api.get<DashboardYearlyResponse[]>('/dashboard/yearly', { params: { anio } }),
  getHistory: () => api.get<DashboardHistoryResponse[]>('/dashboard/history'),
}

// SQL
export const sqlApi = {
  execute: (query: string) => api.post<SQLExecuteResponse>('/sql/execute', { query }),
  getSchema: () => api.get<SQLSchemaResponse>('/sql/schema'),
}

export default api
