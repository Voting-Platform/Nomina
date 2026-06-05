import { deleteElection, duplicateElection } from "@/lib/api/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDeleteElection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (electionId: string) => deleteElection(electionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elections"] });
            toast.success("Election deleted");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete election");
        },
    });
}

export function useDuplicateElection() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (electionId: string) => duplicateElection(electionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elections"] });
            toast.success("Election duplicated");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to duplicate election");
        },
    });
}
