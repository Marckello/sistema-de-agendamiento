import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const [notifications] = useState<any[]>([]);

  return (
    <header className="sticky top-0 z-20 bg-dark-950 border-b border-dark-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          
          {/* Search bar */}
          <div className="hidden sm:flex items-center">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-xl text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-dark-800 transition-colors">
              <BellIcon className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full shadow-glow" />
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95 translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right bg-dark-900 border border-dark-800 rounded-2xl shadow-card focus:outline-none overflow-hidden">
                <div className="p-4 border-b border-dark-800">
                  <h3 className="text-sm font-semibold text-white">
                    Notificaciones
                  </h3>
                </div>
                <div className="p-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6">
                      <BellIcon className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No tienes notificaciones nuevas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notification, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-xl hover:bg-dark-800 transition-colors cursor-pointer"
                        >
                          <p className="text-sm text-gray-300">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-dark-800 transition-colors">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary-500/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white">
                  {user?.firstName}
                </p>
                <p className="text-[10px] text-gray-500">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                   user?.role === 'ADMIN' ? 'Admin' : 'Empleado'}
                </p>
              </div>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95 translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-dark-900 border border-dark-800 rounded-2xl shadow-card focus:outline-none overflow-hidden">
                <div className="px-4 py-3 border-b border-dark-800">
                  <p className="text-sm font-semibold text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                          active
                            ? 'bg-dark-800 text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        <UserCircleIcon className="w-5 h-5" />
                        Mi Perfil
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors ${
                          active
                            ? 'bg-dark-800 text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Configuración
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                <div className="p-2 border-t border-dark-800">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-xl transition-colors ${
                          active
                            ? 'bg-red-500/10 text-red-400'
                            : 'text-red-400/80'
                        }`}
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        Cerrar Sesión
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}
