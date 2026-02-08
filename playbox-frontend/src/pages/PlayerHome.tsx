import { Calendar, CreditCard, LogOut, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function PlayerHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("player");
  
    if (!storedUser) {
      setLoading(false);
      return;
    }
  
    const parsedUser = JSON.parse(storedUser);
  
    api.searchByPhone(parsedUser.phone)
      .then((freshUser) => {
        setUser(freshUser);
        localStorage.setItem("player", JSON.stringify(freshUser));
      })
      .catch((err) => {
        console.error("Failed to refresh user:", err);
        setUser(parsedUser); // fallback to stored user
      })
      .finally(() => setLoading(false));
  
  }, []);
  

  const handleLogout = () => {
    localStorage.removeItem("player");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <h2 style={styles.title}>👋 Welcome, {user.name}</h2>

        {/* Card Info */}
        <div style={styles.infoBox}>
          <CreditCard size={18} />
          <span>
            Card UID: {user.cardUid || "Not Assigned"}
          </span>
        </div>

        {/* Balance */}
        <div style={styles.balanceBox}>
          <Wallet size={24} />
          <h2 style={{ margin: "10px 0" }}>₹ {user.balance}</h2>
          <p>Available Balance</p>

          {user.balance < 100 && (
            <p style={styles.lowBalance}>
              ⚠ Low balance. Please recharge.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button
            style={styles.primaryButton}
            onClick={() => navigate("/sports")}
          >
            <Calendar size={18} />
            Book Slot
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/my-bookings")}
          >
            My Bookings
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => navigate("/profile")}
          >
            <User size={18} />
            My Profile
          </button>

          <button
            style={styles.logout}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px"
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  card: {
    width: "420px",
    background: "#fff",
    padding: "35px",
    borderRadius: "14px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
    textAlign: "center"
  },
  title: {
    marginBottom: "20px"
  },
  infoBox: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "14px",
    color: "#555"
  },
  balanceBox: {
    background: "#E8F5E9",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "25px"
  },
  lowBalance: {
    color: "red",
    fontSize: "13px",
    marginTop: "8px"
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  primaryButton: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#4CAF50",
    color: "white",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px"
  },
  secondaryButton: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #4CAF50",
    background: "white",
    color: "#4CAF50",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px"
  },
  logout: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#f44336",
    color: "white",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px"
  }
};