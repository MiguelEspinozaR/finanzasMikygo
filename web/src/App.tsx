import { Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarPlus, List, Database, Sun, Moon } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import Dashboard from './features/dashboard/Dashboard'
import RegistrarIngreso from './features/registrar/RegistrarIngreso'
import Ingresos from './features/ingresos/Ingresos'
import SQLTab from './features/sql/SQLTab'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/registrar', label: 'Registrar', icon: CalendarPlus },
  { to: '/ingresos', label: 'Ingresos', icon: List },
  { to: '/sql', label: 'SQL', icon: Database },
]

export default function App() {
  const { darkMode, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                Finanzas Mikygo
              </h1>
            </div>

            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}

              <button
                onClick={toggleTheme}
                className="ml-2 p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registrar" element={<RegistrarIngreso />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/sql" element={<SQLTab />} />
        </Routes>
      </main>
    </div>
  )
}
