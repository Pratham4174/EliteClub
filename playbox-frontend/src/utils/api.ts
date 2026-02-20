import type {
  AdminSportDayOverview,
  BookingNotification,
  DailyRevenueDashboard,
  PlayBoxUser,
  ScanResponse,
  Slot,
  SlotDetails,
  Sport,
  Transaction,
  User,
  UserDetails,
  UserStats
} from "../types";

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:8080/playbox";

export const api = {
  // ====================
  // ADMIN AUTHENTICATION
  // ====================
  login: async (username: string, password: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Login failed");
    }
    
    return await res.json();
  },

  logout: () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("admin");
  },

  getAdminInfo: (): any => {
    const adminData = localStorage.getItem("admin");
    return adminData ? JSON.parse(adminData) : null;
  },
// ====================
// PLAYER SLOT APIs
// ====================

getSlots: async (sportId: number, date: string): Promise<Slot[]> => {
  const res = await fetch(
    `${BACKEND_URL}/api/slots?sportId=${sportId}&date=${date}`
  );

  if (!res.ok) throw new Error("Failed to fetch slots");
  return await res.json();
},
getSlotById: async (slotId: number): Promise<SlotDetails> => {
  const res = await fetch(`${BACKEND_URL}/api/slots/${slotId}`);
  if (!res.ok) throw new Error("Failed to fetch slot details");
  return await res.json();
},
bookSlot: async (
  userId: number,
  slotId: number,
  paymentMode: string
) => {
  const res = await fetch(
    `${BACKEND_URL}/api/bookings/book`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        slotId,
        paymentMode
      })
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Booking failed");
  }

  return await res.json();
},
adminManualBookSlot: async (payload: { name: string; phone: string; slotId: number }) => {
  const res = await fetch(
    `${BACKEND_URL}/api/bookings/admin/manual-book`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const error = await res.text().catch(() => "");
    throw new Error(error || "Manual slot booking failed");
  }
  return await res.json();
},

getUserBookings: async (userId: number) => {
  const res = await fetch(
    `${BACKEND_URL}/api/bookings/user/${userId}`
  );

  if (!res.ok) throw new Error("Failed to fetch bookings");
  return await res.json();
},
getUserProfile: async (userId: number) => {
  const res = await fetch(
    `${BACKEND_URL}/api/users/${userId}/details`
  );

  if (!res.ok) throw new Error("Failed to fetch profile");
  return await res.json();
},
updateUserProfile: async (payload: {
  id: number;
  name: string;
  email?: string;
}): Promise<PlayBoxUser> => {
  const res = await fetch(`${BACKEND_URL}/api/users/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to update profile");
  }
  return await res.json();
},
getSports: async (): Promise<Sport[]> => {
  const res = await fetch(`${BACKEND_URL}/api/sports`);
  if (!res.ok) throw new Error("Failed to fetch sports");
  return await res.json();
},

  // ====================
  // RFID SCANNER
  // ====================
  scanCard: async (cardUid: string): Promise<ScanResponse> => {
    const res = await fetch(`${BACKEND_URL}/api/rfid/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardUid }),
    });
    
    if (!res.ok) throw new Error("Scan failed");
    return await res.json();
  },

  // ====================
  // USER MANAGEMENT
  // ====================
  createUser: async (userData: {
    cardUid: string;
    name: string;
    phone: string;
    email?: string;
  }): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    if (!res.ok) throw new Error("User creation failed");
    return await res.json();
  },

  addBalance: async (cardUid: string, amount: number, adminName?: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/add?cardUid=${cardUid}&amount=${amount}&adminName=${adminName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardUid,
        amount,
        adminName: adminName || "Unknown Admin"
      })
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Add balance failed");
    }
    return await res.json();
  },
// ====================
// PLAYER AUTH (OTP)
// ====================
sendOtp: async (phone: string): Promise<string> => {
  const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Failed to send OTP" }));
    throw new Error(errorData.message || "Failed to send OTP");
  }
  
  return await res.text();
},

