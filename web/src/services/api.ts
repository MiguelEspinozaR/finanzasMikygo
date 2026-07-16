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
  tipo: 'qr' | 'efectivo'
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
  tipo: 'qr' | 'efectivo'
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

export interface DashboardMonthlyDay {
  fecha: string
  monto: number
}

export interface DashboardMonthlyResponse {
  semana: string
  monto: number
  promedio: number
  dias: DashboardMonthlyDay[]
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
  promedio_global: number
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

// Cuentas
export interface Cuenta {
  id: number
  alias: string
  banco: string | null
  numero_cuenta: string | null
  tipo: 'ahorro' | 'corriente' | 'virtual' | 'fisica'
  qr_ruta: string | null
  created_at: string
  updated_at: string
}

export interface CreateCuentaRequest {
  alias: string
  banco?: string
  numero_cuenta?: string
  tipo: 'ahorro' | 'corriente' | 'virtual' | 'fisica'
}

export interface CuentaListResponse {
  data: Cuenta[]
}

// Splits
export interface SplitConfig {
  id: number
  cuenta_id: number
  cuenta_alias: string
  cuenta_tipo: string
  porcentaje: number
  orden: number
}

export interface SplitConfigListResponse {
  data: SplitConfig[]
}

export interface Split {
  id: number
  ingreso_id: number
  ingreso_monto: number
  ingreso_fecha_pago: string
  cuenta_id: number
  cuenta_alias: string
  cuenta_tipo: string
  qr_ruta: string | null
  porcentaje: number
  monto_enteros: number
  monto_display: string
  realizado: boolean
  fecha_realizado: string | null
  created_at: string
  updated_at: string
}

export interface SplitListResponse {
  data: Split[]
}

export interface UpdateSplitConfigRequest {
  cuenta_id: number
  porcentaje: number
  aplicar_a_pendientes: boolean
}

export interface UpdateAllSplitConfigRequest {
  configuraciones: UpdateSplitConfigRequest[]
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

// Cuentas
export const cuentasApi = {
  create: (data: CreateCuentaRequest) => api.post<Cuenta>('/cuentas', data),
  getAll: () => api.get<CuentaListResponse>('/cuentas'),
  getById: (id: number) => api.get<Cuenta>(`/cuentas/${id}`),
  update: (id: number, data: Partial<CreateCuentaRequest>) => api.put<Cuenta>(`/cuentas/${id}`, data),
  delete: (id: number) => api.delete(`/cuentas/${id}`),
  uploadQr: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('qr', file)
    return api.post<{ message: string }>(`/cuentas/${id}/qr`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteQr: (id: number) => api.delete(`/cuentas/${id}/qr`),
}

// Splits
export const splitsApi = {
  getConfig: () => api.get<SplitConfigListResponse>('/splits/config'),
  updateConfig: (data: UpdateAllSplitConfigRequest) => api.put<{ message: string }>('/splits/config', data),
  getAll: () => api.get<SplitListResponse>('/splits'),
  getByIngresoId: (ingresoId: number) => api.get<SplitListResponse>(`/splits/ingreso/${ingresoId}`),
  getIngresosConSplits: () => api.get<{ data: number[] }>('/splits/ingresos-con-splits'),
  generarPorIngreso: (id: number) => api.post<{ message: string }>(`/splits/generar/${id}`),
  marcarRealizado: (id: number, realizado: boolean) => api.put<{ message: string }>(`/splits/${id}/realizar`, { realizado }),
  updateMonto: (id: number, montoEnteros: number) => api.put<{ message: string }>(`/splits/${id}`, { monto_enteros: montoEnteros }),
  delete: (id: number) => api.delete(`/splits/${id}`),
}

export default api
