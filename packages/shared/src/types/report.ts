export type ReportType = 'weekly' | 'monthly' | 'custom' | 'client_facing';
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'sent';

export interface Report {
  id: number;
  tenantId: number;
  campaignId: number | null;
  title: string;
  reportType: ReportType;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  config: ReportConfig;
  generatedData: Record<string, unknown> | null;
  fileUrl: string | null;
  status: ReportStatus;
  createdBy: number | null;
  createdAt: string;
}

export interface ReportConfig {
  sections: ReportSection[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export type ReportSection =
  | 'executive_summary'
  | 'kpi_overview'
  | 'channel_breakdown'
  | 'sem_performance'
  | 'seo_rankings'
  | 'ai_insights'
  | 'recommendations'
  | 'forecast';
