import { useState, Fragment, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { clientService } from '@/services/clients';
import { Client, CreateClientData, ClientFilters } from '@/types';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    limit: 20,
    search: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientService.getAll(filters),
  });

  const clients = data?.data?.clients || [];
  const pagination = data?.data?.pagination;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientService.delete(id),
    onSuccess: () => {
      toast.success('Cliente eliminado');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleOpenModal = (client?: Client) => {
    setEditingClient(client || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = (client: Client) => {
    if (confirm(`¿Estás seguro de eliminar a ${client.firstName} ${client.lastName}?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestiona tu base de datos de clientes
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Citas</th>
                <th>Última visita</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6}>
                      <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No hay clientes que mostrar
                    </p>
                    <button
                      onClick={() => handleOpenModal()}
                      className="mt-4 text-primary-600 hover:text-primary-500"
                    >
                      Agregar primer cliente
                    </button>
                  </td>
                </tr>
              ) : (
                clients.map((client: Client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                            {client.firstName?.[0]}{client.lastName?.[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <Link
                            to={`/clients/${client.id}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-primary-600"
                          >
                            {client.firstName} {client.lastName}
                          </Link>
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {client.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                          >
                            <EnvelopeIcon className="w-4 h-4" />
                            {client.email}
                          </a>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600"
                          >
                            <PhoneIcon className="w-4 h-4" />
                            {client.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {client._count?.appointments || 0}
                      </span>
                    </td>
                    <td>
                      {client.lastVisit ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          {format(new Date(client.lastVisit), "d MMM yyyy", { locale: es })}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Sin visitas</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          client.isActive
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {client.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/clients/${client.id}`}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleOpenModal(client)}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                disabled={pagination.page <= 1}
                className="btn-secondary btn-sm"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary btn-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={editingClient}
        onSuccess={() => {
          handleCloseModal();
          refetch();
        }}
      />
    </div>
  );
}

// Client Modal Component
interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  onSuccess?: () => void;
}

function ClientModal({ isOpen, onClose, client, onSuccess }: ClientModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientData>();

  // Reset form when client changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (client) {
        reset({
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email || '',
          phone: client.phone || '',
          birthDate: client.birthDate?.split('T')[0] || '',
          gender: client.gender,
          address: client.address || '',
          city: client.city || '',
          notes: client.notes || '',
          source: client.source || '',
        });
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          birthDate: '',
          gender: undefined,
          address: '',
          city: '',
          notes: '',
          source: '',
        });
      }
    }
  }, [isOpen, client, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientService.create(data),
    onSuccess: () => {
      toast.success('Cliente creado exitosamente');
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateClientData) => clientService.update(client!.id, data),
    onSuccess: () => {
      toast.success('Cliente actualizado');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar');
    },
  });

  const onSubmit = (data: CreateClientData) => {
    if (client) {
      updateMutation.mutate(data);
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    {client ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                    <label className="label">Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input"
                      placeholder="cliente@email.com"
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Fecha de nacimiento</label>
                      <input
                        type="date"
                        {...register('birthDate')}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Género</label>
                      <select {...register('gender')} className="input">
                        <option value="">Seleccionar</option>
                        <option value="MALE">Masculino</option>
                        <option value="FEMALE">Femenino</option>
                        <option value="OTHER">Otro</option>
                        <option value="PREFER_NOT_TO_SAY">Prefiero no decir</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Dirección</label>
                    <input
                      {...register('address')}
                      className="input"
                      placeholder="Calle 123"
                    />
                  </div>

                  <div>
                    <label className="label">Ciudad</label>
                    <input
                      {...register('city')}
                      className="input"
                      placeholder="Ciudad"
                    />
                  </div>

                  <div>
                    <label className="label">Fuente</label>
                    <select {...register('source')} className="input">
                      <option value="">¿Cómo nos conoció?</option>
                      <option value="REFERRAL">Referido</option>
                      <option value="SOCIAL_MEDIA">Redes sociales</option>
                      <option value="GOOGLE">Google</option>
                      <option value="WALK_IN">Pasando por aquí</option>
                      <option value="OTHER">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Notas</label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="input"
                      placeholder="Notas adicionales sobre el cliente..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn-secondary">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? 'Guardando...' : client ? 'Actualizar' : 'Crear'}
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
