import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services/settings';
import {
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Cog6ToothIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  SparklesIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Calendario', href: '/calendar', icon: CalendarDaysIcon },
  { name: 'Citas', href: '/appointments', icon: ClipboardDocumentListIcon },
  { name: 'Clientes', href: '/clients', icon: UsersIcon },
  { name: 'Servicios', href: '/services', icon: BuildingStorefrontIcon },
  { name: 'Extras', href: '/extras', icon: ShoppingBagIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Usuarios', href: '/users', icon: UserGroupIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Configuración', href: '/settings', icon: Cog6ToothIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Obtener settings del tenant para logo y nombre
  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings(),
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });
  
  const tenantSettings = settingsData?.data as any;
  const tenantLogo = tenantSettings?.logo;
  const tenantName = tenantSettings?.name || 'CitasPro';

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-dark-950/95 backdrop-blur-xl border-r border-dark-800/50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-dark-800/50">
          <div className="flex items-center gap-2">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-lg font-bold gradient-text">{tenantName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800/60'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-dark-950 border-r border-dark-800">
          {/* Logo - Branding prominente (soporta logos horizontales y cuadrados) */}
          <div className="flex flex-col items-center py-6 px-4 border-b border-dark-800">
            {tenantLogo ? (
              <img 
                src={tenantLogo} 
                alt={tenantName} 
                className="max-w-[200px] max-h-20 w-auto h-auto object-contain mb-3 rounded-xl" 
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-3">
                <SparklesIcon className="w-10 h-10 text-dark-950" />
              </div>
            )}
            <span className="text-xl font-bold text-white text-center">{tenantName}</span>
            <p className="text-[10px] text-gray-500 mt-0.5">CitasPro by Serrano Marketing</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <p className="px-4 mb-3 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
              Menú principal
            </p>
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          {user && (
            <div className="p-4 m-4 rounded-2xl bg-dark-800 border border-dark-700">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-primary-500 flex items-center justify-center">
                      <span className="text-dark-950 font-semibold">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                     user.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
