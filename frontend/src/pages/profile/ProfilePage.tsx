import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/users';
import {
  UserCircleIcon,
  KeyIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Administra tu información personal
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-6">
            <div className="text-center">
              <div className="relative inline-block">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.firstName}
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto">
                    <span className="text-primary-600 dark:text-primary-400 font-bold text-3xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <CameraIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <span className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                 user?.role === 'ADMIN' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
          </div>

          <div className="card p-2 mt-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <UserCircleIcon className="w-5 h-5" />
              Información Personal
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'password'
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <KeyIcon className="w-5 h-5" />
              Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileForm user={user} onUpdate={updateUser} />}
          {activeTab === 'password' && <PasswordForm />}
        </div>
      </div>
    </div>
  );
}

// Profile Form
function ProfileForm({ user, onUpdate }: { user: any; onUpdate: (user: any) => void }) {
  const { register, handleSubmit, formState: { isDirty, errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Perfil actualizado');
      onUpdate(response.data.user);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Información Personal
        </h2>
      </div>
      <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input
                {...register('firstName', { required: 'Requerido' })}
                className={`input ${errors.firstName ? 'input-error' : ''}`}
              />
            </div>
            <div>
              <label className="label">Apellido</label>
              <input
                {...register('lastName', { required: 'Requerido' })}
                className={`input ${errors.lastName ? 'input-error' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email} disabled className="input bg-gray-50 dark:bg-gray-700" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              El email no se puede cambiar
            </p>
          </div>

          <div>
            <label className="label">Teléfono</label>
            <input type="tel" {...register('phone')} className="input" placeholder="+1 234 567 8900" />
          </div>
        </div>

        <div className="card-footer flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="btn-primary"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Password Form
function PasswordForm() {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const mutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userService.changePassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cambiar Contraseña
        </h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Contraseña actual</label>
            <input
              type="password"
              {...register('currentPassword', { required: 'Requerido' })}
              className={`input ${errors.currentPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="label">Nueva contraseña</label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'Requerido',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Debe incluir mayúscula, minúscula y número',
                },
              })}
              className={`input ${errors.newPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Requerido',
                validate: (value) => value === newPassword || 'Las contraseñas no coinciden',
              })}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="card-footer flex justify-end">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
