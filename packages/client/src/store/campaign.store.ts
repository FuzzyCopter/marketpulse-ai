import { create } from 'zustand';
import api from '../services/api';
import type { DashboardOverview } from '@marketpulse/shared';

interface CampaignSummary {
  id: number;
  name: string;
  slug: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysElapsed: number;
}

interface CampaignState {
  campaigns: CampaignSummary[];
  activeCampaignId: number;
  dashboardData: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchDashboard: (campaignId: number) => Promise<void>;
  setActiveCampaign: (id: number) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  activeCampaignId: 1,
  dashboardData: null,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    try {
      const { data } = await api.get('/dashboard/overview');
      set({ campaigns: data.campaigns });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchDashboard: async (campaignId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/dashboard/campaign/${campaignId}`);
      set({ dashboardData: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setActiveCampaign: (id) => {
    set({ activeCampaignId: id });
    get().fetchDashboard(id);
  },
}));
