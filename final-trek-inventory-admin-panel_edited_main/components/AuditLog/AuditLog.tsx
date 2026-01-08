import React, { useState, useMemo } from 'react';
import { AuditEntry } from '../../types';
import { MOCK_AUDIT_LOGS } from '../../constants.new';

const AuditLog: React.FC = () => {
  const [filters, setFilters] = useState({
    searchTbr: '',
    searchAgent: '',
    fromDate: '',
    toDate: ''
  });

  /* ---------------- Data ---------------- */

  const logs: AuditEntry[] = MOCK_AUDIT_LOGS;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchTbr =
        log.tbr.id.toLowerCase().includes(filters.searchTbr.toLowerCase());

      const matchAgent =
        log.performer.name
          .toLowerCase()
          .includes(filters.searchAgent.toLowerCase()) ||
        log.performer.id
          .toLowerCase()
          .includes(filters.searchAgent.toLowerCase());

      return matchTbr && matchAgent;
    });
  }, [logs, filters]);

  /* ---------------- Grouping ---------------- */

  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditEntry[]> = {};
    filteredLogs.forEach(log => {
      const datePart = log.actionTime.split(' ')[0];
      if (!groups[datePart]) groups[datePart] = [];
      groups[datePart].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const getDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return dateStr;
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Audit Log Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              TBR ID
            </label>
            <input
              type="text"
              placeholder="e.g. TBR-1001"
              value={filters.searchTbr}
              onChange={e =>
                setFilters({ ...filters, searchTbr: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              Performer (Agent/Admin)
            </label>
            <input
              type="text"
              placeholder="Search Name or ID"
              value={filters.searchAgent}
              onChange={e =>
                setFilters({ ...filters, searchAgent: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
              To Date
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-8">
        {Object.entries(groupedLogs)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-px flex-1 bg-gray-200"></div>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border">
                  {getDateLabel(date)}
                </span>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>

              <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Action Time</th>
                      <th className="px-6 py-4">Performer</th>
                      <th className="px-6 py-4">TBR Details</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Reason</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {entries.map(log => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {log.actionTime.split(' ').slice(1).join(' ')}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {log.performer.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">
                            {log.performer.id}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-indigo-600">
                            {log.tbr.id}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {log.tbr.name}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
                            {log.action}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600 italic leading-relaxed max-w-sm">
                            "{log.reason}"
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {filteredLogs.length === 0 && (
          <div className="p-20 text-center bg-white border border-dashed rounded-3xl text-gray-300">
            <i className="fas fa-list-ul text-6xl mb-4 opacity-20"></i>
            <p className="text-xl font-bold">No activity logs found</p>
            <p className="text-sm">
              Try adjusting your filters to see more entries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
