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
                M.C. Dental Clinic ("we," "our," or "us") is fully committed to protecting your privacy in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and other applicable laws of the Republic of the Philippines. This Privacy Policy outlines how we collect, process, manage, and protect your personal and sensitive health information when you avail of our dental services, use our appointment system, or visit our clinic.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Information We Collect
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                To provide quality dental care, we collect the following types of information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Complete name, address, contact numbers, email address, date of birth, age, and gender.</li>
                <li><strong>Sensitive Personal Information:</strong> Medical history (including previous illnesses, surgeries, allergies), dental records, medications currently taken, radiographs (X-rays), and treatment plans.</li>
                <li><strong>Transaction Data:</strong> Scheduled appointments, billing details, and payment history.</li>
                <li><strong>System/Technical Data:</strong> Account credentials, IP addresses, and digital activity strictly limited to the usage of our online portal.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Lawful Basis and Purpose of Processing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                We collect and process your data based on your explicit consent, and for the following primary purposes:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Healthcare Delivery:</strong> Accurate diagnosis, medical clearance, and formulation of personalized dental treatment plans.</li>
                <li><strong>Clinic Operations:</strong> Facilitating appointment scheduling, reminders, billing, and inventory management.</li>
                <li><strong>Patient Communication:</strong> Sending post-treatment advice, check-up notices, and vital clinic updates.</li>
                <li><strong>Regulatory Compliance:</strong> Fulfilling medical record-keeping standards required by Philippine health authorities and specialized dental boards.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Data Sharing and Disclosure
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your medical and personal data is strictly confidential. We do not sell, trade, or distribute your information for commercial gain. We only disclose your information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4 mt-3">
                <li>To attending dentists and allied health professionals directly involved in your care.</li>
                <li>To third-party laboratories (e.g., for specialized fabrications like crowns or dentures) requiring clinical specifications.</li>
                <li>When explicitly mandated by a valid court order or lawful request by government health agencies.</li>
                <li>When you provide written consent for the release of your records to other healthcare providers or insurance companies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Data Protection and Security Measures
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We employ strict organizational, physical, and technical security measures to prevent unauthorized access, accidental loss, disclosure, or alteration of your records:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4 mt-3">
                <li>End-to-end encryption for digital patient records and passwords.</li>
                <li>Role-based digital access controls (only authorized clinicians and staff can access respective data tiers).</li>
                <li>Secure physical filing systems for paper-based charting tools and consent forms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Rights of the Data Subject
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                Under the Data Privacy Act of 2012, you are entitled to the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 ml-4">
                <li><strong>Right to be Informed:</strong> To know that your data is being collected and processed.</li>
                <li><strong>Right to Access:</strong> To request a copy of your dental records and digital data we hold.</li>
                <li><strong>Right to Rectification:</strong> To correct any inaccuracies or errors in your personal or health profile.</li>
                <li><strong>Right to Erasure or Blocking:</strong> To request the suspension, withdrawal, or removal of your data, provided this does not conflict with statutory medical retention laws.</li>
                <li><strong>Right to Object:</strong> To withhold consent for data processing that is not strictly necessary for your medical treatment.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Data Retention Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We retain your dental and personal records in secure archives for a minimum period of <strong>ten (10) years</strong> from your last recorded visit, in compliance with Philippine medical and dental record-keeping standards. Afterwards, records are securely disposed of through digital wiping or physical shredding unless a longer retention period is required by active litigation or continuous treatment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Contact our Data Protection Officer (DPO)
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If you wish to exercise your data privacy rights, raise a concern, or request further clarification regarding our privacy practices, please contact our Data Protection Officer:
              </p>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-black-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300"><strong>M.C. Dental Clinic DPO</strong></p>
                <p className="text-gray-600 dark:text-gray-400">Email: dpo@mcdentalclinic.com</p>
                <p className="text-gray-600 dark:text-gray-400">Phone: (02) 1234-5678</p>
                <p className="text-gray-600 dark:text-gray-400">Address: [Clinic Physical Address, Philippines]</p>
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

