import { useState, useEffect } from 'react';
import { useServices } from '@/hooks/useServices';
import { ServiceDurations } from '@/lib/service-durations';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import type { ServiceItem } from '@/types/user';

interface ServicesTabProps {
  role?: 'admin' | 'staff';
}

export function ServicesTab({ role = 'staff' }: ServicesTabProps) {
  const { services, loadServices, createService, updateService, deleteService } = useServices();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [serviceToDeactivate, setServiceToDeactivate] = useState<ServiceItem | null>(null);

  const handleEdit = (service: ServiceItem) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDelete = (service: ServiceItem) => {
    // Prevent deletion of Consultation service - matching legacy logic exactly
    const serviceName = service.name?.trim().toLowerCase() || '';
    if (service.id === 'srv001' || serviceName === 'consultation') {
      alert('Consultation service cannot be deleted as it is a default system service.');
      return;
    }
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await deleteService(serviceToDelete.id || '');
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete service');
    }
  };

  const handleDeactivate = (service: ServiceItem) => {
    // Prevent deactivation of Consultation service
    const serviceName = service.name?.trim().toLowerCase() || '';
    if (service.id === 'srv001' || serviceName === 'consultation') {
      alert('Consultation service cannot be deactivated as it is a default system service.');
      return;
    }
    setServiceToDeactivate(service);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!serviceToDeactivate) return;

    try {
      const isActive = serviceToDeactivate.active !== false; // Default to true if undefined
      await updateService(serviceToDeactivate.id || '', { active: !isActive });
      setShowDeactivateModal(false);
      setServiceToDeactivate(null);
      void loadServices();
      setSuccessMessage(
        `Service "${serviceToDeactivate.name}" has been ${!isActive ? 'activated' : 'deactivated'} successfully!`
      );
      setShowSuccessModal(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update service status');
    }
  };

  // Filter services based on active status
  const activeServices = services.filter(s => s.active !== false); // Default to true
  const inactiveServices = services.filter(s => s.active === false);
  const displayedServices = showInactive ? services : activeServices;

  // Calculate statistics
  const totalServices = services.length;
  const activeCount = activeServices.length;
  const inactiveCount = inactiveServices.length;
  const servicesWithPrice = displayedServices.filter(s => s.price).length;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Services</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage dental services and treatments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Inactive Services */}
          {inactiveCount > 0 && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                showInactive
                  ? 'bg-gray-700 dark:bg-gray-600 text-white dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {showInactive ? 'Show Active Only' : `Show Inactive (${inactiveCount})`}
            </button>
          )}
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Service
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Total Services</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{totalServices}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Active Services</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-200">{activeCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          {inactiveCount > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Inactive Services</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{inactiveCount}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">With Pricing</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-200">{servicesWithPrice}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 rounded-xl p-6 border border-gold-200 dark:border-gold-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gold-700 dark:text-gold-300 mb-1">Average Duration</p>
                <p className="text-3xl font-bold text-gold-900 dark:text-gold-200">
                  {services.length > 0 
                    ? ServiceDurations.minutesToTime(
                        Math.round(services.reduce((sum, s) => sum + ServiceDurations.getDuration(s), 0) / services.length)
                      )
                    : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-gold-200 dark:bg-gold-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-700 dark:text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services List - Enhanced card layout */}
      {displayedServices.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Services Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by adding your first service</p>
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              + Add Your First Service
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service) => {
            const isActive = service.active !== false; // Default to true
            const duration = ServiceDurations.getDuration(service);
            const durationText = ServiceDurations.minutesToTime(duration);

            return (
              <div
                key={service.id}
                className={`bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden transform hover:-translate-y-1 flex flex-col min-h-[400px] ${
                  isActive
                    ? 'border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-500'
                    : 'border-gray-300 dark:border-gray-600 opacity-75'
                }`}
              >
                {/* Service Header with Icon and Edit Button */}
                <div className={`bg-gradient-to-r px-6 py-4 ${
                  isActive ? 'from-gold-500 to-gold-400' : 'from-gray-400 to-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-black">{service.name}</h3>
                      {!isActive && (
                        <span className="px-2 py-0.5 bg-black/20 text-black text-xs font-bold rounded">INACTIVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(role === 'admin' || role === 'staff') && (
                        <button
                          onClick={() => handleEdit(service)}
                          className="w-8 h-8 bg-black/20 hover:bg-black/30 rounded-lg flex items-center justify-center transition-all group"
                          title="Edit this service"
                        >
                          <svg className="w-4 h-4 text-black group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Body */}
                <div className="p-6 flex flex-col flex-1 min-h-0">
                  <div className="flex-grow space-y-4 mb-4">
                    {/* Duration Badge */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Duration</p>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-300">{durationText}</p>
                      </div>
                    </div>

                    {/* Price Badge */}
                    {service.price && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Price</p>
                          <p className="text-sm font-bold text-green-900 dark:text-green-300">{service.price}</p>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div className="pt-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {service.description || 'No description available'}
                      </p>
                    </div>
                  </div>

                  {/* Service Actions - Admin and Staff (Bottom buttons for better visibility) */}
                  <div className="flex gap-2 pt-4 border-t-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {(role === 'admin' || role === 'staff') ? (
                      <>
                        <button
                          onClick={() => handleEdit(service)}
                          className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-black-800 dark:to-black-700 hover:from-gray-200 hover:to-gray-100 dark:hover:from-black-700 dark:hover:to-black-600 rounded-lg transition-all font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-gray-300 dark:border-gray-600"
                          title="Edit this service"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeactivate(service)}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 ${
                            isActive
                              ? 'text-white bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 border-orange-600'
                              : 'text-white bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 border-green-600'
                          }`}
                          title={isActive ? 'Deactivate this service' : 'Activate this service'}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isActive ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          className="flex-1 px-4 py-3 text-white bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 rounded-lg transition-all font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 border-2 border-red-600"
                          title="Delete this service"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Service Modal */}
      {(role === 'admin' || role === 'staff') && (
        <CreateServiceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(serviceName) => {
            void loadServices();
            setShowCreateModal(false);
            setSuccessMessage(`Service "${serviceName}" has been created successfully!`);
            setShowSuccessModal(true);
          }}
          createService={createService}
        />
      )}

      {/* Edit Service Modal */}
      {(role === 'admin' || role === 'staff') && selectedService && (
        <EditServiceModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onSuccess={(serviceName) => {
            void loadServices();
            setShowEditModal(false);
            setSelectedService(null);
            setSuccessMessage(`Service "${serviceName}" has been updated successfully!`);
            setShowSuccessModal(true);
          }}
          updateService={updateService}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setServiceToDeactivate(null);
        }}
        onConfirm={handleConfirmDeactivate}
        title={serviceToDeactivate?.active !== false ? 'Deactivate Service' : 'Activate Service'}
        message={
          serviceToDeactivate?.active !== false
            ? `Are you sure you want to deactivate "${serviceToDeactivate?.name}"? This service will be hidden from patients but can be reactivated later.`
            : `Are you sure you want to activate "${serviceToDeactivate?.name}"? This service will be visible to patients again.`
        }
        confirmText={serviceToDeactivate?.active !== false ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={serviceToDeactivate?.active !== false ? 'warning' : 'info'}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </div>
  );
}

