import { useState } from 'react'
import { Users, PieChart, Palette } from 'lucide-react'
import CuentasTab from './CuentasTab'
import SplitsTab from './SplitsTab'
import FuentesTab from './FuentesTab'

type Tab = 'cuentas' | 'splits' | 'fuentes'

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'cuentas', label: 'Cuentas', icon: Users },
  { id: 'splits', label: 'Splits', icon: PieChart },
  { id: 'fuentes', label: 'Fuentes', icon: Palette },
]

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState<Tab>('cuentas')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h2>
        <p className="text-gray-500 dark:text-gray-400">Administra cuentas, splits y fuentes de ingreso</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 -mb-px">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'cuentas' && <CuentasTab />}
        {activeTab === 'splits' && <SplitsTab />}
        {activeTab === 'fuentes' && <FuentesTab />}
      </div>
    </div>
  )
}
