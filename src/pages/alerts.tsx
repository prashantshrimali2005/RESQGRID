import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header, BottomNav } from '../components';
import { fetchReports, CivicReport } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

type AlertType = 'all' | 'status' | 'dispatch' | 'resolved' | 'critical';

export interface Alert {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  timestamp: number;
  type: AlertType;
  ticketId: string;
  isRead: boolean;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function generateAlerts(reports: CivicReport[]): Alert[] {
  const alerts: Alert[] = [];

  for (const report of reports) {
    const created = report.created_at || new Date().toISOString();
    const ts = new Date(created).getTime();

    // Report submitted alert
    alerts.push({
      id: `${report.ticket_id}-submitted`,
      icon: 'add_circle',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: `Issue Raised`,
      body: `${report.category} issue reported at ${report.location_address || 'unknown location'} (${report.ticket_id})`,
      time: timeAgo(created),
      timestamp: ts,
      type: 'status',
      ticketId: report.ticket_id,
      isRead: false,
    });

    // Status-based alerts
    if (report.status === 'In Progress') {
      alerts.push({
        id: `${report.ticket_id}-dispatch`,
        icon: 'assignment_turned_in',
        iconBg: 'bg-secondary/10',
        iconColor: 'text-secondary',
        title: 'Assigned to Department',
        body: `Report ${report.ticket_id} (${report.category}) has been received and routed to ${report.department || 'the relevant department'}.`,
        time: timeAgo(new Date(ts + 1000).toISOString()),
        timestamp: ts + 1000,
        type: 'status',
        ticketId: report.ticket_id,
        isRead: false,
      });
    }

    if (report.status === 'Verified') {
      alerts.push({
        id: `${report.ticket_id}-verified`,
        icon: 'verified',
        iconBg: 'bg-tertiary/10',
        iconColor: 'text-tertiary',
        title: 'Report Verified by AI',
        body: `${report.ticket_id} has been verified with ${report.ai_confidence || 98}% AI confidence. Awaiting dispatch.`,
        time: timeAgo(new Date(ts + 600000).toISOString()),
        timestamp: ts + 600000,
        type: 'status',
        ticketId: report.ticket_id,
        isRead: true,
      });
    }

    if (report.status === 'Resolved') {
      alerts.push({
        id: `${report.ticket_id}-resolved`,
        icon: 'check_circle',
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-600',
        title: 'Issue Resolved',
        body: `${report.category} at ${report.location_address || 'location'} (${report.ticket_id}) has been fully resolved.`,
        time: timeAgo(new Date(ts + 86400000).toISOString()),
        timestamp: ts + 86400000,
        type: 'resolved',
        ticketId: report.ticket_id,
        isRead: true,
      });
    }

    if (report.priority === 'High' || report.priority === 'Critical') {
      alerts.push({
        id: `${report.ticket_id}-critical`,
        icon: 'warning',
        iconBg: 'bg-error/10',
        iconColor: 'text-error',
        title: `${report.priority} Priority Alert`,
        body: `${report.category} at ${report.location_address || 'location'} (${report.ticket_id}) requires immediate attention.`,
        time: timeAgo(new Date(ts + 300000).toISOString()),
        timestamp: ts + 300000,
        type: 'critical',
        ticketId: report.ticket_id,
        isRead: false,
      });
    }
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

function groupAlertsByDay(alerts: Alert[]): { label: string; alerts: Alert[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  const groups: { label: string; alerts: Alert[] }[] = [
    { label: 'Today', alerts: [] },
    { label: 'Yesterday', alerts: [] },
    { label: 'This Week', alerts: [] },
    { label: 'Earlier', alerts: [] },
  ];

  for (const alert of alerts) {
    if (alert.timestamp >= todayStart) groups[0].alerts.push(alert);
    else if (alert.timestamp >= yesterdayStart) groups[1].alerts.push(alert);
    else if (alert.timestamp >= weekStart) groups[2].alerts.push(alert);
    else groups[3].alerts.push(alert);
  }

  return groups.filter(g => g.alerts.length > 0);
}

const filterTabs: { key: AlertType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'inbox' },
  { key: 'critical', label: 'Critical', icon: 'warning' },
  { key: 'dispatch', label: 'Dispatch', icon: 'local_shipping' },
  { key: 'status', label: 'Updates', icon: 'info' },
  { key: 'resolved', label: 'Resolved', icon: 'check_circle' },
];

export default function AlertsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<AlertType>('all');
  const [readAlerts, setReadAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        if (!user) return;
        const data = await fetchReports(user.id);
        setReports(data || []);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const allAlerts = generateAlerts(reports);
  const filtered = activeFilter === 'all' ? allAlerts : allAlerts.filter(a => a.type === activeFilter);
  const grouped = groupAlertsByDay(filtered);
  const unreadCount = allAlerts.filter(a => !a.isRead && !readAlerts.has(a.id)).length;

  const markAllRead = () => {
    setReadAlerts(new Set(allAlerts.map(a => a.id)));
  };

  const markRead = (id: string) => {
    setReadAlerts(prev => new Set(prev).add(id));
  };

  return (
    <>
      <Header />
      <main className="w-full pt-20 pb-24 md:pb-8 md:pl-24 bg-surface min-h-screen">
        <div className="max-w-3xl mx-auto px-margin">
          {/* Page Header */}
          <div className="py-space-md flex items-center justify-between">
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Alerts</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Stay updated on your reported issues.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error font-label-sm text-label-sm font-bold">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  {unreadCount} New
                </span>
              )}
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors font-label-sm text-label-sm text-primary font-bold"
              >
                Mark all read
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-space-sm -mx-margin px-margin">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-label-md text-label-md font-bold whitespace-nowrap transition-all shrink-0 ${
                  activeFilter === tab.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/20'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="font-body-md text-on-surface-variant">Loading alerts...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant">notifications_off</span>
              </div>
              <h3 className="font-title-lg text-title-lg text-on-surface font-bold mb-1">No alerts yet</h3>
              <p className="font-body-md text-on-surface-variant max-w-xs">
                {activeFilter === 'all'
                  ? 'When you report issues, alerts will appear here.'
                  : `No ${activeFilter} alerts at the moment.`}
              </p>
            </div>
          )}

