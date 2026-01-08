
import React, { useState } from 'react';
import { TBR, TrekStatus, CancellationPolicy, RouteStage, TransportMode } from '../types';
import { CAPTAINS } from '../constants';
import { deriveTrekStatus } from '../services/inventoryService';

interface TrekDetailsPageProps {
  tbr: TBR;
  onBack: () => void;
  onUpdateCaptain: (id: string, captainData: Partial<TBR>) => void;
}

const TrekDetailsPage: React.FC<TrekDetailsPageProps> = ({ tbr, onBack, onUpdateCaptain }) => {
  const status = deriveTrekStatus(tbr);
  const [isEditingCaptain, setIsEditingCaptain] = useState(false);
  const details = tbr.trekDetails;

  if (!details) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
      <p className="text-slate-500 font-bold italic">No extended details found for this record.</p>
      <button onClick={onBack} className="mt-4 text-indigo-600 font-bold uppercase text-xs">Return</button>
    </div>
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleCaptainSelect = (captainId: string) => {
    if (!captainId) {
      onUpdateCaptain(tbr.id, {
        captainId: undefined, captainName: undefined, captainContact: undefined,
        captainAssignedBy: undefined, captainAssignedAt: undefined
      });
    } else {
      const cap = CAPTAINS.find(c => c.id === captainId);
      if (cap) {
        onUpdateCaptain(tbr.id, {
          captainId: cap.id, captainName: cap.name, captainContact: cap.contact,
          captainAssignedBy: 'Admin Alex (System)', captainAssignedAt: new Date().toISOString()
        });
      }
    }
    setIsEditingCaptain(false);
  };

  const SectionHeader = ({ icon, title }: { icon: string, title: string }) => (
    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
      <i className={`fa-solid ${icon} text-indigo-500`}></i>
      {title}
    </h3>
  );

  // Added key to props type to satisfy TS requirements when passing key to local component function
  const RouteCard = ({ stage, title, color }: { stage: RouteStage, title: string, color: string, key?: React.Key }) => (
    <div className={`p-4 rounded-xl border-l-4 ${color} bg-white border border-slate-100 shadow-sm`}>
      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1 tracking-tighter">{title}</span>
      <div className="text-sm font-bold text-slate-800">{stage.name}</div>
      {stage.point && <div className="text-[11px] text-slate-500 font-medium">Point: {stage.point}</div>}
      {stage.location && <div className="text-[11px] text-slate-500 font-medium">{stage.location}</div>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] font-bold text-indigo-600">{formatDate(stage.date)}</span>
        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-black text-slate-500">{stage.mode}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors group">
          <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          Back to Feed
        </button>
        <div className="flex gap-2">
          <button onClick={() => alert("Post-approval edits will trigger re-approval cycle.")} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
            Edit Details
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase shadow-lg shadow-indigo-600/20">
            Print Itinerary
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Logistics & Contacts */}
        <div className="lg:col-span-1 space-y-8">
          {/* Contacts Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
            <SectionHeader icon="fa-address-book" title="Contact Snapshots" />
            <div className="space-y-6">
              {/* Operator Contact */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <i className="fa-solid fa-building"></i>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Operator Contact (Snapshot)</span>
                  <div className="text-sm font-bold text-slate-800">{details.operatorContactNumber}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Manual snapshot at approval</div>
                </div>
              </div>

              {/* Trek Captain */}
              <div className="flex items-start gap-3 pt-6 border-t border-slate-50">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Trek Captain</span>
                    <button onClick={() => setIsEditingCaptain(true)} className="text-[9px] font-black text-indigo-600 uppercase">Manage</button>
                  </div>
                  {isEditingCaptain ? (
                    <select 
                      autoFocus
                      className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold"
                      onChange={(e) => handleCaptainSelect(e.target.value)}
                      onBlur={() => setIsEditingCaptain(false)}
                      value={tbr.captainId || ''}
                    >
                      <option value="">-- No Captain --</option>
                      {CAPTAINS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-slate-800">{tbr.captainName || 'Not Assigned'}</div>
                      <div className="text-[11px] font-medium text-slate-500">{tbr.captainContact || 'Contact unavailable'}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Lists */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
            <div>
              <SectionHeader icon="fa-check-double" title="Inclusions" />
              <div className="flex flex-wrap gap-2">
                {details.inclusions.map((item, i) => (
                  <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md font-bold">{item}</span>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200">
              <SectionHeader icon="fa-ban" title="Exclusions" />
              <div className="flex flex-wrap gap-2">
                {details.exclusions.map((item, i) => (
                  <span key={i} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-2 py-1 rounded-md font-bold">{item}</span>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-200">
              <SectionHeader icon="fa-circle-exclamation" title="Other Policies" />
              <ul className="space-y-2">
                {details.otherPolicies.map((p, i) => (
                  <li key={i} className="text-[11px] text-slate-600 font-medium flex gap-2">
                    <span className="text-indigo-500">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Itinerary & Route */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Route Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader icon="fa-route" title="Trek Logistics & Route" />
            <div className="space-y-6 relative">
              {/* Vertical line connector */}
              <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-slate-100"></div>

              {/* Departure Stage */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-2 border-white shadow-sm z-10">
                  <i className="fa-solid fa-plane-departure text-xs"></i>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {details.route.departureStages.map((stage, idx) => (
                    <RouteCard key={idx} stage={stage} title={`Departure Pt ${idx + 1}`} color="border-l-blue-500" />
                  ))}
                </div>
              </div>

              {/* Meeting Point */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border-2 border-white shadow-sm z-10">
                  <i className="fa-solid fa-handshake text-xs"></i>
                </div>
                <RouteCard stage={details.route.meetingPoint} title="Official Meeting Point" color="border-l-amber-500" />
              </div>

              {/* Trek Stages */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border-2 border-white shadow-sm z-10">
                  <i className="fa-solid fa-mountain text-xs"></i>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {details.route.trekStages.map((stage, idx) => (
                    <RouteCard key={idx} stage={stage} title={`Trek Stage ${idx + 1}`} color="border-l-emerald-500" />
                  ))}
                </div>
              </div>

              {/* Return Stage */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border-2 border-white shadow-sm z-10">
                  <i className="fa-solid fa-plane-arrival text-xs"></i>
                </div>
                <RouteCard stage={details.route.returnStage} title="Final Return / Drop" color="border-l-slate-400" />
              </div>
            </div>
          </div>

          {/* Itinerary & Activities */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Itinerary List */}
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <SectionHeader icon="fa-calendar-day" title="Day-wise Itinerary" />
              <div className="space-y-6">
                {details.itinerary.map((day, idx) => (
                  <div key={idx} className="group">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">
                        D{day.dayNumber}
                      </span>
                      <h4 className="text-sm font-black text-slate-800">{day.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-11">{day.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities Card */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                <SectionHeader icon="fa-fire" title="Featured Activities" />
                <div className="space-y-4">
                  {details.activities.map((act, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                      <div className="text-xs font-black text-indigo-600 mb-1">{act.name}</div>
                      {act.description && <p className="text-[10px] text-slate-500 font-medium leading-tight">{act.description}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Governance Note */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Governance Seal</div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <i className="fa-solid fa-lock text-indigo-400"></i>
                  Data Immutable After Approval
                </div>
                <div className="mt-2 text-[9px] text-slate-400 leading-relaxed italic">
                  Any modification to route or itinerary requires administrative re-verification.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrekDetailsPage;
