import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { appointmentService } from '@/services/appointments';
import { clientService } from '@/services/clients';
import { serviceService } from '@/services/services';
import { userService } from '@/services/users';
import { Client, Service, User, CreateAppointmentData, TimeSlot } from '@/types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  onSuccess?: () => void;
  editAppointment?: any; // For editing existing appointments
}

export default function AppointmentModal({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
  editAppointment,
}: AppointmentModalProps) {
  const isEditing = !!editAppointment;
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    editAppointment?.client || null
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    editAppointment?.service || null
  );
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(
    editAppointment?.employee || null
  );
  const [selectedDate, setSelectedDate] = useState(
    editAppointment?.date 
      ? format(new Date(editAppointment.date), 'yyyy-MM-dd')
      : initialDate 
        ? format(initialDate, 'yyyy-MM-dd') 
        : format(new Date(), 'yyyy-MM-dd')
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(
    editAppointment?.startTime || null
  );
  const [selectedSlotWarning, setSelectedSlotWarning] = useState<TimeSlot | null>(null);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);

  const {
    register,
    handleSubmit,
  } = useForm<CreateAppointmentData>();

  // Fetch clients
  const { data: clientsData } = useQuery({
    queryKey: ['clients-search', clientSearch],
    queryFn: () => clientService.search(clientSearch, 10),
    enabled: clientSearch.length >= 2,
  });

  // Fetch services
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceService.getAll(),
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => userService.getEmployees(),
  });

  // Fetch available slots when service, employee, and date are selected
  const { data: slotsData } = useQuery({
    queryKey: ['available-slots', selectedEmployee?.id, selectedService?.id, selectedDate],
    queryFn: () =>
      appointmentService.getAvailableSlots(
        selectedEmployee!.id,
        selectedService!.id,
        selectedDate
      ),
    enabled: !!(selectedEmployee && selectedService && selectedDate),
  });

  useEffect(() => {
    // Los slots vienen en data.slots, no directamente en data
    const slots = slotsData?.data?.slots || slotsData?.data || [];
    if (Array.isArray(slots)) {
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
    // Reset warning states when slots change
    setSelectedSlotWarning(null);
    setWarningAccepted(false);
  }, [slotsData]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentData) => appointmentService.create(data),
    onSuccess: () => {
      toast.success('Cita creada exitosamente');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la cita');
    },
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => appointmentService.update(editAppointment?.id, data),
    onSuccess: () => {
      toast.success('Cita actualizada exitosamente');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la cita');
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedClient || !selectedService || !selectedEmployee || !selectedSlot) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    const appointmentData = {
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      employeeId: selectedEmployee.id,
      date: selectedDate,
      startTime: selectedSlot,
      notes: data.notes,
      internalNotes: data.internalNotes,
    };

    if (isEditing) {
      updateMutation.mutate(appointmentData);
    } else {
      createMutation.mutate(appointmentData);
    }
  };

  // Helper to extract array from API response (handles both direct arrays and nested objects)
  const extractArray = (data: any, key?: string): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (key && data[key] && Array.isArray(data[key])) return data[key];
    return [];
  };

  const clients = extractArray(clientsData?.data, 'clients');
  const services = extractArray(servicesData?.data);
  const employees = extractArray(employeesData?.data, 'users');

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
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Editar Cita' : 'Nueva Cita'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                  {/* Client Search */}
                  <div>
                    <label className="label">Cliente *</label>
                    {selectedClient ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedClient.firstName} {selectedClient.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedClient.email || selectedClient.phone}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedClient(null)}
                          className="text-sm text-primary-600 hover:text-primary-500"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Buscar cliente..."
                          className="input pl-10"
                        />
                        {clients.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {clients.map((client: Client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setClientSearch('');
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {client.firstName} {client.lastName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {client.email || client.phone}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Service Select */}
                  <div>
                    <label className="label">Servicio *</label>
                    <Listbox value={selectedService} onChange={setSelectedService}>
                      <div className="relative">
                        <Listbox.Button className="input text-left flex items-center justify-between">
                          <span className={selectedService ? '' : 'text-gray-400'}>
                            {selectedService?.name || 'Seleccionar servicio'}
                          </span>
                          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {services.map((service: Service) => (
                              <Listbox.Option
                                key={service.id}
                                value={service}
                                className={({ active }) =>
                                  `cursor-pointer px-4 py-2 ${
                                    active ? 'bg-gray-50 dark:bg-gray-700' : ''
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-white">
                                        {service.name}
                                      </p>
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {service.duration} min - ${service.price}
                                      </p>
                                    </div>
                                    {selected && (
                                      <CheckIcon className="w-5 h-5 text-primary-600" />
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Employee Select */}
                  <div>
                    <label className="label">Empleado *</label>
                    <Listbox value={selectedEmployee} onChange={setSelectedEmployee}>
                      <div className="relative">
                        <Listbox.Button className="input text-left flex items-center justify-between">
                          <span className={selectedEmployee ? '' : 'text-gray-400'}>
                            {selectedEmployee
                              ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                              : 'Seleccionar empleado'}
                          </span>
                          <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {employees.map((employee: User) => (
                              <Listbox.Option
                                key={employee.id}
                                value={employee}
                                className={({ active }) =>
                                  `cursor-pointer px-4 py-2 ${
                                    active ? 'bg-gray-50 dark:bg-gray-700' : ''
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {employee.firstName} {employee.lastName}
                                    </p>
                                    {selected && (
                                      <CheckIcon className="w-5 h-5 text-primary-600" />
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="label">Fecha *</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="input"
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedEmployee && selectedService && selectedDate && (
                    <div>
                      <label className="label">Hora *</label>
                      {availableSlots.length > 0 ? (
                        <>
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                            {availableSlots
                              .filter((slot) => slot.available)
                              .map((slot) => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => {
                                    if (slot.warning && !warningAccepted) {
                                      setSelectedSlotWarning(slot);
                                      setShowWarningConfirm(true);
                                    } else {
                                      setSelectedSlot(slot.time);
                                      setSelectedSlotWarning(slot.warning ? slot : null);
                                    }
                                  }}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors relative ${
                                    selectedSlot === slot.time
                                      ? 'bg-primary-600 text-white border-primary-600'
                                      : slot.warning
                                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 hover:border-yellow-500'
                                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                                  }`}
                                  title={slot.warningMessage || ''}
                                >
                                  {slot.time}
                                  {slot.warning && selectedSlot !== slot.time && (
                                    <ExclamationTriangleIcon className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
                                  )}
                                </button>
                              ))}
                          </div>
                          {/* Legend */}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-white dark:bg-gray-700 border border-gray-300"></span>
                              Disponible
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-3 h-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300"></span>
                              Con advertencia
                            </span>
                          </div>
                        </>
                      ) : availableSlots.length === 0 && selectedEmployee && selectedService ? (
                        <p className="text-sm text-yellow-500 dark:text-yellow-400">
                          No hay horarios disponibles. Verifica el horario del negocio.
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Selecciona empleado, servicio y fecha para ver horarios
                        </p>
                      )}
                      
                      {/* Warning message for selected slot */}
                      {selectedSlot && selectedSlotWarning?.warning && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg">
                          <div className="flex items-start gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-400">
                              <strong>Advertencia:</strong> {selectedSlotWarning.warningMessage}
                              <span className="block text-xs mt-1 opacity-75">
                                La cita será creada de todas formas.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Warning Confirmation Modal */}
                  {showWarningConfirm && selectedSlotWarning && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm mx-4 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Advertencia de Horario
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {selectedSlotWarning.warningMessage}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                          ¿Deseas agendar la cita de todas formas a las <strong>{selectedSlotWarning.time}</strong>?
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowWarningConfirm(false);
                              setSelectedSlotWarning(null);
                            }}
                            className="btn-secondary flex-1"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSlot(selectedSlotWarning.time);
                              setWarningAccepted(true);
                              setShowWarningConfirm(false);
                            }}
                            className="btn-primary flex-1"
                          >
                            Sí, Agendar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="label">Notas (opcional)</label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      className="input"
                      placeholder="Notas para el cliente..."
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="label">Notas internas (opcional)</label>
                    <textarea
                      {...register('internalNotes')}
                      rows={2}
                      className="input"
                      placeholder="Notas internas (no visibles para el cliente)..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="btn-primary"
                    >
                      {isEditing 
                        ? (updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios')
                        : (createMutation.isPending ? 'Creando...' : 'Crear Cita')
                      }
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
