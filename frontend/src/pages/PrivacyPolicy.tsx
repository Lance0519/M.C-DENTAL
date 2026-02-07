import { Link } from 'react-router-dom';
import clinicLogo from '@/assets/images/logo.png';

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Last updated: November 27, 2025
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Introduction
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                M.C. Dental Clinic ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our appointment booking system, or receive dental services from our clinic.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Information We Collect
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                We may collect the following types of information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, gender, and home address.</li>
                <li><strong>Health Information:</strong> Dental history, medical conditions, allergies, current medications, and treatment records.</li>
                <li><strong>Appointment Data:</strong> Scheduled appointments, service history, and payment records.</li>
                <li><strong>Account Information:</strong> Username, password (encrypted), and profile preferences.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage patterns on our website.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                We use your information to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Provide and manage dental care services</li>
                <li>Schedule and manage appointments</li>
                <li>Process payments and billing</li>
                <li>Send appointment reminders and confirmations</li>
                <li>Communicate about promotions, health tips, and clinic updates</li>
                <li>Improve our services and website functionality</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Information Sharing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4 mt-3">
                <li>With your explicit consent</li>
                <li>With healthcare providers involved in your care</li>
                <li>To comply with legal obligations or court orders</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4 mt-3">
                <li>Encryption of sensitive data during transmission and storage</li>
                <li>Secure authentication systems</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls limiting data access to authorized personnel only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Your Rights
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>Opt-out of promotional communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Data Retention
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We retain your personal and health information for as long as necessary to provide our services and comply with legal obligations. Medical records are typically retained for a minimum of 10 years as required by healthcare regulations in the Philippines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Cookies and Tracking
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Our website uses cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website usage. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                9. Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website with an updated effective date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                10. Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
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

