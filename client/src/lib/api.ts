import { 
  ApiResponse, 
  User, 
  Employee, 
  PricingPlan, 
  SuperAdmin, 
  OrganizationStatus, 
  OrganizationStats, 
  TeamManagerDashboardStats, 
  WeeklyAttendanceData, 
  Message,
  Review,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  Notification,
  Channel,
  ChatMessage,
  Shift,
  Holiday,
  DashboardStats,
  Organization,
  Performance
} from './types';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to normalize an object to have both id and _id
const normalizeId = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's an array, normalize each element
  if (Array.isArray(obj)) {
    return obj.map(normalizeId);
  }
  
  // If it's not an object, return as is
  if (typeof obj !== 'object') return obj;
  
  const normalized = { ...obj };
  
  if (normalized._id && !normalized.id) {
    normalized.id = normalized._id.toString();
  }
  if (normalized.id && !normalized._id) {
    normalized._id = normalized.id;
  }
  
  // Recursively normalize nested objects
  for (const key in normalized) {
    if (Array.isArray(normalized[key])) {
      normalized[key] = normalized[key].map(normalizeId);
    } else if (typeof normalized[key] === 'object' && normalized[key] !== null) {
      normalized[key] = normalizeId(normalized[key]);
    }
  }
  
  return normalized;
};

// Helper to get current user from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      console.log('getCurrentUser: No user in localStorage');
      return null;
    }
    const user = JSON.parse(userStr);
    // Ensure both _id and id are present!
    if (user._id && !user.id) user.id = user._id;
    if (user.id && !user._id) user._id = user.id;
    // console.log('getCurrentUser: Found user:', user);
    return user;
  } catch (e) {
    console.error('getCurrentUser: Error parsing user from localStorage:', e);
    return null;
  }
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const currentUser = getCurrentUser();
  
  // Merge headers properly
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Spread options.headers if it's an object
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      // For plain object
      Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
        headers[key] = value;
      });
    }
  }
  
  if (currentUser?.id || currentUser?._id) {
    headers['x-user-id'] = currentUser.id || currentUser._id;
  }
  
  console.log('Making request to:', url, 'with headers:', headers, 'options:', options);
  
  const response = await fetch(url, {
    headers,
    ...options,
  });
  
  let result = await response.json();
  console.log('Response:', response.status, result);
  
  // Normalize the response data
  if (result.data) {
    result.data = normalizeId(result.data);
  }
  
  if (!response.ok) {
    // If we get trial expired error, show alert and don't clear localStorage
    if (result.data?.trialExpired) {
      alert(result.message || 'Your free trial has expired! Please upgrade to continue.');
    }
    // If we get an error about organizationId or user not found, clear localStorage!
    else if (result.message?.toLowerCase().includes('organization id') || 
        result.message?.toLowerCase().includes('invalid email') ||
        response.status === 401) {
      console.warn('Clearing localStorage because user might not exist or be invalid!');
      localStorage.removeItem('currentUser');
    }
    throw new Error(result.message || `HTTP error! status: ${response.status}`);
  }
  
  return result;
}

