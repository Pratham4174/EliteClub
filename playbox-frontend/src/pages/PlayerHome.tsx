import { Calendar, CreditCard, LogOut, Menu, User, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../utils/api";
import { formatSlotRange, isPresentOrFutureSlot } from "../utils/formatters";
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

type FooterInfoKey = "terms" | "privacy" | "cancellation" | "support";

const FOOTER_MODAL_CONTENT: Record<FooterInfoKey, { title: string; lines: string[] }> = {
  terms: {
    title: "Terms of Use",
    lines: [
      "Booking is confirmed only after successful wallet/card deduction.",
      "Slots are allocated first-come-first-serve based on live availability.",
      "Late arrival or no-show may be treated as consumed booking as per venue rules.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lines: [
      "Your phone number is used for OTP login, booking alerts, and transaction notifications.",
      "Card and booking data are linked to your registered account for service operations.",
      "By using the platform, you agree to receive operational SMS and policy updates.",
    ],
  },
  cancellation: {
    title: "Cancellation Policy",
    lines: [
      "Cancellation and reschedule eligibility is controlled by venue administration.",
      "Refund decisions are based on club policy and booking timing rules.",
      "Contact admin support for slot change or exceptional booking issues.",
    ],
  },
  support: {
    title: "Support",
    lines: [
      "Elite Club Support: +91-99999-99999",
      "For card assignment/blocking or account help, contact admin desk.",
      "Support hours and response time may vary by venue operations.",
    ],
  },
};

const OFFERS = [
  "Recharge for 3000 and get 3500 in EliteCard wallet.",
  "Recharge for 5000 and get 6000 in EliteCard wallet.",
  "Recharge for 10000 and get 12000 in EliteCard wallet.",
];

export default function PlayerHome() {
  const navigate = useNavigate();
  const accountCardRef = useRef<HTMLDivElement | null>(null);
  const [offerIndex, setOfferIndex] = useState(0);
  const [sessionUser, setSessionUser] = useState<PlayerSession | null>(null);
  const [profile, setProfile] = useState<UserDetails | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportsById, setSportsById] = useState<Record<number, Sport>>({});
  const [slotById, setSlotById] = useState<Record<number, SlotDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [footerModal, setFooterModal] = useState<FooterInfoKey | null>(null);

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
        setSports(Array.isArray(sportsData) ? sportsData : []);

        const sportsMap: Record<number, Sport> = {};
        (Array.isArray(sportsData) ? sportsData : []).forEach((sport) => {
          sportsMap[sport.id] = sport;
        });
        setSportsById(sportsMap);

        // Fetch slot details for all bookings so active booking count stays accurate.
        const bookingSlotIds = Array.from(
          new Set(
            [...normalizedBookings]
              .map((booking) => booking.slotId)
              .filter((id) => typeof id === "number")
          )
        );
        const slotDetails = await Promise.all(
          bookingSlotIds.map(async (slotId) => {
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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOfferIndex((prev) => (prev + 1) % OFFERS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  const activeBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (booking.status !== "CONFIRMED") return false;
        const slot = slotById[booking.slotId];
        if (!slot) return false;
        return isPresentOrFutureSlot(slot.slotDate, slot.startTime, slot.endTime);
      }).length,
    [bookings, slotById]
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

  const openProfile = () => {
    setIsSidebarOpen(false);
    navigate("/profile");
  };

  const openBookings = () => {
    setIsSidebarOpen(false);
    navigate("/my-bookings");
  };

  const openCardDetails = () => {
    setIsSidebarOpen(false);
    accountCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <p style={{ color: "#0f172a", fontWeight: 600 }}>Loading player data...</p>
      </div>
    );
  }

  if (!sessionUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", padding: "82px 20px 96px" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            height: 62,
            padding: "0 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, color: "#0f172a", letterSpacing: 0.6 }}>ELITECLUB</div>
          <div style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>
            {sessionUser.name}
          </div>
        </div>
      </nav>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>
              Hey {sessionUser.name}
            </h1>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              {sessionUser.name} ({sessionUser.phone})
            </p>
          </div>
          {isMobile ? (
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                border: "1px solid #3f3f46",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Menu size={16} /> Menu
            </button>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                border: "1px solid #3f3f46",
                background: "#ffffff",
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
          )}
        </div>

        {isMobile && isSidebarOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1200,
              background: "rgba(15, 23, 42, 0.42)",
            }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <aside
              style={{
                width: 280,
                maxWidth: "85vw",
                height: "100%",
                background: "#ffffff",
                borderRight: "1px solid #e2e8f0",
                padding: 16,
                color: "#0f172a",
                boxShadow: "8px 0 24px rgba(15, 23, 42, 0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontWeight: 800, letterSpacing: 0.7 }}>ELITECLUB</div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#0f172a",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={openProfile} style={mobileMenuBtnStyle}>Profile</button>
                <button onClick={openBookings} style={mobileMenuBtnStyle}>Bookings</button>
                <button onClick={openCardDetails} style={mobileMenuBtnStyle}>Card Details</button>
                <button
                  onClick={handleLogout}
                  style={{
                    ...mobileMenuBtnStyle,
                    border: "1px solid #7f1d1d",
                    background: "#3f0d0d",
                    color: "#fecaca",
                  }}
                >
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, background: "#2a0e0e", border: "1px solid #7f1d1d", color: "#fecaca", padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            background: "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1f2937 100%)",
            border: "1px solid #334155",
            borderRadius: 14,
            padding: 16,
            color: "#ffffff",
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.2)",
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: 0.7, color: "#cbd5e1", marginBottom: 8, fontWeight: 700 }}>
            ELITECLUB OFFERS
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.35, minHeight: 60 }}>
            {OFFERS[offerIndex]}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {OFFERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOfferIndex(idx)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: idx === offerIndex ? "#ffffff" : "rgba(255,255,255,0.35)",
                }}
                aria-label={`Show offer ${idx + 1}`}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid rgba(148, 163, 184, 0.3)",
              paddingTop: 10,
              color: "#e2e8f0",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            For now only offline recharge. Contact the Manager for recharge: <span style={{ color: "#ffffff" }}>9094000015</span>
          </div>
        </div>

        <div
          ref={accountCardRef}
          style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}
        >
          <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Account Snapshot</h3>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              color: "#ffffff",
              background: "linear-gradient(145deg, #060606 0%, #101010 45%, #1a1a1a 100%)",
              border: "1px solid #7a7a7a",
              boxShadow: "0 12px 26px rgba(0, 0, 0, 0.35)",
              minHeight: 180,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.2, color: "#d4d4d8" }}>ELITECLUB</div>
              <div
                style={{
                  border: "1px solid #a3a3a3",
                  background: "linear-gradient(135deg, #4b5563 0%, #9ca3af 100%)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0a0a0a",
                }}
              >
                MEMBER
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: "#a3a3a3", marginBottom: 4, letterSpacing: 0.8 }}>
                CARD NUMBER
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.4, color: "#e5e7eb" }}>
                {sessionUser.cardUid || "Not Assigned"}
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "end", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#a3a3a3", marginBottom: 4, letterSpacing: 0.8 }}>
                  BALANCE
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#f5f5f5" }}>
                  ₹{Number(profile?.currentBalance ?? sessionUser.balance ?? 0).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#d4d4d8", textAlign: "right" }}>
                Last Visit: {profile?.lastVisit ? new Date(profile.lastVisit).toLocaleString() : "-"}
              </div>
            </div>
          </div>
        </div>

        {!sessionUser.cardUid && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#9f1239",
              borderRadius: 12,
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Get your card offline at Venue.
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
          <button onClick={() => navigate("/my-bookings")} style={actionBtnStyle}>My Bookings</button>
          <button onClick={() => navigate("/profile")} style={actionBtnStyle}>Profile</button>
        </div>

        <div style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}>
          <h3 style={{ margin: "0 0 10px", color: "#0f172a" }}>Available Sports</h3>
          <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: 13 }}>
            Tap a sport to book instantly.
          </p>
          {sports.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>No sports available right now.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              {sports
                .filter((sport) => sport.active !== false)
                .map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => navigate(`/book-slot/${sport.id}`)}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 10,
                      padding: "12px",
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,1)",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                      {sport.name}
                    </div>
                    <div style={{ color: "#475569", fontSize: 13, marginBottom: 3 }}>
                      {sport.courtName}
                    </div>
                    <div style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 13 }}>
                      ₹{Number(sport.pricePerHour || 0).toLocaleString()} / hour
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}>
          <h3 style={{ margin: "0 0 12px", color: "#0f172a" }}>Recent Bookings (Live)</h3>
          {recentBookings.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>No bookings found.</p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {recentBookings.map((booking) => {
                const sport = sportsById[booking.sportId];
                const slot = slotById[booking.slotId];
                const sportLabel = sport ? `${sport.name}${sport.courtName ? ` (${sport.courtName})` : ""}` : `#${booking.sportId}`;
                const slotLabel = slot ? `${slot.slotDate} | ${formatSlotRange(slot.startTime, slot.endTime)}` : `#${booking.slotId}`;
                const isConfirmed = booking.status === "CONFIRMED";

                return (
                  <div
                    key={booking.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 12,
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{sportLabel}</div>
                      <span
                        style={{
                          border: isConfirmed ? "1px solid #86efac" : "1px solid #fecaca",
                          background: isConfirmed ? "#ecfdf5" : "#fef2f2",
                          color: isConfirmed ? "#166534" : "#991b1b",
                          borderRadius: 999,
                          padding: "3px 9px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {booking.status || "-"}
                      </span>
                    </div>

                    <div style={{ color: "#334155", fontSize: 13, marginBottom: 8 }}>
                      {slotLabel}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      }}
                    >
                      <div style={bookingMetaStyle}>
                        <div style={bookingMetaLabelStyle}>Amount</div>
                        <div style={bookingMetaValueStyle}>₹{Number(booking.amount || 0).toLocaleString()}</div>
                      </div>
                      <div style={bookingMetaStyle}>
                        <div style={bookingMetaLabelStyle}>Payment</div>
                        <div style={bookingMetaValueStyle}>{booking.paymentMode || "-"}</div>
                      </div>
                      <div style={bookingMetaStyle}>
                        <div style={bookingMetaLabelStyle}>Created</div>
                        <div style={bookingMetaValueStyle}>
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer
          style={{
            marginTop: 16,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: 12,
            color: "#0f172a",
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", letterSpacing: 0.6 }}>ELITECLUB</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setFooterModal("terms")} style={footerItemStyle}>Terms</button>
              <button type="button" onClick={() => setFooterModal("privacy")} style={footerItemStyle}>Privacy</button>
              <button type="button" onClick={() => setFooterModal("cancellation")} style={footerItemStyle}>Cancellation</button>
              <button type="button" onClick={() => setFooterModal("support")} style={footerItemStyle}>Support</button>
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #e2e8f0",
              fontSize: 11,
              color: "#64748b",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>© {new Date().getFullYear()} ELITECLUB. All rights reserved.</span>
            <span>Use of this app indicates acceptance of terms and club policies.</span>
          </div>
        </footer>

      </div>

      {footerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 1300,
            padding: 16,
          }}
          onClick={() => setFooterModal(null)}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
              padding: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>{FOOTER_MODAL_CONTENT[footerModal].title}</h3>
              <button
                type="button"
                onClick={() => setFooterModal(null)}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Close
              </button>
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {FOOTER_MODAL_CONTENT[footerModal].lines.map((line) => (
                <div
                  key={line}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    background: "#f8fafc",
                    padding: "9px 10px",
                    color: "#334155",
                    fontSize: 14,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 10,
          width: "min(520px, calc(100% - 20px))",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
          padding: "8px 10px",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          zIndex: 1100,
        }}
      >
        <button onClick={openProfile} style={bottomNavBtnStyle}>
          <User size={16} />
          <span>Profile</span>
        </button>
        <button onClick={openBookings} style={bottomNavBtnStyle}>
          <Calendar size={16} />
          <span>Bookings</span>
        </button>
        <button onClick={openCardDetails} style={bottomNavBtnStyle}>
          <CreditCard size={16} />
          <span>Card</span>
        </button>
        <button onClick={handleLogout} style={bottomNavBtnStyle}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 14,
        boxShadow: "0 8px 18px rgba(15, 23, 42, 0.08)",
      }}
    >
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
  borderRadius: 12,
  padding: "12px 14px",
  cursor: "pointer",
  fontWeight: 700,
  boxShadow: "0 8px 16px rgba(15, 23, 42, 0.08)",
};

const mobileMenuBtnStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "11px 12px",
  textAlign: "left",
  fontWeight: 700,
  cursor: "pointer",
};

const bookingMetaStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#ffffff",
  padding: "8px 10px",
};

const bookingMetaLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 2,
};

const bookingMetaValueStyle: CSSProperties = {
  fontSize: 13,
  color: "#0f172a",
  fontWeight: 700,
};

const bottomNavBtnStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#0f172a",
  borderRadius: 10,
  padding: "8px 4px",
  display: "grid",
  placeItems: "center",
  gap: 4,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const footerItemStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 999,
  background: "#f8fafc",
  color: "#334155",
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
