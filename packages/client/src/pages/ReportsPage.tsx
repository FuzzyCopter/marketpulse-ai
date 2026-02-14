import { useEffect, useState } from 'react';
import { useCampaignStore } from '../store/campaign.store';
import api from '../services/api';
import { FileText, Download, Plus, Eye, Printer, Loader2 } from 'lucide-react';

interface Report {
  id: string;
  campaignId: number;
  title: string;
  type: string;
  createdAt: string;
  data: {
    campaign: { name: string; status: string; daysElapsed: number; totalDays: number };
    kpiProgress: Array<{ channel: string; current: number; target: number; progressPercent: number; onTrack: boolean }>;
    summary: string;
  };
}

export default function ReportsPage() {
  const { activeCampaignId } = useCampaignStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'campaign'>('weekly');

  useEffect(() => {
    if (!activeCampaignId) return;
    fetchReports();
  }, [activeCampaignId]);

  const fetchReports = async () => {
    const { data } = await api.get(`/reports?campaignId=${activeCampaignId}`);
    setReports(data);
  };

  const generateReport = async () => {
    if (!activeCampaignId) return;
    setGenerating(true);
    try {
      await api.post('/reports/generate', { campaignId: activeCampaignId, type: reportType });
      fetchReports();
    } finally {
      setGenerating(false);
    }
  };

  const viewHTML = (reportId: string) => {
    // Open report HTML in new tab — use the backend URL with auth
    const token = localStorage.getItem('mp_access_token');
    window.open(`/api/reports/${reportId}/html?token=${token}`, '_blank');
  };

  const printReport = (reportId: string) => {
    const printWindow = window.open(`/api/reports/${reportId}/html`, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const typeLabels: Record<string, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    campaign: 'Full Campaign',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      {/* Generate Report Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" data-tour="report-generator">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate New Report</h3>
        <p className="text-sm text-gray-500 mb-4">
          Generate Honda campaign report. Report bisa di-print atau save as PDF langsung dari browser.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as 'weekly' | 'monthly' | 'campaign')}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
          >
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="campaign">Full Campaign Report</option>
          </select>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{selectedReport.title}</h3>
            <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close</button>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">{selectedReport.data.summary}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{selectedReport.data.campaign.daysElapsed}/{selectedReport.data.campaign.totalDays}</p>
              <p className="text-xs text-gray-500">Days</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{selectedReport.data.kpiProgress.filter(k => k.onTrack).length}/{selectedReport.data.kpiProgress.length}</p>
              <p className="text-xs text-gray-500">On Track</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold" style={{ color: selectedReport.data.campaign.status === 'active' ? '#16a34a' : '#ca8a04' }}>
                {selectedReport.data.campaign.status.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">Status</p>
            </div>
          </div>

          {/* KPI Table */}
          <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full mb-4 min-w-[400px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Channel</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Current</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Target</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Progress</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport.data.kpiProgress.map((kpi, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-sm">{kpi.channel}</td>
                  <td className="px-3 py-2 text-sm text-right">{kpi.current.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sm text-right">{kpi.target.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sm text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${kpi.onTrack ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {kpi.progressPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => viewHTML(selectedReport.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <Eye className="w-4 h-4" /> View Full Report
            </button>
            <button onClick={() => printReport(selectedReport.id)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Generated Reports ({reports.length})</h3>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada report. Klik Generate Report untuk membuat.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedReport(report)}>
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">{report.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {typeLabels[report.type] || report.type}
                  </span>
                  <button onClick={() => setSelectedReport(report)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => viewHTML(report.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