// Auth
export const authAPI = {
  login: async (credentials: { role?: string; email?: string; password?: string }): Promise<ApiResponse<{ user: User }>> => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: async (userData: any): Promise<ApiResponse<{ user: User }>> =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  registerAdmin: async (adminData: { name: string; email: string; password: string; organizationName: string; phone?: string; address?: string }): Promise<ApiResponse<{ user: User; organization: any }>> =>
    apiRequest('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(adminData),
    }),
  getSuperAdmin: (): Promise<ApiResponse<SuperAdmin>> => apiRequest('/auth/super-admin'),
  updateSettings: (userId: string, updateData: any): Promise<ApiResponse<SuperAdmin>> => 
    apiRequest(`/auth/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  getOrganizationStatus: (): Promise<ApiResponse<OrganizationStatus>> => apiRequest('/auth/organization-status'),
  markPaid: (): Promise<ApiResponse<any>> => apiRequest('/auth/mark-paid', {
    method: 'POST',
  }),
  createPaymentOrder: (amount: number, currency: string): Promise<ApiResponse<{ key_id: string; amount: number; currency: string; id: string }>> =>
    apiRequest('/auth/create-payment-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    }),
  verifyPayment: (paymentData: any): Promise<ApiResponse<any>> =>
    apiRequest('/auth/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  verifyPaymentAndRegister: (data: any): Promise<ApiResponse<{ user: User }>> =>
    apiRequest('/auth/verify-payment-and-register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOrganizationStats: (): Promise<ApiResponse<OrganizationStats>> => apiRequest('/auth/organization-stats'),
  getPricing: (): Promise<ApiResponse<PricingPlan[]>> => apiRequest('/auth/pricing'),
  updatePricing: (data: any): Promise<ApiResponse<PricingPlan[]>> =>
    apiRequest('/auth/pricing', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Employees
export const employeesAPI = {
  getAll: (): Promise<ApiResponse<Employee[]>> => apiRequest('/employees'),
  getById: (id: string): Promise<ApiResponse<Employee>> => apiRequest(`/employees/${id}`),
  getByEmployeeId: (employeeId: string): Promise<ApiResponse<Employee>> => apiRequest(`/employees/employeeId/${employeeId}`),
  getByManager: (managerName: string): Promise<ApiResponse<Employee[]>> => apiRequest(`/employees/manager/${managerName}`),
  create: (data: any): Promise<ApiResponse<Employee>> => apiRequest('/employees', { method: 'POST', body: JSON.stringify(data) }),
  bulkImport: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/employees/bulk-import`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  },
  update: (id: string, data: any): Promise<ApiResponse<Employee>> => apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/employees/${id}`, { method: 'DELETE' }),
};

// Attendance
export const attendanceAPI = {
  // Get all
  getAll: (params?: { date?: string; department?: string; status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<AttendanceRecord[]>> => {
    let url = '/attendance';
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.department) searchParams.set('department', params.department);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  
  // Get by date
  getByDate: (date: string): Promise<ApiResponse<AttendanceRecord[]>> => apiRequest(`/attendance/date/${date}`),
  
  // Get by employee
  getByEmployee: (employeeId: string, params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<AttendanceRecord[]>> => {
    let url = `/attendance/employee/${employeeId}`;
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  
  // Get today's attendance
  getToday: (employeeId: string): Promise<ApiResponse<AttendanceRecord>> => apiRequest(`/attendance/today/${employeeId}`),
  
  // Dashboard stats
  getDashboardStats: (date?: string): Promise<ApiResponse<DashboardStats>> => {
    let url = '/attendance/dashboard/stats';
    if (date) url += `?date=${date}`;
    return apiRequest(url);
  },
  
  // Clock in distribution
  getClockInDistribution: (date?: string): Promise<ApiResponse<any>> => {
    let url = '/attendance/clock-in-distribution';
    if (date) url += `?date=${date}`;
    return apiRequest(url);
  },
  
  // Attendance heatmap
  getHeatmap: (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> => {
    let url = '/attendance/heatmap';
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  
  // Get team attendance
  getTeamAttendance: (managerName: string, params?: { date?: string; status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<AttendanceRecord[]>> => {
    let url = `/attendance/team/${encodeURIComponent(managerName)}`;
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.set('date', params.date);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  
  // Clock in
  clockIn: (data: {
    employeeId: string;
    method: string;
    clockInImage?: string;
    location?: { latitude: number; longitude: number; address?: string };
    qrCodeData?: string;
    biometricId?: string;
    notes?: string;
    officeLocation?: { lat: number; lon: number; radius: number };
  }): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest('/attendance/clock-in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Clock out
  clockOut: (data: {
    employeeId: string;
    clockOutImage?: string;
    notes?: string;
  }): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest('/attendance/clock-out', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Break management
  startBreak: (data: { employeeId: string; type: string }): Promise<ApiResponse<any>> =>
    apiRequest('/attendance/start-break', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  endBreak: (data: { employeeId: string }): Promise<ApiResponse<any>> =>
    apiRequest('/attendance/end-break', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // CRUD
  create: (data: any): Promise<ApiResponse<AttendanceRecord>> => apiRequest('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<AttendanceRecord>> => apiRequest(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/attendance/${id}`, { method: 'DELETE' }),
  
  // Approvals
  getPendingApprovals: (): Promise<ApiResponse<AttendanceRecord[]>> => apiRequest('/attendance/pending-approvals'),
  approve: (id: string, approvedBy: string): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest(`/attendance/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy }),
    }),
  reject: (id: string, approvedBy: string, notes?: string): Promise<ApiResponse<AttendanceRecord>> =>
    apiRequest(`/attendance/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approvedBy, notes }),
    }),
};

