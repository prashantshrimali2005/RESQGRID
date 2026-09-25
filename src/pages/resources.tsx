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
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      <Header title="Resource Hub" />
      
      <main className="pt-24 pb-32 md:pb-24 px-gutter-lg max-w-7xl mx-auto flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h1 className="font-headline-md text-headline-md font-bold">Coordination Center</h1>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            New Request/Offer
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-outline-variant/30 overflow-x-auto no-scrollbar">
          {(['shelters', 'requests', 'offers'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-title-sm capitalize transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'shelters' ? 'Shelters & Depots' : tab}
            </button>
          ))}
        </div>

        {/* Submit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/20 animate-pageIn">
            <h2 className="font-title-md font-bold mb-4">Post a Request or Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-label-sm font-bold mb-1">Type</label>
                <select 
                  value={formType} 
                  onChange={e => setFormType(e.target.value as any)}
                  className="w-full p-3 rounded-xl bg-surface-container outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Request">I need help (Request)</option>
                  <option value="Offer">I can help (Offer)</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-bold mb-1">Category</label>
                <select 
                  value={formCategory} 
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-container outline-none focus:ring-2 focus:ring-primary/50"
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
            <div className="mb-4">
              <label className="block text-label-sm font-bold mb-1">Description</label>
              <textarea 
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-surface-container outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Detail what you need or what you are offering..."
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-xl">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-bold rounded-xl">Submit</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'shelters' && resources.map(res => (
              <div key={res.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-primary-container text-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">{res.type === 'Shelter' ? 'night_shelter' : 'inventory_2'}</span>
                  </div>
                  {res.verified && <span className="material-symbols-outlined text-tertiary" title="Verified">verified</span>}
                </div>
                <h3 className="font-title-md font-bold">{res.name}</h3>
                <p className="text-body-sm text-on-surface-variant mb-4 flex-grow">{res.description}</p>
                <div className="mt-auto pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center text-label-sm">
                    <span className="font-bold text-on-surface-variant">Capacity</span>
                    <span className="font-bold text-primary">{res.current_occupancy} / {res.capacity}</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, ((res.current_occupancy || 0) / (res.capacity || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {activeTab !== 'shelters' && reqOffers.filter(r => r.type.toLowerCase() === activeTab.replace('s','')).map(item => (
              <div key={item.id} className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    item.type === 'Request' ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">{new Date(item.created_at!).toLocaleDateString()}</span>
                </div>
                <p className="text-body-md font-medium mt-3">{item.description}</p>
                <div className="mt-4 flex items-center gap-2 text-primary font-title-sm cursor-pointer hover:underline">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Respond
                </div>
              </div>
            ))}

            {((activeTab === 'shelters' && resources.length === 0) || 
              (activeTab !== 'shelters' && reqOffers.filter(r => r.type.toLowerCase() === activeTab.replace('s','')).length === 0)) && (
              <div className="col-span-full py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">inbox</span>
                <p>No {activeTab} found in the network.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNav active="resources" />
    </div>
  );
}
