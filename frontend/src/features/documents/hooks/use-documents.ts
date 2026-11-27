"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { documentsApi } from "../api/documents-api";
import {
  CreateDocumentInput,
  DocumentItem,
  UpdateDocumentInput,
} from "@/types/document.types";

export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters?: { search?: string; creatorId?: string }) =>
    [...documentKeys.lists(), filters ?? {}] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocuments(
  filters?: { search?: string; creatorId?: string },
  enabled = true
) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async () => {
      const res = await documentsApi.getDocuments(filters);
      return res.documents ?? [];
    },
    enabled,
  });
}

export function useDocument(id: string | null, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await documentsApi.getDocumentById(id!);
      return res.document;
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDocumentInput = {}) =>
      documentsApi.createDocument(input),
    onSuccess: (res) => {
      if (res.document?.id) {
        queryClient.setQueryData(
          documentKeys.detail(res.document.id),
          res.document
        );
      }
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create document"
      );
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentInput }) =>
      documentsApi.updateDocument(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });
      const previousLists = queryClient.getQueriesData<DocumentItem[]>({
        queryKey: documentKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<DocumentItem>(
        documentKeys.detail(id)
      );

      const now = new Date().toISOString();

      queryClient.setQueriesData<DocumentItem[]>(
        { queryKey: documentKeys.lists() },
        (old) =>
          old?.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  ...(data.title !== undefined ? { title: data.title } : {}),
                  ...(data.icon !== undefined ? { icon: data.icon } : {}),
                  updatedAt: now,
                }
              : doc
          ) ?? old
      );

      if (previousDetail) {
        queryClient.setQueryData<DocumentItem>(documentKeys.detail(id), {
          ...previousDetail,
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.icon !== undefined ? { icon: data.icon } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          updatedAt: now,
        });
      }

      return { previousLists, previousDetail };
    },
    onSuccess: (res, { id }) => {
      const updated = res.document;
      if (!updated) return;

      queryClient.setQueryData<DocumentItem>(
        documentKeys.detail(id),
        (existing) => ({
          ...(existing ?? updated),
          ...updated,
          creator: existing?.creator ?? updated.creator,
        })
      );

      queryClient.setQueriesData<DocumentItem[]>(
        { queryKey: documentKeys.lists() },
        (old) =>
          old?.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  title: updated.title,
                  icon: updated.icon,
                  updatedAt: updated.updatedAt,
                }
              : doc
          ) ?? old
      );
    },
    onError: (_err, { id }, context) => {
      context?.previousLists.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
      if (context?.previousDetail) {
        queryClient.setQueryData(
          documentKeys.detail(id),
          context.previousDetail
        );
      }
      toast.error("Failed to save document");
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: documentKeys.lists() });
      const previous = queryClient.getQueriesData<DocumentItem[]>({
        queryKey: documentKeys.lists(),
      });

      queryClient.setQueriesData<DocumentItem[]>(
        { queryKey: documentKeys.lists() },
        (old) => old?.filter((doc) => doc.id !== id) ?? old
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      context?.previous.forEach(([key, snapshot]) => {
        queryClient.setQueryData(key, snapshot);
      });
      toast.error("Failed to delete document");
    },
    onSuccess: (_res, id) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      toast.success("Document deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}
