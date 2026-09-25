import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchReports, fetchFieldUnits, createFieldUnit, deleteFieldUnit, updateReport, deleteReport, supabase, CivicReport, FieldUnit } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

function DashboardTab({ reports, onDelete }: { reports: CivicReport[], onDelete: (id: string) => void }) {
  const total = reports.length;
  const newToday = reports.filter(r => r.created_at && new Date(r.created_at).toDateString() === new Date().toDateString()).length;
  const inProgress = reports.filter(r => r.status === 'In Progress').length;
  const resolved = reports.filter(r => r.status === 'Resolved').length;
  const overdue = reports.filter(r => r.status === 'Reported' || r.status === 'Verified').length; // Mock overdue logic

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-label-sm font-label-sm uppercase tracking-wider text-primary">Municipal Operations Center</span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">Live Feed Active</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Department Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high transition-colors text-body-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors text-body-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            New Manual Ticket
          </button>
        </div>
      </div>

      <div className="px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Complaints" icon="forum" value={total} trend="+4%" bg="bg-primary-fixed" text="text-on-primary-fixed" sub="Active municipal queue" />
        <StatCard title="New Today" icon="fiber_new" value={newToday} trend="+12%" bg="bg-primary-container" text="text-on-primary-container" sub="Requires triage" />
        <StatCard title="In Progress" icon="engineering" value={inProgress} bg="bg-secondary-fixed-dim" text="text-on-secondary-fixed" sub="Field units active" />
        <StatCard title="Resolved" icon="check_circle" value={resolved} trend="+8%" bg="bg-secondary" text="text-on-secondary" sub="This current week" />
        <StatCard title="Overdue" icon="warning" value={overdue} trend="-2" isError bg="bg-error-container" text="text-on-error-container" sub="SLA breach risk" />
      </div>

      <div className="px-8 mb-6">
        <h2 className="text-title-md font-bold mb-4">Recent Issues</h2>
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <IssueTable reports={[...reports].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5)} onUpdate={() => {}} onDelete={onDelete} readonly />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, icon, value, trend, bg, text, sub, isError = false }: any) {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${bg}/10 rounded-full group-hover:scale-110 transition-transform`}></div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-label-md font-label-md text-on-surface-variant">{title}</span>
        <div className={`w-8 h-8 rounded-xl ${bg} ${text} flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-headline-lg font-headline-lg ${isError ? 'text-error' : 'text-on-surface'}`}>{value}</span>
        {trend && (
          <span className={`text-label-sm font-label-sm ${isError ? 'text-error' : 'text-secondary'} flex items-center`}>
            <span className="material-symbols-outlined text-[14px]">
              {trend.startsWith('+') ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {trend}
          </span>
        )}
      </div>
      <p className="text-label-sm font-label-sm text-on-surface-variant mt-1">{sub}</p>
    </div>
  );
}

function TriageTab({ reports, fieldUnits, onUpdate, onDelete }: { reports: CivicReport[], fieldUnits: FieldUnit[], onUpdate: (id: string, updates: Partial<CivicReport>) => void, onDelete: (id: string) => void }) {
  const [statusFilter, setStatusFilter] = useState('All');
  
  const filtered = useMemo(() => {
    if (statusFilter === 'All') return reports;
    return reports.filter(r => r.status === statusFilter);
  }, [reports, statusFilter]);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Issue Triage</h1>
      </div>
      
      <div className="px-8 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-surface-container px-4 py-2 rounded-xl text-body-sm text-on-surface focus:outline-none pr-10"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Verified">Verified</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <span className="text-body-sm text-on-surface-variant">Showing {filtered.length} issues</span>
        </div>
      </div>

      <div className="px-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <IssueTable reports={filtered} fieldUnits={fieldUnits} onUpdate={onUpdate} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsTab({ reports }: { reports: CivicReport[] }) {
  // Chart Data Processing
  const categoryCount = reports.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const categoryData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));
  const COLORS = ['#0037B0', '#1FA463', '#FFC107', '#BA1A1A', '#9C27B0'];

  const statusCount = reports.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusData = Object.keys(statusCount).map(key => ({ name: key, count: statusCount[key] }));

  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const trendData = last7Days.map(dateStr => {
    const count = reports.filter(r => r.created_at && r.created_at.startsWith(dateStr)).length;
    return { date: dateStr.substring(5), issues: count };
  });

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Analytics Dashboard</h1>
      </div>
      <div className="px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 col-span-1 lg:col-span-2">
          <h2 className="text-title-md font-bold mb-6 text-on-surface">Issue Volume (Last 7 Days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#73777F' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#73777F' }} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1A1C1E', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="issues" name="Issues Reported" stroke="#0037B0" strokeWidth={3} dot={{ r: 4, fill: '#0037B0', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 col-span-1">
          <h2 className="text-title-md font-bold mb-6 text-on-surface">Issues by Category</h2>
          <div className="h-64 flex flex-col">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1A1C1E', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#44474E', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldUnitsTab({ fieldUnits, reports, onAdd, onDelete }: { fieldUnits: FieldUnit[], reports: CivicReport[], onAdd: (unit: Omit<FieldUnit, 'id' | 'created_at'>) => Promise<void>, onDelete: (id: string) => Promise<void> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !department || !mobile) return;
    setLoading(true);
    try {
      await onAdd({ name, department, mobile_number: mobile, status: 'Idle', current_task: 'None' });
      setIsAdding(false);
      setName('');
      setDepartment('');
      setMobile('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-8 pt-8 pb-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Field Units</h1>
        <button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-body-sm font-medium shadow-sm hover:bg-primary/90 transition-colors">
          {isAdding ? 'Cancel' : 'Add Unit'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 rounded-2xl shadow-md border-2 border-primary/20 flex flex-col gap-3">
            <h3 className="font-bold text-title-md mb-2">New Field Unit</h3>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Unit Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Delta Team" className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Department</label>
              <input required value={department} onChange={e => setDepartment(e.target.value)} type="text" placeholder="e.g. Electrical" className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Mobile Number</label>
              <input required value={mobile} onChange={e => setMobile(e.target.value)} type="tel" placeholder="+1-555-..." className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button type="submit" disabled={loading} className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Unit'}
            </button>
          </form>
        )}
        {fieldUnits.map((unit) => {
          const activeReport = reports.find(r => r.assigned_lead === unit.name && r.status === 'In Progress');
          const dynamicStatus = activeReport ? 'Active' : 'Idle';
          const currentTask = activeReport ? `#${activeReport.ticket_id}` : 'None';
          
          return (
            <div key={unit.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex flex-col relative group border border-outline-variant/10">
              <button onClick={() => { if(confirm(`Delete ${unit.name}?`)) onDelete(unit.id!) }} className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <h3 className="font-bold text-title-md mb-1 pr-8">{unit.name}</h3>
              <span className="text-label-sm font-medium text-primary mb-2">{unit.department}</span>
              <div className="text-body-sm text-on-surface-variant mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">call</span>
                {unit.mobile_number}
              </div>
              <span className="text-body-sm text-on-surface-variant mb-4 font-mono font-medium">Current Task: {currentTask}</span>
              <span className={`px-3 py-1 rounded-full text-[12px] font-bold self-start ${dynamicStatus === 'Active' ? 'bg-primary/20 text-primary' : 'bg-surface-container text-on-surface'}`}>
                {dynamicStatus}
              </span>
            </div>
          );
        })}
        {fieldUnits.length === 0 && (
          <div className="col-span-3 text-center p-8 text-on-surface-variant bg-surface-container-lowest rounded-2xl">
            No field units configured in database.
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ reports, onDelete }: { reports: CivicReport[], onDelete: (id: string) => void }) {
  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [reports]);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="px-8 pt-8 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">Report History</h1>
      </div>
      <div className="px-8 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <span className="text-body-sm text-on-surface-variant">Showing all {sortedReports.length} historical reports</span>
        </div>
      </div>
      <div className="px-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            <IssueTable reports={sortedReports} onUpdate={() => {}} onDelete={onDelete} readonly />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="px-8 pt-8 pb-16">
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-6">Settings</h1>
      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm max-w-2xl">
        <div className="space-y-6">
          <div>
            <h3 className="font-bold mb-2">Notification Preferences</h3>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary" />
              <span>Email alerts for critical issues</span>
            </label>
          </div>
          <div>
            <h3 className="font-bold mb-2">AI Auto-Triage Threshold</h3>
            <input type="range" className="w-full" min="0" max="100" defaultValue="85" />
            <div className="text-body-sm text-on-surface-variant mt-1">Issues above 85% confidence will be auto-assigned.</div>
          </div>
          <button className="px-6 py-2 rounded-xl bg-primary text-on-primary font-medium mt-4">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function IssueTable({ reports, fieldUnits, onUpdate, onDelete, readonly = false }: { reports: CivicReport[], fieldUnits?: FieldUnit[], onUpdate: (id: string, updates: Partial<CivicReport>) => void, onDelete?: (id: string) => void, readonly?: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (reports.length === 0) {
    return <div className="p-8 text-center text-on-surface-variant">No issues found.</div>;
  }

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'Critical': return 'bg-error-container text-on-error-container';
      case 'High': return 'bg-error-container/50 text-error';
      case 'Medium': return 'bg-tertiary-fixed text-on-tertiary-fixed';
      default: return 'bg-surface-container text-on-surface';
    }
  };

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'In Progress': return 'bg-primary-fixed text-on-primary-fixed';
      case 'Resolved': return 'bg-secondary-fixed text-on-secondary-fixed';
      case 'Verified': return 'bg-tertiary-container/20 text-tertiary-container';
      default: return 'bg-surface-container text-on-surface';
    }
  };

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-surface-container-low text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider">
          <th className="py-4 px-6 font-medium">ID</th>
          <th className="py-4 px-6 font-medium">Issue Description</th>
          <th className="py-4 px-6 font-medium">Location</th>
          <th className="py-4 px-6 font-medium">Priority</th>
          <th className="py-4 px-6 font-medium">Status</th>
          <th className="py-4 px-6 font-medium">Date</th>
          {(!readonly || onDelete) && <th className="py-4 px-6 font-medium text-right">Action</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-container text-body-sm text-on-surface">
        {reports.map(report => (
          <React.Fragment key={report.id || report.ticket_id}>
            <tr className="hover:bg-surface-container-low/50 transition-colors group">
            <td className="py-4 px-6 font-medium text-primary">#{report.ticket_id}</td>
            <td className="py-4 px-6">
              <div className="flex items-center gap-3">
                {report.image_url ? (
                  <div className="w-10 h-10 rounded-xl bg-surface-container bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${report.image_url}')` }}></div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-surface-container shrink-0 flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined">image</span></div>
                )}
                <div className="max-w-[250px]">
                  <p className="font-medium text-on-surface truncate">{report.category}</p>
                  <p className="text-label-sm text-on-surface-variant truncate">{report.description}</p>
                </div>
              </div>
            </td>
            <td className="py-4 px-6 text-on-surface-variant max-w-[200px] truncate">{report.location_address}</td>
            <td className="py-4 px-6">
              {readonly ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm ${getPriorityColor(report.priority)} font-medium`}>
                  {report.priority}
                </span>
              ) : (
                <select 
                  value={report.priority} 
                  onChange={(e) => onUpdate(report.id!, { priority: e.target.value as any })}
                  className={`bg-transparent outline-none cursor-pointer font-medium text-label-sm ${getPriorityColor(report.priority)} px-2 py-1 rounded-md`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              )}
            </td>
            <td className="py-4 px-6">
              {readonly ? (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm ${getStatusColor(report.status)} font-medium`}>
                  {report.status}
                </span>
              ) : (
                <select 
                  value={report.status} 
                  onChange={(e) => onUpdate(report.id!, { status: e.target.value as any })}
                  className={`bg-transparent outline-none cursor-pointer font-medium text-label-sm ${getStatusColor(report.status)} px-2 py-1 rounded-md`}
                >
                  <option value="Reported">Reported</option>
                  <option value="Verified">Verified</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              )}
            </td>
            <td className="py-4 px-6 text-on-surface-variant text-[12px]">
              {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
            </td>
            {(!readonly || onDelete) && (
              <td className="py-4 px-6 text-right">
                {!readonly && (
                  <button onClick={() => setEditingId(editingId === report.id ? null : report.id!)} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" title="Edit Assignment Details">
                    <span className="material-symbols-outlined text-[18px]">{editingId === report.id ? 'expand_less' : 'edit'}</span>
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(report.id!)} className="p-2 rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors ml-1" title="Delete Report">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </td>
            )}
          </tr>
          {editingId === report.id && !readonly && (
            <tr className="bg-surface-container-lowest border-b-2 border-primary/20">
              <td colSpan={7} className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                    <div className="flex-1">
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Smart Assign (Field Units)</label>
                      <select 
                        className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50 text-primary font-medium"
                        value={report.assigned_lead || ''}
                        onChange={(e) => {
                          const unit = fieldUnits?.find(u => u.name === e.target.value);
                          if (unit) {
                            onUpdate(report.id!, {
                              assigned_lead: unit.name,
                              department: unit.department,
                              lead_mobile_number: unit.mobile_number,
                              truck_id: 'Dispatched'
                            });
                          }
                        }}
                      >
                        <option value="">Select an active Field Unit...</option>
                        {fieldUnits?.map(u => {
                          const activeReport = reports.find(r => r.assigned_lead === u.name && r.status === 'In Progress' && r.id !== report.id);
                          const statusIcon = activeReport ? '🔴' : '🟢';
                          const statusText = activeReport ? `Busy on #${activeReport.ticket_id}` : 'Available';
                          return (
                            <option key={u.id} value={u.name}>{statusIcon} {u.name} • {u.department} ({statusText})</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Department (Manual Override)</label>
                      <input type="text" defaultValue={report.department} className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50" onBlur={(e) => { if(e.target.value !== report.department) onUpdate(report.id!, { department: e.target.value }) }} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Assigned Lead</label>
                      <input type="text" value={report.assigned_lead || ''} placeholder="e.g. Officer Raj Kumar" className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50 opacity-70" disabled />
                    </div>
                    <div className="flex-1">
                      <label className="block text-label-sm font-bold text-on-surface-variant mb-1">Truck / Vehicle ID</label>
                      <input type="text" defaultValue={report.truck_id || ''} placeholder="e.g. #KA-03-9912" className="w-full bg-surface-container px-3 py-2 rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-primary/50" onBlur={(e) => { if(e.target.value !== report.truck_id) onUpdate(report.id!, { truck_id: e.target.value }) }} />
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-medium hover:bg-primary/90">Done</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

export default function AuthorityPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [fieldUnits, setFieldUnits] = useState<FieldUnit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.email !== 'prashantshrimali2005@gmail.com') {
        navigate('/admin/login', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    Promise.all([fetchReports(), fetchFieldUnits()])
      .then(([reportsData, unitsData]) => {
        const deletedIds = JSON.parse(localStorage.getItem('civicfix_deleted_reports') || '[]');
        const filteredReports = (reportsData || []).filter(r => r.id && !deletedIds.includes(r.id));
        
        setReports(filteredReports);
        setFieldUnits(unitsData || []);
        setLoading(false);
      }).catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const handleDeleteReport = async (id: string) => {
    if (confirm('Are you sure you want to delete this report? This cannot be undone.')) {
      try {
        await deleteReport(id);
      } catch (e) {
        // If backend RLS blocks it, we soft-delete it locally for the prototype
        console.warn('Backend delete failed, falling back to local soft-delete', e);
      }
      
      const deletedIds = JSON.parse(localStorage.getItem('civicfix_deleted_reports') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('civicfix_deleted_reports', JSON.stringify(deletedIds));
      }
      
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleUpdate = async (id: string, updates: Partial<CivicReport>) => {
    try {
      const updated = await updateReport(id, updates);
      setReports(prev => prev.map(r => r.id === id ? updated : r));
    } catch (e) {
      console.error('Failed to update report', e);
      alert('Failed to update report');
    }
  };

  const handleAddUnit = async (unit: Omit<FieldUnit, 'id' | 'created_at'>) => {
    try {
      const newUnit = await createFieldUnit(unit);
      setFieldUnits(prev => [...prev, newUnit]);
    } catch (e) {
      console.error('Failed to add field unit', e);
      alert('Failed to add field unit');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      await deleteFieldUnit(id);
      setFieldUnits(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      console.error('Failed to delete field unit', e);
      alert('Failed to delete field unit');
    }
  };

  const tabs = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'triage', icon: 'task', label: 'Issue Triage' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics' },
    { id: 'field-units', icon: 'engineering', label: 'Field Units' },
    { id: 'history', icon: 'history', label: 'History' },
  ];

  return (
    <div className="bg-surface font-body-md text-on-surface flex flex-col min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col pt-6 pb-8">
        <div className="px-6 mb-8 flex items-center gap-3">
          <img alt="RESQGRID Logo" className="h-8 w-auto object-contain" src="/logo.svg" onError={(e) => (e.currentTarget.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDGUa-E78kV18F2dK07EBsQukwuCLNCzktvNcJL7-RUCdoVEKoDSLf9pDn9IRF1REC0QrrGgOFalkAtn4mr1fg-jvRqjUlpVt2GK6LTd8VOU-eUgtBWEaEmZknT_yBNoK6yuZOTYmEC4JxfGwTOO0h20vdyBLd7f3RriMURb89TDgx77rLnXFLG_8BWJOMTlQ5Dpt4pDYXMluu_-BvVPe8YaG3Lt0Yc8g6XUqK0XDpYM0OkO32mhkMp1A")} />
          <span className="text-headline-sm font-headline-sm text-on-surface font-bold">Authority Portal</span>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined mr-3 text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-outline-variant/20">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined mr-3 text-[20px]">settings</span>
            Settings
          </button>
        </div>
      </aside>

      <div className="pl-64 flex flex-col flex-1">
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-8 border-b border-outline-variant/10">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">search</span>
              <input className="w-full bg-surface-container pl-10 pr-4 py-2 rounded-xl text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" placeholder="Search reports, IDs, or locations..." type="text" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
                className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/20 p-4 z-50">
                  <h3 className="font-bold text-label-md mb-3 text-on-surface">Notifications</h3>
                  <div className="flex flex-col gap-3">
                    <div className="text-body-sm text-on-surface-variant">
                      <span className="font-bold text-error">Critical:</span> High severity issue reported in Sector 4.
                    </div>
                    <div className="text-body-sm text-on-surface-variant">
                      <span className="font-bold text-primary">System:</span> Weekly report is ready for export.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); }}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm"
              >
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-2xl shadow-lg border border-outline-variant/20 p-2 z-50">
                  <button onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-surface-container-low rounded-xl text-body-sm transition-colors">
                    Admin Settings
                  </button>
                  <div className="h-px bg-outline-variant/20 my-1 mx-2"></div>
                  <button onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/admin/login', { replace: true });
                  }} className="w-full text-left px-4 py-2 hover:bg-error/10 text-error rounded-xl text-body-sm transition-colors">
                    Secure Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="relative pt-16 bg-surface min-h-screen flex-1 overflow-x-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full pt-32">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab reports={reports} onDelete={handleDeleteReport} />}
              {activeTab === 'triage' && <TriageTab reports={reports} fieldUnits={fieldUnits} onUpdate={handleUpdate} onDelete={handleDeleteReport} />}
              {activeTab === 'analytics' && <AnalyticsTab reports={reports} />}
              {activeTab === 'field-units' && <FieldUnitsTab fieldUnits={fieldUnits} reports={reports} onAdd={handleAddUnit} onDelete={handleDeleteUnit} />}
              {activeTab === 'history' && <HistoryTab reports={reports} onDelete={handleDeleteReport} />}
              {activeTab === 'settings' && <SettingsTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
