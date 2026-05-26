import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContasPagarFormModal from '@/components/financeiro/ContasPagarFormModal';

export default function ContasPagarForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    navigate('/financeiro/contas-pagar');
  };

  if (!open) return null;

  return (
    <ContasPagarFormModal
      contaId={id}
      onSucesso={handleClose}
      onCancelar={handleClose}
    />
  );
}
