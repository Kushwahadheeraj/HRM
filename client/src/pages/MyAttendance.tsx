import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { motion } from 'framer-motion';
import { Clock, Calendar, Camera, MapPin, QrCode, Fingerprint, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { attendanceAPI } from '../lib/api';
import type { AttendanceRecord } from '../lib/types';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Type for Attendance History
interface AttendanceHistoryItem {
  date: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: string;
}

export default function MyAttendance() {
  const { currentUser } = useApp();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const [elapsed, setElapsed] = useState('00:00:00');
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistoryItem[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanningQR, setScanningQR] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const methodMap: Record<number, string> = {
    0: 'face',
    1: 'gps',
    2: 'qr',
    3: 'biometric'
  };

  const getTodayDateStr = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const getCurrentTimeStr = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const formatMonthYear = (): string => {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    return `${month} ${year}`;
  };

  const showStatus = (msg: string, type: 'success' | 'error') => {
    setStatusMessage(msg);
    setStatusType(type);
    setTimeout(() => {
      setStatusMessage('');
      setStatusType('');
    }, 5000);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.employeeId) return;
      setLoading(true);
      try {
        const [todayRes, historyRes] = await Promise.all([
          attendanceAPI.getToday(currentUser.employeeId),
          attendanceAPI.getByEmployee(currentUser.employeeId)
        ]);
        if (todayRes.success && todayRes.data) {
          setTodayAttendance(todayRes.data);
          if (todayRes.data.clockIn && !todayRes.data.clockOut) {
            setClockedIn(true);
            setClockTime(todayRes.data.clockIn);
          }
        }
        if (historyRes.success && historyRes.data) {
          const transformed = historyRes.data.map((item: any) => ({
            date: formatDate(item.date),
            clockIn: item.clockIn,
            clockOut: item.clockOut,
            hours: item.workingHours ? `${Math.floor(item.workingHours)}h ${Math.round((item.workingHours % 1) * 60)}m` : '-',
            status: item.status
          }));
          setAttendanceHistory(transformed);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser?.employeeId]);

  useEffect(() => {
    if (!clockedIn) return;
    const timer = setInterval(() => {
      const now = new Date();
      const [h, m] = clockTime.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const diff = now.getTime() - start.getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(String(hrs).padStart(2, '0') + ':' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0'));
    }, 1000);
    return () => clearInterval(timer);
  }, [clockedIn, clockTime]);

  // Cleanup camera and QR scanner
  useEffect(() => {
    return () => {
      stopCamera();
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  // Start camera for Face ID
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      showStatus('Camera access denied', 'error');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture image for Face ID
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      return imageData;
    }
    return null;
  };

  // Get user's location for GPS method
  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Start QR code scanner
  const startQRScanner = () => {
    setScanningQR(true);
  };

  // Handle QR code scan success
  const handleQRCodeScan = async (decodedText: string) => {
    if (qrScannerRef.current) {
      await qrScannerRef.current.clear();
      qrScannerRef.current = null;
    }
    setScanningQR(false);
    await handleClockIn({ qrCodeData: decodedText });
  };

  // QR scanner component
  useEffect(() => {
    if (scanningQR && !qrScannerRef.current) {
      qrScannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      qrScannerRef.current.render(
        handleQRCodeScan,
        (error) => {
          console.error('QR Scan error:', error);
        }
      );
    }
  }, [scanningQR]);

  // Handle Biometric (WebAuthn)
  const handleBiometric = async () => {
    try {
      const publicKeyCredentialCreationOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: Uint8Array.from(
            'random-challenge-' + Date.now(),
            (c) => c.charCodeAt(0)
          ),
          rp: { name: 'Traxale HRM' },
          user: {
            id: Uint8Array.from(currentUser?.employeeId || 'user', (c) => c.charCodeAt(0)),
            name: currentUser?.email || 'user@example.com',
            displayName: currentUser?.name || 'User'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' }
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          }
        }
      };

      const credential = await navigator.credentials.create(publicKeyCredentialCreationOptions);
      if (credential) {
        await handleClockIn({ biometricId: credential.id });
      }
    } catch (err) {
      console.error('Biometric error:', err);
      showStatus('Biometric authentication failed', 'error');
    }
  };

  const handleClockIn = async (additionalData: any = {}) => {
    if (!currentUser?.employeeId) return;
    try {
      let requestData: any = {
        employeeId: currentUser.employeeId,
        method: methodMap[selectedMethod]
      };

      if (selectedMethod === 0) {
        // Face ID
        if (!cameraActive) {
          await startCamera();
          return;
        }
        const imageData = captureImage();
        if (imageData) {
          requestData.clockInImage = imageData;
        }
        stopCamera();
      } else if (selectedMethod === 1) {
        // GPS
        try {
          const location = await getLocation();
          requestData.location = location;
        } catch (err) {
          showStatus('Could not get location', 'error');
          return;
        }
      } else if (selectedMethod === 2) {
        // QR Code
        if (!scanningQR) {
          startQRScanner();
          return;
        }
      } else if (selectedMethod === 3) {
        // Biometric
        await handleBiometric();
        return;
      }

      // Add any additional data passed in
      Object.assign(requestData, additionalData);

      const res = await attendanceAPI.clockIn(requestData);
      if (res.success && res.data) {
        const now = getCurrentTimeStr();
        setClockTime(now);
        setClockedIn(true);
        setTodayAttendance(res.data);
        showStatus('Successfully clocked in!', 'success');
        const historyRes = await attendanceAPI.getByEmployee(currentUser.employeeId);
        if (historyRes.success && historyRes.data) {
          const transformed = historyRes.data.map((item: any) => ({
            date: formatDate(item.date),
            clockIn: item.clockIn,
            clockOut: item.clockOut,
            hours: item.workingHours ? `${Math.floor(item.workingHours)}h ${Math.round((item.workingHours % 1) * 60)}m` : '-',
            status: item.status
          }));
          setAttendanceHistory(transformed);
        }
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      showStatus('Error clocking in', 'error');
    }
  };

  const handleClockOut = async () => {
    if (!currentUser?.employeeId) return;
    try {
      const res = await attendanceAPI.clockOut({
        employeeId: currentUser.employeeId
      });
      if (res.success && res.data) {
        setClockedIn(false);
        setTodayAttendance(res.data);
        showStatus('Successfully clocked out!', 'success');
        const historyRes = await attendanceAPI.getByEmployee(currentUser.employeeId);
        if (historyRes.success && historyRes.data) {
          const transformed = historyRes.data.map((item: any) => ({
            date: formatDate(item.date),
            clockIn: item.clockIn,
            clockOut: item.clockOut,
            hours: item.workingHours ? `${Math.floor(item.workingHours)}h ${Math.round((item.workingHours % 1) * 60)}m` : '-',
            status: item.status
          }));
          setAttendanceHistory(transformed);
        }
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      showStatus('Error clocking out', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  const weekSummary = (() => {
    const last7Days = attendanceHistory.slice(0, 7);
    const daysPresent = last7Days.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'half-day').length;
    const lateArrivals = last7Days.filter(r => r.status === 'late').length;
    const totalHours = last7Days.reduce((sum, r) => {
      if (r.hours === '-') return sum;
      const match = r.hours.match(/(\d+)h\s*(\d+)?m?/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        return sum + hours + minutes / 60;
      }
      return sum;
    }, 0);

    return [
      { label: 'Days Present', value: daysPresent.toString(), color: '#10B981' },
      { label: 'Late Arrival', value: lateArrivals.toString(), color: '#F59E0B' },
      { label: 'Hours Worked', value: totalHours.toFixed(1) + 'hrs', color: '#3B82F6' }
    ];
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Attendance</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track your daily attendance and work hours</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
          Live
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: statusType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${statusType === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {statusType === 'success' ? <CheckCircle2 size={20} style={{ color: '#10B981' }} /> : <XCircle size={20} style={{ color: '#EF4444' }} />}
          <span className="text-sm font-medium" style={{ color: statusType === 'success' ? '#10B981' : '#EF4444' }}>{statusMessage}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Clock In/Out Panel */}
        <div className="lg:col-span-2 glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' }}>
              <Clock size={40} style={{ color: '#3B82F6' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {clockedIn ? 'You are Checked In!' : 'Ready to Clock In?'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {clockedIn ? `Started at ${clockTime}` : currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {clockedIn && <p className="text-4xl font-bold mt-4" style={{ color: '#3B82F6' }}>{elapsed}</p>}
          </div>

          {selectedMethod === 0 && cameraActive && !clockedIn && (
            <div className="mb-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <button
                onClick={() => handleClockIn()}
                className="w-full py-3 rounded-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                Capture & Clock In
              </button>
            </div>
          )}

          {selectedMethod === 2 && scanningQR && !clockedIn && (
            <div className="mb-4">
              <div className="relative">
                <div id="qr-reader" />
                <button
                  onClick={() => {
                    if (qrScannerRef.current) {
                      qrScannerRef.current.clear().catch(console.error);
                      qrScannerRef.current = null;
                    }
                    setScanningQR(false);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
          )}

          {(!(selectedMethod === 0 && cameraActive) && !(selectedMethod === 2 && scanningQR)) && (
            <button onClick={clockedIn ? handleClockOut : handleClockIn} className="w-full py-4 rounded-xl font-semibold text-white text-lg transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: clockedIn ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
              {clockedIn ? 'Clock Out' : 'Clock In with ' + ['Face ID', 'GPS', 'QR Code', 'Biometric'][selectedMethod]}
            </button>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Clock-in Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Camera, label: 'Face ID', active: selectedMethod === 0 },
                { icon: MapPin, label: 'GPS', active: selectedMethod === 1 },
                { icon: QrCode, label: 'QR Code', active: selectedMethod === 2 },
                { icon: Fingerprint, label: 'Biometric', active: selectedMethod === 3 },
              ].map((method, i) => (
                <button
                  key={i}
                  onClick={() => {
                    stopCamera();
                    if (qrScannerRef.current) {
                      qrScannerRef.current.clear().catch(console.error);
                      qrScannerRef.current = null;
                    }
                    setScanningQR(false);
                    setSelectedMethod(i);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={{ background: method.active ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-glass)', border: method.active ? '2px solid #3B82F6' : '2px solid transparent' }}
                >
                  <method.icon size={20} style={{ color: method.active ? '#3B82F6' : 'var(--text-muted)' }} />
                  <span className="text-[10px] font-medium" style={{ color: method.active ? '#3B82F6' : 'var(--text-muted)' }}>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>This Week Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              {weekSummary.map((card, i) => (
                <div key={i} className="text-center p-3 rounded-xl" style={{ background: card.color + '15' }}>
                  <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance History</h3>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <Calendar size={14} /> {formatMonthYear()}
          </button>
        </div>
        <div className="space-y-2">
          {attendanceHistory.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full" style={{ background: item.status === 'present' ? '#10B981' : item.status === 'late' ? '#F59E0B' : item.status === 'absent' ? '#EF4444' : '#3B82F6' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span>{item.clockIn || '--:--'}</span>
                <span>—</span>
                <span>{item.clockOut || '--:--'}</span>
                <span className="font-medium" style={{ color: item.status === 'present' ? '#10B981' : item.status === 'late' ? '#F59E0B' : item.status === 'absent' ? '#EF4444' : '#3B82F6' }}>{item.hours}</span>
                <span className="px-2 py-1 rounded-full text-[10px] font-medium" style={{ background: item.status === 'present' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'late' ? 'rgba(245, 158, 11, 0.1)' : item.status === 'absent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: item.status === 'present' ? '#10B981' : item.status === 'late' ? '#F59E0B' : item.status === 'absent' ? '#EF4444' : '#3B82F6' }}>{item.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
