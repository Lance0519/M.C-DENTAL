import { useState, useEffect } from 'react';
import { usePromos } from '@/hooks/usePromos';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { SuccessModal } from '@/components/modals/SuccessModal';
import type { Promo } from '@/types/user';

interface PromosTabProps {
  role?: 'admin' | 'staff';
}

export function PromosTab({ role = 'staff' }: PromosTabProps) {
  const { promos, loadPromos, createPromo, updatePromo, deletePromo } = usePromos();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<Promo | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [promoToDeactivate, setPromoToDeactivate] = useState<Promo | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleEdit = (promo: Promo) => {
    setSelectedPromo(promo);
    setShowEditModal(true);
  };

  const handleDelete = (promo: Promo) => {
    setPromoToDelete(promo);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!promoToDelete) return;

    const result = deletePromo(promoToDelete.id as string);
    if (result.success) {
      setShowDeleteModal(false);
      setPromoToDelete(null);
      loadPromos();
    } else {
      alert(result.message || 'Failed to delete promotion');
    }
  };

  const handleDeactivate = (promo: Promo) => {
    setPromoToDeactivate(promo);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = () => {
    if (!promoToDeactivate) return;

    try {
      const isActive = promoToDeactivate.active !== false; // Default to true if undefined
      const result = updatePromo(promoToDeactivate.id as string, { active: !isActive });
      if (result.success) {
        setShowDeactivateModal(false);
        setPromoToDeactivate(null);
        loadPromos();
        setSuccessMessage(
          `Promotion "${promoToDeactivate.title}" has been ${!isActive ? 'activated' : 'deactivated'} successfully!`
        );
        setShowSuccessModal(true);
      } else {
        alert(result.message || 'Failed to update promotion status');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update promotion status');
    }
  };

  // Filter promos based on active status
  const activePromos = promos.filter(p => p.active !== false); // Default to true
  const inactivePromos = promos.filter(p => p.active === false);
  const displayedPromos = showInactive ? promos : activePromos;

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: string | number | undefined): string => {
    if (!price) return 'N/A';
    const priceStr = typeof price === 'number' ? price.toString() : price;
    // If already formatted, return as is
    if (priceStr.includes('₱') || priceStr.includes('$')) {
      return priceStr;
    }
    return `₱${priceStr}`;
  };

  // Calculate statistics
  const totalPromos = promos.length;
  const activePromosCount = activePromos.length;
  const inactivePromosCount = inactivePromos.length;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Promotions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage special offers and discounts</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Inactive Promos */}
          {inactivePromosCount > 0 && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                showInactive
                  ? 'bg-gray-700 dark:bg-gray-600 text-white dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {showInactive ? 'Show Active Only' : `Show Inactive (${inactivePromosCount})`}
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
              Add Promotion
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {promos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-gold-50 to-gold-100 dark:from-gold-900/30 dark:to-gold-800/30 rounded-xl p-6 border border-gold-200 dark:border-gold-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gold-700 dark:text-gold-300 mb-1">Total Promotions</p>
                <p className="text-3xl font-bold text-gold-900 dark:text-gold-100">{totalPromos}</p>
              </div>
              <div className="w-12 h-12 bg-gold-200 dark:bg-gold-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-700 dark:text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Active Promotions</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{activePromosCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          {inactivePromosCount > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Inactive Promotions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{inactivePromosCount}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Promotions List - Enhanced beautiful gold/white/black themed cards */}
      {displayedPromos.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Promotions Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started by creating your first promotion</p>
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              + Create Your First Promotion
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPromos.map((promo) => {
            const isActive = promo.active !== false; // Default to true

            return (
              <div
                key={promo.id}
                className={`bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden transform hover:-translate-y-1 ${
                  isActive
                    ? 'border-gold-200 dark:border-gold-700 hover:border-gold-400 dark:hover:border-gold-500'
                    : 'border-gray-300 dark:border-gray-600 opacity-75'
                }`}
              >
                {/* Promo Header - Gold accent */}
                <div className={`bg-gradient-to-r px-6 py-4 border-b-2 ${
                  isActive ? 'from-gold-500 to-gold-400 border-gold-600' : 'from-gray-400 to-gray-500 border-gray-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-black dark:text-black">{promo.title}</h3>
                    {!isActive && (
                      <span className="px-2 py-0.5 bg-black/20 text-black dark:text-black text-xs font-bold rounded">INACTIVE</span>
                    )}
                  </div>
                </div>

              {/* Promo Body */}
              <div className="p-6 space-y-4">
                {/* Discount Badge */}
                {promo.discount && (
                  <div className="inline-block px-4 py-2 bg-gradient-to-r from-gold-400 to-gold-300 rounded-full shadow-md">
                    <span className="text-black font-bold text-sm">{promo.discount}</span>
                  </div>
                )}

                {/* Price Information */}
                <div className="space-y-2">
                  {promo.originalPrice && promo.promoPrice && (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(promo.originalPrice)}
                      </span>
                      <span className="text-2xl font-bold text-black dark:text-gray-100">
                        {formatPrice(promo.promoPrice || promo.price)}
                      </span>
                    </div>
                  )}
                  {!promo.originalPrice && (
                    <div className="text-2xl font-bold text-black dark:text-gray-100">
                      {formatPrice(promo.promoPrice || promo.price)}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{promo.description}</p>

                {/* Valid Until */}
                {promo.validUntil && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        Valid until: {formatDate(promo.validUntil)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Promo Actions - Admin only */}
              {(role === 'admin' || role === 'staff') && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-black-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleEdit(promo)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeactivate(promo)}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500'
                        : 'bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500'
                    }`}
                  >
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(promo)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all transform hover:scale-105 text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setPromoToDeactivate(null);
        }}
        onConfirm={handleConfirmDeactivate}
        title={promoToDeactivate?.active !== false ? 'Deactivate Promotion' : 'Activate Promotion'}
        message={
          promoToDeactivate?.active !== false
            ? `Are you sure you want to deactivate "${promoToDeactivate?.title}"? This promotion will be hidden from patients but can be reactivated later.`
            : `Are you sure you want to activate "${promoToDeactivate?.title}"? This promotion will be visible to patients again.`
        }
        confirmText={promoToDeactivate?.active !== false ? 'Yes, Deactivate' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={promoToDeactivate?.active !== false ? 'warning' : 'info'}
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

      {/* Create Promotion Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && (
        <CreatePromoModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadPromos();
            setShowCreateModal(false);
          }}
          createPromo={createPromo}
        />
      )}

      {/* Edit Promotion Modal (Admin only) */}
      {(role === 'admin' || role === 'staff') && selectedPromo && (
        <EditPromoModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPromo(null);
          }}
          promo={selectedPromo}
          updatePromo={updatePromo}
          onSuccess={() => {
            loadPromos();
            setShowEditModal(false);
            setSelectedPromo(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPromoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Promotion"
        message={`Are you sure you want to delete "${promoToDelete?.title}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

// Create Promotion Modal Component
function CreatePromoModal({
  isOpen,
  onClose,
  onSuccess,
  createPromo,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createPromo: (promo: Omit<Promo, 'id' | 'createdAt'>) => { success: boolean; message?: string; data?: Promo };
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    originalPrice: '',
    promoPrice: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        discount: '',
        validUntil: '',
        originalPrice: '',
        promoPrice: '',
        duration: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title || !formData.description) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const promoData: Omit<Promo, 'id' | 'createdAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim() || '',
        validUntil: formData.validUntil || '',
        originalPrice: formData.originalPrice.trim() || '',
        promoPrice: formData.promoPrice.trim() || formData.originalPrice.trim() || '',
        price: formData.promoPrice.trim() || formData.originalPrice.trim() || '',
        duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
      };

      const result = createPromo(promoData);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to create promotion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Promotion" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="e.g., Summer Special, Holiday Discount"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Describe the promotion details..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Discount</label>
            <input
              type="text"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g., 20% OFF, Save ₱500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Valid Until</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Original Price</label>
            <input
              type="text"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g., ₱1,000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Promo Price</label>
            <input
              type="text"
              value={formData.promoPrice}
              onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g., ₱800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Duration (minutes) - Optional
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">For services like metal braces installation</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="e.g., 60 (for 1 hour)"
          />
          <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            If specified, this duration will be used for appointment scheduling when this promotion is applied. Leave empty to use standard service duration.
          </small>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Promotion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Promotion Modal Component
function EditPromoModal({
  isOpen,
  onClose,
  promo,
  updatePromo,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  promo: Promo;
  updatePromo: (id: string, promo: Partial<Promo>) => { success: boolean; message?: string; data?: Promo };
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: promo.title || '',
    description: promo.description || '',
    discount: promo.discount?.toString() || '',
    validUntil: promo.validUntil || '',
    originalPrice: promo.originalPrice?.toString() || '',
    promoPrice: promo.promoPrice?.toString() || promo.price?.toString() || '',
    duration: promo.duration?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: promo.title || '',
        description: promo.description || '',
        discount: promo.discount?.toString() || '',
        validUntil: promo.validUntil || '',
        originalPrice: promo.originalPrice?.toString() || '',
        promoPrice: promo.promoPrice?.toString() || promo.price?.toString() || '',
        duration: promo.duration?.toString() || '',
      });
      setError(null);
    }
  }, [isOpen, promo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title || !formData.description) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      const updates: Partial<Promo> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim() || undefined,
        validUntil: formData.validUntil || undefined,
        originalPrice: formData.originalPrice.trim() || undefined,
        promoPrice: formData.promoPrice.trim() || formData.originalPrice.trim() || undefined,
        price: formData.promoPrice.trim() || formData.originalPrice.trim() || undefined,
        duration: formData.duration ? parseInt(formData.duration, 10) : undefined,
      };

      const result = updatePromo(promo.id as string, updates);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'Failed to update promotion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update promotion');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Promotion" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Discount</label>
            <input
              type="text"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Valid Until</label>
            <input
              type="date"
              value={formatDate(formData.validUntil)}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Original Price</label>
            <input
              type="text"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Promo Price</label>
            <input
              type="text"
              value={formData.promoPrice}
              onChange={(e) => setFormData({ ...formData, promoPrice: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Duration (minutes) - Optional
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">For services like metal braces installation</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-2 focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-colors"
            placeholder="e.g., 60 (for 1 hour)"
          />
          <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            If specified, this duration will be used for appointment scheduling when this promotion is applied. Leave empty to use standard service duration.
          </small>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t-2 border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Promotion'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

