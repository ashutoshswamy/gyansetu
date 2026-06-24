import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tour, TourApplication } from "@/types";

export function useTours(status?: string) {
  return useQuery<Tour[]>({
    queryKey: ["tours", status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/tours${params}`);
      if (!res.ok) throw new Error("Failed to fetch tours");
      return res.json();
    },
  });
}

export function useTour(id: string) {
  return useQuery<Tour>({
    queryKey: ["tours", id],
    queryFn: async () => {
      const res = await fetch(`/api/tours/${id}`);
      if (!res.ok) throw new Error("Failed to fetch tour");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useMyApplications() {
  return useQuery<TourApplication[]>({
    queryKey: ["applications", "my"],
    queryFn: async () => {
      const res = await fetch("/api/tours/applications/my");
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
  });
}
