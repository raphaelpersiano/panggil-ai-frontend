import { supabase } from "@/lib/supabase";
import type {
  ApiSuccess,
  BillingBalance,
  BillingInvoice,
  BillingTransaction,
  CallLog,
  CallLogListParams,
  CallLogSummary,
  Campaign,
  AgentConfig,
  CampaignSummary,
  CampaignStatus,
  CreateCampaignPayload,
  CreateInvoicePayload,
  CreateLeadPayload,
  Lead,
  LeadListParams,
  PaginationMeta,
  UpdateProfilePayload,
  UploadedDocument,
  UserProfile,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from "@/lib/types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(`${API_BASE_URL}${path}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return API_BASE_URL ? `${API_BASE_URL}${path}${url.search}` : `${path}${url.search}`;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(path: string, init?: RequestInit, params?: Record<string, string | number | undefined | null>): Promise<ApiSuccess<T>> {
  const token = await getAccessToken();
  const res = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const message = json?.error?.message ?? json?.error ?? `Request failed with ${res.status}`;
    throw new Error(message);
  }

  return json as ApiSuccess<T>;
}

export async function listLeads(params: LeadListParams): Promise<{ data: Lead[]; meta?: PaginationMeta }> {
  const response = await request<Lead[]>("/leads", undefined, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    type: params.type,
    status: params.status && params.status !== "all" ? params.status : undefined,
    search: params.search,
    sortBy: params.sortBy,
    campaignId: params.campaignId,
  });

  return { data: response.data, meta: response.meta };
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await request<Lead>("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function importLeads(file: File, type: "telesales" | "collection") {
  const token = await getAccessToken();
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);

  const res = await fetch(buildUrl("/leads/import"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? json?.error ?? `Import failed with ${res.status}`);
  }
  return json.data as {
    imported: number;
    failed: number;
    errors?: { row: number; field: string; message: string }[];
  };
}

export async function listCampaigns(type: "telesales" | "collection", page = 1, limit = 20) {
  const response = await request<Campaign[]>("/campaigns", undefined, { type, page, limit });
  return { data: response.data, meta: response.meta };
}

export async function getCampaignSummary(type: "telesales" | "collection") {
  const response = await request<CampaignSummary>("/campaigns/summary", undefined, { type });
  return response.data;
}

export async function createCampaign(payload: CreateCampaignPayload) {
  const response = await request<Campaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateCampaignStatus(campaignId: string, status: CampaignStatus) {
  const response = await request<Campaign>(`/campaigns/${campaignId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return response.data;
}

export async function deleteCampaign(campaignId: string) {
  const response = await request<{ message: string }>(`/campaigns/${campaignId}`, {
    method: "DELETE",
  });

  return response.data;
}

export async function getBalance() {
  const response = await request<BillingBalance>("/billing/balance");
  return response.data;
}

export async function listTransactions(page = 1, limit = 20, type?: "topup" | "usage") {
  const response = await request<BillingTransaction[]>("/billing/transactions", undefined, { page, limit, type });
  return { data: response.data, meta: response.meta };
}

export async function createInvoice(payload: CreateInvoicePayload) {
  const response = await request<BillingInvoice>("/billing/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getProfile() {
  const response = await request<UserProfile>("/users/profile");
  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await request<UserProfile>("/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function uploadDocument(file: File, documentType: "nib" | "npwp") {
  const token = await getAccessToken();
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", documentType);

  const res = await fetch(buildUrl("/users/documents"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? json?.error ?? `Upload failed with ${res.status}`);
  }

  return json.data as UploadedDocument;
}

export async function sendOtp(payload: SendOtpPayload) {
  const response = await request<SendOtpResponse>("/users/otp/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await request<VerifyOtpResponse>("/users/otp/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function listLogs(params: CallLogListParams) {
  const response = await request<CallLog[]>("/logs", undefined, {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    campaignId: params.campaignId,
    agentType: params.agentType && params.agentType !== "all" ? params.agentType : undefined,
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return { data: response.data, meta: response.meta };
}

export async function getLogSummary() {
  const response = await request<CallLogSummary>("/logs/summary");
  return response.data;
}
export async function listAgentConfigs(type?: "telesales" | "collection") {
  const response = await request<AgentConfig[]>("/agents", undefined, { type });
  return response.data;
}
