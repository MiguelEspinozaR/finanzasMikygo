import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarPlus, List, Database, Sun, Moon, PieChart, Settings, Menu, X } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import Dashboard from './features/dashboard/Dashboard'
import RegistrarIngreso from './features/registrar/RegistrarIngreso'
import Ingresos from './features/ingresos/Ingresos'
import SQLTab from './features/sql/SQLTab'
import Splits from './features/splits/Splits'
import Configuracion from './features/configuracion/Configuracion'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/registrar', label: 'Registrar', icon: CalendarPlus },
    ],
  },
  {
    label: 'Datos',
    items: [
      { to: '/ingresos', label: 'Ingresos', icon: List },
      { to: '/splits', label: 'Splits', icon: PieChart },
    ],
  },
  {
    label: 'Config',
    items: [
      { to: '/configuracion', label: 'Configuración', icon: Settings },
      { to: '/sql', label: 'SQL', icon: Database },
    ],
  },
]

export default function App() {
  const { darkMode, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-3 relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">$</span>
                </div>
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  Finanzas Mikygo
                </h1>
              </div>

              {/* Dropdown menu - inside menuRef to prevent click-outside close */}
              <div
                className={`absolute top-full left-0 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg transition-all duration-200 origin-top z-50 ${
                  menuOpen
                    ? 'opacity-100 scale-y-100 pointer-events-auto'
                    : 'opacity-0 scale-y-0 pointer-events-none'
                }`}
              >
                <nav className="py-2">
                  {navGroups.map((group, gi) => (
                    <div key={group.label}>
                      {gi > 0 && <div className="border-t border-gray-200 dark:border-gray-700 my-1" />}
                      <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {group.label}
                      </p>
                      {group.items.map(({ to, label, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          end={to === '/'}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`
                          }
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </NavLink>
                      ))}
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Right: Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registrar" element={<RegistrarIngreso />} />
          <Route path="/ingresos" element={<Ingresos />} />
          <Route path="/splits" element={<Splits />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/sql" element={<SQLTab />} />
        </Routes>
      </main>
    </div>
  )
}
