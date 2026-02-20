import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  CreditCard,
  Gamepad2,
  Info,
  Loader2,
  LogOut,
  Minus,
  Plus,
  Scan,
  Search,
  Settings,
  User,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/main.css"; // Custom CSS
import "./index.css"; // Tailwind
import type { AdminSportDayOverview, BookingNotification, PlayBoxUser, Slot, Sport, StatusType } from "./types";
import { formatSlotRange, isPresentOrFutureSlot } from "./utils/formatters";
import { api } from "./utils/api";

const SLOT_REQUIRED_ACTIVITIES = new Set(["cricket", "pickleball", "swimming pool", "swimming"]);

const normalizeActivity = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const isSportMatchForActivity = (activity: string, sportName: string) => {
  const normalizedActivity = normalizeActivity(activity);
  const normalizedSport = normalizeActivity(sportName);

  if (normalizedActivity === "swimming pool") {
    return normalizedSport.includes("swimming");
  }

  return normalizedSport.includes(normalizedActivity);
};

export default function App() {
  const [cardUid, setCardUid] = useState("");
  const [activeUid, setActiveUid] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusType>({
    text: "Waiting for RFID scan...",
    type: "info"
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUsers, setAdminUsers] = useState<PlayBoxUser[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(500);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isCardAssignmentMode, setIsCardAssignmentMode] = useState(false);
  const [isTxnLoading, setIsTxnLoading] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showCancelCardModal, setShowCancelCardModal] = useState(false);
  const [cancelAdminPassword, setCancelAdminPassword] = useState("");
  const [isCancelingCard, setIsCancelingCard] = useState(false);
  const [deductorName, setDeductorName] = useState("");
  const [description, setDescription] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [deductSportId, setDeductSportId] = useState<number | "">("");
  const [slotDate, setSlotDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | "">("");
  const [slotLoading, setSlotLoading] = useState(false);
  const [overviewSportId, setOverviewSportId] = useState<number | "">("");
  const [overviewDate, setOverviewDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [dayOverview, setDayOverview] = useState<AdminSportDayOverview | null>(null);
  const [showBlockSlotModal, setShowBlockSlotModal] = useState(false);
  const [blockBookingName, setBlockBookingName] = useState("");
  const [blockBookingPhone, setBlockBookingPhone] = useState("");
  const [blockBookingEmail, setBlockBookingEmail] = useState("");
  const [blockBookingSportId, setBlockBookingSportId] = useState<number | "">("");
  const [blockBookingDate, setBlockBookingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [blockBookingSlots, setBlockBookingSlots] = useState<Slot[]>([]);
  const [blockBookingSlotId, setBlockBookingSlotId] = useState<number | "">("");
  const [blockSlotLoading, setBlockSlotLoading] = useState(false);
  const [blockSlotSubmitting, setBlockSlotSubmitting] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState<BookingNotification[]>([]);
  const [bookingNotificationsLoading, setBookingNotificationsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const adminRole = String(adminInfo?.role || "").trim().toLowerCase();
  const isOwner = adminRole.includes("owner");

  const navigate = useNavigate();
  const hasAssignedCard = Boolean(activeUid && activeUid.trim().length > 0);
  useEffect(() => {
    // Focus scanner input when switching from admin view
    if (!isAdminView && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [isAdminView]);
  useEffect(() => {
    if (showDeductModal) {
      const admin = localStorage.getItem("admin");
      if (admin) {
        try {
          const parsedAdmin = JSON.parse(admin);
          setDeductorName(parsedAdmin.name || parsedAdmin.username || "");
        } catch (error) {
          console.error("Error parsing admin data:", error);
        }
      }
    }
  }, [showDeductModal]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      try {
        const loggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
        const adminData = localStorage.getItem("admin");
        
        setIsLoggedIn(loggedIn);
        if (adminData) {
          const parsedAdmin = JSON.parse(adminData);
          setAdminInfo(parsedAdmin);
          setDeductorName(parsedAdmin.username || "");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    api.getSports()
      .then((data) => setSports(Array.isArray(data) ? data : []))
      .catch((error) => console.error("Failed to load sports:", error));
  }, []);

  const requiresSlotSelection = SLOT_REQUIRED_ACTIVITIES.has(normalizeActivity(description));
  const availableSportsForActivity = useMemo(
    () => sports.filter((sport) => isSportMatchForActivity(description, sport.name)),
    [sports, description]
  );

  useEffect(() => {
    if (!requiresSlotSelection) {
      if (deductSportId !== "") setDeductSportId("");
      if (selectedSlotId !== "") setSelectedSlotId("");
      if (slots.length > 0) setSlots([]);
      return;
    }

    if (availableSportsForActivity.length === 1) {
      setDeductSportId(availableSportsForActivity[0].id);
    } else if (
      deductSportId !== "" &&
      !availableSportsForActivity.some((sport) => sport.id === deductSportId)
    ) {
      setDeductSportId("");
    }
  }, [requiresSlotSelection, availableSportsForActivity, deductSportId, selectedSlotId, slots.length]);

  useEffect(() => {
    if (!showDeductModal || !requiresSlotSelection || deductSportId === "") {
      return;
    }

    setSlotLoading(true);
    api.getSlots(Number(deductSportId), slotDate)
      .then((data) => {
        setSlots(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Failed to load slots:", error);
        setSlots([]);
      })
      .finally(() => setSlotLoading(false));
  }, [showDeductModal, requiresSlotSelection, deductSportId, slotDate]);

  useEffect(() => {
    if (isAdminView) {
      return;
    }
    loadBookingNotifications();
  }, [isAdminView]);

  useEffect(() => {
    if (!showBlockSlotModal || blockBookingSportId === "") {
      setBlockBookingSlots([]);
      setBlockBookingSlotId("");
      return;
    }

    setBlockSlotLoading(true);
    api.getSlots(Number(blockBookingSportId), blockBookingDate)
      .then((data) => setBlockBookingSlots(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Failed to load block-slot options:", error);
        setBlockBookingSlots([]);
      })
      .finally(() => setBlockSlotLoading(false));
  }, [showBlockSlotModal, blockBookingSportId, blockBookingDate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear ALL localStorage items related to the app
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("admin");
      
      // Optional: Clear any other app-specific localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("playbox_") || key?.includes("admin")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset all state
      setIsLoggedIn(false);
      setAdminInfo(null);
      setIsAdminView(false);
      
      // Clear other state if needed
      setCardUid("");
      setActiveUid("");
      setName(null);
      setBalance(null);
      setStatus({
        text: "Waiting for RFID scan...",
        type: "info"
      });
      setIsNewUser(false);
      setAdminUsers([]);
      setSearchPhone("");
      setAmount(500);
      setApiError(null);
      
      // Redirect to login page
      navigate("/admin/login", { replace: true });
    }
  };

  const handleScan = async (uid: string) => {
    if (!uid.trim()) return;

    setStatus({ text: "Scanning card...", type: "info" });

    try {
      if (isCardAssignmentMode && selectedUserId) {
        const updatedUser = await api.assignCardToUser(selectedUserId, uid);
        setActiveUid(updatedUser.cardUid || uid);
        setName(updatedUser.name || name);
        setBalance(updatedUser.balance ?? balance ?? 0);
        setIsNewUser(false);
        setIsCardAssignmentMode(false);
        setAdminUsers((prev) =>
          prev.map((user) => (user.id === selectedUserId ? { ...user, cardUid: updatedUser.cardUid } : user))
        );
        setStatus({ text: `Card assigned successfully to ${updatedUser.name}`, type: "success" });
        return;
      }

      const data = await api.scanCard(uid);
      setActiveUid(uid);

      if (data.status === "NEW_CARD") {
        setName(null);
        setBalance(null);
        setIsNewUser(true);
        setStatus({ 
          text: "New RFID card detected. Please create user profile.", 
          type: "warning" 
        });
      } else {
        setName(data.name || "");
        setBalance(data.balance ?? 0);
        setIsNewUser(false);
        setStatus({ 
          text: "User found successfully!", 
          type: "success" 
        });
      }
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Backend connection error"}`, 
        type: "error" 
      });
    } finally {
      setCardUid("");
    }
  };

  const handleCreateUser = async () => {
    if (!activeUid || !newName.trim() || !newPhone.trim()) {
      setStatus({ text: "Name & phone are required", type: "error" });
      return;
    }

    setStatus({ text: "Creating user...", type: "info" });

    try {
      const user = await api.createUser({
        cardUid: activeUid,
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
      });

      setName(user.name);
      setBalance(user.balance);
      setIsNewUser(false);

      setNewName("");
      setNewPhone("");
      setNewEmail("");

      setStatus({ 
        text: "User created successfully!", 
        type: "success" 
      });
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Backend error while creating user"}`, 
        type: "error" 
      });
    }
  };

  const handleAddBalance = async () => {
    if (!activeUid || amount < 500) {
      setStatus({ text: "Minimum add amount is ₹500", type: "error" });
      return;
    }
  
    setIsTxnLoading(true);
    setStatus({ text: "Adding amount...", type: "info" });
  
    try {
      // Get admin name from adminInfo or localStorage
      const adminName = adminInfo?.username || 
                       deductorName || 
                       localStorage.getItem('admin') || 
                       'Unknown Admin';
      
      // Pass adminName as the third parameter
      const user = await api.addBalance(activeUid, amount, adminName);
      
      setBalance(user.balance);
      
      // Update status message to show who added the balance
      setStatus({ 
        text: `₹${amount} added by ${adminName} successfully!`, 
        type: "success" 
      });
      
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Failed to add balance"}`, 
        type: "error" 
      });
    } finally {
      setIsTxnLoading(false);
    }
  };
  const handleDeductBalance = async () => {
    if (!deductorName.trim() || !description.trim()) {
      setStatus({ text: "Deductor name & description required", type: "warning" });
      return;
    }

    if (requiresSlotSelection) {
      if (deductSportId === "") {
        setStatus({ text: "Please select sport/court", type: "warning" });
        return;
      }
      if (selectedSlotId === "") {
        setStatus({ text: "Please select a slot", type: "warning" });
        return;
      }
    }
  
    setIsTxnLoading(true);
    setStatus({ text: "Deducting amount...", type: "info" });
  
    try {
      const user = await api.deductBalance(
        activeUid,
        amount,
        deductorName,
        description,
        deductSportId === "" ? undefined : deductSportId,
        selectedSlotId === "" ? undefined : selectedSlotId
      );
  
      setBalance(user.balance);
      setStatus({
        text: `₹${amount} deducted by ${deductorName}`,
        type: "success",
      });
  
      // reset modal
      setShowDeductModal(false);
      setDeductorName("");
      setDescription("");
      setDeductSportId("");
      setSelectedSlotId("");
      setSlots([]);
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "Insufficient balance"}`, type: "error" });
    } finally {
      setIsTxnLoading(false);
    }
  };

  const handleCancelCard = async () => {
    if (!activeUid) {
      setStatus({ text: "No card assigned to cancel", type: "warning" });
      return;
    }
    if (!adminInfo?.username) {
      setStatus({ text: "Admin username not found in session", type: "error" });
      return;
    }
    if (!cancelAdminPassword.trim()) {
      setStatus({ text: "Admin password is required", type: "warning" });
      return;
    }

    try {
      setIsCancelingCard(true);
      const updatedUser = await api.cancelUserCard(activeUid, adminInfo.username, cancelAdminPassword);

      setShowCancelCardModal(false);
      setCancelAdminPassword("");
      setActiveUid("");
      setName(updatedUser.name || name);
      setBalance(updatedUser.balance ?? balance ?? 0);
      setIsCardAssignmentMode(false);

      setAdminUsers((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? { ...user, cardUid: "" } : user))
      );

      setStatus({ text: `Card cancelled successfully for ${updatedUser.name}`, type: "success" });
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "Failed to cancel card"}`, type: "error" });
    } finally {
      setIsCancelingCard(false);
    }
  };

  
  // UPDATED: loadAllUsers with better error handling
  const loadAllUsers = async () => {
    try {
      console.log("Starting to load all users...");
      setLoading(true);
      setApiError(null);
      
      const users = await api.getAllUsers();
      console.log("API response received:", users);
      
      if (Array.isArray(users)) {
        setAdminUsers(users);
        setStatus({ 
          text: `Successfully loaded ${users.length} users`, 
          type: "success" 
        });
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error: any) {
      console.error("Failed to load users:", error);
      setApiError(error.message || "Failed to load users");
      setStatus({ 
        text: `Error: ${error.message || "Failed to load users"}`, 
        type: "error" 
      });
      
      // Add mock data for testing if API fails
      const mockUsers: PlayBoxUser[] = [
        { 
          id: 1, 
          name: "John Doe", 
          phone: "9876543210", 
          cardUid: "ABC123DEF456", 
          balance: 1500,
          email: "john@example.com"
        },
        { 
          id: 2, 
          name: "Jane Smith", 
          phone: "9876543211", 
          cardUid: "DEF456GHI789", 
          balance: 2500,
          email: "jane@example.com"
        },
        { 
          id: 3, 
          name: "Bob Wilson", 
          phone: "9876543212", 
          cardUid: "GHI789JKL012", 
          balance: 500,
          email: "bob@example.com"
        },
      ];
      setAdminUsers(mockUsers);
      setStatus({ 
        text: "Using demo data (API failed)", 
        type: "warning" 
      });
    } finally {
      setLoading(false);
      console.log("Finished loading users");
    }
  };

  const searchByPhone = async () => {
    if (!searchPhone.trim()) return;

    try {
      setLoading(true);
      const user = await api.searchByPhone(searchPhone);
      setSelectedUserId(user.id);
      setName(user.name);
      setBalance(user.balance);
      setActiveUid(user.cardUid || "");
      setIsCardAssignmentMode(false);
      setIsNewUser(false);
      setIsAdminView(false);
      setStatus({ text: "User loaded via phone search ✅", type: "success" });
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "No user found"}`, type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const loadDayOverview = async () => {
    if (overviewSportId === "") {
      setStatus({ text: "Select a sport/court for day overview", type: "warning" });
      return;
    }

    try {
      setOverviewLoading(true);
      const overview = await api.getAdminSportDayOverview(Number(overviewSportId), overviewDate);
      setDayOverview(overview);
      setStatus({ text: "Day-wise slot overview loaded", type: "success" });
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "Failed to load slot overview"}`, type: "error" });
      setDayOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  };

  function loadBookingNotifications() {
    return (async () => {
      try {
        setBookingNotificationsLoading(true);
        const data = await api.getBookingNotifications();
        const unseenOnly = Array.isArray(data) ? data.filter((item) => !item.seen) : [];
        setBookingNotifications(unseenOnly);
      } catch (error) {
        console.error("Failed to load booking notifications:", error);
      } finally {
        setBookingNotificationsLoading(false);
      }
    })();
  }

  const openBlockSlotModal = () => {
    setShowBlockSlotModal(true);
    setBlockBookingName("");
    setBlockBookingPhone("");
    setBlockBookingEmail("");
    setBlockBookingSportId("");
    setBlockBookingDate(new Date().toISOString().slice(0, 10));
    setBlockBookingSlots([]);
    setBlockBookingSlotId("");
  };

  const handleBlockSlotBooking = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!blockBookingName.trim()) {
      setStatus({ text: "Name is required", type: "warning" });
      return;
    }
    if (!phoneRegex.test(blockBookingPhone.trim())) {
      setStatus({ text: "Enter valid 10-digit phone number", type: "warning" });
      return;
    }
    if (blockBookingSportId === "") {
      setStatus({ text: "Please select sport/court", type: "warning" });
      return;
    }
    if (blockBookingSlotId === "") {
      setStatus({ text: "Please select slot", type: "warning" });
      return;
    }

    try {
      setBlockSlotSubmitting(true);
      await api.adminBlockSlot({
        name: blockBookingName.trim(),
        phone: blockBookingPhone.trim(),
        email: blockBookingEmail.trim() || undefined,
        slotId: Number(blockBookingSlotId),
      });

      setShowBlockSlotModal(false);
      setStatus({
        text: "Slot blocked successfully (OFFLINE payment). OTP SMS sent to user.",
        type: "success",
      });
      loadBookingNotifications();
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "Failed to block slot"}`, type: "error" });
    } finally {
      setBlockSlotSubmitting(false);
    }
  };

  const handleMarkNotificationSeen = async (id: number) => {
    try {
      await api.markBookingNotificationSeen(id);
      setBookingNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to mark notification as seen:", error);
    }
  };

  const handleSelectUser = (user: PlayBoxUser) => {
    setSelectedUserId(user.id);
    setActiveUid(user.cardUid || "");
    setName(user.name);
    setBalance(user.balance);
    setIsCardAssignmentMode(false);
    setIsNewUser(false);
    setIsAdminView(false);
    setStatus({
      text: user.cardUid ? "User loaded from Admin Panel ✅" : "User has no card. Click Create Card and scan RFID.",
      type: user.cardUid ? "success" : "warning",
    });
  };

  const startCardAssignment = () => {
    if (!selectedUserId) {
      setStatus({ text: "Please select a user first", type: "warning" });
      return;
    }
    setIsCardAssignmentMode(true);
    setStatus({ text: "Card assignment mode ON: scan RFID card to assign it.", type: "info" });
  };

  const goToOwnerDashboard = () => {
    navigate("/owner");
    // Fallback for HashRouter edge cases
    if (window.location.hash !== "#/owner") {
      window.location.hash = "/owner";
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "warning": return "#f59e0b";
      default: return "#3b82f6";
    }
  };

  const StatusIcon = () => {
    const iconProps = { size: 20, className: "status-icon" };
    switch (status.type) {
      case "success": return <CheckCircle {...iconProps} />;
      case "error": return <AlertCircle {...iconProps} />;
      case "warning": return <AlertTriangle {...iconProps} />;
      default: return <Info {...iconProps} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h1 className="app-title">🎮 PlayBox Sports Arena</h1>
              <p className="app-subtitle">
                {adminInfo ? `Logged in as ${adminInfo.username} (${adminInfo.role})` : "Tap RFID card to begin transaction"}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={() => {
                setIsAdminView(!isAdminView);
                if (!isAdminView) {
                  console.log("Switching to admin view, loading users...");
                  loadAllUsers();
                }
              }}
              className="btn btn-outline header-action-btn"
              style={{
                backgroundColor: isAdminView ? "#4f46e5" : "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
              }}
            >
              <Settings size={16} className="btn-icon" />
              {isAdminView ? "Back to RFID" : "Find Users"}
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={goToOwnerDashboard}
                className="btn btn-outline header-action-btn"
                style={{
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                }}
              >
                Owner Dashboard
              </button>
            )}

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="btn btn-outline logout-btn header-action-btn"
                style={{
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                <LogOut size={16} className="btn-icon" />
                Logout
              </button>
              
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="content-container">
          {/* Scanner Section */}
          {!isAdminView && (
            <div className="card section">
              <div className="section-header">
                <Scan size={20} className="btn-icon" />
                <h2 className="section-title">RFID Scanner</h2>
              </div>
              <div className="scanner-container">
                <input
                  ref={scannerInputRef} // Add this line
                  autoFocus
                  placeholder="Enter RFID UID or tap card"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan(cardUid)}
                  className="input-field scanner-input"
                />
                <button
                  onClick={() => handleScan(cardUid)}
                  disabled={!cardUid.trim()}
                  className="btn btn-primary scan-button"
                >
                  Scan
                </button>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button onClick={openBlockSlotModal} className="btn btn-outline">
                  Block Slot (Offline)
                </button>
              </div>
              
              {activeUid && (
                <div className="rfid-info">
                  <span className="rfid-label">RFID UID:</span>
                  <code className="rfid-code">{activeUid}</code>
                </div>
              )}
            </div>
          )}

          {/* Status Display */}
          <div 
            className="status-card"
            style={{
              borderColor: getStatusColor(),
              backgroundColor: `${getStatusColor()}15`
            }}
          >
            <div 
              className="status-icon"
              style={{ backgroundColor: getStatusColor() }}
            >
              <StatusIcon />
            </div>
            <span style={{ color: getStatusColor(), fontWeight: 500 }}>
              {status.text}
            </span>
          </div>

          {/* Admin Panel */}
          {isAdminView ? (
            <div className="card admin-panel">
              <div className="section-header">
                <Users size={20} className="btn-icon" />
                <h2 className="section-title">Admin Panel</h2>
              </div>
              
              {/* Debug Info */}
              {apiError && (
                <div className="debug-info" style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b'
                }}>
                  <strong>API Error:</strong> {apiError}
                </div>
              )}
              
              {/* Search Section */}
              <div className="search-container">
                <div style={{ position: 'relative', flex: 1 }}>
                  <div className="search-icon-wrapper">
                    <Search size={16} color="#6b7280" />
                  </div>
                  <input
                    placeholder="Search by phone number"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByPhone()}
                    className="input-field"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                <button
                  onClick={searchByPhone}
                  disabled={loading || !searchPhone.trim()}
                  className="btn btn-primary admin-search-btn"
                  style={{ marginLeft: 8 }}
                >
                  <Search size={16} className="btn-icon" />
                  Search
                </button>
                <button
                  onClick={loadAllUsers}
                  disabled={loading}
                  className="btn btn-outline admin-search-btn"
                  style={{ marginLeft: 8 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner btn-icon" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users size={16} className="btn-icon" />
                      Load All Users
                    </>
                  )}
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#6b7280' }}>Loading users...</p>
                </div>
              )}

              {/* Users Table */}
              {!loading && adminUsers.length > 0 && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr className="table-header">
                        <th className="table-header-cell">Name</th>
                        <th className="table-header-cell">Phone</th>
                        <th className="table-header-cell">RFID</th>
                        <th className="table-header-cell" style={{ textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="table-row"
                          onClick={() => handleSelectUser(user)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="table-cell">{user.name}</td>
                          <td className="table-cell">{user.phone}</td>
                          <td className="table-cell">
                            <span className="badge">
                              {user.cardUid}
                            </span>
                          </td>
                          <td className="table-cell" style={{ textAlign: 'right', fontWeight: 600 }}>
                            ₹{user.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && adminUsers.length === 0 && (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p style={{ color: '#6b7280', marginBottom: 16 }}>
                    No users found. Click "Load All Users" to display users.
                  </p>
                  <button
                    onClick={() => {
                      console.log("Adding test user...");
                      const testUser: PlayBoxUser = {
                        id: Date.now(),
                        name: "Test User",
                        phone: "1234567890",
                        cardUid: "TEST123",
                        balance: 1000,
                        email: "test@example.com"
                      };
                      setAdminUsers([testUser]);
                    }}
                    className="btn btn-outline"
                  >
                    Add Test User
                  </button>
                </div>
              )}

              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ padding: 16 }}>
                  <h3 className="section-title" style={{ marginBottom: 12 }}>Day-wise Slot Status</h3>
                  <div className="admin-overview-controls" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      value={overviewSportId}
                      onChange={(e) => setOverviewSportId(e.target.value ? Number(e.target.value) : "")}
                      className="input-field"
                      style={{ minWidth: 220 }}
                    >
                      <option value="">Select Sport/Court</option>
                      {sports.map((sport) => (
                        <option key={sport.id} value={sport.id}>
                          {sport.name} - {sport.courtName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={overviewDate}
                      onChange={(e) => setOverviewDate(e.target.value)}
                      className="input-field"
                    />
                    <button
                      onClick={loadDayOverview}
                      disabled={overviewLoading}
                      className="btn btn-primary"
                    >
                      {overviewLoading ? "Loading..." : "Load Overview"}
                    </button>
                  </div>

                  {dayOverview && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ marginBottom: 8, color: "#374151", fontWeight: 500 }}>
                        {dayOverview.sportName} - {dayOverview.courtName} ({dayOverview.date}) | Total: {dayOverview.totalSlots} | Booked: {dayOverview.bookedSlots} | Empty: {dayOverview.emptySlots}
                      </p>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr className="table-header">
                              <th className="table-header-cell">Time</th>
                              <th className="table-header-cell">Status</th>
                              <th className="table-header-cell">User</th>
                              <th className="table-header-cell">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dayOverview.slots.map((slot) => (
                              <tr key={slot.slotId} className="table-row">
                                <td className="table-cell">{formatSlotRange(slot.startTime, slot.endTime)}</td>
                                <td className="table-cell">{slot.booked ? "BOOKED" : "EMPTY"}</td>
                                <td className="table-cell">{slot.userName || "-"}</td>
                                <td className="table-cell">{slot.amount ? `₹${slot.amount}` : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Main Content Area */
            <>
              {name && !isNewUser ? (
                <div style={{ width: '100%' }}>
                  {/* User Info Card */}
                  <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                        <div className="avatar">
                          <User size={32} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <h2 className="user-name">{name}</h2>
                            <span className="badge rfid-badge">
                              {hasAssignedCard ? activeUid : "No Card Assigned"}
                            </span>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <span className="balance-label">Current Balance</span>
                            <div className="balance-amount">₹{balance?.toLocaleString()}</div>
                          </div>
                          {hasAssignedCard && (
                            <div style={{ marginTop: 12 }}>
                              <button
                                onClick={() => {
                                  setShowCancelCardModal(true);
                                  setCancelAdminPassword("");
                                }}
                                className="btn btn-destructive"
                                style={{ height: 40 }}
                              >
                                Cancel Card
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!hasAssignedCard ? (
                    <div className="card">
                      <div style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ marginBottom: 16 }}>Create Card</h3>
                        <p className="hint" style={{ marginBottom: 12 }}>
                          This user has no RFID card assigned. Click Create Card, then scan card in RFID Scanner.
                        </p>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <button
                            onClick={startCardAssignment}
                            className="btn btn-primary"
                            style={{ height: 44 }}
                          >
                            Create Card
                          </button>
                          {isCardAssignmentMode && (
                            <span style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 14 }}>
                              Waiting for RFID scan...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card">
                      <div style={{ padding: 24 }}>
                        <h3 className="section-title" style={{ marginBottom: 16 }}>Transaction</h3>
                        
                        <div style={{ marginBottom: 16 }}>
                          <label className="label">Amount</label>
                          <div style={{ position: 'relative' }}>
                            <span className="currency-symbol">₹</span>
                            <input
                              type="number"
                              min={1}
                              value={amount}
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="input-field"
                              style={{ paddingLeft: 40, fontSize: '1.25rem', textAlign: 'right' }}
                              placeholder="Enter amount"
                            />
                          </div>
                          <p className="hint">Minimum ₹500 for deposit</p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <button
                            onClick={handleAddBalance}
                            disabled={isTxnLoading || amount < 500}
                            className="btn btn-primary"
                            style={{ flex: 1, height: 48 }}
                          >
                            {isTxnLoading ? (
                              <>
                                <Loader2 size={16} className="spinner btn-icon" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="btn-icon" />
                                Add Balance
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowDeductModal(true);
                              setDescription("");
                              setDeductSportId("");
                              setSelectedSlotId("");
                              setSlots([]);
                            }}
                            disabled={isTxnLoading || amount <= 0}
                            className="btn btn-destructive"
                            style={{ flex: 1, height: 48 }}
                          >
                            {isTxnLoading ? (
                              <>
                                <Loader2 size={16} className="spinner btn-icon" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Minus size={16} className="btn-icon" />
                                Deduct Balance
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : isNewUser ? (
                <div className="card">
                  <div style={{ padding: 24 }}>
                    <div className="section-header">
                      <UserPlus size={20} className="btn-icon" />
                      <h2 className="section-title">Create New User</h2>
                    </div>
                    
                    {/* RFID Display */}
                    <div className="rfid-display">
                      <CreditCard size={20} style={{ marginRight: 8, color: '#6b7280' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>RFID UID:</span>
                      <code className="rfid-code">{activeUid}</code>
                    </div>

                    {/* Form */}
                    <div style={{ marginTop: 24 }}>
                      <div className="form-group">
                        <label className="label">Full Name *</label>
                        <input
                          placeholder="Enter full name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Phone Number *</label>
                        <input
                          placeholder="Enter phone number"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <button
                        onClick={handleCreateUser}
                        disabled={!newName.trim() || !newPhone.trim()}
                        className="btn btn-primary"
                        style={{ width: '100%', height: 48, marginTop: 8 }}
                      >
                        <UserPlus size={16} className="btn-icon" />
                        Create User Profile
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div className="empty-icon">
                      <Gamepad2 size={40} />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                        Ready to Scan
                      </h3>
                      <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>
                        Scan an RFID card to view user details or create a new profile
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!isAdminView && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h3 className="section-title" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Bell size={18} />
                    Booking Notifications
                  </h3>
                  <button
                    onClick={loadBookingNotifications}
                    disabled={bookingNotificationsLoading}
                    className="btn btn-outline"
                  >
                    {bookingNotificationsLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {bookingNotifications.length === 0 ? (
                  <p style={{ color: "#6b7280", margin: 0 }}>No booking notifications yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {bookingNotifications.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 10,
                          padding: 10,
                          background: item.seen ? "#ffffff" : "#f0f9ff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#111827" }}>{item.userName} ({item.userPhone})</div>
                            <div style={{ color: "#374151", fontSize: 14 }}>
                              {item.sportName} | {item.slotDate} | {formatSlotRange(item.startTime, item.endTime)}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{item.createdAt}</div>
                          </div>
                          {!item.seen && (
                            <button
                              onClick={() => handleMarkNotificationSeen(item.id)}
                              className="btn btn-primary"
                              style={{ height: 34, padding: "0 12px" }}
                            >
                              Mark Seen
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Deduct Modal */}
        {showDeductModal && (
          <div className="modal-overlay" onClick={() => setShowDeductModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ position: 'relative' }}>
                <h2 className="modal-title">Confirm Deduction</h2>
                <button 
                  onClick={() => setShowDeductModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              {/* Amount Preview */}
              <div className="amount-preview">
                <span className="amount-label">Deduction Amount</span>
                <div className="amount-value">₹{amount}</div>
              </div>

              {/* Activity Select */}
              <div className="form-group">
                <label className="label">Select Activity *</label>
                <select
                  value={description}
                  onChange={(e) => {
                    const selectedActivity = e.target.value;
                    setDescription(selectedActivity);
                    if (selectedActivity === "Cricket") {
                      setAmount(1000);
                    } else if (selectedActivity === "Pickleball") {
                      setAmount(600);
                    }
                    setDeductSportId("");
                    setSelectedSlotId("");
                    setSlots([]);
                  }}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                  required
                >
                  <option value="">Select Activity</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Pool">Pool</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Pickleball">Pickleball</option>
                </select>
              </div>

              {requiresSlotSelection && (
                <>
                  <div className="form-group">
                    <label className="label">Select Sport/Court *</label>
                    <select
                      value={deductSportId}
                      onChange={(e) => {
                        setDeductSportId(e.target.value ? Number(e.target.value) : "");
                        setSelectedSlotId("");
                      }}
                      className="input-field"
                      style={{ width: "100%", padding: "10px 12px" }}
                      required
                    >
                      <option value="">Select Sport/Court</option>
                      {availableSportsForActivity.map((sport) => (
                        <option key={sport.id} value={sport.id}>
                          {sport.name} - {sport.courtName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Select Date *</label>
                    <input
                      type="date"
                      value={slotDate}
                      onChange={(e) => {
                        setSlotDate(e.target.value);
                        setSelectedSlotId("");
                      }}
                      min={new Date().toISOString().slice(0, 10)}
                      className="input-field"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Select Slot *</label>
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value ? Number(e.target.value) : "")}
                      className="input-field"
                      style={{ width: "100%", padding: "10px 12px" }}
                      disabled={slotLoading || deductSportId === ""}
                      required
                    >
                      <option value="">
                        {slotLoading ? "Loading slots..." : "Select Available Slot"}
                      </option>
                      {slots
                        .filter((slot) => !slot.booked && isPresentOrFutureSlot(slotDate, slot.startTime, slot.endTime))
                        .map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {formatSlotRange(slot.startTime, slot.endTime)}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Deductor Name - READONLY */}
              <div className="form-group">
                <label className="label">Deducted By *</label>
                <div className="deductor-display">
                  <div className="deductor-info">
                    <div className="deductor-name">{adminInfo?.username || deductorName}</div>
                    <div className="deductor-role">({adminInfo?.role || 'Staff'})</div>
                  </div>
                  <input
                    type="hidden"
                    value={adminInfo?.username || deductorName}
                    onChange={(e) => setDeductorName(e.target.value)}
                  />
                </div>
                <p className="hint" style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                  This field cannot be changed
                </p>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  onClick={() => setShowDeductModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeductBalance}
                  className="btn btn-destructive"
                  disabled={
                    isTxnLoading ||
                    !description.trim() ||
                    (requiresSlotSelection && (deductSportId === "" || selectedSlotId === ""))
                  }
                  style={{ flex: 1, padding: '12px' }}
                >
                  {isTxnLoading ? (
                    <>
                      <Loader2 size={16} className="spinner btn-icon" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Deduction"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelCardModal && (
          <div className="modal-overlay" onClick={() => setShowCancelCardModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ position: "relative" }}>
                <h2 className="modal-title">Cancel Card</h2>
                <button
                  onClick={() => setShowCancelCardModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  marginBottom: 14,
                  padding: 10,
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                This will unassign card <strong>{activeUid}</strong> from this user.
              </div>

              <div className="form-group">
                <label className="label">Admin Username</label>
                <input
                  value={adminInfo?.username || ""}
                  disabled
                  className="input-field"
                  style={{ width: "100%", background: "#f1f5f9" }}
                />
              </div>

              <div className="form-group">
                <label className="label">Enter Admin Password *</label>
                <input
                  type="password"
                  value={cancelAdminPassword}
                  onChange={(e) => setCancelAdminPassword(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                  placeholder="Enter password to confirm"
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowCancelCardModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: "12px" }}
                >
                  Close
                </button>
                <button
                  onClick={handleCancelCard}
                  className="btn btn-destructive"
                  disabled={isCancelingCard || !cancelAdminPassword.trim()}
                  style={{ flex: 1, padding: "12px" }}
                >
                  {isCancelingCard ? "Processing..." : "Confirm Cancel Card"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {showBlockSlotModal && (
        <div className="modal-overlay" onClick={() => setShowBlockSlotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ position: "relative" }}>
              <h2 className="modal-title">Block Slot (Offline Payment)</h2>
              <button onClick={() => setShowBlockSlotModal(false)} className="modal-close">✕</button>
            </div>

            <div className="form-group">
              <label className="label">Name *</label>
              <input
                value={blockBookingName}
                onChange={(e) => setBlockBookingName(e.target.value)}
                className="input-field"
                placeholder="Enter customer name"
              />
            </div>

            <div className="form-group">
              <label className="label">Phone *</label>
              <input
                value={blockBookingPhone}
                onChange={(e) => setBlockBookingPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="input-field"
                placeholder="10-digit phone"
              />
            </div>

            <div className="form-group">
              <label className="label">Email (Optional)</label>
              <input
                type="email"
                value={blockBookingEmail}
                onChange={(e) => setBlockBookingEmail(e.target.value)}
                className="input-field"
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label className="label">Sport / Court *</label>
              <select
                value={blockBookingSportId}
                onChange={(e) => setBlockBookingSportId(e.target.value ? Number(e.target.value) : "")}
                className="input-field"
                style={{ padding: "10px 12px" }}
              >
                <option value="">Select Sport/Court</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name} - {sport.courtName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Date *</label>
              <input
                type="date"
                value={blockBookingDate}
                onChange={(e) => setBlockBookingDate(e.target.value)}
                className="input-field"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div className="form-group">
              <label className="label">Available Slot *</label>
              <select
                value={blockBookingSlotId}
                onChange={(e) => setBlockBookingSlotId(e.target.value ? Number(e.target.value) : "")}
                className="input-field"
                style={{ padding: "10px 12px" }}
                disabled={blockBookingSportId === "" || blockSlotLoading}
              >
                <option value="">{blockSlotLoading ? "Loading slots..." : "Select Slot"}</option>
                {blockBookingSlots
                  .filter((slot) => !slot.booked && isPresentOrFutureSlot(blockBookingDate, slot.startTime, slot.endTime))
                  .map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {formatSlotRange(slot.startTime, slot.endTime)}
                    </option>
                  ))}
              </select>
            </div>

            <div
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 13,
              }}
            >
              Payment Mode: <strong>OFFLINE</strong> (collected physically by admin)
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowBlockSlotModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleBlockSlotBooking}
                disabled={blockSlotSubmitting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {blockSlotSubmitting ? "Blocking..." : "Block Slot"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-text">
          PlayBox RFID System v1.0 • Ensure RFID reader is connected
        </p>
      </footer>
    </div>
  );
}
