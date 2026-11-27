import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/endpoints";
import {
  CreateDocumentInput,
  DocumentItem,
  UpdateDocumentInput,
} from "@/types/document.types";

export const documentsApi = {
  getDocuments: (filters?: {
    search?: string;
    creatorId?: string;
  }): Promise<{ success: boolean; documents: DocumentItem[] }> => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.creatorId) params.set("creatorId", filters.creatorId);
    const qs = params.toString();
    const url = qs ? `${ENDPOINTS.DOCUMENTS}?${qs}` : ENDPOINTS.DOCUMENTS;
    return apiClient<{ success: boolean; documents: DocumentItem[] }>(url, {
      method: "GET",
    });
  },

  getDocumentById: (
    id: string
  ): Promise<{ success: boolean; document: DocumentItem }> => {
    return apiClient<{ success: boolean; document: DocumentItem }>(
      `${ENDPOINTS.DOCUMENTS}/${id}`,
      { method: "GET" }
    );
  },

  createDocument: (
    data: CreateDocumentInput = {}
  ): Promise<{ success: boolean; document: DocumentItem }> => {
    return apiClient<{ success: boolean; document: DocumentItem }>(
      ENDPOINTS.DOCUMENTS,
      {
        method: "POST",
        data,
      }
    );
  },

  updateDocument: (
    id: string,
    data: UpdateDocumentInput
  ): Promise<{ success: boolean; document: DocumentItem }> => {
    return apiClient<{ success: boolean; document: DocumentItem }>(
      `${ENDPOINTS.DOCUMENTS}/${id}`,
      {
        method: "PATCH",
        data,
      }
    );
  },

  deleteDocument: (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>(
      `${ENDPOINTS.DOCUMENTS}/${id}`,
      { method: "DELETE" }
    );
  },
};
