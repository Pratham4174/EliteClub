export interface ScanResponse {
    status: "NEW_CARD" | "EXISTING_USER";
    name?: string;
    balance?: number;
  }
  
  export interface PlayBoxUser {
    id: number;
    name: string;
    phone: string;
    email?: string;
    cardUid: string;
    balance: number;
    [key: string]: any;
  }
  
  export interface StatusType {
    text: string;
    type: "info" | "success" | "error" | "warning";
  }

  export interface DashboardStats {
    totalUsers: number;
    totalBalance: number;
    todayTransactions: number;
    activeToday: number;
    revenueToday: number;
  }
  
  export interface Transaction {
    id: number;
    userId: number;
    userName: string | null;
    type: 'ADD' | 'DEDUCT' | 'NEW_USER';
    amount: number;
    description?: string; // Add this line - make it optional
    timestamp: string;
    adminName?: string;
    previousBalance?: number;
    balanceAfter?: number;
  }

  export interface FilterState {
    userId?: number;
    adminName?: string;
    startDate?: string;  // Format: YYYY-MM-DD
    endDate?: string;    // Format: YYYY-MM-DD
    type?: 'ADD' | 'DEDUCT' | 'NEW_USER';
  }
  // Add PageResponse type
export interface PageResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
  }

  export interface StatItem {
    name: string;
    count: number;
  }
  
  export interface DailyRevenueDashboard {
    totalDeposited: number;
    totalDeducted: number;
    netCashflow: number;
    mostActiveStaff: StatItem[];
    mostActiveUsers: StatItem[];
  }

  export interface User {
    id: number;
    name: string;
    // Remove userId field since your backend doesn't have it
    phone?: string;
    email?: string;
    registrationDate: string; // Your backend returns string
    lastVisit?: string;
    totalVisits: number;
    totalRecharge: number;
    totalDeduction: number;
    currentBalance: number;
    status: 'active' | 'inactive';
  }
  
  export interface UserDetails extends User {
    recentTransactions: Transaction[]; // Use your TransactionDTO
    rechargeHistory: { date: string; amount: number }[];
    avgVisitAmount: number;
    lastRechargeDate?: string;
  }
  
export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    totalRecharge: number;
    totalDeduction: number;
    avgBalance: number;
    newUsersToday: number;
  }
 
  export interface Sport {
    id: number;
    name: string;
    courtName: string;
    pricePerHour: number;
    active: boolean;
  }

  export interface Slot {
    id: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    booked: boolean;
  }

  export interface SlotDetails extends Slot {
    sportId: number;
  }

  export interface AdminSlotStatus {
    slotId: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    booked: boolean;
    bookingId?: number;
    userId?: number;
    userName?: string;
    amount?: number;
    status?: string;
    paymentMode?: string;
    createdAt?: string;
  }

  export interface AdminSportDayOverview {
    sportId: number;
    sportName: string;
    courtName: string;
    date: string;
    totalSlots: number;
    bookedSlots: number;
    emptySlots: number;
    slots: AdminSlotStatus[];
  }

  
