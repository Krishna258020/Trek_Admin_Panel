import React from 'react';
import {
  InventoryFilters,
  CancellationRequestStatus,
  AppView
} from '../types';
import { OPERATORS } from '../constants';

interface FilterBarProps {
  filters: InventoryFilters;
  onFilterChange: (newFilters: InventoryFilters) => void;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  activeView,
  onViewChange
}) => {
  const handleChange = (field: keyof InventoryFilters, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm p-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">

        {/* ================= Navigation ================= */}
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => onViewChange('inventory')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all
              ${
                activeView === 'inventory'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <i className="fa-solid fa-list-ul mr-2"></i>
            Inventory
          </button>

          <button
            onClick={() => onViewChange('requests')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all
              ${
                activeView === 'requests'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <i className="fa-solid fa-code-pull-request mr-2"></i>
            Requests
          </button>

          <button
            onClick={() => onViewChange('audit')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all
              ${
                activeView === 'audit'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            <i className="fa-solid fa-clock-rotate-left mr-2"></i>
            Audit Log
          </button>
        </div>

        {/* ================= Inventory Filters ================= */}
        {activeView === 'inventory' && (
          <div className="flex flex-wrap gap-4 items-end">

            {/* TBR ID Search */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                Search ID
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="TBR-1000"
                value={filters.tbrIdSearch || ''}
                onChange={(e) =>
                  handleChange('tbrIdSearch', e.target.value)
                }
              />
            </div>

            {/* Operator Filter */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                Operator
              </label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.operatorId || ''}
                onChange={(e) =>
                  handleChange('operatorId', e.target.value)
                }
              >
                <option value="">All Operators</option>
                {OPERATORS.map(op => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Status */}
            <div className="w-[160px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                Request Status
              </label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.requestStatus || ''}
                onChange={(e) =>
                  handleChange('requestStatus', e.target.value)
                }
              >
                <option value="">Any</option>
                <option value={CancellationRequestStatus.NONE}>None</option>
                <option value={CancellationRequestStatus.REQUESTED}>
                  Requested
                </option>
                <option value={CancellationRequestStatus.APPROVED}>
                  Approved
                </option>
                <option value={CancellationRequestStatus.REJECTED}>
                  Rejected
                </option>
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex gap-2 items-center min-w-[280px]">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  From
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.startDate || ''}
                  onChange={(e) =>
                    handleChange('startDate', e.target.value)
                  }
                />
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                  To
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.endDate || ''}
                  onChange={(e) =>
                    handleChange('endDate', e.target.value)
                  }
                />
              </div>
            </div>

            {/* Clear */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 text-xs font-black uppercase rounded-lg"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
