import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ServiceModal } from '@/components/modals/ServiceModal';
import api from '@/lib/api';
import { ServiceDurations } from '@/lib/service-durations';
import { formatDate, toPeso } from '@/lib/utils';
import type { ServiceItem, Promo } from '@/types/storage';
import '@/styles/design-system.css';
import '../services.css';

const serviceIcons: Record<string, string> = {
  'General Consultation': '🩺',
  'Cardiology': '❤️',
  'Pediatric': '👶',
  'Orthopedic': '🦴',
  'Dermatology': '✨',
  'Lab Tests': '🔬',
  'X-Ray': '📷',
  'Physical Therapy': '💪'
};

function getServiceIcon(serviceName: string): string {
  const name = serviceName.toLowerCase();
  for (const [key, icon] of Object.entries(serviceIcons)) {
    if (name.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return '🦷';
}

export function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPromos, setExpandedPromos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [servicesResponse, promosResponse] = await Promise.all([
          api.getServices(),
          api.getPromotions({ active: true }),
        ]);

        if (!isMounted) return;

        const serviceList = Array.isArray(servicesResponse)
          ? servicesResponse
          : (servicesResponse as any)?.data ?? [];
        const promoList = Array.isArray(promosResponse)
          ? promosResponse
          : (promosResponse as any)?.data ?? [];

        const activeServices = (serviceList as ServiceItem[]).filter(
          (service) => service.active !== false,
        );
        setServices(activeServices);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activePromos = (promoList as Promo[]).filter((promo) => {
          if ((promo as any).active === false) return false;
          if (!promo.validUntil) return true;
          const validUntil = new Date(promo.validUntil);
          validUntil.setHours(0, 0, 0, 0);
          return validUntil >= today;
        });
        setPromos(activePromos);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading services:', err);
        setError(err instanceof Error ? err.message : 'Failed to load services');
        setServices([]);
        setPromos([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleServiceClick = (service: ServiceItem) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const togglePromoExpansion = (promoId: string) => {
    setExpandedPromos((prev) => ({
      ...prev,
      [promoId]: !prev[promoId]
    }));
  };

  return (
    <>
      <Header />
      <main>
        {/* Promos Section */}
        {promos.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-gold-50 dark:from-black-950 dark:via-black-900 dark:to-black-950">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Special Promotions</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Limited time offers on selected dental services
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map((promo) => {
                  const description =
                    promo.description || 'Limited time offer on selected dental services';
                  const isExpanded = !!expandedPromos[promo.id];

                  return (
                    <div
                      key={promo.id}
                      className={`group bg-white dark:bg-black-900 rounded-2xl shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2 overflow-hidden cursor-pointer ${
                        isExpanded ? 'border-gold-300 dark:border-gold-600' : ''
                      }`}
                      onClick={() => togglePromoExpansion(promo.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          togglePromoExpansion(promo.id);
                        }
                      }}
                    >
                      {/* Promo Header */}
                      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-gold-500 px-6 py-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="inline-block px-4 py-1 bg-white/90 rounded-full mb-2">
                              <span className="text-sm font-bold text-purple-600">{promo.discount || promo.title || 'Special Offer'}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{promo.title || 'Special Promotion'}</h3>
                          </div>
                          <div className="text-4xl">✨</div>
                        </div>
                      </div>

                      {/* Promo Body */}
                      <div className="p-6">
                        <p className={`text-gray-600 dark:text-gray-300 mb-4 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {description}
                        </p>
                        
                        {isExpanded && (
                          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {promo.validUntil && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Valid until {formatDate(promo.validUntil)}
                              </div>
                            )}
                            
                            <div className="flex items-baseline gap-3">
                              {promo.originalPrice && (
                                <span className="text-lg text-gray-400 dark:text-gray-500 line-through">{toPeso(promo.originalPrice)}</span>
                              )}
                              <span className="text-3xl font-extrabold text-gold-600 dark:text-gold-400">{toPeso(promo.price || promo.promoPrice || '0')}</span>
                            </div>
                            
                            <Link
                              to="/book"
                              className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Book Now
                            </Link>
                          </div>
                        )}
                        
                        {!isExpanded && (
                          <div className="text-center pt-2">
                            <span className="text-sm font-semibold text-gold-600 dark:text-gold-400">Click to view details</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-gold-50 dark:from-black-950 dark:via-black-900 dark:to-black-950 overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <span className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold-400 blur-3xl"></span>
            <span className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl"></span>
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Our Dental Services</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive dental care services tailored to your needs
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Our Services</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Comprehensive dental care services tailored to your needs
              </p>
            </div>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">Loading services...</p>
                <p className="text-gray-500 dark:text-gray-400">Please wait while we load our available services.</p>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">No services available yet</p>
                <p className="text-gray-500 dark:text-gray-400">Please check back soon for our updated offerings.</p>
                {error && <p className="text-red-500 mt-4">{error}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                  const duration = ServiceDurations.getDuration(service);
                  const durationText = ServiceDurations.minutesToTime(duration);
                  return (
                    <div 
                      key={service.id} 
                      className="group bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl p-6 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2 cursor-pointer"
                      onClick={() => handleServiceClick(service)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-5xl">{getServiceIcon(service.name)}</div>
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{service.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{service.description}</p>
                      <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Duration: {durationText}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Comprehensive Evaluation</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Professional Care</span>
                        </div>
                      </div>
                      <button className="w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2">
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-br from-gold-500 via-gold-400 to-gold-600 dark:from-gold-600 dark:via-gold-500 dark:to-gold-700 overflow-hidden">
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to Schedule Your Appointment?</h2>
            <p className="text-xl text-white/90 dark:text-white/80 mb-8 max-w-2xl mx-auto">
              Book your appointment now and take the first step towards a healthier, brighter smile
            </p>
            <Link
              to="/book"
              className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-900 px-8 py-4 text-base font-bold text-gold-600 dark:text-gold-400 shadow-xl dark:shadow-black/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gold-500"
            >
              Book Appointment
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      <ServiceModal service={selectedService} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

