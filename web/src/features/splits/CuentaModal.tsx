import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cuentasApi, Cuenta, CreateCuentaRequest } from '../../services/api'

interface Props {
  cuenta: Cuenta | null
  onClose: () => void
  onSaved: () => void
}

export default function CuentaModal({ cuenta, onClose, onSaved }: Props) {
  const queryClient = useQueryClient()
  const [alias, setAlias] = useState(cuenta?.alias || '')
  const [banco, setBanco] = useState(cuenta?.banco || '')
  const [numeroCuenta, setNumeroCuenta] = useState(cuenta?.numero_cuenta || '')
  const [tipo, setTipo] = useState<Cuenta['tipo']>(cuenta?.tipo || 'ahorro')
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(
    cuenta?.qr_ruta ? `/uploads/${cuenta.qr_ruta}` : null
  )

  const createMutation = useMutation({
    mutationFn: (data: CreateCuentaRequest) => cuentasApi.create(data),
    onSuccess: (response) => {
      if (qrFile) {
        uploadQr.mutate({ id: response.data.id, file: qrFile })
      } else {
        onSaved()
      }
    },
    onError: () => toast.error('Error al crear cuenta'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCuentaRequest> }) =>
      cuentasApi.update(id, data),
    onSuccess: () => {
      if (qrFile && cuenta) {
        uploadQr.mutate({ id: cuenta.id, file: qrFile })
      } else {
        onSaved()
      }
    },
    onError: () => toast.error('Error al actualizar cuenta'),
  })

  const uploadQr = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      cuentasApi.uploadQr(id, file),
    onSuccess: () => onSaved(),
    onError: () => toast.error('Error al subir QR'),
  })

  const deleteQr = useMutation({
    mutationFn: (id: number) => cuentasApi.deleteQr(id),
    onSuccess: () => {
      setQrPreview(null)
      setQrFile(null)
      queryClient.invalidateQueries({ queryKey: ['cuentas'] })
      toast.success('QR eliminado')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setQrFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setQrPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alias.trim()) {
      toast.error('El alias es requerido')
      return
    }

    const data: CreateCuentaRequest = {
      alias: alias.trim(),
      tipo,
    }
    if (banco.trim()) data.banco = banco.trim()
    if (numeroCuenta.trim()) data.numero_cuenta = numeroCuenta.trim()

    if (cuenta) {
      updateMutation.mutate({ id: cuenta.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending || uploadQr.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {cuenta ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alias *
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ej: Ahorro Personal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Cuenta['tipo'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ahorro">Ahorro</option>
              <option value="corriente">Corriente</option>
              <option value="virtual">Virtual</option>
              <option value="fisica">Física</option>
            </select>
          </div>

          {tipo !== 'fisica' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: BNB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ej: 123456789"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              QR (opcional)
            </label>
            {qrPreview ? (
              <div className="relative">
                <img src={qrPreview} alt="QR" className="w-32 h-32 object-contain mx-auto" />
                <button
                  type="button"
                  onClick={() => {
                    if (cuenta && cuenta.qr_ruta) {
                      deleteQr.mutate(cuenta.id)
                    } else {
                      setQrPreview(null)
                      setQrFile(null)
                    }
                  }}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500 mt-2">Subir imagen QR</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
