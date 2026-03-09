import { useQuery } from "@tanstack/react-query";

async function fetchVisitors(): Promise<number> {
  const res = await fetch("/api/visitors");
  if (!res.ok) throw new Error(`Visitor API responded with ${res.status}`);
  const data: { count: number } = await res.json();
  return data.count;
}

export function useVisitors() {
  return useQuery<number>({
    queryKey: ["visitors"],
    queryFn: fetchVisitors,
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}
