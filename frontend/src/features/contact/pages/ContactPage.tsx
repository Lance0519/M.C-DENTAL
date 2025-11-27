import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StorageService } from '@/lib/storage';
import { formatTime, validateEmail, validatePhone, showNotification } from '@/lib/utils';
import type { ClinicSchedule } from '@/types/storage';
import '@/styles/design-system.css';
import '../contact.css';

export function ContactPage() {
  const [clinicSchedule, setClinicSchedule] = useState<ClinicSchedule | null>(null);

  useEffect(() => {
    const loadClinicHours = () => {
      try {
        const schedule = StorageService.getClinicSchedule();
        setClinicSchedule(schedule);
      } catch (error) {
        console.error('Error loading clinic hours:', error);
      }
    };
    loadClinicHours();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadClinicHours();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('clinicDataUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clinicDataUpdated', handleStorageChange);
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get('contactEmail')?.toString() ?? '';
    const phone = formData.get('contactPhone')?.toString() ?? '';

    // Validation
    if (!validateEmail(email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    if (!validatePhone(phone)) {
      showNotification('Please enter a valid phone number', 'error');
      return;
    }

    // In a real application, this would send the message to a server
    // For now, we'll just show a success notification
    showNotification('Thank you for your message! We will get back to you soon.', 'success');

    // Reset form
    form.reset();
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-gold-50 dark:from-black-950 dark:via-black-900 dark:to-black-950 overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <span className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold-400 blur-3xl"></span>
            <span className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl"></span>
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Contact Us</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're here to help and answer any questions you might have
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
              {/* Contact Information */}
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Get in Touch</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Have questions or need to schedule an appointment? We're here to help!</p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Address</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        57 Susano Road Novaliches Quezon City
                        <br />
                        Quezon City, Philippines
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-pink-50 dark:bg-pink-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Instagram</h3>
                      <p className="text-gray-700 dark:text-gray-300">@mcdental</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Facebook</h3>
                      <p className="text-gray-700 dark:text-gray-300">M.C. DENTAL CLINIC</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Clinic Hours</h3>
                      <p className="text-sm text-gold-600 dark:text-gold-400 mb-3 font-semibold">
                        <em>*Hours are subject to change</em>
                      </p>
                      <div className="space-y-2">
                        {clinicSchedule ? (
                          days.map((day) => {
                            const daySchedule = clinicSchedule[day as keyof ClinicSchedule] || {
                              isOpen: false,
                              startTime: '09:00',
                              endTime: '18:00'
                            };

                            if (daySchedule.isOpen) {
                              const startTime = formatTime(daySchedule.startTime);
                              const endTime = formatTime(daySchedule.endTime);
                              return (
                                <div key={day} className="flex justify-between items-center py-2 border-b border-yellow-200 dark:border-yellow-800">
                                  <strong className="text-gray-900 dark:text-gray-100 font-semibold min-w-[120px]">{day}:</strong>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">{startTime} - {endTime}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={day} className="flex justify-between items-center py-2 border-b border-yellow-200 dark:border-yellow-800">
                                <strong className="text-gray-500 dark:text-gray-500 font-semibold min-w-[120px]">{day}:</strong>
                                <span className="text-gray-400 dark:text-gray-600">Closed</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">Loading hours...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl p-8 shadow-xl border-2 border-gray-200 dark:border-gray-700">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Send Us a Message</h2>
                <form id="contactForm" className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Your Name</label>
                    <input 
                      type="text" 
                      id="contactName" 
                      name="contactName" 
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-3 text-base focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-all" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      id="contactEmail" 
                      name="contactEmail" 
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-3 text-base focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-all" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="contactPhone" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      id="contactPhone" 
                      name="contactPhone" 
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-3 text-base focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-all" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="contactSubject" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Subject</label>
                    <input 
                      type="text" 
                      id="contactSubject" 
                      name="contactSubject" 
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-3 text-base focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-all" 
                      required 
                    />
                  </div>
                  <div>
                    <label htmlFor="contactMessage" className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Message</label>
                    <textarea 
                      id="contactMessage" 
                      name="contactMessage" 
                      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-black-800 text-gray-900 dark:text-white px-4 py-3 text-base focus:border-gold-500 dark:focus:border-gold-400 focus:ring-2 focus:ring-gold-500/30 dark:focus:ring-gold-400/30 transition-all min-h-[150px]" 
                      rows={6} 
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-black-950 dark:to-black-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Find Us</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Visit our clinic at your convenience</p>
            </div>
            <div className="max-w-5xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200 dark:border-gray-700">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.8911823456789!2d121.03845!3d14.6855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDQxJzA3LjgiTiAxMjHCsDAyJzE4LjQiRQ!5e0!3m2!1sen!2sph!4v1234567890!5m2!1sen!2sph"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="M.C DENTAL CLINIC Location"
                ></iframe>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="max-w-md">
                    <p className="text-2xl font-bold text-white mb-2">M.C DENTAL CLINIC</p>
                    <p className="text-white/90 mb-4">57 Susano Road Novaliches Quezon City, Quezon City, Philippines</p>
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=57+Susano+Road+Novaliches+Quezon+City,+Philippines"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-gold-600 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

