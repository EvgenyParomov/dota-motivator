import { useNavigate } from 'react-router-dom';
import { useCreateLot, type LotInput } from './use-lots';

export const useCreateLotFlow = () => {
  const navigate = useNavigate();
  const create = useCreateLot();
  return {
    submitting: create.isPending,
    submit: (input: LotInput) =>
      create.mutate(input, { onSuccess: () => navigate('/lots') }),
  };
};