verifyOtp: async (phone: string, otp: string, name?: string) => {
  const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, name }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "OTP verification failed");
  }

  return await res.json();
},

  deductBalance: async (
    cardUid: string,
    amount: number,
    deductor: string,
    description: string,
    sportId?: number,
    slotId?: number
  ): Promise<PlayBoxUser> => {
    const params = new URLSearchParams({
      cardUid,
      amount: amount.toString(),
      deductor,
      description
    });
    if (sportId != null) params.append("sportId", sportId.toString());
    if (slotId != null) params.append("slotId", slotId.toString());

    const res = await fetch(
      `${BACKEND_URL}/api/users/deduct?${params.toString()}`,
      { method: "POST" }
    );
  
    if (!res.ok) {
      const error = await res.text().catch(() => "");
      throw new Error(error || "Deduction failed");
    }
    return await res.json();
  },
  cancelUserCard: async (
    cardUid: string,
    adminUsername: string,
    adminPassword: string
  ): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/cancel-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardUid, adminUsername, adminPassword }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to cancel card");
    }
    return await res.json();
  },
  assignCardToUser: async (userId: number, cardUid: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/assign-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, cardUid }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to assign card");
    }
    return await res.json();
  },

  getAdminSportDayOverview: async (sportId: number, date: string): Promise<AdminSportDayOverview> => {
    const res = await fetch(
      `${BACKEND_URL}/api/bookings/admin/day-overview?sportId=${sportId}&date=${date}`
    );
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to fetch day overview");
    }
    return await res.json();
  },

  getBookingNotifications: async (): Promise<BookingNotification[]> => {
    const res = await fetch(`${BACKEND_URL}/api/notifications/bookings`);
    if (!res.ok) {
      const error = await res.text().catch(() => "");
      throw new Error(error || "Failed to fetch booking notifications");
    }
    return await res.json();
  },

  markBookingNotificationSeen: async (id: number): Promise<BookingNotification> => {
    const res = await fetch(`${BACKEND_URL}/api/notifications/bookings/${id}/seen`, {
      method: "POST",
    });
    if (!res.ok) {
      const error = await res.text().catch(() => "");
      throw new Error(error || "Failed to mark notification as seen");
    }
    return await res.json();
  },
  
  getAllUsers: async (): Promise<PlayBoxUser[]> => {
    const res = await fetch(`${BACKEND_URL}/api/users/all`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  },

  searchByPhone: async (phone: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/phone/${phone}`);
    if (!res.ok) throw new Error("User not found");
    return await res.json();
  },

  // ====================
  // DASHBOARD
  // ====================


  getRecentTransactions: async (limit = 10): Promise<Transaction[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/transactions/recent?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    } catch {
      // If endpoint doesn't exist, return mock data
      const users = await api.getAllUsers();
      return api.getMockTransactions(users);
    }
  },

  // ====================
  // MOCK DATA FALLBACKS
  // ====================
 

  getMockTransactions: (users: PlayBoxUser[]): Transaction[] => {
    const transactions: Transaction[] = [];
    const types: ('ADD' | 'DEDUCT' | 'NEW_USER')[] = ['ADD', 'DEDUCT', 'NEW_USER'];
    const activities = ['Swimming Pool', 'Cricket', 'Pool', 'PlayStation', 'Pickleball'];
    const admins = ['Admin', 'Manager', 'Staff'];
    
    users.slice(0, 10).forEach((user, index) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = type === 'NEW_USER' ? 0 : Math.floor(Math.random() * 1000) + 100;
      const description = type === 'DEDUCT' 
        ? activities[Math.floor(Math.random() * activities.length)]
        : type === 'ADD' ? 'Balance added' : 'New user created';
      
      transactions.push({
        id: index + 1,
        userId: user.id,
        userName: user.name,
        type,
        amount,
        description,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        adminName: admins[Math.floor(Math.random() * admins.length)]
      });
    });
    
    return transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },
};
// utils/api.ts - Update the mapTransaction function
const mapTransaction = (item: any): Transaction => ({
    id: item.id,
    userId: item.userId,
    userName: item.userName || `User ${item.userId}`, // Map from backend
    type: item.type,
    amount: item.amount,
    description: item.description,
    timestamp: item.timestamp,
    adminName: item.adminName,
    previousBalance: item.previousBalance,
    balanceAfter: item.balanceAfter, // Map balanceAfter to newBalance
  });
export const transactionApi = {
    // Get all transactions
    getAll: async (): Promise<Transaction[]> => {
      const response = await fetch(`${BACKEND_URL}/api/transactions/all`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      const data = await response.json();
      
      // Map backend fields to frontend Transaction type
      return data.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        userName: item.userName || `User ${item.userId}`,
        type: item.type, // Should be 'ADD' | 'DEDUCT' | 'NEW_USER'
        amount: item.amount || 0,
        description: item.description,
        timestamp: item.instant || item.timestamp || item.createdAt,
        adminName: item.adminName,
        previousBalance: item.previousBalance,
        balanceAfter: item.balanceAfter
      }));
    },
  
    // Filter transactions - matches your Java controller
    filter: async (filters: {
      userId?: number;
      adminName?: string;
      startDate?: string;
      endDate?: string;
      type?: string;
    }): Promise<Transaction[]> => {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.adminName) params.append('adminName', filters.adminName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Note: Your Java controller doesn't have 'type' parameter
      // If you need type filtering, you'll need to add it to the backend
      
      const url = `${BACKEND_URL}/api/transactions/filter?${params.toString()}`;
      console.log('Filter URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to filter transactions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map backend fields to frontend Transaction type
      return data.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        userName: item.userName || `User ${item.userId}`,
        type: item.type,
        amount: item.amount || 0,
        description: item.description,
        timestamp: item.timestamp || item.createdAt,
        adminName: item.adminName,
        previousBalance: item.previousBalance,
        newBalance: item.newBalance
      }));
    }
  };

  export const dashboardApi = {
    getTodayRevenue: async (): Promise<DailyRevenueDashboard> => {
      const res = await fetch(
        `${BACKEND_URL}/api/transactions/daily`
      );
  
      if (!res.ok) {
        throw new Error("Failed to load daily revenue dashboard");
      }
  
      return await res.json();
    }
  };

  export const userApi = {
    // Get all users summary
    getAllUsers: async (): Promise<User[]> => {
      const response = await fetch(`${BACKEND_URL}/api/users/all-summary`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      
      // Map backend fields to frontend User type
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone || '',
        email: item.email || '',
        registrationDate: item.registrationDate,
        lastVisit: item.lastVisit,
        totalVisits: item.totalVisits || 0,
        totalRecharge: item.totalRecharge || 0,
        totalDeduction: item.totalDeduction || 0,
        currentBalance: item.currentBalance || 0,
        status: item.status || 'inactive'
      }));
    },
  
    // Get user details by ID
    getUserDetails: async (userId: number): Promise<UserDetails> => {
      const response = await fetch(`${BACKEND_URL}/api/users/${userId}/details`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.status}`);
      }
      return response.json(); // Backend DTO matches frontend UserDetails
    },
  
    // Get user stats
    getUserStats: async (): Promise<UserStats> => {
      const response = await fetch(`${BACKEND_URL}/api/users/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }
      return response.json(); // Direct mapping
    },
  
    // Search users
    searchUsers: async (query: string): Promise<User[]> => {
      const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search users: ${response.status}`);
      }
      const data = await response.json();
      
      // Map backend fields to frontend User type
      return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone || '',
        email: item.email || '',
        registrationDate: item.registrationDate,
        lastVisit: item.lastVisit,
        totalVisits: item.totalVisits || 0,
        totalRecharge: item.totalRecharge || 0,
        totalDeduction: item.totalDeduction || 0,
        currentBalance: item.currentBalance || 0,
        status: item.status || 'inactive'
      }));
    },
  };

  
