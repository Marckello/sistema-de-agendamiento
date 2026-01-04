import { useState, Fragment, useEffect } from 'react';
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
  UserGroupIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { serviceService } from '@/services/services';
import { userService } from '@/services/users';
import { Service, CreateServiceData, ServiceCategory, User } from '@/types';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

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

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

interface ScheduleDay {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

function ServiceModal({ isOpen, onClose, service, categories, onSuccess }: ServiceModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'employees' | 'schedule'>('general');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDay[]>(
    DAYS_OF_WEEK.map(day => ({
      dayOfWeek: day.value,
      isAvailable: day.value >= 1 && day.value <= 5, // Lun-Vie por defecto
      startTime: '09:00',
      endTime: '18:00',
    }))
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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
      isPublic: service.isPublic ?? true,
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
      isPublic: true,
      requiresConfirmation: false,
      maxAdvanceBooking: 30,
      minAdvanceBooking: 1,
    },
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => userService.getEmployees(),
    enabled: isOpen,
  });
  const employees = employeesData?.data || [];

  // Cargar datos del servicio cuando se edita
  useEffect(() => {
    if (service && isOpen) {
      // Cargar empleados asignados
      if (service.employees) {
        setSelectedEmployees(service.employees.map(e => e.id));
      }
      // Cargar horarios
      if (service.schedules && service.schedules.length > 0) {
        const loadedSchedules = DAYS_OF_WEEK.map(day => {
          const found = service.schedules?.find(s => s.dayOfWeek === day.value);
          return found ? {
            dayOfWeek: found.dayOfWeek,
            isAvailable: found.isAvailable,
            startTime: found.startTime,
            endTime: found.endTime,
          } : {
            dayOfWeek: day.value,
            isAvailable: false,
            startTime: '09:00',
            endTime: '18:00',
          };
        });
        setSchedules(loadedSchedules);
      }
    } else if (!service && isOpen) {
      // Reset para nuevo servicio
      setSelectedEmployees([]);
      setSchedules(DAYS_OF_WEEK.map(day => ({
        dayOfWeek: day.value,
        isAvailable: day.value >= 1 && day.value <= 5,
        startTime: '09:00',
        endTime: '18:00',
      })));
    }
  }, [service, isOpen]);

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleDay = (dayOfWeek: number) => {
    setSchedules(prev =>
      prev.map(s =>
        s.dayOfWeek === dayOfWeek ? { ...s, isAvailable: !s.isAvailable } : s
      )
    );
  };

  const updateScheduleTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedules(prev =>
      prev.map(s =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    );
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceData) => serviceService.create(data),
    onSuccess: () => {
      toast.success('Servicio creado');
      reset();
      setActiveTab('general');
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
    const formattedData = {
      ...data,
      duration: Number(data.duration),
      bufferTime: Number(data.bufferTime || 0),
      price: Number(data.price),
      maxAdvanceBooking: Number(data.maxAdvanceBooking || 30),
      minAdvanceBooking: Number(data.minAdvanceBooking || 1),
      employeeIds: selectedEmployees,
      schedules: schedules.filter(s => s.isAvailable).map(s => ({
        dayOfWeek: s.dayOfWeek,
        isAvailable: s.isAvailable,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
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

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === 'general'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    General
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('employees')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                      activeTab === 'employees'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <UserGroupIcon className="w-4 h-4" />
                    Empleados
                    {selectedEmployees.length > 0 && (
                      <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs px-2 py-0.5 rounded-full">
                        {selectedEmployees.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                      activeTab === 'schedule'
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <CalendarDaysIcon className="w-4 h-4" />
                    Horarios
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                  {/* Tab: General */}
                  {activeTab === 'general' && (
                    <div className="space-y-4">
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

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Requiere confirmación manual
                        </span>
                        <ToggleSwitch
                          checked={watch('requiresConfirmation') || false}
                          onChange={(val) => setValue('requiresConfirmation', val)}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            🌐 Visible en reservas online
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Los clientes podrán ver y reservar este servicio desde tu página pública
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={watch('isPublic') ?? true}
                          onChange={(val) => setValue('isPublic', val)}
                          size="sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab: Empleados */}
                  {activeTab === 'employees' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Selecciona los empleados que pueden realizar este servicio
                      </p>
                      
                      {employees.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No hay empleados registrados
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                          {employees.map((employee: User) => (
                            <div
                              key={employee.id}
                              onClick={() => toggleEmployee(employee.id)}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedEmployees.includes(employee.id)
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {employee.firstName} {employee.lastName}
                                  </div>
                                  {employee.specialty && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {employee.specialty}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ToggleSwitch
                                checked={selectedEmployees.includes(employee.id)}
                                onChange={() => toggleEmployee(employee.id)}
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: Horarios */}
                  {activeTab === 'schedule' && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Define los días y horarios en que está disponible este servicio
                      </p>

                      <div className="space-y-3">
                        {DAYS_OF_WEEK.map((day) => {
                          const schedule = schedules.find(s => s.dayOfWeek === day.value);
                          return (
                            <div
                              key={day.value}
                              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                                schedule?.isAvailable
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-[140px]">
                                <ToggleSwitch
                                  checked={schedule?.isAvailable || false}
                                  onChange={() => toggleDay(day.value)}
                                  size="sm"
                                />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {day.label}
                                </span>
                              </div>

                              {schedule?.isAvailable && (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="time"
                                    value={schedule.startTime}
                                    onChange={(e) => updateScheduleTime(day.value, 'startTime', e.target.value)}
                                    className="input py-1.5 text-sm"
                                  />
                                  <span className="text-gray-500">a</span>
                                  <input
                                    type="time"
                                    value={schedule.endTime}
                                    onChange={(e) => updateScheduleTime(day.value, 'endTime', e.target.value)}
                                    className="input py-1.5 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
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
