import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Search, Bell, Moon, Sun, Menu, X, User } from 'lucide-react';
import { notificationsAPI } from '../lib/api';
import { Notification } from '../lib/types';

export default function TopBar() {
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen, currentUser, setCurrentPage } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userLocation, setUserLocation] = useState<string>('Detecting location...');

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationsAPI.getAll(currentUser?._id);
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (error) {
        console.log(error);
        setNotifications([]);
      }
    };

    fetchNotifications();

    // GET USER LOCATION
    const getLocation = () => {
      if (!navigator.geolocation) {
        setUserLocation('Geolocation not supported');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            // FREE OPENSTREETMAP API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  Accept: 'application/json',
                },
              }
            );

            const data = await response.json();

            if (data?.display_name) {
              setUserLocation(data.display_name);
            } else {
              const city =
                data?.address?.city ||
                data?.address?.town ||
                data?.address?.village ||
                data?.address?.state ||
                'Unknown Location';

              setUserLocation(city);
            }
          } catch (error) {
            console.log('Location Error:', error);
            setUserLocation(
              `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`
            );
          }
        },

        (error) => {
          console.log('Permission Error:', error);
          setUserLocation('Location permission denied');
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    getLocation();
  }, [currentUser?._id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-4"
      style={{
        background: theme === 'dark' ? 'rgba(4, 8, 16, 0.8)' : 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl w-80" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search employees, departments..."
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>⌘K</kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl transition-all hover:scale-105"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="p-2.5 rounded-xl transition-all hover:scale-105 relative"
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#EF4444' }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl z-50" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</div>
                ) : (
                  notifications.map(n => {
                    const id = n.id || n._id || '';
                    return (
                    <div
                      key={id}
                      className="p-3 border-b transition-colors hover:bg-white/5 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)' }}
                      onClick={() => !n.read && id && handleMarkAsRead(id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'opacity-30' : ''}`} style={{
                          background: n.type === 'success' ? '#10B981' : n.type === 'warning' ? '#F59E0B' : n.type === 'error' ? '#EF4444' : '#3B82F6'
                        }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{n.time}</p>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <User size={16} />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{currentUser?.name || 'User'}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{currentUser?.roleLabel || 'Admin'}</p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden shadow-2xl z-50" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{currentUser?.name || 'User'}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentUser?.email || 'user@traxale.com'}</p>
                <div className="mt-2 p-2 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Login Location</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{userLocation}</p>
                </div>
              </div>
              <div className="p-2">
                <button 
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" 
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => { setCurrentPage('my-profile'); setShowProfile(false); }}
                >Profile Settings</button>
                <button 
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" 
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => { setCurrentPage('settings'); setShowProfile(false); }}
                >Preferences</button>
                <button 
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" 
                  style={{ color: 'var(--text-secondary)' }}
                  onClick={() => setShowProfile(false)}
                >Help & Support</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
