import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header, BottomNav } from '../components';
import { fetchReportByTicket, fetchReports, CivicReport } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { TilerMap, TilerMarker } from '../components';

export default function TrackingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const ticketParam = searchParams.get('id');
  
  const [report, setReport] = useState<CivicReport | null>(null);
  const [allReports, setAllReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (ticketParam) {
          const data = await fetchReportByTicket(ticketParam);
          if (data) setReport(data);
        } else if (user) {
          const data = await fetchReports(user.id);
          setAllReports(data || []);
        }
      } catch (err) {
        console.error('Error loading report:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketParam, user]);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col bg-surface">
        <Header />
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
          <span className="font-body-md text-on-surface-variant">Connecting to live Supabase report...</span>
        </div>
        <BottomNav active="tracking" />
      </div>
    );
  }

  if (!ticketParam) {
    return (
      <div className="w-full h-screen flex flex-col bg-surface">
        <Header />
        <main className="flex-1 overflow-y-auto pt-24 pb-24 md:pl-24 px-gutter-lg bg-surface">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-headline-md text-on-surface font-bold mb-2">Track Your Issues</h1>
            <p className="font-body-md text-on-surface-variant mb-6">Select a report to track its progress in real-time.</p>
            
            {allReports.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-3 bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-sm mt-8">
                <div className="w-16 h-16 rounded-full bg-surface-container-low text-secondary flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-[32px]">assignment</span>
                </div>
                <h3 className="font-title-md font-bold text-on-surface">No reports filed yet</h3>
                <p className="font-body-sm text-on-surface-variant max-w-[250px]">
                  Help improve your neighborhood. Tap "Report New Issue" to get started.
                </p>
                <Link to="/report" className="mt-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-label-lg font-bold hover:bg-primary/90 transition-colors shadow-sm">
                  Report Issue
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allReports.map(r => (
                  <Link 
                    key={r.id || r.ticket_id} 
                    to={`/tracking?id=${encodeURIComponent(r.ticket_id)}`}
                    className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 hover:bg-surface-container-low transition-all active:scale-[0.98] shadow-sm group"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">track_changes</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-title-md font-bold text-on-surface truncate">{r.category}</h3>
                      <p className="font-body-sm text-on-surface-variant truncate">{r.location_address || r.ticket_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        r.status === 'Resolved' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 
                        r.status === 'Cancelled' ? 'bg-surface-container-high text-on-surface-variant' :
                        r.status === 'In Progress' ? 'bg-secondary-fixed text-on-secondary-fixed' : 
                        'bg-primary-fixed text-on-primary-fixed'
                      }`}>
                        {r.status}
                      </span>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">
                        chevron_right
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
        <BottomNav active="tracking" />
      </div>
    );
  }

  if (ticketParam && !report) {
    return (
      <div className="w-full h-screen flex flex-col bg-surface">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <h2 className="font-headline-sm font-bold text-on-surface">Report Not Found</h2>
          <p className="font-body-md text-on-surface-variant max-w-sm">
            We couldn't find a report with ticket ID <strong>{ticketParam}</strong>. It might have been deleted or doesn't exist.
          </p>
          <Link to="/tracking" className="mt-4 px-6 py-2.5 bg-surface-container-high text-on-surface rounded-full font-label-lg font-bold hover:bg-surface-container-highest transition-colors">
            View All Reports
          </Link>
        </div>
        <BottomNav active="tracking" />
      </div>
    );
  }

  const currentReport = report!;

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-surface">
      <Header />
      <main className="flex-1 flex flex-col relative w-full h-full pt-20 pb-20 md:pb-8 md:pl-24 overflow-y-auto">
        <section className="w-full px-gutter-lg pt-space-lg pb-space-md border-b border-outline-variant/20 shadow-sm bg-surface sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <Link 
                to="/tracking" 
                className="w-10 h-10 mr-1 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-low text-on-surface flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                aria-label="Back to all reports"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                    {currentReport.ticket_id}
                  </span>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/50 border border-secondary/20 text-on-secondary-container shadow-sm backdrop-blur-md">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                    </span>
                    <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">
                      {currentReport.status}
                    </span>
                  </div>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Live response tracker • {currentReport.location_address}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tracking link copied to clipboard!');
                }}
                aria-label="Share" 
                className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-surface-container-low hover:border-outline-variant/60 text-on-surface-variant flex items-center justify-center transition-all active:scale-95 shadow-sm group" 
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">share</span>
              </button>
            </div>
          </div>
          
          <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/20 flex flex-col gap-3 relative overflow-hidden mt-4">
            {(() => {
              if (currentReport.status === 'Cancelled') {
                return (
                  <div className="flex flex-col items-center justify-center p-6 text-center z-10 relative bg-surface-container-highest rounded-xl border border-outline-variant/30 overflow-hidden">
                    <span className="material-symbols-outlined text-on-surface-variant text-[40px] mb-3 relative z-10">cancel</span>
                    <h3 className="font-headline-sm text-on-surface font-bold mb-1 relative z-10">Issue Cancelled</h3>
                    <p className="font-body-md text-on-surface-variant max-w-sm relative z-10">
                      {currentReport.cancellation_reason ? `Reason: ${currentReport.cancellation_reason}` : 'This report was cancelled and is no longer being tracked.'}
                    </p>
                  </div>
                );
              }

              const priority = currentReport.priority || 'Medium';
              const slaHours = priority === 'Critical' || priority === 'High' ? 8 : (priority === 'Medium' ? 24 : 48);
              
              const createdTime = currentReport.created_at ? new Date(currentReport.created_at).getTime() : Date.now() - 4 * 3600 * 1000 - 13 * 60 * 1000;
              const now = Date.now();
              const elapsedMs = now - createdTime;
              const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
              const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
              
              const slaMs = slaHours * 3600 * 1000;
              let percentage = Math.min(100, Math.max(0, (elapsedMs / slaMs) * 100));
              if (currentReport.status === 'Resolved') percentage = 100;
              
              const isOverdue = elapsedMs > slaMs && currentReport.status !== 'Resolved';
              
              const estFinish = new Date(createdTime + slaMs);
              const finishText = estFinish.toLocaleDateString() === new Date().toLocaleDateString() 
                ? `Today, ${estFinish.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                : estFinish.toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});

              return (
                <>
                  <div className="flex items-center justify-between relative z-10">
                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-error' : 'text-primary'}`}>
                      <span className="material-symbols-outlined text-[22px]">{isOverdue ? 'warning' : 'timer'}</span>
                      <span className="font-title-md text-title-md text-on-surface font-bold">Target SLA: {slaHours} Hours</span>
                    </div>
                    <span className={`font-label-sm text-[10px] sm:text-label-sm px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                      currentReport.status === 'Resolved' 
                        ? 'text-tertiary-fixed-dim bg-tertiary-container/20 border border-tertiary-fixed-dim/30' 
                        : isOverdue
                          ? 'text-error bg-error/10 border border-error/30'
                          : 'text-primary bg-primary/10 border border-primary/30'
                    }`}>
                      {currentReport.status === 'Resolved' ? 'Completed' : isOverdue ? 'Overdue' : `On Track (${Math.round(percentage)}%)`}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden shadow-inner relative z-10">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      currentReport.status === 'Resolved' ? 'bg-tertiary' : isOverdue ? 'bg-error' : 'bg-gradient-to-r from-primary via-primary to-tertiary-fixed shadow-[0_0_8px_rgba(0,55,176,0.6)]'
                    }`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm relative z-10">
                    <span className="font-medium">Elapsed: {elapsedHours}h {elapsedMins}m</span>
                    <span className="text-on-surface font-bold">
                      {currentReport.status === 'Resolved' ? 'Resolved within SLA' : `Est. Finish: ${finishText}`}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-gutter-lg pt-4">
          <div className="md:col-span-1 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 p-space-sm flex flex-col gap-space-sm">
            <div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner group">
              <img alt={currentReport.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={currentReport.image_url || "/pothole.jpg"} />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-on-surface/40 pointer-events-none"></div>
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-on-error font-label-sm text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${currentReport.priority === 'High' || currentReport.priority === 'Critical' ? 'bg-error/90' : 'bg-primary/90'}`}>
                  {currentReport.priority} Priority {currentReport.priority === 'High' || currentReport.priority === 'Critical' ? '🔴' : '🔵'}
                </span>
                <span className="bg-surface-container-lowest/80 text-on-surface font-mono text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-sm">
                  {currentReport.ai_confidence || 95}% AI Confidence
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1 mt-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
                <span className="font-label-sm text-[10px] uppercase tracking-widest font-bold">Department</span>
              </div>
              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                {currentReport.department}
              </span>
              <p className="text-body-sm text-on-surface-variant text-[12px] mt-1 line-clamp-2">
                {currentReport.description}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 p-space-md flex flex-col gap-space-sm relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                {(currentReport.status === 'In Progress' || currentReport.status === 'Verified') && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-error shadow-[0_0_8px_rgba(186,26,26,0.8)]"></span>
                  </span>
                )}
                <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight">Location Data</span>
              </div>
              {(currentReport.status === 'In Progress' || currentReport.status === 'Verified') && (
                <span className="font-label-sm text-label-sm text-primary font-bold bg-primary/10 px-3 py-1 rounded-full border border-primary/20">GPS Active</span>
              )}
            </div>
            
            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-surface-container-high shadow-inner border border-outline-variant/10 z-10 isolate">
              <TilerMap
                defaultZoom={16}
                defaultCenter={{ lat: currentReport.latitude, lng: currentReport.longitude }}
                style={{width: '100%', height: '100%'}}
              >
                <TilerMarker position={{ lat: currentReport.latitude, lng: currentReport.longitude }} />
              </TilerMap>
            </div>

            {(currentReport.status === 'In Progress' || currentReport.status === 'Resolved') && (
              <div className="flex items-start justify-between gap-space-sm p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/10 relative z-10 mt-2">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 shadow-inner">
                    <span className="material-symbols-outlined text-[22px]">engineering</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Assigned Lead</span>
                    <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">{currentReport.assigned_lead || 'Pending Assignment'}</span>
                    <span className="font-body-sm text-[11px] text-on-surface-variant truncate">{currentReport.truck_id || 'Waiting for dispatch'}</span>
                  </div>
                </div>
                <a className="w-10 h-10 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-sm hover:bg-surface-container-low" href={`tel:${currentReport.lead_mobile_number || '+1800555019'}`}>
                  <span className="material-symbols-outlined text-[20px]">call</span>
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="p-gutter-lg pt-0">
          <div className="p-space-xl rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col gap-space-lg relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Audit Trail & Timeline</h3>
            </div>
            
            <div className="relative flex flex-col ml-4 relative z-10">
              <div className="absolute left-[15px] top-4 bottom-8 w-1 rounded-full bg-surface-container-highest"></div>
              
              {/* Step 1: Reported */}
              <div className="relative flex items-start gap-space-lg pb-space-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border-2 border-surface-container-lowest ring-2 ${true ? 'bg-tertiary-fixed text-on-tertiary-fixed ring-tertiary/20' : 'bg-surface-container-high text-on-surface-variant ring-transparent'}`}>
                  <span className="material-symbols-outlined text-[16px] font-bold">done</span>
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="font-title-md text-title-md text-on-surface font-bold">Report Logged</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      {currentReport.created_at ? new Date(currentReport.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '10:32 AM'}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Citizen report securely logged with AI image evidence.
                  </p>
                </div>
              </div>
              
              {/* Step 2: Verified */}
              {(currentReport.status === 'Verified' || currentReport.status === 'In Progress' || currentReport.status === 'Resolved') && (
                <div className="relative flex items-start gap-space-lg pb-space-lg group">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 z-10 shadow-sm border-2 border-surface-container-lowest ring-2 ring-tertiary/20">
                    <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-baseline justify-between">
                      <span className="font-title-md text-title-md text-on-surface font-bold">AI Verification Complete</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Issue automatically categorized and routed to {currentReport.department}.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: In Progress */}
              {(currentReport.status === 'In Progress' || currentReport.status === 'Resolved') && (
                <div className="relative flex items-start gap-space-lg pb-space-lg group">
                  {currentReport.status === 'In Progress' && (
                    <div className="absolute left-[15px] top-8 -bottom-4 w-1 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent"></div>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-surface-container-lowest ${
                    currentReport.status === 'Resolved' 
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed ring-2 ring-tertiary/20' 
                      : 'bg-primary text-on-primary shadow-[0_0_12px_rgba(0,55,176,0.6)]'
                  }`}>
                    <span className={`material-symbols-outlined text-[16px] font-bold ${currentReport.status === 'In Progress' ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
                      {currentReport.status === 'Resolved' ? 'done' : 'autorenew'}
                    </span>
                  </div>
                  <div className={`flex-1 flex flex-col ${currentReport.status === 'In Progress' ? 'p-space-md rounded-2xl bg-primary/5 border border-primary/20 shadow-sm transition-all group-hover:bg-primary/10' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                      <span className={`font-title-md text-title-md font-bold flex items-center gap-2 ${currentReport.status === 'In Progress' ? 'text-primary' : 'text-on-surface'}`}>
                        Repair In Progress
                        {currentReport.status === 'In Progress' && (
                          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,55,176,0.8)] animate-pulse"></span>
                        )}
                      </span>
                      {currentReport.status === 'In Progress' && (
                        <span className="font-label-sm text-[11px] text-primary font-mono font-bold bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </div>
                    <p className={`font-body-md text-body-md ${currentReport.status === 'In Progress' ? 'text-on-surface' : 'text-on-surface-variant font-body-sm text-body-sm'} leading-relaxed`}>
                      Crew dispatched by municipal team for {currentReport.category}. Inspection and repair work underway.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Resolved */}
              {currentReport.status === 'Resolved' && (
                <div className="relative flex items-start gap-space-lg pb-space-lg group">
                  <div className="absolute left-[15px] top-8 -bottom-4 w-1 rounded-full bg-gradient-to-b from-tertiary via-tertiary/50 to-transparent"></div>
                  <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 z-10 shadow-[0_0_12px_rgba(0,80,31,0.6)] border-2 border-surface-container-lowest">
                    <span className="material-symbols-outlined text-[16px] font-bold">check_circle</span>
                  </div>
                  <div className="flex-1 flex flex-col p-space-md rounded-2xl bg-tertiary/5 border border-tertiary/20 shadow-sm transition-all group-hover:bg-tertiary/10">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                      <span className="font-title-md text-title-md text-tertiary font-bold flex items-center gap-2">
                        Issue Resolved
                        <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(0,80,31,0.8)]"></span>
                      </span>
                      <span className="font-label-sm text-[11px] text-tertiary font-mono font-bold bg-tertiary/10 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      The issue has been fully resolved by the maintenance crew and verified.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Step 5: Cancelled */}
              {currentReport.status === 'Cancelled' && (
                <div className="relative flex items-start gap-space-lg pb-space-lg group">
                  <div className="w-8 h-8 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 z-10 shadow-[0_0_12px_rgba(186,26,26,0.6)] border-2 border-surface-container-lowest">
                    <span className="material-symbols-outlined text-[16px] font-bold">cancel</span>
                  </div>
                  <div className="flex-1 flex flex-col p-space-md rounded-2xl bg-error/5 border border-error/20 shadow-sm transition-all group-hover:bg-error/10">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                      <span className="font-title-md text-title-md text-error font-bold flex items-center gap-2">
                        Issue Cancelled
                        <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(186,26,26,0.8)]"></span>
                      </span>
                      <span className="font-label-sm text-[11px] text-error font-mono font-bold bg-error/10 px-2 py-0.5 rounded-full">Cancelled</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                      {currentReport.cancellation_reason ? `Cancellation Reason: ${currentReport.cancellation_reason}` : 'This issue has been cancelled and will not be processed.'}
                    </p>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </section>

      </main>
      <BottomNav active="tracking" />
    </div>
  );
}
