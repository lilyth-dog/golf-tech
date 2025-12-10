import React, { useEffect, useState } from 'react';
import { User, Activity, Ruler, Weight, Dumbbell, Percent, Droplets, Award, Clock, Save, LogOut } from 'lucide-react';
import { getProfile, updateProfile } from '../api/profile';
import type { UserProfile } from '../types/auth'; // fixed import type
import { useNavigate } from 'react-router-dom';

const DEFAULT_PROFILE = {
  id: 0,
  user: 0,
  nickname: '',
  height: 0,
  weight: 0,
  handicap: 30,
  years_experience: 0
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile', error);
      // Optional: redirect to login if 401
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
    }));
  };
  
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            My Profile
          </h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
             <LogOut className="w-4 h-4"/> Logout
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> Basic Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">Nickname</label>
                <input
                  type="text"
                  name="nickname"
                  value={profile.nickname || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Enter nickname"
                />
              </div>
            </div>
          </div>

          {/* Physical Stats */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Physical Stats
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Ruler className="w-3 h-3" /> Height (cm)
                </label>
                <input type="number" name="height" value={profile.height || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Weight className="w-3 h-3" /> Weight (kg)
                </label>
                <input type="number" name="weight" value={profile.weight || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" /> Skeletal Muscle (kg)
                </label>
                <input type="number" name="skeletal_muscle_mass" value={profile.skeletal_muscle_mass || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Body Fat (%)
                </label>
                <input type="number" name="body_fat_percentage" value={profile.body_fat_percentage || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
               <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> BMI
                </label>
                <input type="number" name="bmi" value={profile.bmi || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
               <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Body Water (%)
                </label>
                <input type="number" name="body_water_percentage" value={profile.body_water_percentage || ''} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Golf Profile */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
             <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Golf Info
            </h2>
             <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Handicap
                </label>
                <input type="number" name="handicap" value={profile.handicap || 0} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Experience (Years)
                </label>
                <input type="number" name="years_experience" value={profile.years_experience || 0} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          {message && (
             <div className={`p-4 rounded-xl text-center font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
             </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Profile'}
            {!saving && <Save className="w-5 h-5" />}
          </button>

        </form>
      </main>
    </div>
  );
}
