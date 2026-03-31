import { useQuery } from "@tanstack/react-query";
import { fetchDinnerMenu } from "@/services/dinnerMenuService";

export function useDinnerMenu(viewerPassword: string, enabled: boolean) {
  return useQuery({
    queryKey: ["dinner-menu", viewerPassword],
    queryFn: () => fetchDinnerMenu(viewerPassword),
    enabled: enabled && viewerPassword.trim().length > 0,
    retry: false,
  });
}

