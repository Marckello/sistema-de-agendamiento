import { Outlet } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background - pure dark like Blitzit */}
        <div className="absolute inset-0 bg-dark-950" />
        
        {/* Subtle glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-fuchsia-500/10 to-transparent blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-dark-950" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CitasPro</h1>
              <p className="text-xs text-gray-600">by Serrano Marketing</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                <span className="text-white">Gestiona tu negocio</span><br/>
                <span className="gradient-text">con superpoderes</span>
              </h2>
              <p className="text-gray-400 mt-4 text-lg">
                Administra citas, clientes y servicios desde una sola plataforma. 
                Recibe notificaciones automáticas y analiza el rendimiento de tu negocio.
              </p>
            </div>
            
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Rápido y eficiente</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Ahorra hasta 10 horas semanales con nuestra plataforma automatizada
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary-500 border-2 border-dark-950 flex items-center justify-center">
                  <span className="text-dark-950 text-xs font-bold">JD</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-fuchsia-500 border-2 border-dark-950 flex items-center justify-center">
                  <span className="text-dark-950 text-xs font-bold">MR</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-cyan-500 border-2 border-dark-950 flex items-center justify-center">
                  <span className="text-dark-950 text-xs font-bold">AL</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-semibold">+500</span> negocios confían en nosotros
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Serrano Marketing. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col bg-dark-950">
        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden p-4 text-center text-gray-600 text-sm">
          © {new Date().getFullYear()} Serrano Marketing
        </div>
      </div>
    </div>
  );
}
