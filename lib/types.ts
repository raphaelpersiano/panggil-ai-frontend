export type Occasion = "telesales" | "collection";
export type LeadStatus = "uncontacted" | "connected" | "follow_up" | "promise_to_pay" | "closed";
export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed";
export type ScheduleMode = "immediate" | "scheduled";
export type TransactionType = "topup" | "usage";
export type TransactionStatus = "success" | "pending" | "failed";
export type AgentType = Occasion;
export type DocumentType = "nib" | "npwp";

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorShape {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Lead {
  id: string;
  type: Occasion;
  name: string;
  mobile: string;
  source: string;
  status: LeadStatus;
  lastCallTime: string | null;
  createdAt: string;
  outstanding?: number;
  emi?: number;
  emiDueDate?: string;
}

export interface LeadListParams {
  page?: number;
  limit?: number;
  type: Occasion;
  status?: LeadStatus | "all";
  search?: string;
  sortBy?: "newest" | "oldest" | "last_call";
  campaignId?: string;
}

export interface CreateLeadPayload {
  type: Occasion;
  name: string;
  mobile: string;
  source: string;
  status: LeadStatus;
  outstanding?: number;
  emi?: number;
  emiDueDate?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: Occasion;
  status: CampaignStatus;
  scheduleMode: ScheduleMode;
  startDate?: string;
  endDate?: string;
  selectedDays?: number[];
  dayTimes?: Record<string, string[]>;
  maxRetries: number;
  retryIntervalMinutes: number;
  maxConcurrent: number;
  totalLeads: number;
  calledLeads: number;
  createdAt: string;
}

export interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeads: number;
  totalCalls: number;
}

export interface LeadSelectionExplicit {
  mode: "explicit";
  leadIds: string[];
}

export interface LeadSelectionFilter {
  mode: "filter";
  filter: {
    status?: LeadStatus;
    search?: string;
  };
}

export type LeadSelection = LeadSelectionExplicit | LeadSelectionFilter;

export interface CreateCampaignPayload {
  name: string;
  description?: string;
  type: Occasion;
  scheduleMode: ScheduleMode;
  startDate?: string;
  endDate?: string;
  selectedDays?: number[];
  dayTimes?: Record<string, string[]>;
  maxRetries: number;
  retryIntervalMinutes: number;
  maxConcurrent: number;
  leadSelection: LeadSelection;
}

export interface BillingBalance {
  balance: number;
}

export interface BillingTransaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  invoiceId?: string;
  externalId?: string;
  expiresAt?: string;
  paidAt?: string;
}

export interface CreateInvoicePayload {
  amount: number;
}

export interface BillingInvoice {
  invoiceId: string;
  externalId: string;
  invoiceUrl: string;
  amount: number;
  status: TransactionStatus | "expired";
  expiresAt: string;
}

export interface UserDocument {
  url: string;
  status: "not_uploaded" | "pending" | "verified" | "rejected";
  uploadedAt?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  picName: string;
  picMobile: string;
  companyName: string;
  occasions: Occasion[];
  balance: number;
  documents?: Partial<Record<DocumentType, UserDocument>>;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  picName: string;
  picMobile: string;
  companyName: string;
  occasions: Occasion[];
}

export interface UploadedDocument {
  documentType: DocumentType;
  url: string;
  status: "not_uploaded" | "pending" | "verified" | "rejected";
  uploadedAt?: string;
}

export interface SendOtpPayload {
  mobile: string;
}

export interface SendOtpResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpPayload {
  mobile: string;
  otp: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  onboardingComplete: boolean;
}

export interface CallLog {
  callId: string;
  campaignId: string;
  campaignName?: string;
  agentType: AgentType;
  fromNumber: string;
  toNumber: string;
  leadName?: string;
  duration: number;
  endedBy: "agent" | "leads";
  cost: number;
  createdAt: string;
  recordingUrl?: string;
  transcript?: string;
  structuredOutput?: Record<string, unknown>;
}

export interface CallLogListParams {
  page?: number;
  limit?: number;
  campaignId?: string;
  agentType?: AgentType | "all";
  search?: string;
  sortBy?: "createdAt" | "duration" | "cost";
  sortOrder?: "asc" | "desc";
}

export interface CallLogSummary {
  totalCalls: number;
  totalDuration: number;
  totalCost: number;
  avgDuration: number;
}

export interface AgentStructuredOutput {
  name: string;
  type: string;
  description: string;
}

export interface AgentConfig {
  id: string;
  type: Occasion;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  settings?: {
    silenceTimeoutSeconds?: number;
    maxDurationSeconds?: number;
    immediateStopSeconds?: number;
    backOffSeconds?: number;
  };
  structuredOutput?: AgentStructuredOutput[];
  updatedAt?: string;
}