// Organization
export const organizationAPI = {
  getSettings: (): Promise<ApiResponse<Organization>> => apiRequest('/organization/settings'),
  updateSettings: (data: {
    officeLocation?: Organization['officeLocation'];
    attendanceSettings?: Organization['attendanceSettings'];
  }): Promise<ApiResponse<Organization>> =>
    apiRequest('/organization/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Shifts
export const shiftsAPI = {
  getAll: (params?: { department?: string; isActive?: boolean }): Promise<ApiResponse<Shift[]>> => {
    let url = '/shifts';
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.set('department', params.department);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  getById: (id: string): Promise<ApiResponse<Shift>> => apiRequest(`/shifts/${id}`),
  create: (data: any): Promise<ApiResponse<Shift>> => apiRequest('/shifts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<Shift>> => apiRequest(`/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/shifts/${id}`, { method: 'DELETE' }),
};

// Holidays
export const holidaysAPI = {
  getAll: (params?: { year?: string; type?: string; isActive?: boolean }): Promise<ApiResponse<Holiday[]>> => {
    let url = '/holidays';
    const searchParams = new URLSearchParams();
    if (params?.year) searchParams.set('year', params.year);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  getById: (id: string): Promise<ApiResponse<Holiday>> => apiRequest(`/holidays/${id}`),
  create: (data: any): Promise<ApiResponse<Holiday>> => apiRequest('/holidays', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<Holiday>> => apiRequest(`/holidays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/holidays/${id}`, { method: 'DELETE' }),
};

// Leaves
export const leavesAPI = {
  getAll: (): Promise<ApiResponse<LeaveRequest[]>> => apiRequest('/leaves'),
  getByEmployee: (employeeId: string): Promise<ApiResponse<LeaveRequest[]>> => apiRequest(`/leaves/employee/${employeeId}`),
  getTeamLeaves: (managerName: string, params?: { status?: string }): Promise<ApiResponse<LeaveRequest[]>> => {
    let url = `/leaves/team/${encodeURIComponent(managerName)}`;
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  getBalance: (employeeId: string): Promise<ApiResponse<any>> => apiRequest(`/leaves/balance/${employeeId}`),
  create: (data: any): Promise<ApiResponse<LeaveRequest>> => apiRequest('/leaves', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, role?: string): Promise<ApiResponse<LeaveRequest>> => apiRequest(`/leaves/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, role }) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/leaves/${id}`, { method: 'DELETE' }),
};

// Payroll
export const payrollAPI = {
  getAll: (): Promise<ApiResponse<PayrollRecord[]>> => apiRequest('/payroll'),
  getByEmployee: (employeeId: string): Promise<ApiResponse<PayrollRecord[]>> => apiRequest(`/payroll/employee/${employeeId}`),
  create: (data: any): Promise<ApiResponse<PayrollRecord>> => apiRequest('/payroll', { method: 'POST', body: JSON.stringify(data) }),
  process: (data: any): Promise<ApiResponse<any>> => apiRequest('/payroll/process', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<PayrollRecord>> => apiRequest(`/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/payroll/${id}`, { method: 'DELETE' }),
};

// Notifications
export const notificationsAPI = {
  getAll: (userId?: string): Promise<ApiResponse<Notification[]>> => 
    apiRequest(userId ? `/notifications?userId=${userId}` : '/notifications'),
  create: (data: any): Promise<ApiResponse<Notification>> => apiRequest('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<Notification>> => apiRequest(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markAsRead: (id: string): Promise<ApiResponse<any>> => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// Chat
export const chatAPI = {
  sendMessage: async (data: { channelId: string; content?: string; files?: File[] }): Promise<ApiResponse<ChatMessage>> => {
    const formData = new FormData();
    formData.append('channelId', data.channelId);
    if (data.content) formData.append('content', data.content);
    if (data.files) {
      data.files.forEach(file => formData.append('files', file));
    }
    
    const url = `${API_BASE_URL}/chat`;
    const currentUser = getCurrentUser();
    
    const headers: Record<string, string> = {};
    if (currentUser?.id || currentUser?._id) {
      headers['x-user-id'] = currentUser.id || currentUser._id;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    let result = await response.json();
    if (result.data) {
      result.data = normalizeId(result.data);
    }
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    return result;
  },
  getChannelMessages: (channelId: string, limit?: number, before?: string): Promise<ApiResponse<ChatMessage[]>> => {
    let url = `/chat/channels/${channelId}`;
    const searchParams = new URLSearchParams();
    if (limit) searchParams.set('limit', String(limit));
    if (before) searchParams.set('before', before);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  addReaction: (messageId: string, emoji: string): Promise<ApiResponse<any>> =>
    apiRequest(`/chat/${messageId}/reactions`, { 
      method: 'POST', 
      body: JSON.stringify({ emoji }) 
    }),
  removeReaction: (messageId: string, emoji: string): Promise<ApiResponse<any>> =>
    apiRequest(`/chat/${messageId}/reactions`, { 
      method: 'DELETE', 
      body: JSON.stringify({ emoji }) 
    }),
  deleteMessage: (messageId: string): Promise<ApiResponse<any>> =>
    apiRequest(`/chat/${messageId}`, { method: 'DELETE' }),
};

// Channels
export const channelAPI = {
  getAll: (): Promise<ApiResponse<Channel[]>> => apiRequest('/channels'),
  getTeamMembers: (): Promise<ApiResponse<Employee[]>> => apiRequest('/channels/team-members'),
  getOrCreateDirect: (targetUserId: string): Promise<ApiResponse<Channel>> =>
    apiRequest('/channels/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),
  getById: (channelId: string): Promise<ApiResponse<Channel>> => apiRequest(`/channels/${channelId}`),
};

// Recruitment
export const recruitmentAPI = {
  getAll: (): Promise<ApiResponse<any[]>> => apiRequest('/recruitment'),
  getById: (id: string): Promise<ApiResponse<any>> => apiRequest(`/recruitment/${id}`),
  create: (data: any): Promise<ApiResponse<any>> => apiRequest('/recruitment', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<any>> => apiRequest(`/recruitment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/recruitment/${id}`, { method: 'DELETE' }),
  getCandidates: (): Promise<ApiResponse<any[]>> => apiRequest('/recruitment/candidates/list'),
  getCandidateById: (id: string): Promise<ApiResponse<any>> => apiRequest(`/recruitment/candidates/${id}`),
  createCandidate: (data: any): Promise<ApiResponse<any>> => apiRequest('/recruitment/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id: string, data: any): Promise<ApiResponse<any>> => apiRequest(`/recruitment/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCandidate: (id: string): Promise<ApiResponse<any>> => apiRequest(`/recruitment/candidates/${id}`, { method: 'DELETE' }),
  getDashboardStats: (): Promise<ApiResponse<any>> => apiRequest('/recruitment/dashboard/stats'),
};

// Analytics
export const analyticsAPI = {
  getDashboardStats: (): Promise<ApiResponse<any>> => apiRequest('/analytics/dashboard'),
  getDepartmentStats: (): Promise<ApiResponse<any>> => apiRequest('/analytics/departments'),
  getAttendanceTrends: (): Promise<ApiResponse<any>> => apiRequest('/analytics/attendance-trends'),
  getRadarData: (): Promise<ApiResponse<any>> => apiRequest('/analytics/radar'),
  getRevenueData: (): Promise<ApiResponse<any>> => apiRequest('/analytics/revenue'),
  getProductivityData: (): Promise<ApiResponse<any>> => apiRequest('/analytics/productivity'),
};

// Team Managers
export const teamManagersAPI = {
  getAll: (): Promise<ApiResponse<any[]>> => apiRequest('/team-managers'),
  getById: (id: string): Promise<ApiResponse<any>> => apiRequest(`/team-managers/${id}`),
  getEmployeesByManager: (managerName: string): Promise<ApiResponse<Employee[]>> => apiRequest(`/team-managers/${encodeURIComponent(managerName)}/employees`),
  getDashboardStats: (managerName: string): Promise<ApiResponse<TeamManagerDashboardStats>> => apiRequest(`/team-managers/${encodeURIComponent(managerName)}/dashboard`),
  getWeeklyAttendance: (managerName: string): Promise<ApiResponse<WeeklyAttendanceData[]>> => apiRequest(`/team-managers/${encodeURIComponent(managerName)}/weekly-attendance`),
  create: (data: any): Promise<ApiResponse<any>> => apiRequest('/team-managers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<any>> => apiRequest(`/team-managers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/team-managers/${id}`, { method: 'DELETE' }),
};

// Messages
export const messagesAPI = {
  getMessages: (userId1: string, userId2: string): Promise<ApiResponse<Message[]>> => apiRequest(`/messages?userId1=${userId1}&userId2=${userId2}`),
  getMessagesForUser: (userId: string): Promise<ApiResponse<Message[]>> => apiRequest(`/messages/user/${userId}`),
  sendMessage: (data: any): Promise<ApiResponse<Message>> => apiRequest('/messages', { method: 'POST', body: JSON.stringify(data) }),
  markAsRead: (messageId: string): Promise<ApiResponse<any>> => apiRequest(`/messages/${messageId}/read`, { method: 'PATCH' }),
};

// Performance
export const performanceAPI = {
  getAll: (params?: { month?: string; year?: number; managerName?: string; employeeId?: string }): Promise<ApiResponse<Performance[]>> => {
    let url = '/performance';
    const searchParams = new URLSearchParams();
    if (params?.month) searchParams.set('month', params.month);
    if (params?.year) searchParams.set('year', params.year.toString());
    if (params?.managerName) searchParams.set('managerName', params.managerName);
    if (params?.employeeId) searchParams.set('employeeId', params.employeeId);
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    return apiRequest(url);
  },
  getById: (id: string): Promise<ApiResponse<Performance>> => apiRequest(`/performance/${id}`),
  create: (data: any): Promise<ApiResponse<Performance>> => apiRequest('/performance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any): Promise<ApiResponse<Performance>> => apiRequest(`/performance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string): Promise<ApiResponse<any>> => apiRequest(`/performance/${id}`, { method: 'DELETE' }),
};

// Reviews
export const reviewsAPI = {
  submit: (data: { rating: number; comment: string }): Promise<ApiResponse<Review>> =>
    apiRequest('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  getMyReview: (): Promise<ApiResponse<Review>> => apiRequest('/reviews/my'),
  getApproved: (): Promise<ApiResponse<Review[]>> => apiRequest('/reviews/approved'),
  getAll: (): Promise<ApiResponse<Review[]>> => apiRequest('/reviews'),
  updateStatus: (reviewId: string, isApproved: boolean): Promise<ApiResponse<Review>> =>
    apiRequest(`/reviews/${reviewId}/status`, { method: 'PUT', body: JSON.stringify({ isApproved }) }),
  delete: (reviewId: string): Promise<ApiResponse<any>> => apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' }),
};
