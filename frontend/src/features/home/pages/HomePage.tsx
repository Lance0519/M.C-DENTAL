import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import '@/styles/design-system.css';
import '../home.css';

export function HomePage() {

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FAFBFC] via-white to-[#F8F9FA] dark:from-black-950 dark:via-black-900 dark:to-black-950 py-20 text-black-900 dark:text-gray-100 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <span
              aria-hidden
              className="absolute -top-24 right-0 h-80 w-80 rounded-full opacity-70 dark:opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(255,216,76,0.25) 0%, transparent 70%)' }}
            />
            <span
              aria-hidden
              className="absolute -bottom-32 left-0 h-64 w-64 rounded-full opacity-70 dark:opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(255,216,76,0.2) 0%, transparent 70%)' }}
            />
          </div>

          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
              <span className="text-base font-light uppercase tracking-[0.3em] text-black-500 dark:text-gray-400">
                Your Path to a
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-black-950 dark:text-gray-100 sm:text-5xl lg:text-6xl">
                Confident Smile
              </h1>
              <p className="mt-4 text-lg text-black-600 dark:text-gray-300 sm:text-xl">
                Get in touch to schedule your consultation today
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-gold-500/30 dark:shadow-gold-500/50 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                >
                  Book Appointment
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center rounded-full border-2 border-black-900 dark:border-gray-300 px-8 py-3 text-base font-semibold text-black-900 dark:text-gray-100 transition-transform duration-200 hover:-translate-y-0.5 hover:border-black-950 dark:hover:border-gray-200 hover:bg-gold-50 dark:hover:bg-gold-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black-900 dark:focus-visible:ring-gray-300 focus-visible:ring-offset-2"
                >
                  View Services
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-black-950 dark:to-black-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Why Choose Us</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experience exceptional dental care with our team of experts and state-of-the-art facilities
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c-4.4 0-8 3.6-8 8 0 1.8.6 3.5 1.7 4.9L12 22l6.3-7.1c1.1-1.4 1.7-3.1 1.7-4.9 0-4.4-3.6-8-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Expert Dentists</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Access to experienced dental professionals across various specialties</p>
              </div>
              <div className="group bg-white dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Easy Booking</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Schedule appointments online 24/7 with just a few clicks</p>
              </div>
              <div className="group bg-white dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Appointment Management</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">View, reschedule, or cancel appointments from your dashboard</p>
              </div>
              <div className="group bg-white dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Comprehensive Dental Care</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Wide range of dental services all under one roof</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Get started with your dental care journey in just a few simple steps
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 dark:from-gold-600 dark:via-gold-500 dark:to-gold-600" style={{ margin: '0 10%' }} />
              
              {[
                { number: '1', title: 'Create Account', description: 'Register for a patient account in minutes', icon: '👤' },
                { number: '2', title: 'Choose Service', description: 'Select the dental service you need', icon: '🦷' },
                { number: '3', title: 'Book Appointment', description: 'Pick a convenient date and time', icon: '📅' },
                { number: '4', title: 'Get Care', description: 'Visit the clinic for your appointment', icon: '✨' }
              ].map((step, index) => (
                <div key={index} className="relative flex flex-col items-center text-center group">
                  <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-3xl">{step.icon}</span>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-black-900 rounded-full flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-bold text-gold-600 dark:text-gold-400">{step.number}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-br from-gold-500 via-gold-400 to-gold-600 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of patients who trust us with their dental care
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-gold-600 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gold-500"
              >
                Get Started Now
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gold-500"
              >
                View Services
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

