import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { FileSpreadsheet, Download, Clock, ArrowRight, BarChart2, FileBarChart } from 'lucide-react';

interface RecentReport {
  id: string;
  type: string;
  generatedAt: string;
}

export function ReportsWidget() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canViewReports = hasPermission('reports:view');

  const recentReports: RecentReport[] = [];

  if (!canViewReports) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm shadow-violet-500/20">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
            <p className="text-sm text-slate-500">Analytics and insights</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Generate Report Button */}
      <button
        onClick={() => navigate('/reports-analytics')}
        className="w-full flex items-center justify-center gap-3 p-4 mb-5 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-sm shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 group"
      >
        <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
          <Download className="w-5 h-5" />
        </div>
        <div className="text-left">
          <span className="text-sm font-semibold">Generate New Report</span>
          <p className="text-xs text-purple-100">Create custom analytics reports</p>
        </div>
      </button>

      {/* Quick Report Types */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-purple-50 rounded-xl transition-colors group"
        >
          <div className="p-2 rounded-lg bg-white shadow-sm group-hover:bg-purple-100 transition-colors">
            <BarChart2 className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-purple-600">Performance</span>
        </button>
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors group"
        >
          <div className="p-2 rounded-lg bg-white shadow-sm group-hover:bg-emerald-100 transition-colors">
            <FileBarChart className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-600">Compliance</span>
        </button>
      </div>

      {/* Recent Reports */}
      {recentReports.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Reports</p>
          {recentReports.map((report, index) => (
            <div
              key={`${report.id}-${index}`}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
            >
              <div className="p-2 rounded-lg bg-white shadow-sm">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{report.type}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {report.generatedAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-slate-50 mx-auto mb-3 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">No reports generated yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Generate reports from the Reports module
          </p>
        </div>
      )}
    </div>
  );
}
