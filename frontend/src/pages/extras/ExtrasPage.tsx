import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { extrasService } from '@/services/extras';
import { Extra, CreateExtraData } from '@/types';

export default function ExtrasPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);

  const { data: extrasData, isLoading } = useQuery({
    queryKey: ['extras'],
    queryFn: () => extrasService.getAll(),
  });

  const extras = extrasData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => extrasService.delete(id),
    onSuccess: (data) => {
      toast.success(data.message || 'Extra eliminado');
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (extra: Extra) => extrasService.update(extra.id, { isActive: !extra.isActive }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const handleOpenModal = (extra?: Extra) => {
    setEditingExtra(extra || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExtra(null);
  };

  const handleDelete = (extra: Extra) => {
    if (confirm(`¿Estás seguro de eliminar "${extra.name}"?`)) {
      deleteMutation.mutate(extra.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extras</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Productos o servicios adicionales que puedes agregar a las citas
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Extra
        </button>
      </div>

      {/* Extras Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : extras.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay extras
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comienza creando tu primer extra
          </p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Extra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extras.map((extra: Extra) => (
            <div
              key={extra.id}
              className={`card p-4 ${!extra.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <ShoppingBagIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {extra.name}
                    </h3>
                    {extra.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {extra.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActiveMutation.mutate(extra)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title={extra.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {extra.isActive ? (
                      <EyeIcon className="w-4 h-4" />
                    ) : (
                      <EyeSlashIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenModal(extra)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(extra)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${Number(extra.price).toFixed(2)}
                  </span>
                </div>
                {extra._count?.appointments !== undefined && extra._count.appointments > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {extra._count.appointments} usos
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ExtraModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        extra={editingExtra}
      />
    </div>
  );
}

// Modal Component
interface ExtraModalProps {
  isOpen: boolean;
  onClose: () => void;
  extra: Extra | null;
}

function ExtraModal({ isOpen, onClose, extra }: ExtraModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!extra;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateExtraData>({
    defaultValues: extra ? {
      name: extra.name,
      description: extra.description || '',
      price: Number(extra.price),
      isActive: extra.isActive,
    } : {
      name: '',
      description: '',
      price: 0,
      isActive: true,
    },
  });

  // Reset form when extra changes
  useState(() => {
    if (extra) {
      reset({
        name: extra.name,
        description: extra.description || '',
        price: Number(extra.price),
        isActive: extra.isActive,
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        isActive: true,
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateExtraData) => extrasService.create(data),
    onSuccess: () => {
      toast.success('Extra creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear extra');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateExtraData) => extrasService.update(extra!.id, data),
    onSuccess: () => {
      toast.success('Extra actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['extras'] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar extra');
    },
  });

  const onSubmit = (data: CreateExtraData) => {
    const formattedData = {
      ...data,
      price: Number(data.price),
    };
    
    if (isEditing) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Editar Extra' : 'Nuevo Extra'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="label">Nombre *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Tinte, Shampoo Premium"
                      {...register('name', { required: 'El nombre es requerido' })}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="label">Descripción</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="Descripción opcional del extra"
                      {...register('description')}
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="label">Precio *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input pl-8"
                        placeholder="0.00"
                        {...register('price', { 
                          required: 'El precio es requerido',
                          min: { value: 0, message: 'El precio debe ser mayor o igual a 0' }
                        })}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  {/* Activo */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...register('isActive')}
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                      Extra activo (visible para agregar a citas)
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending || updateMutation.isPending
                        ? 'Guardando...'
                        : isEditing
                        ? 'Actualizar'
                        : 'Crear Extra'}
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
