import React, { useState, useMemo } from 'react';
import {
  TBR,
  InventoryFilters,
  TimelineDirection,
  CancellationRequestStatus,
  AppView,
  Booking
} from './types';

import {
  fetchInventory,
  updateTBR,
  getGlobalPendingAlertCount,
  getTBRStore
} from './services/inventoryService';

import { CAPTAINS } from './constants';

import FilterBar from './components/FilterBar';
import TBRCard from './components/TBRCard';
import TimelineNav from './components/TimelineNav';
import TrekDetailsPage from './components/TrekDetailsPage';
import BookingsPage from './components/BookingsPage';

// ✅ NEW MODULES
import Requests from './components/Requests/Requests';
import AuditLog from './components/AuditLog/AuditLog';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('inventory');
  const [selectedTbrId, setSelectedTbrId] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>({});
  const [timelineAnchor, setTimelineAnchor] = useState<string>(
    new Date().toISOString()
  );
  const [version, setVersion] = useState(0);

  /* ---------------- Inventory ---------------- */

  const visibleTbrs = useMemo(() => {
    return fetchInventory(filters, timelineAnchor);
  }, [filters, timelineAnchor, version]);

  const alertCount = useMemo(() => {
    return getGlobalPendingAlertCount();
  }, [version]);

  const selectedTbr = useMemo(() => {
    if (!selectedTbrId) return null;
    return getTBRStore().find(t => t.id === selectedTbrId) || null;
  }, [selectedTbrId, version]);

  /* ---------------- Mutations ---------------- */

  const triggerUpdate = (id: string, updates: Partial<TBR>) => {
    updateTBR(id, updates);
    setVersion(v => v + 1);
  };

  const handleUpdateBookings = (id: string, updatedBookings: Booking[]) => {
    triggerUpdate(id, { bookings: updatedBookings });
  };

  const handleCancelTBR = (id: string) => {
    if (window.confirm(`Immediate Action: Mark TBR ${id} as Cancelled?`)) {
      triggerUpdate(id, {
        isCancelled: true,
        cancellationRequestStatus: CancellationRequestStatus.APPROVED,
        cancellationDecision: {
          by: 'Admin Alex (Manual)',
          at: new Date().toISOString(),
          notes: 'Manual cancellation from inventory feed.'
        }
      });
    }
  };

  const handleApproveCancellation = (id: string) => {
    if (window.confirm(`Approve cancellation request for ${id}?`)) {
      triggerUpdate(id, {
        isCancelled: true,
        cancellationRequestStatus: CancellationRequestStatus.APPROVED,
        cancellationDecision: {
          by: 'Admin Alex',
          at: new Date().toISOString(),
          notes: 'Approved from inventory feed.'
        }
      });
    }
  };

  const handleRejectCancellation = (id: string, reason: string) => {
    triggerUpdate(id, {
      cancellationRequestStatus: CancellationRequestStatus.REJECTED,
      cancellationDecision: {
        by: 'Admin Alex',
        at: new Date().toISOString(),
        notes: reason
      }
    });
  };

  const handleAssignCaptain = (id: string) => {
    const options = CAPTAINS.map(
      (c, i) => `${i + 1}. ${c.name} (${c.id})`
    ).join('\n');

    const choice = window.prompt(
      `Select Trek Captain for ${id}:\n\n${options}\n\nEnter number or leave empty to unassign`
    );

    if (choice === '') {
      triggerUpdate(id, {
        captainId: undefined,
        captainName: undefined,
        captainContact: undefined,
        captainAssignedBy: undefined,
        captainAssignedAt: undefined
      });
      return;
    }

    const index = parseInt(choice || '0') - 1;
    if (CAPTAINS[index]) {
      const captain = CAPTAINS[index];
      triggerUpdate(id, {
        captainId: captain.id,
        captainName: captain.name,
        captainContact: captain.contact,
        captainAssignedBy: 'Admin Alex',
        captainAssignedAt: new Date().toISOString()
      });
      alert(`Assigned ${captain.name} to ${id}`);
    } else if (choice !== null) {
      alert('Invalid selection');
    }
  };

  /* ---------------- Navigation ---------------- */

  const handleNavigate = (direction: TimelineDirection) => {
    const next = new Date(timelineAnchor);
    next.setDate(next.getDate() + (direction === 'prev' ? -7 : 7));
    setTimelineAnchor(next.toISOString());
  };

  const handleViewDetails = (id: string) => {
    setSelectedTbrId(id);
    setActiveView('details');
  };

  const handleViewBookings = (id: string) => {
    setSelectedTbrId(id);
    setActiveView('bookings');
  };

  const handleBackToFeed = () => {
    setActiveView('inventory');
    setSelectedTbrId(null);
  };

  /* ---------------- Render ---------------- */

  const renderContent = () => {
    switch (activeView) {
      case 'details':
        return selectedTbr ? (
          <TrekDetailsPage
            tbr={selectedTbr}
            onBack={handleBackToFeed}
            onUpdateCaptain={triggerUpdate}
          />
        ) : null;

      case 'bookings':
        return selectedTbr ? (
          <BookingsPage
            tbr={selectedTbr}
            onBack={handleBackToFeed}
            onUpdateBookings={handleUpdateBookings}
          />
        ) : null;

      case 'requests':
        return <Requests />;

      case 'audit':
        return <AuditLog />;

      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  Inventory Feed
                </h2>
                <p className="text-sm text-slate-500">
                  Timeline view based on Arrival Date & Time
                </p>
              </div>
              <div className="bg-white border px-4 py-2 rounded-xl shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  Showing
                </span>
                <span className="text-lg font-black text-indigo-600">
                  {visibleTbrs.length} Records
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {visibleTbrs.map(tbr => (
                <TBRCard
                  key={tbr.id}
                  tbr={tbr}
                  onCancel={handleCancelTBR}
                  onApproveCancellation={handleApproveCancellation}
                  onRejectCancellation={handleRejectCancellation}
                  onAssignCaptain={handleAssignCaptain}
                  onViewDetails={handleViewDetails}
                  onViewBookings={handleViewBookings}
                />
              ))}

              {visibleTbrs.length === 0 && (
                <div className="border-2 border-dashed rounded-2xl py-24 text-center">
                  <h3 className="text-xl font-bold">No Records Found</h3>
                  <p className="text-slate-400">
                    Try adjusting filters or timeline
                  </p>
                </div>
              )}

              {!filters.tbrIdSearch &&
                !filters.startDate &&
                !filters.endDate && (
                  <TimelineNav
                    currentAnchor={timelineAnchor}
                    onNavigate={handleNavigate}
                  />
                )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-900 text-white px-8 py-4 shadow-lg">
        <h1 className="text-xl font-black">TrekFlow Admin</h1>
        <p className="text-[10px] uppercase tracking-widest text-indigo-300">
          Inventory Governance Context
        </p>
      </header>

      {/* 🔹 FILTER BAR + NAV */}
      {activeView !== 'details' && activeView !== 'bookings' && (
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      )}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-auto">
        {renderContent()}
      </main>

      <footer className="border-t p-4 text-[10px] uppercase flex justify-between">
        <span>© 2024 TrekFlow Platform Architecture</span>
        <span>v3.0.0-LedgerSync</span>
      </footer>
    </div>
  );
};

export default App;
