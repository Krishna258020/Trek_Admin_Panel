import React from 'react';
import { VendorRequest, RequestType } from '../../types';

interface DecisionHistoryProps {
  records: VendorRequest[];
}

const DecisionHistory: React.FC<DecisionHistoryProps> = ({ records }) => {
  return (
    <div className="space-y-3">
      {records.map(record => {
        const status = 'Approved'; // mock assumption
        const isApproved = status === 'Approved';

        return (
          <div
            key={record.id}
            className="bg-white border rounded-xl shadow-sm p-4 flex items-center justify-between hover:bg-gray-50/50 transition border-l-4 overflow-hidden"
            style={{ borderLeftColor: isApproved ? '#10b981' : '#ef4444' }}
          >
            <div className="flex items-center space-x-6">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                  isApproved ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                <i className={`fas ${isApproved ? 'fa-check' : 'fa-times'}`}></i>
              </div>

              <div>
                <div className="text-sm font-bold text-gray-900">
                  {record.tbrId} &bull; {record.type}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Vendor Request Processed
                </div>
              </div>

              <div className="hidden lg:block border-l pl-6">
                <div className="text-[10px] font-bold text-gray-400 uppercase">
                  Vendor
                </div>
                <div className="text-xs font-semibold text-gray-700">
                  {record.vendor.name}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-gray-400 uppercase">
                Requested At
              </div>
              <div className="text-xs font-bold text-gray-800">
                {record.requestedAt}
              </div>

              <span
                className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {status}
              </span>
            </div>
          </div>
        );
      })}

      {records.length === 0 && (
        <div className="p-12 text-center bg-white border border-dashed rounded-2xl text-gray-400">
          <i className="fas fa-history text-4xl mb-3 text-gray-200"></i>
          <p className="font-medium">No decision records yet.</p>
        </div>
      )}
    </div>
  );
};

export default DecisionHistory;
