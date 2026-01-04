import { useState, Fragment, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { userService, CreateUserData } from '@/services/users';
import { User, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/50' },
  ADMIN: { label: 'Administrador', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/50' },
  EMPLOYEE: { label: 'Empleado', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/50' },
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll(true),
  });

  const users = usersData?.data?.users || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => userService.toggleActive(id),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes eliminarte a ti mismo');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar a ${user.firstName} ${user.lastName}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los usuarios de tu negocio
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Permisos</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No hay usuarios
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user: User) => {
                  const roleConfig = ROLE_CONFIG[user.role];
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-primary-600">(Tú)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.bgColor} ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          {user.canModify && (
                            <span className="flex items-center gap-1" title="Puede modificar">
                              <PencilIcon className="w-4 h-4" />
                            </span>
                          )}
                          {user.canDelete && (
                            <span className="flex items-center gap-1" title="Puede eliminar">
                              <TrashIcon className="w-4 h-4" />
                            </span>
                          )}
                          {!user.canModify && !user.canDelete && (
                            <span>Solo lectura</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => !isCurrentUser && toggleActiveMutation.mutate(user.id)}
                          disabled={isCurrentUser}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                            user.isActive
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          } ${isCurrentUser ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
                        >
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSuccess={() => {
          handleCloseModal();
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
      />
    </div>
  );
}

// User Modal Component
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess?: () => void;
}

function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserData>({
    defaultValues: user ? {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      canModify: user.canModify,
      canDelete: user.canDelete,
    } : {
      role: 'EMPLOYEE',
      canModify: false,
      canDelete: false,
    },
  });

  // Cargar datos del usuario cuando se abre el modal de edición
  useEffect(() => {
    if (user && isOpen) {
      reset({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role,
        canModify: user.canModify,
        canDelete: user.canDelete,
      });
    } else if (!user && isOpen) {
      reset({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        role: 'EMPLOYEE',
        canModify: false,
        canDelete: false,
      });
    }
  }, [user, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => userService.create(data),
    onSuccess: () => {
      toast.success('Usuario creado');
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateUserData>) => userService.update(user!.id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const onSubmit = (data: CreateUserData) => {
    if (user) {
      // Don't send password on update unless it's provided
      const updateData: any = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      updateMutation.mutate(updateData);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Nombre *</label>
                      <input
                        {...register('firstName', { required: 'Requerido' })}
                        className={`input ${errors.firstName ? 'input-error' : ''}`}
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="label">Apellido *</label>
                      <input
                        {...register('lastName', { required: 'Requerido' })}
                        className={`input ${errors.lastName ? 'input-error' : ''}`}
                        placeholder="Pérez"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      {...register('email', { required: 'Requerido' })}
                      className={`input ${errors.email ? 'input-error' : ''}`}
                      placeholder="usuario@email.com"
                    />
                  </div>

                  <div>
                    <label className="label">Teléfono</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="input"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="label">
                      Contraseña {user ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <input
                      type="password"
                      {...register('password', {
                        required: user ? false : 'Requerido',
                        minLength: user ? undefined : { value: 8, message: 'Mínimo 8 caracteres' },
                      })}
                      className={`input ${errors.password ? 'input-error' : ''}`}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">Rol *</label>
                    <select {...register('role', { required: true })} className="input">
                      <option value="EMPLOYEE">Empleado</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="label">Permisos</label>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Puede modificar registros
                      </span>
                      <ToggleSwitch
                        checked={watch('canModify') || false}
                        onChange={(val) => setValue('canModify', val)}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Puede eliminar registros
                      </span>
                      <ToggleSwitch
                        checked={watch('canDelete') || false}
                        onChange={(val) => setValue('canDelete', val)}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        ✨ Acceso al asistente de IA
                      </span>
                      <ToggleSwitch
                        checked={watch('canUseAI') || false}
                        onChange={(val) => setValue('canUseAI', val)}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
