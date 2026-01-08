
import React, { useMemo, useState } from 'react';
import { TBR, Booking, CancellationPolicy } from '../types';

interface BookingsPageProps {
  tbr: TBR;
  onBack: () => void;
  onUpdateBookings: (id: string, updatedBookings: Booking[]) => void;
}

interface CancellationModalData {
  booking: Booking;
  mode: 'STANDARD' | 'MANUAL';
  userRefund: number;
  deduction: number;
  nonRefundableHold: number;
  vendorCredit: number;
  reason: string;
  isCustomReason: boolean;
}

const BookingsPage: React.FC<BookingsPageProps> = ({ tbr, onBack, onUpdateBookings }) => {
  const [modalData, setModalData] = useState<CancellationModalData | null>(null);

  const activeBookings = useMemo(() => tbr.bookings.filter(b => b.status === 'Active'), [tbr.bookings]);
  const cancelledBookings = useMemo(() => tbr.bookings.filter(b => b.status === 'Cancelled'), [tbr.bookings]);

  const stats = useMemo(() => {
    const s = {
      activePaid: 0, activeSlots: 0,
      cancelledPaid: 0, cancelledSlots: 0,
      activePlatShare: 0, cancelledPlatShare: 0,
      gstComm: 0, gstPF: 0, tcs: 0, tds: 0, totalTaxes: 0,gstBase: 0,
      activePayout: 0, cancelledPayout: 0,
      refundsIssued: 0,
    };

    tbr.bookings.forEach(b => {
      if (b.status === 'Active') {
        s.activePaid += b.totalPaid;
        s.activeSlots += b.slots;
        s.gstComm += b.getComm18;
        s.gstPF += b.getPF5;
        s.gstBase += b.gst5;        // ✅ HERE
        s.tcs += b.tcs1;
        s.tds += b.tds1;
        s.activePayout += b.vendorShare;
      } else {
        s.cancelledPaid += b.totalPaid;
        s.cancelledSlots += b.slots;
        s.refundsIssued += (b.refundAmount || 0); 
        s.gstComm += (b.getComm18 || 0);
        s.gstPF += (b.getPF5 || 0);
        s.gstBase += (b.gst5 || 0); // ✅ HERE
        s.tcs += (b.tcs1 || 0);
        s.tds += (b.tds1 || 0);
        s.cancelledPayout += (b.vendorShare || 0);
      }
    });


    s.totalTaxes = s.gstComm + s.gstPF + s.gstBase + s.tcs + s.tds;

    return s;
  }, [tbr.bookings]);

  const now = new Date();
  const trekDeparture = new Date(tbr.departureTime);
  const trekArrival = new Date(tbr.arrivalTime);
  
  const isUpcoming = now < trekDeparture;
  const isOngoing = now >= trekDeparture && now < trekArrival;
  const isRecentlyCompleted = now >= trekArrival && (now.getTime() - trekArrival.getTime()) <= (5 * 24 * 60 * 60 * 1000);
  const showActionButtons = isUpcoming || isOngoing || isRecentlyCompleted;

  const initiateCancel = (booking: Booking) => {
    if (isUpcoming) {
      // UPCOMING RULE: Only take PF (9.52) + GST PF (0.48) = 10.00
      // No Comm, No GST Comm, No TCS, No TDS
      const nonRefundableHold = 10; 
      const refund = Math.max(0, booking.totalPaid - nonRefundableHold);
      setModalData({
        booking,
        mode: 'STANDARD',
        userRefund: refund,
        deduction: nonRefundableHold,
        nonRefundableHold: nonRefundableHold,
        vendorCredit: 0, // Usually 0 for upcoming cancellations as it's a small fee retention
        reason: 'User Request',
        isCustomReason: false
      });
    } else {
      // POST-DEPARTURE RULE: Take full Platform Share + Taxes (Comm, PF, GST, TCS, TDS)
      const nonRefundable = booking.platformShare + booking.taxes;
      const maxAvailableForDistribution = Math.max(0, booking.totalPaid - nonRefundable);
      setModalData({
        booking,
        mode: 'MANUAL',
        userRefund: 0,
        deduction: booking.totalPaid,
        nonRefundableHold: nonRefundable,
        vendorCredit: maxAvailableForDistribution,
        reason: isOngoing ? 'Force Majeure' : 'Admin Adjustment',
        isCustomReason: false
      });
    }
  };

  const handleRefundChange = (val: string) => {
    if (!modalData || modalData.mode === 'STANDARD') return;
    const input = parseFloat(val) || 0;
    const maxAvailable = Math.max(0, modalData.booking.totalPaid - modalData.nonRefundableHold);
    const clampedRefund = Math.min(input, maxAvailable);
    setModalData({
      ...modalData,
      userRefund: clampedRefund,
      deduction: modalData.booking.totalPaid - clampedRefund,
      vendorCredit: maxAvailable - clampedRefund
    });
  };

  const handleConfirmAction = () => {
    if (!modalData) return;
    
    const { booking, userRefund, deduction, vendorCredit, reason } = modalData;
    const isActuallyUpcoming = new Date() < new Date(tbr.departureTime);

    const updatedBookings = tbr.bookings.map(b => {
      if (b.id === booking.id) {
        if (isActuallyUpcoming) {
          // UPCOMING: Zero out commission based taxes
          return {
            ...b,
            status: 'Cancelled' as const,
            refundAmount: userRefund,
            deductionAmount: deduction,
            vendorShare: vendorCredit,
            // Financial adjustment for upcoming cancellation
            comm10: 0,
            getComm18: 0,
            tcs1: 0,
            tds1: 0,
            pf: 9.52,
            getPF5: 0.48,
            platformShare: 9.52,
            taxes: 0.48,
            cxlId: `CXL-${Math.floor(Math.random() * 9000) + 1000}`,
            cxlReason: reason,
            remarks: `Upcoming Cancellation: Only PF + GST PF retained.`,
            cxlTimeSlab: '>24H'
          };
        } else {
          // POST-DEPARTURE: Keep original commission and tax calculations
          return {
            ...b,
            status: 'Cancelled' as const,
            refundAmount: userRefund,
            deductionAmount: deduction,
            vendorShare: vendorCredit,
            cxlId: `CXL-${Math.floor(Math.random() * 9000) + 1000}`,
            cxlReason: reason,
            remarks: `Post-Departure Adjustment. Full commission and taxes retained.`,
            cxlTimeSlab: 'Post-Departure'
          };
        }
      }
      return b;
    });

    onUpdateBookings(tbr.id, updatedBookings);
    setModalData(null);
  };

  const renderMoney = (val: number | undefined) => (val === undefined || val === 0 ? "₹0" : `₹${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cancellation Modal */}
      {modalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className={`px-10 py-8 flex justify-between items-center text-white ${modalData.mode === 'STANDARD' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
              <div className="flex items-center gap-4">
                <i className={`fa-solid ${modalData.mode === 'STANDARD' ? 'fa-bolt-lightning' : 'fa-hand-holding-dollar'} text-xl`}></i>
                <div>
                  <h3 className="font-black uppercase tracking-[0.15em] text-xs">Governance Action</h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{modalData.mode} Cancellation</p>
                </div>
              </div>
              <button onClick={() => setModalData(null)} className="hover:rotate-90 transition-transform w-8 h-8 flex items-center justify-center bg-white/10 rounded-full">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="p-10 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Booking Hash</span>
                  <span className="font-black text-indigo-600 text-lg tracking-tight">{modalData.booking.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Primary Ledger</span>
                  <span className="font-black text-slate-800 truncate block max-w-[150px]">{modalData.booking.travellerName}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-emerald-50 p-6 rounded-[1.5rem] border-2 border-emerald-100">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-3">Audited Refund to Customer</label>
                  {modalData.mode === 'MANUAL' ? (
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-2xl">₹</span>
                      <input 
                        type="number"
                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-emerald-200 rounded-2xl font-black text-emerald-700 text-3xl focus:ring-8 focus:ring-emerald-100 outline-none transition-all shadow-inner"
                        value={modalData.userRefund}
                        onChange={(e) => handleRefundChange(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-emerald-700 tracking-tighter">₹{modalData.userRefund.toLocaleString()}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] shadow-sm">
                    <span className="text-[10px] font-black text-rose-500 uppercase block mb-1">Retention Fee</span>
                    <span className="font-black text-rose-700 text-xl tracking-tight">₹{modalData.deduction.toLocaleString()}</span>
                    <div className="text-[8px] text-rose-400 font-bold uppercase mt-1">{isUpcoming ? 'PF + GST PF ONLY' : 'COMM + TAXES'}</div>
                  </div>
                  <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-[1.5rem] shadow-sm">
                    <span className="text-[10px] font-black text-indigo-500 uppercase block mb-1">Vendor Credit</span>
                    <span className="font-black text-indigo-700 text-xl tracking-tight">₹{modalData.vendorCredit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Governance Reason</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] px-6 py-4 text-sm font-bold focus:ring-8 focus:ring-indigo-100 outline-none appearance-none cursor-pointer"
                    value={modalData.isCustomReason ? "OTHER" : modalData.reason}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "OTHER") {
                        setModalData({...modalData, isCustomReason: true, reason: ""});
                      } else {
                        setModalData({...modalData, isCustomReason: false, reason: val});
                      }
                    }}
                  >
                    <option value="User Request">User Request</option>
                    <option value="Force Majeure">Force Majeure</option>
                    <option value="Admin Adjustment">Admin Adjustment</option>
                    <option value="OTHER">Other / Custom Notes</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                </div>
              </div>
            </div>

            <div className="px-10 py-10 bg-slate-50 border-t border-slate-100 flex gap-5">
              <button 
                onClick={() => setModalData(null)}
                className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-100 transition-colors shadow-sm"
              >
                Go Back
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`flex-1 py-5 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-95 ${modalData.mode === 'STANDARD' ? 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700' : 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-700'}`}
              >
                Process Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ledger Operations</h2>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <span className="text-indigo-600">{tbr.id}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{tbr.trekName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-indigo-50 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-5 mb-6">Customer Payments</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-indigo-500 uppercase">Active Bookings Gross </span>
                <span className="text-[10px] font-black text-indigo-500">Slots: {stats.activeSlots}</span>
              </div>
              <div className="text-2xl font-black text-slate-900">₹{stats.activePaid.toLocaleString()}</div>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-amber-600 uppercase">Cancelled Total Paid</span>
              </div>
              <div className="text-2xl font-black text-slate-500 opacity-60">₹{stats.cancelledPaid.toLocaleString()}</div>
                {/* Refunds Issued */}
    <div className="pt-4 border-t border-dashed border-slate-200">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-black text-emerald-600 uppercase">
          Refunds Issued
        </span>
      </div>
      <div className="text-2xl font-black text-emerald-700">
        ₹{stats.refundsIssued.toLocaleString()}
      </div>
    </div>
  </div>
</div>
           
        </div>
        

        <div className="bg-white border-2 border-emerald-50 rounded-[2rem] p-8 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-5 mb-2">Platform Share</h4>
          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block mb-6">Share = Commission + PF</span>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>Active Share</span>
              <span className="text-emerald-600 font-black">₹{stats.activePlatShare.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>Cancelled Share</span>
              <span className="text-emerald-600 font-black">₹{stats.cancelledPlatShare.toLocaleString()}</span>
            </div>
            <div className="pt-5 border-t border-slate-100 flex justify-between items-center text-[13px] font-black mt-4">
              <span className="text-emerald-800 uppercase tracking-widest">Total Share</span>
              <span className="text-emerald-800 text-xl tracking-tighter">₹{(stats.activePlatShare + stats.cancelledPlatShare).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-amber-50 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-5 mb-6">Tax Breakdown</h4>
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>GST Comm (18%)</span>
              <span className="font-black">₹{stats.gstComm.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>GST 5% (Base Fare)</span>
              <span className="font-black">₹{stats.gstBase.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>GST PF (5%)</span>
              <span className="font-black">₹{stats.gstPF.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>TCS (1%)</span>
              <span className="font-black">₹{stats.tcs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-600">
              <span>TDS (1%)</span>
              <span className="font-black">₹{stats.tds.toLocaleString()}</span>
            </div>
          </div>
          <div className="pt-5 border-t border-dashed border-slate-200 flex justify-between items-center mt-6">
            <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Total Taxes</span>
            <span className="text-xl font-black text-amber-700">₹{stats.totalTaxes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="bg-white border-2 border-rose-50 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-5 mb-6">Vendor Payouts</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>Active Payout</span>
              <span className="text-rose-600 font-black">₹{stats.activePayout.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span>Cancelled Payout</span>
              <span className="text-rose-600 font-black">₹{stats.cancelledPayout.toLocaleString()}</span>
            </div>
            <div className="pt-6 mt-2 border-t border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 text-rose-800">Net Estimated Payout</span>
              <div className="text-3xl font-black text-rose-800 tracking-tighter">₹{(stats.activePayout + stats.cancelledPayout).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE LEDGER (24 Columns Match Request) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-emerald-50/10">
          <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-[0.2em]">Active Ledger ({activeBookings.length})</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[3400px]">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <th className="px-5 py-5 sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Booking ID / Time</th>
                <th className="px-5 py-5">Traveller Details</th>
                <th className="px-5 py-5">Sub-Traveller Details</th>
                <th className="px-5 py-5">Slots</th>
                <th className="px-5 py-5">Coupon Details</th>
                <th className="px-5 py-5 text-right">Final Base Fare (₹)</th>
                <th className="px-5 py-5 text-right">GST 5% (₹)</th>
                <th className="px-5 py-5 text-right">PF (₹)</th>
                <th className="px-5 py-5 text-right">TI (₹)</th>
                <th className="px-5 py-5">TI Policy ID</th>
                <th className="px-5 py-5 text-right">FC (₹)</th>
                <th className="px-5 py-5">FC Policy ID</th>

                {tbr.cancellationPolicy === CancellationPolicy.STANDARD && (
                  <>
                    
                  </>
                )}
                <th className="px-5 py-5 text-right font-black bg-indigo-50/20">Total Paid (₹)</th>
                {tbr.cancellationPolicy === CancellationPolicy.FLEXIBLE && (
                  <th className="px-5 py-5 text-right font-black text-rose-600 bg-rose-50/10">Pending Amount (₹)</th>
                )}
                <th className="px-5 py-5 text-right">Comm 10% (₹)</th>
                
                <th className="px-5 py-5 text-right">GST Comm 18%</th>
                <th className="px-5 py-5 text-right">GST PF 5%</th>
                <th className="px-5 py-5 text-right">TCS 1%</th>
                <th className="px-5 py-5 text-right">TDS 1%</th>
                <th className="px-5 py-5 text-right font-black">Taxes (₹)</th>
                <th className="px-5 py-5 text-right font-black text-rose-600">Vendor Share (₹)</th>
                <th className="px-5 py-5 min-w-[200px]">Remarks</th>
                <th className="px-5 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeBookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors group text-[11px] font-bold">
                  <td className="px-5 py-6 sticky left-0 z-10 bg-white border-r border-slate-100 group-hover:bg-slate-50">
                    <div className="text-indigo-600 font-black tracking-tight">{b.id}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1">{b.date}</div>
                  </td>
                  <td className="px-5 py-6">
                    <div className="text-slate-800">{b.travellerName}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{b.travellerDetails}</div>
                  </td>
                  <td className="px-5 py-6 italic text-slate-500 font-medium">{b.subTravellerDetails || '-'}</td>
                  <td className="px-5 py-6 font-black text-slate-700">{b.slots}</td>
                  <td className="px-5 py-6 text-slate-400 font-medium">{b.couponDetails || '-'}</td>
                  <td className="px-5 py-6 text-right font-bold text-slate-800">{renderMoney(b.finalBaseFare)}</td>
                  <td className="px-5 py-6 text-right text-slate-600">{renderMoney(b.gst5)}</td>
                  <td className="px-5 py-6 text-right text-slate-600">{renderMoney(b.pf)}</td>
                  <td className="px-5 py-6 text-right text-slate-600">{renderMoney(b.ti)}</td>
                  <td className="px-5 py-6 text-[9px] uppercase text-slate-400 font-black">{b.tiPolicyId || '-'}</td>
                  <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.fc)}</td>
                  <td className="px-5 py-6 text-[9px] font-black uppercase text-slate-300">{b.fcPolicyId || '-'}</td>

                  {tbr.cancellationPolicy === CancellationPolicy.STANDARD && (
                    <>
                      <td className="px-5 py-6 text-right text-slate-600">{renderMoney(b.fc)}</td>
                      <td className="px-5 py-6 text-[9px] uppercase text-slate-400 font-black">{b.fcPolicyId || '-'}</td>
                    </>
                  )}
                  
                  <td className="px-5 py-6 text-right font-black bg-indigo-50/10 text-indigo-800 text-xs">{renderMoney(b.totalPaid)}</td>
                  {tbr.cancellationPolicy === CancellationPolicy.FLEXIBLE && (
                    <td className={`px-5 py-6 text-right font-black bg-rose-50/10 ${b.pendingAmount > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                      {renderMoney(b.pendingAmount)}
                    </td>
                  )}
                  <td className="px-5 py-6 text-right text-emerald-600">{renderMoney(b.comm10)}</td>
                  
                  <td className="px-5 py-6 text-right text-amber-600">₹{b.getComm18.toFixed(2)}</td>
                  <td className="px-5 py-6 text-right text-amber-600">₹{b.getPF5.toFixed(2)}</td>
                  <td className="px-5 py-6 text-right text-indigo-500">₹{b.tcs1.toFixed(2)}</td>
                  <td className="px-5 py-6 text-right text-indigo-500">₹{b.tds1.toFixed(2)}</td>
                  <td className="px-5 py-6 text-right font-black text-amber-800">{renderMoney(b.taxes)}</td>
                  <td className="px-5 py-6 text-right font-black text-rose-600">{renderMoney(b.vendorShare)}</td>
                  <td className="px-5 py-6 text-slate-400 italic font-medium leading-relaxed">
                    {b.remarks || '-'}
                  </td>
                  <td className="px-5 py-6 text-center">
                    {showActionButtons ? (
                      <button 
                        onClick={() => initiateCancel(b)} 
                        className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-100 hover:bg-rose-100 shadow-sm"
                      >
                        Cancel
                      </button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCELLATION LEDGER (26 Columns Match Request) */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-rose-50/20">
          <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-[0.2em]">Cancellation Governance Audit ({cancelledBookings.length})</h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[4200px]">
            <thead className="bg-rose-50/10 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                <th className="px-5 py-5 sticky left-0 bg-white z-10 border-r border-slate-100">CXL ID / Time</th>
                <th className="px-5 py-5">Booking ID / Time</th>
                <th className="px-5 py-5">Traveller Details</th>
                <th className="px-5 py-5">Sub Traveller</th>
                <th className="px-5 py-5">Slots</th>
                <th className="px-5 py-5">Coupon Details</th>
                <th className="px-5 py-5 text-right">Final Base Fare (₹)</th>
                <th className="px-5 py-5 text-right">GST (₹)</th>
                <th className="px-5 py-5 text-right">PF (₹)</th>
                <th className="px-5 py-5 text-right">TI (₹)</th>
                <th className="px-5 py-5">TI Policy ID</th>
                {tbr.cancellationPolicy === CancellationPolicy.STANDARD && (
                  <>
                    <th className="px-5 py-5 text-right">FC (₹)</th>
                    <th className="px-5 py-5">FC Policy ID</th>
                  </>
                )}
                <th className="px-5 py-5 text-right font-black">Total Paid (₹)</th>
                <th className="px-5 py-5">CXL Time / Slab</th>
                <th className="px-5 py-5 text-right font-black text-emerald-700 bg-emerald-50/40">Refund Amount (₹)</th>
                <th className="px-5 py-5 text-right font-black text-rose-700 bg-rose-50/40">Deduction Amount (₹)</th>
                <th className="px-5 py-5 text-right">Comm 10% (₹)</th>
                <th className="px-5 py-5 text-right">Platform Share (₹)</th>
                <th className="px-5 py-5 text-right text-amber-600">GST Comm 18%</th>
                <th className="px-5 py-5 text-right text-amber-600">GST PF 5%</th>
                <th className="px-5 py-5 text-center">TCS</th>
                <th className="px-5 py-5 text-center">TDS</th>
                <th className="px-5 py-5 text-right font-black">Taxes (₹)</th>
                <th className="px-5 py-5 text-right font-black text-rose-900">Vendor Share (₹)</th>
                <th className="px-5 py-5 min-w-[250px]">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50 text-sm">
              {cancelledBookings.map(b => (
                <tr key={b.id} className="hover:bg-rose-50/10 transition-colors group text-[11px] font-bold">
                  <td className="px-5 py-6 sticky left-0 z-10 bg-white border-r border-rose-100 group-hover:bg-rose-50/20 text-rose-700 font-black">
                    <div>{b.cxlId}</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1">{b.date}</div>
                  </td>
                  <td className="px-5 py-6 text-slate-400 font-black">
                    <div>{b.id}</div>
                    <div className="text-[9px] mt-1 italic">{b.date}</div>
                  </td>
                  <td className="px-5 py-6 text-slate-800">
                    <div>{b.travellerName}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{b.travellerDetails}</div>
                  </td>
                  <td className="px-5 py-6 italic text-slate-400 font-medium">{b.subTravellerDetails || '-'}</td>
                  <td className="px-5 py-6 font-black text-slate-600">{b.slots}</td>
                  <td className="px-5 py-6 text-slate-300 font-medium">{b.couponDetails || '-'}</td>
                  <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.finalBaseFare)}</td>
                  <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.gst5)}</td>
                  <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.pf)}</td>
                  <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.ti)}</td>
                  <td className="px-5 py-6 text-[9px] font-black uppercase text-slate-300">{b.tiPolicyId || '-'}</td>
                  
                  {tbr.cancellationPolicy === CancellationPolicy.STANDARD && (
                    <>
                      <td className="px-5 py-6 text-right text-slate-500">{renderMoney(b.fc)}</td>
                      <td className="px-5 py-6 text-[9px] font-black uppercase text-slate-300">{b.fcPolicyId || '-'}</td>
                    </>
                  )}
                  
                  <td className="px-5 py-6 text-right font-black text-slate-800">{renderMoney(b.totalPaid)}</td>
                  <td className="px-5 py-6 text-[10px] font-black uppercase text-slate-400 tracking-tighter">{b.cxlTimeSlab || 'N/A'}</td>
                  <td className="px-5 py-6 text-right font-black bg-emerald-50/20 text-emerald-800 text-xs">{renderMoney(b.refundAmount)}</td>
                  <td className="px-5 py-6 text-right font-black bg-rose-50/20 text-rose-800 text-xs">{renderMoney(b.deductionAmount)}</td>
                  
                  {/* Comm, PlatShare, GST, TCS/TDS Columns */}
                  <td className="px-5 py-6 text-right font-bold text-slate-600">{renderMoney(b.comm10)}</td>
                  
                  <td className="px-5 py-6 text-right font-black text-amber-600">₹{(b.getComm18 || 0).toFixed(2)}</td>
                  <td className="px-5 py-6 text-right font-black text-amber-600">₹{(b.getPF5 || 0).toFixed(2)}</td>
                  <td className="px-5 py-6 text-center text-slate-400">{b.tcs1 > 0 ? `₹${b.tcs1.toFixed(2)}` : '₹0.00'}</td>
                  <td className="px-5 py-6 text-center text-slate-400">{b.tds1 > 0 ? `₹${b.tds1.toFixed(2)}` : '₹0.00'}</td>
                  
                  <td className="px-5 py-6 text-right font-black text-amber-800">{renderMoney(b.taxes)}</td>
                  <td className="px-5 py-6 text-right font-black text-rose-900 text-xs">{renderMoney(b.vendorShare)}</td>
                  <td className="px-5 py-6">
                    <div className="text-[10px] font-black uppercase text-rose-900 leading-none">{b.cxlReason}</div>
                    <div className="text-[9px] text-slate-400 italic mt-1.5 leading-tight">"{b.remarks}"</div>
                  </td>
                </tr>
              ))}
              {cancelledBookings.length === 0 && (
                <tr>
                  <td colSpan={28} className="px-10 py-32 text-center text-slate-300 italic font-black text-lg tracking-widest opacity-40 uppercase">No historical cancellation data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
