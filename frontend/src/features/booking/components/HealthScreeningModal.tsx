import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/modals/Modal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import clinicLogo from '@/assets/images/logo.png';

interface HealthScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function HealthScreeningModal({ isOpen, onClose, onComplete }: HealthScreeningModalProps) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSymptomsModal, setShowSymptomsModal] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if all questions are answered
    const allAnswered = Object.values(answers).every((answer) => answer !== '');
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    // Check if any answer is "yes"
    const hasSymptoms = Object.values(answers).some((answer) => answer === 'yes');

    if (hasSymptoms) {
      setShowSymptomsModal(true);
      return;
    }

    // Mark screening as passed
    sessionStorage.setItem('healthScreeningPassed', 'true');
    onComplete();
  };

  const handleGoBack = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmGoBack = () => {
    sessionStorage.removeItem('healthScreeningPassed');
    setShowConfirmModal(false);
    navigate('/');
  };

  const handleSymptomsModalClose = () => {
    sessionStorage.removeItem('healthScreeningPassed');
    setShowSymptomsModal(false);
    navigate('/');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleGoBack} title="" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <img src={clinicLogo} alt="M.C DENTAL CLINIC Logo" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">M.C. Dental Clinic</h2>
              <p className="text-sm text-gold-500">Affordable • Professional • Caring</p>
            </div>
          </div>
          <button
            onClick={handleGoBack}
            className="w-10 h-10 rounded-full border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black transition-all flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-gold-500 p-4 rounded">
          <p className="text-sm text-gray-800 dark:text-gray-200">
            If you answer yes to any of these questions please inform us ASAP.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1 */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <label className="block mb-3">
              <span className="text-gold-500 font-bold text-lg mr-2">1.</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Do you have fever or are you feeling feverish?
              </span>
            </label>
            <div className="flex gap-6 ml-8">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q1"
                  value="yes"
                  checked={answers.q1 === 'yes'}
                  onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q1"
                  value="no"
                  checked={answers.q1 === 'no'}
                  onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </label>
            </div>
          </div>

          {/* Question 2 */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <label className="block mb-3">
              <span className="text-gold-500 font-bold text-lg mr-2">2.</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Do you have cough or shortness of breath? Do you have sore throat?
              </span>
            </label>
            <div className="flex gap-6 ml-8">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q2"
                  value="yes"
                  checked={answers.q2 === 'yes'}
                  onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q2"
                  value="no"
                  checked={answers.q2 === 'no'}
                  onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </label>
            </div>
          </div>

          {/* Question 3 */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <label className="block mb-3">
              <span className="text-gold-500 font-bold text-lg mr-2">3.</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Do you have loss sense of taste or smell?
              </span>
            </label>
            <div className="flex gap-6 ml-8">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q3"
                  value="yes"
                  checked={answers.q3 === 'yes'}
                  onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q3"
                  value="no"
                  checked={answers.q3 === 'no'}
                  onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </label>
            </div>
          </div>

          {/* Question 4 */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <label className="block mb-3">
              <span className="text-gold-500 font-bold text-lg mr-2">4.</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Have you had a positive for COVID-19 test for active virus in the past 10 days?
              </span>
            </label>
            <div className="flex gap-6 ml-8">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q4"
                  value="yes"
                  checked={answers.q4 === 'yes'}
                  onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q4"
                  value="no"
                  checked={answers.q4 === 'no'}
                  onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </label>
            </div>
          </div>

          {/* Question 5 */}
          <div className="border-b-2 border-gray-200 dark:border-gray-700 pb-4">
            <label className="block mb-3">
              <span className="text-gold-500 font-bold text-lg mr-2">5.</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                Have you been around anyone else with these symptoms in the last 14 days? Are you living with them?
              </span>
            </label>
            <div className="flex gap-6 ml-8">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q5"
                  value="yes"
                  checked={answers.q5 === 'yes'}
                  onChange={(e) => setAnswers({ ...answers, q5: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors">
                <input
                  type="radio"
                  name="q5"
                  value="no"
                  checked={answers.q5 === 'no'}
                  onChange={(e) => setAnswers({ ...answers, q5: e.target.value })}
                  className="w-5 h-5 accent-gold-500"
                />
                <span className="text-gray-900 dark:text-gray-100">No</span>
              </label>
            </div>
          </div>

          {/* Info Text */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-gold-500 p-4 rounded">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              If you are having any of these symptoms, it is recommended that you stay at home and contact your health care provider.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full max-w-xs mx-auto block px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-lg hover:shadow-lg transition-all uppercase tracking-wide"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmGoBack}
        title="Go Back?"
        message="Are you sure you want to go back? You will need to complete the health screening to book an appointment."
        confirmText="Yes, Go Back"
        cancelText="No, Stay"
        variant="warning"
      />

      {/* Symptoms Warning Modal */}
      <Modal isOpen={showSymptomsModal} onClose={handleSymptomsModalClose} title="" size="md">
        <div className="space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 flex items-center justify-center shadow-lg">
              <svg
                className="w-12 h-12 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Warning Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Health Screening Notice
            </h2>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
            <p className="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-line">
              Based on your responses, we recommend that you stay at home and contact your health care provider.
              {'\n\n'}
              For your safety and the safety of others, please reschedule your appointment once you have recovered.
              {'\n\n'}
              For urgent dental concerns, please call the clinic directly.
            </p>
          </div>

          {/* OK Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleSymptomsModalClose}
              className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-400 text-black font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 uppercase tracking-wide"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

