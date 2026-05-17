import { LotForm } from '../ui/lot-form';
import { LotCreateLayout } from '../ui/lot-create-layout';
import { useCreateLotFlow } from '../model/use-create-lot-flow';

export const LotCreateRoute = () => {
  const flow = useCreateLotFlow();
  return (
    <LotCreateLayout
      form={<LotForm submitting={flow.submitting} onSubmit={flow.submit} />}
    />
  );
};
