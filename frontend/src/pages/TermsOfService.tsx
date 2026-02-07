import { Link } from 'react-router-dom';
import clinicLogo from '@/assets/images/logo.png';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black-950">
      {/* Header */}
      <header className="bg-white dark:bg-black-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img src={clinicLogo} alt="M.C. Dental Clinic" className="h-10 w-10" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">M.C. DENTAL CLINIC</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white dark:bg-black-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last updated: November 27, 2025
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                By accessing and using the M.C. Dental Clinic website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Services Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                M.C. Dental Clinic provides comprehensive dental care services including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4 mt-3">
                <li>General dentistry (cleaning, fillings, extractions)</li>
                <li>Cosmetic dentistry (whitening, veneers)</li>
                <li>Orthodontic treatments (braces, aligners)</li>
                <li>Oral surgery and implants</li>
                <li>Pediatric dentistry</li>
                <li>Emergency dental care</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Appointment Booking
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                When booking appointments through our website:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>You must provide accurate and complete information</li>
                <li>Appointments are subject to availability and confirmation</li>
                <li>We reserve the right to reschedule appointments due to unforeseen circumstances</li>
                <li>You will receive confirmation via email and/or SMS</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Cancellation Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                We understand that plans change. Please note the following:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>24-Hour Notice:</strong> We request at least 24 hours notice for cancellations or rescheduling</li>
                <li><strong>Late Cancellations:</strong> Cancellations made less than 24 hours before the appointment may be subject to a cancellation fee</li>
                <li><strong>No-Shows:</strong> Patients who miss appointments without notice may be charged a no-show fee</li>
                <li><strong>Emergency Exceptions:</strong> We understand emergencies happen and will consider each case individually</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. User Accounts
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                If you create an account on our platform:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You agree not to share your account with others</li>
                <li>We reserve the right to terminate accounts that violate these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Payment Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Payment for services is due at the time of service unless otherwise arranged:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>We accept cash, credit/debit cards, and approved payment plans</li>
                <li>Prices are subject to change without prior notice</li>
                <li>Insurance claims will be processed where applicable</li>
                <li>Patients are responsible for any amounts not covered by insurance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Patient Responsibilities
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                As a patient, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Provide accurate and complete health information</li>
                <li>Inform us of any changes to your medical history</li>
                <li>Follow pre and post-treatment instructions</li>
                <li>Arrive on time for scheduled appointments</li>
                <li>Treat our staff and other patients with respect</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Medical Disclaimer
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The information provided on our website is for general informational purposes only and should not be considered medical advice. Treatment outcomes may vary depending on individual circumstances. All dental procedures carry some level of risk, which will be discussed with you before any treatment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                9. Intellectual Property
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                All content on this website, including text, graphics, logos, images, and software, is the property of M.C. Dental Clinic and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or use any content without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                10. Limitation of Liability
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                To the maximum extent permitted by law, M.C. Dental Clinic shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or website. Our liability for any claim shall not exceed the amount paid for the specific service giving rise to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                11. Governing Law
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in the Philippines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                12. Changes to Terms
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after any changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                13. Contact Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                For questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-black-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300"><strong>M.C. Dental Clinic</strong></p>
                <p className="text-gray-600 dark:text-gray-400">Email: info@mcdentalclinic.com</p>
                <p className="text-gray-600 dark:text-gray-400">Phone: (02) 1234-5678</p>
                <p className="text-gray-600 dark:text-gray-400">Hours: Mon-Sat 9AM-6PM</p>
              </div>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-600 font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

