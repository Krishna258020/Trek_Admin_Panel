import React, { useState, useMemo } from 'react';
import { VendorRequest, RequestType } from '../../types';
import PendingRequests from './PendingRequests';
import DecisionHistory from './DecisionHistory';
import { MOCK_REQUESTS } from '../../constants.new';

const Requests: React.FC = () => {
  const [subTab, setSubTab] = useState<'pending' | 'history'>('pending');

  /* ---------------- Data Derivation ---------------- */

  const pendingRequests = useMemo(
    () =>
      MOCK_REQUESTS.filter(
        (r: VendorRequest) => r.type !== RequestType.BATCH_CANCELLATION
      ),
    []
  );

  const decisionHistory = useMemo(
    () =>
      MOCK_REQUESTS.filter(
        (r: VendorRequest) => r.type === RequestType.BATCH_CANCELLATION
      ),
    []
  );

  /* ---------------- Actions (mock only) ---------------- */

  const handleApprove = (id: string) => {
    alert(`Approved request ${id} (mock action)`);
  };

  const handleReject = (id: string) => {
    alert(`Rejected request ${id} (mock action)`);
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-1 flex w-fit">
        <button
          onClick={() => setSubTab('pending')}
          className={`px-6 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition ${
            subTab === 'pending'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Pending ({pendingRequests.length})
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`px-6 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition ${
            subTab === 'history'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          History ({decisionHistory.length})
        </button>
      </div>

      {/* Content */}
      {subTab === 'pending' ? (
        <PendingRequests
          requests={pendingRequests}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : (
        <DecisionHistory records={decisionHistory} />
      )}
    </div>
  );
};

export default Requests;
