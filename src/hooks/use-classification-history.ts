// hooks/use-classification-history.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveClassification } from "@/lib/api/classification";
import { getClassificationById, deleteClassificationById, getClassificationHistory } from "@/lib/api/classification-history";
import { toast } from "sonner";

export function useClassificationHistory() {
  const queryClient = useQueryClient();

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveClassification,
    onSuccess: () => {
      // Invalidate dan refetch queries
      queryClient.invalidateQueries({
        queryKey: ["classification-history"],
        refetchType: "all", // Pastikan semua queries di-refetch
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats"],
        refetchType: "active",
      });
    },
  });

  // Delete mutation - dengan update cache yang lebih agresif
  const deleteMutation = useMutation({
    mutationFn: deleteClassificationById,
    onSuccess: (deletedItem, deletedId) => {
      // Approach 1: Invalidate queries untuk memaksa refetch
      queryClient.invalidateQueries({
        queryKey: ["classification-history"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-stats"],
        refetchType: "active",
      });

      // Approach 2: Update cache manually untuk response yang lebih cepat
      queryClient.setQueryData(["classification-history"], (oldData: { data: Array<{ id: string }>; pagination: { total: number } } | undefined) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.filter((item) => item.id !== deletedId),
          pagination: {
            ...oldData.pagination,
            total: oldData.pagination.total - 1,
          },
        };
      });

      toast.success("Riwayat klasifikasi berhasil dihapus");
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error("Gagal menghapus riwayat klasifikasi");
    },
  });

  return {
    saveClassification: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    deleteClassification: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

// Hook untuk mengambil history
export function useClassificationHistoryList(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: ["classification-history", page, limit],
    queryFn: () => getClassificationHistory(page, limit),
  });
}

// Hook untuk mengambil single classification
export function useClassification(id: string) {
  return useQuery({
    queryKey: ["classification", id],
    queryFn: () => getClassificationById(id),
    enabled: !!id,
  });
}
