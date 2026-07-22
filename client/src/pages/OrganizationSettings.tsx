import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Save, Check, MapPin, Clock } from 'lucide-react';
import { organizationAPI } from '../lib/api';
import { Organization } from '../lib/types';

export default function OrganizationSettings() {
  const { theme } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<{
    officeLocation: Organization['officeLocation'];
    attendanceSettings: Organization['attendanceSettings'];
  }>({
    officeLocation: {
      latitude: undefined,
      longitude: undefined,
      address: '',
      radius: 100,
    },
    attendanceSettings: {
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateThreshold: '09:15',
    },
  });

  // Fetch organization settings on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await organizationAPI.getSettings();
        if (res.success && res.data) {
          setOrganization(res.data);
          setFormData({
            officeLocation: res.data.officeLocation || {
              latitude: undefined,
              longitude: undefined,
              address: '',
              radius: 100,
            },
            attendanceSettings: res.data.attendanceSettings || {
              checkInTime: '09:00',
              checkOutTime: '18:00',
              lateThreshold: '09:15',
            },
          });
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, min, max, step } = e.target;
    setFormData(prev => {
      if (name.startsWith('officeLocation.')) {
        const key = name.split('.')[1];
        return {
          ...prev,
          officeLocation: {
            ...prev.officeLocation,
            [key]: type === 'number' ? Number(value) : value,
          },
        };
      }
      if (name.startsWith('attendanceSettings.')) {
        const key = name.split('.')[1];
        return {
          ...prev,
          attendanceSettings: {
            ...prev.attendanceSettings,
            [key]: value,
          },
        };
      }
      return prev;
    });
  };

  // Handle get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            officeLocation: {
              ...prev.officeLocation,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Failed to get current location');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }
  };

  // Handle save settings
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await organizationAPI.updateSettings(formData);
      if (res.success && res.data) {
        setOrganization(res.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Organization Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure office location and attendance rules</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Office Location */}
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <MapPin size={20} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Office Location</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Address</label>
              <input
                type="text"
                name="officeLocation.address"
                value={formData.officeLocation?.address || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                placeholder="Enter office address"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Latitude</label>
                <input
                  type="number"
                  name="officeLocation.latitude"
                  value={formData.officeLocation?.latitude ?? ''}
                  onChange={handleInputChange}
                  step="0.000001"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="00.000000"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Longitude</label>
                <input
                  type="number"
                  name="officeLocation.longitude"
                  value={formData.officeLocation?.longitude ?? ''}
                  onChange={handleInputChange}
                  step="0.000001"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="00.000000"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Allowed Radius (meters)</label>
                <input
                  type="number"
                  name="officeLocation.radius"
                  value={formData.officeLocation?.radius ?? 100}
                  onChange={handleInputChange}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleGetCurrentLocation}
                  className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                  }}
                >
                  Get Current Location
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Time Settings */}
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Time Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Check-in Time</label>
              <input
                type="time"
                name="attendanceSettings.checkInTime"
                value={formData.attendanceSettings?.checkInTime || '09:00'}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Check-out Time</label>
              <input
                type="time"
                name="attendanceSettings.checkOutTime"
                value={formData.attendanceSettings?.checkOutTime || '18:00'}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Late Threshold</label>
              <input
                type="time"
                name="attendanceSettings.lateThreshold"
                value={formData.attendanceSettings?.lateThreshold || '09:15'}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: saved ? '#10B981' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
          }}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          ) : saved ? (
            <>
              <Check size={16} /> Saved!
            </>
          ) : (
            <>
              <Save size={16} /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
