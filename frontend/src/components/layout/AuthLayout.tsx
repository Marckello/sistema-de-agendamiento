import { Outlet } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <h1 className="text-white text-3xl font-bold">
            Serrano Marketing
          </h1>
          <p className="text-primary-100 mt-2">
            Sistema de Gestión de Citas
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-2">
              Gestiona tu negocio fácilmente
            </h3>
            <p className="text-primary-100 text-sm">
              Administra citas, clientes y servicios desde una sola plataforma. 
              Recibe notificaciones automáticas y analiza el rendimiento de tu negocio.
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary-300 border-2 border-white"></div>
              <div className="w-10 h-10 rounded-full bg-primary-400 border-2 border-white"></div>
              <div className="w-10 h-10 rounded-full bg-primary-500 border-2 border-white"></div>
            </div>
            <p className="text-white text-sm">
              +500 negocios confían en nosotros
            </p>
          </div>
        </div>
        
        <p className="text-primary-200 text-sm">
          © {new Date().getFullYear()} Serrano Marketing. Todos los derechos reservados.
        </p>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col">
        {/* Theme toggle */}
        <div className="flex justify-end p-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Serrano Marketing
        </div>
      </div>
    </div>
  );
}
