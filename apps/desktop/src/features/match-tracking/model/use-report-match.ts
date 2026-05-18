import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shared/lib/api';

export type ReportInput = {
  matchId: string;
  phase: 'post_game';
  lobbyType: string;
};

export type ReportResult = {
  matchEventId: string | null;
  counted: boolean;
  duplicate: boolean;
};

export const useReportMatch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReportInput) =>
      api<ReportResult>('/match-events', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['balance'] });
      qc.invalidateQueries({ queryKey: ['recent-events'] });
    },
  });
};
