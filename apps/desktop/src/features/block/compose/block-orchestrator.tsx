import { useBlockOrchestrator } from '../model/use-block-orchestrator';
import { BlockOverlay } from '../ui/block-overlay';

export const BlockOrchestrator = () => {
  const { open, reason, close } = useBlockOrchestrator();
  return <BlockOverlay open={open} reason={reason} onClose={close} />;
};
