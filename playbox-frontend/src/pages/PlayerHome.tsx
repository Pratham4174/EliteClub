import { Calendar, CreditCard, LogOut, User, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../utils/api";
import { formatSlotRange } from "../utils/formatters";
import type { SlotDetails, Sport, UserDetails } from "../types";

interface Booking {
  id: number;
  userId: number;
  sportId: number;
  slotId: number;
  amount: number;
  status: string;
  paymentMode: string;
  createdAt: string;
}

interface PlayerSession {
  id: number;
  name: string;
  phone: string;
  cardUid?: string;
  balance?: number;
}

export default function PlayerHome() {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<PlayerSession | null>(null);
  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sportsById, setSportsById] = useState<Record<number, Sport>>({});
  const [slotById, setSlotById] = useState<Record<number, SlotDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlayerData = async () => {
      const storedUser = localStorage.getItem("player");
      if (!storedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(storedUser) as PlayerSession;

        const freshUser = await api.searchByPhone(parsed.phone);
        setSessionUser(freshUser);
        localStorage.setItem("player", JSON.stringify(freshUser));

        const [profileData, bookingsData, sportsData] = await Promise.all([
          api.getUserProfile(freshUser.id),
          api.getUserBookings(freshUser.id),
          api.getSports(),
        ]);

        setProfile(profileData);
        const normalizedBookings = Array.isArray(bookingsData) ? bookingsData : [];
        setBookings(normalizedBookings);

        const sportsMap: Record<number, Sport> = {};
        (Array.isArray(sportsData) ? sportsData : []).forEach((sport) => {
          sportsMap[sport.id] = sport;
        });
        setSportsById(sportsMap);

        const uniqueSlotIds = Array.from(
          new Set(normalizedBookings.map((booking) => booking.slotId).filter((id) => typeof id === "number"))
        );
        const slotDetails = await Promise.all(
          uniqueSlotIds.map(async (slotId) => {
            try {
              return await api.getSlotById(slotId);
            } catch {
              return null;
            }
          })
        );

        const slotMap: Record<number, SlotDetails> = {};
        slotDetails.forEach((slot) => {
          if (slot) {
            slotMap[slot.id] = slot;
          }
        });
        setSlotById(slotMap);
      } catch (err: any) {
        setError(err.message || "Failed to load player data");
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "CONFIRMED").length,
    [bookings]
  );

  const totalSpent = useMemo(
    () => bookings.reduce((sum, booking) => sum + (Number(booking.amount) || 0), 0),
    [bookings]
  );

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => b.id - a.id).slice(0, 6),
    [bookings]
  );

  const handleLogout = () => {
    localStorage.removeItem("player");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <p style={{ color: "#334155", fontWeight: 600 }}>Loading player data...</p>
      </div>
    );
  }

  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>Player Home</h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              {sessionUser.name} ({sessionUser.phone})
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              color: "#0f172a",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <StatCard icon={<Wallet size={18} />} label="Wallet Balance" value={`₹${Number(sessionUser.balance || 0).toLocaleString()}`} />
          <StatCard icon={<Calendar size={18} />} label="Total Bookings" value={`${bookings.length}`} />
          <StatCard icon={<CreditCard size={18} />} label="Active Bookings" value={`${activeBookings}`} />
          <StatCard icon={<User size={18} />} label="Total Booking Spend" value={`₹${totalSpent.toLocaleString()}`} />
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          <button onClick={() => navigate("/sports")} style={actionBtnStyle}>Book Slot</button>
          <button onClick={() => navigate("/my-bookings")} style={actionBtnStyle}>My Bookings</button>
          <button onClick={() => navigate("/profile")} style={actionBtnStyle}>Profile</button>
        </div>

        <div style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Account Snapshot</h3>
          <p style={{ margin: "0 0 6px", color: "#334155" }}>Card UID: {sessionUser.cardUid || "-"}</p>
          <p style={{ margin: "0 0 6px", color: "#334155" }}>Current Balance: ₹{Number(profile?.currentBalance ?? sessionUser.balance ?? 0).toLocaleString()}</p>
          <p style={{ margin: 0, color: "#334155" }}>Last Visit: {profile?.lastVisit ? new Date(profile.lastVisit).toLocaleString() : "-"}</p>
        </div>

        <div style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Recent Bookings (Live)</h3>
          {recentBookings.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>No bookings found.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Sport</th>
                    <th style={thStyle}>Slot</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      {/** Fall back to ids only when lookup data isn't available */}
                      {(() => {
                        const sport = sportsById[booking.sportId];
                        const slot = slotById[booking.slotId];
                        const sportLabel = sport ? `${sport.name}${sport.courtName ? ` (${sport.courtName})` : ""}` : `#${booking.sportId}`;
                        const slotLabel = slot ? `${slot.slotDate} | ${formatSlotRange(slot.startTime, slot.endTime)}` : `#${booking.slotId}`;
                        return (
                          <>
                      <td style={tdStyle}>{sportLabel}</td>
                      <td style={tdStyle}>{slotLabel}</td>
                      <td style={tdStyle}>₹{Number(booking.amount || 0).toLocaleString()}</td>
                      <td style={tdStyle}>{booking.paymentMode || "-"}</td>
                      <td style={tdStyle}>{booking.status || "-"}</td>
                      <td style={tdStyle}>{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}</td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0f172a", marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 14, color: "#475569" }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

const actionBtnStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "1px solid #e2e8f0",
  padding: "8px 6px",
  color: "#475569",
  fontSize: 13,
};

const tdStyle: CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  padding: "10px 6px",
  color: "#0f172a",
  fontSize: 14,
};