// Create Service Modal Component
function CreateServiceModal({
  isOpen,
  onClose,
  onSuccess,
  createService,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (serviceName: string) => void;
  createService: (
    service: Partial<ServiceItem>,
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '30 mins',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        duration: '30 mins',
        price: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const normalizeDuration = (duration: string): string => {
    // Normalize duration format - matching legacy logic
    const trimmed = duration.trim().toLowerCase();
    if (!trimmed) return '30 mins';

    // Handle HH:MM format
    if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
      return duration.trim();
    }

    // Handle "X mins", "X minutes", "X hour(s)", etc.
    if (trimmed.includes('min') || trimmed.includes('hour')) {
      return duration.trim();
    }

    // If just a number, assume minutes
    const numericValue = parseFloat(trimmed);
    if (!isNaN(numericValue) && numericValue > 0) {
      return `${Math.round(numericValue)} mins`;
    }

    return duration.trim() || '30 mins';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.description || !formData.duration) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const serviceData: Partial<ServiceItem> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: normalizeDuration(formData.duration),
        price: formData.price ? formData.price.trim() : undefined,
      };

      const result = await createService(serviceData);
      if (result.success) {
        setLoading(false);
        onSuccess(serviceData.name);
      } else {
        setError(result.message || 'Failed to create service');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Service" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration *</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 30 mins, 1 hour, 1:30"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Examples: 30 mins, 1 hour, 1:30, 90 mins</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (Optional)</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., ₱500, ₱1,000"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Service Modal Component
function EditServiceModal({
  isOpen,
  onClose,
  service,
  onSuccess,
  updateService,
}: {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceItem | null;
  onSuccess: (serviceName: string) => void;
  updateService: (
    id: string | number,
    updates: Partial<ServiceItem>,
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration: service?.duration || '30 mins',
    price: service?.price || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && service) {
      setFormData({
        name: service?.name || '',
        description: service?.description || '',
        duration: service?.duration || '30 mins',
        price: service?.price || '',
      });
      setError(null);
    }
  }, [isOpen, service]);

  const normalizeDuration = (duration: string): string => {
    // Normalize duration format - matching legacy logic
    const trimmed = duration.trim().toLowerCase();
    if (!trimmed) return '30 mins';

    if (/^\d{1,2}:\d{1,2}$/.test(trimmed)) {
      return duration.trim();
    }

    if (trimmed.includes('min') || trimmed.includes('hour')) {
      return duration.trim();
    }

    const numericValue = parseFloat(trimmed);
    if (!isNaN(numericValue) && numericValue > 0) {
      return `${Math.round(numericValue)} mins`;
    }

    return duration.trim() || '30 mins';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.name || !formData.description || !formData.duration) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const updates: Partial<ServiceItem> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: normalizeDuration(formData.duration),
        price: formData.price ? formData.price.trim() : service?.price || '',
      };

      if (!service?.id) {
        setError('Service ID is missing');
        setLoading(false);
        return;
      }

      const result = await updateService(service.id, updates);
      if (result.success) {
        setLoading(false);
        onSuccess(updates.name || service?.name || 'Service');
      } else {
        setError(result.message || 'Failed to update service');
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Service" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration *</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 30 mins, 1 hour, 1:30"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Examples: 30 mins, 1 hour, 1:30, 90 mins</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price (Optional)</label>
            <input
              type="text"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="e.g., ₱500, ₱1,000"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

