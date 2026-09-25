import React, { useState, useEffect } from 'react';
import { Header, BottomNav, showToast } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchResources, 
  fetchRequestsOffers, 
  Resource, 
  RequestOffer,
  createRequestOffer
} from '../supabase';
import { Plus, Package, ShieldCheck, Home, AlertCircle, MessageSquare } from 'lucide-react';

export default function ResourcesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'shelters' | 'requests' | 'offers'>('shelters');
  const [resources, setResources] = useState<Resource[]>([]);
  const [reqOffers, setReqOffers] = useState<RequestOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request/Offer Form
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'Request' | 'Offer'>('Request');
  const [formCategory, setFormCategory] = useState('Food');
  const [formDescription, setFormDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, reqOffData] = await Promise.all([
        fetchResources(),
        fetchRequestsOffers()
      ]);
      setResources(resData);
      setReqOffers(reqOffData);
    } catch (err) {
      console.error(err);
      showToast('Error loading resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showToast('Please login to submit');
    try {
      await createRequestOffer({
        type: formType,
        category: formCategory,
        description: formDescription,
        user_id: user.id,
        latitude: 0, // Mock location for now
        longitude: 0,
      });
      showToast(`${formType} submitted successfully`);
      setShowForm(false);
      setFormDescription('');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit');
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted font-sans text-text-primary">
      <Header title="Resource Hub" />
      
      <main className="pt-24 pb-32 md:pb-24 px-4 max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Coordination Center</h1>
              <p className="text-brand-100 font-medium max-w-xl">Find nearby shelters, request essential supplies, or offer your resources to help the community in real-time.</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-white text-brand-700 hover:bg-brand-50 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancel Form' : 'New Request/Offer'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-border-light/50 rounded-2xl overflow-x-auto no-scrollbar max-w-fit">
          {(['shelters', 'requests', 'offers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-6 font-bold text-sm capitalize transition-all rounded-xl whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-surface-elevated text-brand-700 shadow-sm ring-1 ring-black/5' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-border-light/50'
              }`}
            >
              {tab === 'shelters' ? 'Shelters & Depots' : tab}
            </button>
          ))}
        </div>

        {/* Submit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-elevated p-6 md:p-8 rounded-3xl shadow-xl shadow-brand-900/5 border border-border-light animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
              <Package className="w-6 h-6 text-brand-600" />
              Post a Request or Offer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Type</label>
                <div className="relative">
                  <select 
                    value={formType} 
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full p-4 pl-4 pr-10 rounded-2xl bg-surface-muted border border-border-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-medium text-text-secondary transition-all"
                  >
                    <option value="Request">🚨 I need help (Request)</option>
                    <option value="Offer">🤝 I can help (Offer)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary">Category</label>
                <select 
                  value={formCategory} 
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-surface-muted border border-border-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none font-medium text-text-secondary transition-all"
                >
                  <option>Food</option>
                  <option>Water</option>
                  <option>Medical</option>
                  <option>Shelter</option>
                  <option>Transport</option>
                  <option>Rescue</option>
                </select>
              </div>
            </div>
            <div className="mb-6 space-y-2">
              <label className="text-sm font-bold text-text-secondary">Description</label>
              <textarea 
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={3}
                required
                className="w-full p-4 rounded-2xl bg-surface-muted border border-border-base outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none font-medium text-text-secondary transition-all"
                placeholder="Detail exactly what you need or what you are offering..."
              ></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-text-muted hover:text-text-primary hover:bg-border-light rounded-xl transition-all">Cancel</button>
              <button type="submit" className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all">Submit Post</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'shelters' && resources.map(res => (
              <div key={res.id} className="bg-surface-elevated p-6 rounded-3xl shadow-sm border border-border-light flex flex-col group hover:shadow-xl hover:shadow-brand-900/5 hover:border-brand-100 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {res.type === 'Shelter' ? <Home className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  {res.verified && (
                    <div className="bg-safe/10 text-safe px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-safe/20">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-1">{res.name}</h3>
                <p className="text-sm font-medium text-text-secondary mb-6 flex-grow line-clamp-3 leading-relaxed">{res.description}</p>
                
                <div className="mt-auto pt-5 border-t border-border-light">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Capacity</span>
                    <span className="text-sm font-black text-brand-600">{res.current_occupancy} <span className="text-text-muted font-medium">/ {res.capacity}</span></span>
                  </div>
                  <div className="w-full bg-border-light h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        ((res.current_occupancy || 0) / (res.capacity || 1)) > 0.9 ? 'bg-critical' : 'bg-gradient-to-r from-brand-400 to-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, ((res.current_occupancy || 0) / (res.capacity || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab !== 'shelters' && reqOffers.filter(r => r.type.toLowerCase() === activeTab.replace('s','')).map(item => (
              <div key={item.id} className="bg-surface-elevated p-6 rounded-3xl shadow-sm border border-border-light flex flex-col group hover:shadow-xl hover:border-border-base transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    item.type === 'Request' ? 'bg-critical/10 text-critical border border-critical/20' : 'bg-safe/10 text-safe border border-safe/20'
                  }`}>
                    {item.type === 'Request' ? <AlertCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    {item.category}
                  </div>
                  <span className="text-xs font-medium text-text-muted">{new Date(item.created_at!).toLocaleDateString()}</span>
                </div>
                <p className="text-text-secondary font-medium leading-relaxed flex-grow">{item.description}</p>
                <div className="mt-6 pt-4 border-t border-border-light flex justify-between items-center">
                  <button className="flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    Respond to {item.type}
                  </button>
                </div>
              </div>
            ))}

            {((activeTab === 'shelters' && resources.length === 0) || 
              (activeTab !== 'shelters' && reqOffers.filter(r => r.type.toLowerCase() === activeTab.replace('s','')).length === 0)) && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted bg-surface-elevated rounded-3xl border border-dashed border-border-base">
                <Package className="w-16 h-16 mb-4 text-border-base" />
                <p className="text-lg font-medium text-text-secondary">No {activeTab} found in the network.</p>
                <p className="text-sm mt-1">Check back later or post a new one.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNav active="resources" />
    </div>
  );
}
