import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';
import type { DoctorProfile } from '@/types/storage';
import '@/styles/design-system.css';
import '../about.css';

export function AboutPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadTeam = async () => {
      try {
        const response = await api.getDoctors();
        if (!isMounted) return;
        const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
        setDoctors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading team:', error);
      }
    };

    loadTeam();

    return () => {
      isMounted = false;
    };
  }, []);

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
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">About M.C DENTAL CLINIC</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your trusted partner in dental health and beautiful smiles
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Our Mission</h2>
                  <div className="space-y-4 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      At M.C DENTAL CLINIC, we are committed to providing exceptional dental care with compassion, expertise,
                      and innovation. Our mission is to improve the oral health and confidence of our community by delivering
                      accessible, high-quality dental services.
                    </p>
                    <p>
                      We believe that everyone deserves a beautiful, healthy smile, and we strive to make dental care more
                      convenient and patient-centered through our comprehensive appointment system and state-of-the-art treatments.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full h-96 bg-gradient-to-br from-gold-500 to-gold-400 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7v10c0 5 4 8 10 10 6-2 10-5 10-10V7l-10-5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-black-950 dark:to-black-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Our Core Values</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  title: 'Compassion', 
                  description: 'We treat every patient with gentle care, respect, and understanding',
                  icon: '❤️',
                  gradient: 'from-red-500 to-pink-500'
                },
                { 
                  title: 'Excellence', 
                  description: 'We maintain the highest standards of dental practice and patient care',
                  icon: '⭐',
                  gradient: 'from-yellow-500 to-orange-500'
                },
                { 
                  title: 'Integrity', 
                  description: 'We uphold honesty and ethical practices in all our interactions',
                  icon: '🤝',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                { 
                  title: 'Innovation', 
                  description: 'We use modern dental technology for better results and comfort',
                  icon: '💡',
                  gradient: 'from-purple-500 to-indigo-500'
                }
              ].map((value, index) => (
                <div key={index} className="group bg-white dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform shadow-lg`}>
                    {value.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">Meet Our Dentists</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Experienced dental professionals dedicated to your smile
              </p>
            </div>
            {doctors.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300">No dentists available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.map((doctor) => {
                  const avatarHTML = (doctor as any).profileImage ? (
                    <img src={(doctor as any).profileImage} alt={doctor.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-white">
                      {doctor.name.charAt(0).toUpperCase()}
                    </div>
                  );
                  return (
                    <div key={doctor.id} className="group bg-white dark:bg-black-900 rounded-2xl shadow-lg dark:shadow-black-800/50 hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-600 transform hover:-translate-y-2 overflow-hidden">
                      <div className="relative h-64 overflow-hidden">
                        {avatarHTML}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{doctor.name}</h3>
                        <div className="inline-block px-4 py-1 bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500 rounded-full text-sm font-bold text-white mb-4">
                          {doctor.specialty}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">Dedicated healthcare professional committed to providing excellent patient care and treatment.</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

