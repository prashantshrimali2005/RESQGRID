import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CivicReport {
  id?: string;
  ticket_id: string;
  category: string;
  description: string;
  location_address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status: 'Reported' | 'Verified' | 'In Progress' | 'Resolved' | 'Cancelled';
  cancellation_reason?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  department: string;
  ai_confidence?: number;
  assigned_lead?: string;
  lead_mobile_number?: string;
  truck_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// New Disaster Interfaces
export interface Disaster {
  id?: string;
  title: string;
  description?: string;
  severity: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Resource {
  id?: string;
  type: string;
  name: string;
  description?: string;
  capacity?: number;
  current_occupancy?: number;
  latitude?: number;
  longitude?: number;
  contact_info?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RequestOffer {
  id?: string;
  type: string; // 'Request' | 'Offer'
  category: string;
  description: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  user_id?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Volunteer {
  id: string; // references auth.users(id)
  skills?: string[];
  availability?: string;
  location_name?: string;
  current_lat?: number;
  current_lng?: number;
  radius_km?: number;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// User Profiles
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error fetching profile:', error);
    }
    return null;
  }
  return data as Profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  return data as Profile;
}

// Reports
export async function fetchReports(userId?: string) {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
  return data as CivicReport[];
}

export async function fetchReportByTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();

  if (error) {
    console.error('Error fetching report:', error);
    return null;
  }
  return data as CivicReport;
}

export async function createReport(report: Omit<CivicReport, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('reports')
    .insert([report])
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    throw error;
  }
  return data as CivicReport;
}

export async function updateReport(id: string, updates: Partial<CivicReport>) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating report:', error);
    throw error;
  }
  return data as CivicReport;
}

export async function deleteReport(id: string) {
  const { data, error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.error('No report found with that ID, or RLS prevented deletion.');
    throw new Error('Could not delete report (Not found or Permission denied).');
  }
}

export async function cancelReport(id: string, reason: string) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status: 'Cancelled', cancellation_reason: reason })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling report:', error);
    throw error;
  }
  return data as CivicReport;
}

// Storage
export async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
}

// Field Units
export interface FieldUnit {
  id: string;
  name: string;
  mobile_number: string;
  department: string;
  status: string;
  current_task: string | null;
  created_at: string;
}

export async function fetchFieldUnits() {
  const { data, error } = await supabase
    .from('field_units')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching field units:', error);
    throw error;
  }
  return data as FieldUnit[];
}

export async function createFieldUnit(unit: Omit<FieldUnit, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('field_units')
    .insert([unit])
    .select()
    .single();

  if (error) {
    console.error('Error creating field unit:', error);
    throw error;
  }
  return data as FieldUnit;
}

export async function deleteFieldUnit(id: string) {
  const { error } = await supabase
    .from('field_units')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting field unit:', error);
    throw error;
  }
}

// --- New Disaster Platform Functions ---

export async function fetchDisasters() {
  const { data, error } = await supabase.from('disasters').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Error fetching disasters:', error); throw error; }
  return data as Disaster[];
}

export async function createDisaster(disaster: Omit<Disaster, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('disasters').insert([disaster]).select().single();
  if (error) throw error;
  return data as Disaster;
}

export async function fetchResources() {
  const { data, error } = await supabase.from('resources').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Resource[];
}

export async function createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('resources').insert([resource]).select().single();
  if (error) throw error;
  return data as Resource;
}

export async function fetchRequestsOffers(type?: string) {
  let query = supabase.from('requests_offers').select('*').order('created_at', { ascending: false });
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data as RequestOffer[];
}

export async function createRequestOffer(reqOffer: Omit<RequestOffer, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('requests_offers').insert([reqOffer]).select().single();
  if (error) throw error;
  return data as RequestOffer;
}

export async function fetchVolunteer(userId: string) {
  const { data, error } = await supabase.from('volunteers').select('*').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as Volunteer | null;
}

export async function upsertVolunteer(volunteer: Volunteer) {
  const { data, error } = await supabase.from('volunteers').upsert([volunteer]).select().single();
  if (error) throw error;
  return data as Volunteer;
}
