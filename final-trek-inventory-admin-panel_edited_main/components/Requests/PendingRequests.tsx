import { VendorRequest, RequestType } from '../../types';

import React from 'react';


interface PendingRequestsProps {
  requests: VendorRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({ requests, onApprove, onReject }) => {
  return (
    <div className="space-y-4">
      {requests.map(req => (
        <div key={req.id} className="bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Metadata */}
          <div className="bg-gray-50 p-6 md:w-80 border-b md:border-b-0 md:border-r">
            <div className="flex justify-between items-start mb-4">
              <div className="text-lg font-bold text-gray-900">{req.id}</div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.type === RequestType.EDIT_DETAILS ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                {req.type}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">TBR ID & Status</div>
                <div className="text-sm font-semibold">{req.tbrId} • {req.trekStatus}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Vendor</div>
                <div className="text-sm font-semibold">{req.vendor.name}</div>
                <div className="text-xs text-gray-500">Score: {req.vendor.score}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Requested On</div>
                <div className="text-xs font-medium text-gray-700 italic">{req.requestedAt}</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Service</div>
                <div className="text-sm font-bold">{req.serviceName}</div>
                <div className="text-xs text-gray-500">{req.sourceCities.join(', ')} &rarr; {req.destinations.join(', ')}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Schedule</div>
                <div className="text-xs font-semibold">{req.schedule.departure}</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-700 uppercase mb-3 flex items-center">
                <i className="fas fa-exchange-alt mr-2"></i> Requested Changes
              </h4>
              
              <div className="space-y-6">
                {/* Captain Change Section */}
                {req.details?.captainChange && (

                  <div className="p-4 bg-white rounded-2xl border border-indigo-100/50 shadow-sm space-y-4">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Trek Captain Change</div>
                    <div className="grid grid-cols-2 gap-8 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border text-indigo-600 shadow-sm z-10">
                        <i className="fas fa-arrow-right"></i>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Old Data</div>
                        <div className="text-xs font-bold text-gray-700">{req.details.captainChange.old.name}</div>
                        <div className="text-[10px] text-gray-500">{req.details.captainChange.old.phone}</div>
                      </div>
                      <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-right">
                        <div className="text-[9px] font-bold text-indigo-400 uppercase mb-1">New Proposed</div>
                        <div className="text-xs font-bold text-indigo-700">{req.details.captainChange.new.name}</div>
                        <div className="text-[10px] text-indigo-500">{req.details.captainChange.new.phone}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Accommodation Change Section */}
                {req.details.accommodationChanges && req.details.accommodationChanges.length > 0 && (
                  <div className="space-y-4">
                    {req.details.accommodationChanges.map((change, i) => (
                      <div key={i} className="p-4 bg-white rounded-2xl border border-indigo-100/50 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Accommodation Change</div>
                          <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm">
                            {change.night}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-8 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border text-indigo-600 shadow-sm z-10">
                            <i className="fas fa-arrow-right"></i>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1">Old Data</div>
                            <p className="text-xs font-medium text-gray-600 leading-relaxed">{change.old}</p>
                          </div>
                          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-right">
                            <div className="text-[9px] font-bold text-indigo-400 uppercase mb-1">New Proposed</div>
                            <p className="text-xs font-black text-indigo-800 leading-relaxed">{change.new}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancellation Reason Section */}
              {req.type === RequestType.BATCH_CANCELLATION && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 text-red-500">Cancellation Reason</div>
                    <p className="text-sm text-gray-700 bg-white p-4 rounded-2xl border border-red-50 leading-relaxed italic">"{req.details.cancellationReason}"</p>
                  </div>
                  {req.details.vendorRemarks && (
                    <div className="text-xs italic text-gray-400 mt-2 bg-gray-50 p-2 rounded">
                      Vendor Remark: "{req.details.vendorRemarks}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 md:w-48 bg-gray-50 flex flex-col justify-center space-y-3 border-t md:border-t-0 md:border-l">
            <button 
              onClick={() => onApprove(req.id)}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
            >
              Approve
            </button>
            <button 
              onClick={() => onReject(req.id)}
              className="w-full py-2.5 bg-white text-red-600 border border-red-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
      {requests.length === 0 && (
        <div className="p-12 text-center bg-white border border-dashed rounded-2xl text-gray-400">
          <i className="fas fa-check-circle text-4xl mb-3 text-emerald-200"></i>
          <p className="font-medium text-lg">No pending requests!</p>
          <p className="text-sm">All vendor requested changes have been processed.</p>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
