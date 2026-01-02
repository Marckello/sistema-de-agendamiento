import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
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
}

export default function AppointmentModal({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
}: AppointmentModalProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
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
  const { data: slotsData, refetch: refetchSlots } = useQuery({
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
    if (slotsData?.data) {
      setAvailableSlots(slotsData.data);
    }
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

  const onSubmit = (data: any) => {
    if (!selectedClient || !selectedService || !selectedEmployee || !selectedSlot) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    createMutation.mutate({
      clientId: selectedClient.id,
      serviceId: selectedService.id,
      employeeId: selectedEmployee.id,
      startTime: selectedSlot,
      notes: data.notes,
      internalNotes: data.internalNotes,
    });
  };

  const clients = clientsData?.data || [];
  const services = servicesData?.data || [];
  const employees = employeesData?.data || [];

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
                    Nueva Cita
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
                        <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {availableSlots
                            .filter((slot) => slot.available)
                            .map((slot) => (
                              <button
                                key={slot.start}
                                type="button"
                                onClick={() => setSelectedSlot(slot.start)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                  selectedSlot === slot.start
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-500'
                                }`}
                              >
                                {format(new Date(slot.start), 'HH:mm')}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No hay horarios disponibles para esta fecha
                        </p>
                      )}
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
                      disabled={createMutation.isPending}
                      className="btn-primary"
                    >
                      {createMutation.isPending ? 'Creando...' : 'Crear Cita'}
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