          {/* Alert Groups */}
          {!loading && grouped.map(group => (
            <div key={group.label} className="mb-space-md">
              <div className="flex items-center gap-3 py-3">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">{group.label}</span>
                <div className="flex-1 h-px bg-outline-variant/15"></div>
                <span className="font-label-sm text-[11px] text-on-surface-variant/60">{group.alerts.length}</span>
              </div>
              <div className="space-y-2">
                {group.alerts.map(alert => {
                  const isUnread = !alert.isRead && !readAlerts.has(alert.id);
                  return (
                    <Link
                      key={alert.id}
                      to={`/tracking?id=${encodeURIComponent(alert.ticketId)}`}
                      onClick={() => markRead(alert.id)}
                      className={`block rounded-2xl p-4 border transition-all group hover:-translate-y-0.5 hover:shadow-md ${
                        isUnread
                          ? 'bg-primary/[0.04] border-primary/20 shadow-sm'
                          : 'bg-surface-container-lowest border-outline-variant/15 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-11 h-11 rounded-xl ${alert.iconBg} ${alert.iconColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <span className="material-symbols-outlined text-[22px]">{alert.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-title-sm text-title-sm text-on-surface truncate ${isUnread ? 'font-bold' : 'font-semibold'}`}>
                              {alert.title}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isUnread && (
                                <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,55,176,0.4)]"></span>
                              )}
                              <span className="font-label-sm text-[11px] text-on-surface-variant/70 whitespace-nowrap">{alert.time}</span>
                            </div>
                          </div>
                          <p className={`font-body-sm text-[13px] mt-0.5 line-clamp-2 ${isUnread ? 'text-on-surface-variant' : 'text-on-surface-variant/70'}`}>
                            {alert.body}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high/60 font-mono text-[10px] text-on-surface-variant font-bold">
                              {alert.ticketId}
                            </span>
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                              arrow_forward
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
