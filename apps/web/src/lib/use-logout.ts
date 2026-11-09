import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, parseApiError } from '@/lib/api';
import { trackUmamiEvent } from '@/lib/umami';
import { UmamiEvents } from '@/lib/umami-events';

/** Signs the user out, clears cached data, and returns to the login page. */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.api.auth.logout.$post();

      if (!response.ok) {
        throw new Error(await parseApiError(response, 'Failed to log out'));
      }
    },
    onSuccess: async () => {
      trackUmamiEvent(UmamiEvents.authLogout);
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await queryClient.clear();
      window.location.href = '/login';
    },
  });
}
