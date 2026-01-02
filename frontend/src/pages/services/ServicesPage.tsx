import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline';
import { serviceService } from '@/services/services';
import { Service, CreateServiceData, ServiceCategory } from '@/types';

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAll(true),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => serviceService.getCategories(),
  });

  const services = servicesData?.data || [];
  const categories = categoriesData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceService.delete(id),
    onSuccess: () => {
      toast.success('Servicio eliminado');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => serviceService.toggleActive(id),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const handleOpenModal = (service?: Service) => {
    setEditingService(service || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleDelete = (service: Service) => {
    if (confirm(`¿Estás seguro de eliminar "${service.name}"?`)) {
      deleteMutation.mutate(service.id);
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc: Record<string, Service[]>, service: Service) => {
    const categoryName = service.category?.name || 'Sin categoría';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(service);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Servicios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los servicios que ofreces
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCategoryModalOpen(true)} 
            className="btn-secondary flex items-center"
          >
            <FolderPlusIcon className="w-5 h-5 mr-2" />
            Nueva Categoría
          </button>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Services Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ClockIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay servicios
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comienza creando tu primer servicio
          </p>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Crear Servicio
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([categoryName, categoryServices]) => (
            <div key={categoryName}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service: Service) => (
                  <div
                    key={service.id}
                    className={`card p-4 relative ${!service.isActive ? 'opacity-60' : ''}`}
                  >
                    {/* Color indicator */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                      style={{ backgroundColor: service.color || '#3B82F6' }}
                    />

                    <div className="pl-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                        {!service.isActive && (
                          <span className="badge badge-gray text-xs">Inactivo</span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {service.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          ${service.price}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => toggleActiveMutation.mutate(service.id)}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          title={service.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {service.isActive ? (
                            <EyeIcon className="w-5 h-5" />
                          ) : (
                            <EyeSlashIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        service={editingService}
        categories={categories}
        onSuccess={() => {
          handleCloseModal();
          queryClient.invalidateQueries({ queryKey: ['services'] });
        }}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          setIsCategoryModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['service-categories'] });
        }}
      />
    </div>
  );
}

// Service Modal Component
interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  categories: ServiceCategory[];
  onSuccess?: () => void;
}

function ServiceModal({ isOpen, onClose, service, categories, onSuccess }: ServiceModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceData>({
    defaultValues: service ? {
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      bufferTime: service.bufferTime,
      price: service.price,
      color: service.color || '#3B82F6',
      isActive: service.isActive,
      requiresConfirmation: service.requiresConfirmation,
      maxAdvanceBooking: service.maxAdvanceBooking,
      minAdvanceBooking: service.minAdvanceBooking,
      categoryId: service.categoryId || '',
    } : {
      duration: 30,
      bufferTime: 0,
      price: 0,
      color: '#3B82F6',
      isActive: true,
      requiresConfirmation: false,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceData) => serviceService.create(data),
    onSuccess: () => {
      toast.success('Servicio creado');
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateServiceData) => serviceService.update(service!.id, data),
    onSuccess: () => {
      toast.success('Servicio actualizado');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const onSubmit = (data: CreateServiceData) => {
    // Convert string numbers to actual numbers
    const formattedData = {
      ...data,
      duration: Number(data.duration),
      bufferTime: Number(data.bufferTime || 0),
      price: Number(data.price),
      maxAdvanceBooking: Number(data.maxAdvanceBooking || 30),
      minAdvanceBooking: Number(data.minAdvanceBooking || 1),
    };

    if (service) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {service ? 'Editar Servicio' : 'Nuevo Servicio'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                  <div>
                    <label className="label">Nombre *</label>
                    <input
                      {...register('name', { required: 'Requerido' })}
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Corte de cabello"
                    />
                  </div>

                  <div>
                    <label className="label">Descripción</label>
                    <textarea
                      {...register('description')}
                      rows={2}
                      className="input"
                      placeholder="Descripción del servicio..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Duración (min) *</label>
                      <input
                        type="number"
                        {...register('duration', { required: 'Requerido', min: 5 })}
                        className={`input ${errors.duration ? 'input-error' : ''}`}
                        min="5"
                        step="5"
                      />
                    </div>
                    <div>
                      <label className="label">Tiempo buffer (min)</label>
                      <input
                        type="number"
                        {...register('bufferTime')}
                        className="input"
                        min="0"
                        step="5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Precio *</label>
                      <input
                        type="number"
                        {...register('price', { required: 'Requerido', min: 0 })}
                        className={`input ${errors.price ? 'input-error' : ''}`}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="label">Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          {...register('color')}
                          className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          {...register('color')}
                          className="input flex-1"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">Categoría</label>
                    <select {...register('categoryId')} className="input">
                      <option value="">Sin categoría</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Reserva mínima anticipada (días)</label>
                      <input
                        type="number"
                        {...register('minAdvanceBooking')}
                        className="input"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="label">Reserva máxima anticipada (días)</label>
                      <input
                        type="number"
                        {...register('maxAdvanceBooking')}
                        className="input"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('requiresConfirmation')}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Requiere confirmación manual
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? 'Guardando...' : service ? 'Actualizar' : 'Crear'}
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

// Category Modal Component
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function CategoryModal({ isOpen, onClose, onSuccess }: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string; description?: string; color?: string }>({
    defaultValues: {
      color: '#3B82F6',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) =>
      serviceService.createCategory(data),
    onSuccess: () => {
      toast.success('Categoría creada');
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear categoría');
    },
  });

  const onSubmit = (data: { name: string; description?: string; color?: string }) => {
    createMutation.mutate(data);
  };

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
                    Nueva Categoría
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                  <div>
                    <label className="label">Nombre *</label>
                    <input
                      {...register('name', { required: 'Requerido' })}
                      className={`input ${errors.name ? 'input-error' : ''}`}
                      placeholder="Ej: Cortes, Tratamientos, Coloración..."
                    />
                  </div>

                  <div>
                    <label className="label">Descripción</label>
                    <textarea
                      {...register('description')}
                      rows={2}
                      className="input"
                      placeholder="Descripción de la categoría..."
                    />
                  </div>

                  <div>
                    <label className="label">Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        {...register('color')}
                        className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        {...register('color')}
                        className="input flex-1"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? 'Creando...' : 'Crear Categoría'}
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
