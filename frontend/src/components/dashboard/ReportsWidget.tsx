import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { FileSpreadsheet, Download, Clock, ArrowRight } from 'lucide-react';

interface RecentReport {
  id: string;
  type: string;
  generatedAt: string;
}

export function ReportsWidget() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canViewReports = hasPermission('reports:view');

  // Mock recent reports based on audit log (would need backend API in production)
  const recentReports: RecentReport[] = [];

  if (!canViewReports) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-brand-500" />
          <h2 className="text-sm font-semibold text-slate-900">Reports</h2>
        </div>
        <button
          onClick={() => navigate('/reports-analytics')}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Generate Report Button */}
      <button
        onClick={() => navigate('/reports-analytics')}
        className="w-full flex items-center justify-center gap-2 p-3 mb-4 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg border border-brand-200 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">Generate Report</span>
      </button>

      {/* Recent Reports */}
      {recentReports.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Recent Reports</p>
          {recentReports.map((report, index) => (
            <div
              key={`${report.id}-${index}`}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{report.type}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {report.generatedAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No reports generated yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Generate reports from the Reports module
          </p>
        </div>
      )}
    </div>
  );
}
