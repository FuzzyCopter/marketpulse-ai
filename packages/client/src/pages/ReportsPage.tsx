import { FileText, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Generated Reports</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <FileText size={16} />
            Generate Report
          </button>
        </div>

        <div className="space-y-3">
          {[
            { title: 'MBBH Weekly Report - Week 1', date: '2026-02-21', status: 'ready' },
            { title: 'MBBH Campaign Overview', date: '2026-02-14', status: 'ready' },
            { title: 'Bale Santai Pre-Campaign Brief', date: '2026-03-01', status: 'draft' },
          ].map((report, i) => (
            <div key={i} className="flex items-center justify-between border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium text-gray-800">{report.title}</p>
                  <p className="text-xs text-gray-500">{report.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  report.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {report.status}
                </span>
                {report.status === 'ready' && (
                  <button className="text-gray-400 hover:text-blue-600">
                    <Download size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
