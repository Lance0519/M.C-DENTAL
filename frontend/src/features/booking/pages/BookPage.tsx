import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingModal } from '../components/BookingModal';

export function BookPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  const handleSuccess = () => {
    // Success is handled by the modal's success modal
  };

  return (
    <BookingModal
      isOpen={isModalOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
