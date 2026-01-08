
import React from 'react';
import { TBR, TrekStatus, CancellationRequestStatus } from '../types';
import { deriveTrekStatus, isBookable } from '../services/inventoryService';

interface TBRCardProps {
  tbr: TBR;
  onCancel: (id: string) => void;
  onApproveCancellation: (id: string) => void;
  onRejectCancellation: (id: string, reason: string) => void;
  onAssignCaptain: (id: string) => void;
  onViewDetails: (id: string) => void;
  onViewBookings: (id: string) => void;
}

const TBRCard: React.FC<TBRCardProps> = ({ 
  tbr, 
  onCancel, 
  onApproveCancellation, 
  onRejectCancellation,
  onAssignCaptain,
  onViewDetails,
  onViewBookings
}) => {
  const status = deriveTrekStatus(tbr);
  const bookable = isBookable(tbr);
  const availableSlots = tbr.totalSlots - tbr.soldSlots;
  const hasRequest = tbr.cancellationRequestStatus === CancellationRequestStatus.REQUESTED;
  
  const now = new Date();
  const trekDeparture = new Date(tbr.departureTime);
  const canCancelFullTBR = now < trekDeparture;

  const getStatusColor = (s: TrekStatus) => {
    switch (s) {
      case TrekStatus.UPCOMING: return 'bg-blue-100 text-blue-700 border-blue-200';
      case TrekStatus.ONGOING: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case TrekStatus.COMPLETED: return 'bg-slate-100 text-slate-600 border-slate-200';
      case TrekStatus.CANCELLED: return 'bg-rose-100 text-rose-700 border-rose-200';
      case TrekStatus.NEEDS_APPROVAL: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const handleReject = () => {
    const reason = window.prompt('Action Required: Provide mandatory rejection reason:');
    if (reason && reason.trim()) {
      onRejectCancellation(tbr.id, reason.trim());
    } else if (reason !== null) {
      alert('Rejection reason is mandatory.');
    }
  };

  return (
    <div className={`relative bg-white border-2 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group ${hasRequest ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200'}`}>
      {hasRequest && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
      )}

      <div className="flex flex-col md:flex-row p-5 gap-6">
        <div className="flex flex-col gap-2 min-w-[150px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-tighter ${getStatusColor(status)}`}>
              {status}
            </span>
            {tbr.isApproved && (
              <span className="text-emerald-500 text-sm" title="Approved Record">
                <i className="fa-solid fa-circle-check"></i>
              </span>
            )}
          </div>
          
          {hasRequest && (
            <div className="bg-rose-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-600/20 border border-rose-700">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Req: Cancellation
            </div>
          )}

          <span className="text-sm font-mono font-bold text-slate-400 mt-1"># {tbr.id}</span>
          
          {bookable ? (
            <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-tighter">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Bookable
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Locked
            </span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors leading-tight">
            {tbr.trekName}
          </h3>
          <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mb-4">
            <i className="fa-solid fa-location-dot text-indigo-400"></i>
            {tbr.destination}
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Departure</span>
              <span className="font-bold text-slate-700">{formatDate(tbr.departureTime)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Arrival</span>
              <span className="font-bold text-slate-700">{formatDate(tbr.arrivalTime)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Operator</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {tbr.operator.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Price / Slot</div>
            <div className="text-2xl font-black text-indigo-600">₹{tbr.slotPrice.toLocaleString()}</div>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-xs font-black text-slate-600">
               {tbr.soldSlots} <span className="text-slate-400 font-bold tracking-tighter uppercase">/ {tbr.totalSlots} Slots</span>
             </span>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 justify-center min-w-[170px]">
          <button 
            onClick={() => onViewDetails(tbr.id)}
            className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-black uppercase tracking-widest shadow-sm"
          >
            Trek details
          </button>
          
          <button 
            onClick={() => onViewBookings(tbr.id)}
            className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest shadow-sm"
          >
            Bookings
          </button>

          {hasRequest ? (
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={() => onApproveCancellation(tbr.id)}
                className="w-full px-4 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
              >
                Approve Cancel
              </button>
              <button 
                onClick={handleReject}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Reject Request
              </button>
            </div>
          ) : (
            canCancelFullTBR && (
              <button 
                onClick={() => onCancel(tbr.id)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-black uppercase tracking-widest transition-colors"
              >
                Cancel TBR
              </button>
            )
          )}
        </div>
      </div>

      <div className={`border-t border-slate-100 px-5 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-wider ${hasRequest ? 'bg-rose-50/50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
        <div className="flex gap-5 items-center">
          <span>Policy: <strong>{tbr.cancellationPolicy}</strong></span>
          {tbr.approvalDetails && (
            <span>Approved By: <strong>{tbr.approvalDetails.approvedBy}</strong></span>
          )}
        </div>
        <div className="italic opacity-40 font-mono">
          REF_{tbr.approvalDetails?.versionHash || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default TBRCard;
