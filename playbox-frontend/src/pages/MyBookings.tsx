import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import { formatSlotRange } from "../utils/formatters";
import { getPlayer } from "../utils/playerAuth";
import type { SlotDetails, Sport } from "../types";

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

function parseTimeTo24HourParts(time: string): { hour: number; minute: number } | null {
  const raw = String(time || "").trim();
  if (!raw) return null;

  // Supports: "17:00", "17:00:00", "05:00 PM", "5:00 pm"
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!match) return null;

  let hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === "AM" && hour === 12) hour = 0;
    if (meridiem === "PM" && hour !== 12) hour += 12;
  } else if (hour < 0 || hour > 23) {
    return null;
  }

  return { hour, minute };
}

export default function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sportsById, setSportsById] = useState<Record<number, Sport>>({});
  const [slotById, setSlotById] = useState<Record<number, SlotDetails>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const player = getPlayer();

  useEffect(() => {
    const loadBookings = async () => {
      if (!player?.id) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const [bookingsData, sportsData] = await Promise.all([
          api.getUserBookings(player.id),
          api.getSports(),
        ]);

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

        const slots = await Promise.all(
          uniqueSlotIds.map(async (slotId) => {
            try {
              return await api.getSlotById(slotId);
            } catch {
              return null;
            }
          })
        );

        const slotMap: Record<number, SlotDetails> = {};
        slots.forEach((slot) => {
          if (slot) {
            slotMap[slot.id] = slot;
          }
        });
        setSlotById(slotMap);
      } catch (err: any) {
        setError(err.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [player?.id]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => b.id - a.id),
    [bookings]
  );

  const isFutureBooking = (booking: Booking) => {
    const slot = slotById[booking.slotId];
    if (!slot?.slotDate || !slot?.endTime) return false;

    const normalizedDate = (slot.slotDate.includes("T") ? slot.slotDate.split("T")[0] : slot.slotDate).trim();
    const dateMatch = normalizedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return false;

    const endTimeParts = parseTimeTo24HourParts(slot.endTime);
    if (!endTimeParts) return false;

    const year = Number.parseInt(dateMatch[1], 10);
    const monthIndex = Number.parseInt(dateMatch[2], 10) - 1;
    const day = Number.parseInt(dateMatch[3], 10);
    const slotEnd = new Date(year, monthIndex, day, endTimeParts.hour, endTimeParts.minute, 0, 0);

    return slotEnd.getTime() > Date.now();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <p style={{ color: "#334155", fontWeight: 600 }}>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => navigate("/player-dashboard")}
          style={{
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            borderRadius: 8,
            padding: "8px 12px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 10,
          }}
        >
          Back
        </button>
        <h2 style={{ marginTop: 0, marginBottom: 12, color: "#0f172a" }}>My Bookings</h2>

        {error && (
          <div style={{ marginBottom: 12, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: 10 }}>
            {error}
          </div>
        )}

        {sortedBookings.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, color: "#64748b" }}>
            No bookings found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sortedBookings.map((booking) => {
              const sport = sportsById[booking.sportId];
              const slot = slotById[booking.slotId];
              const isFuture = isFutureBooking(booking);

              return (
                <div
                  key={booking.id}
                  style={{
                    background: isFuture ? "#ecfdf5" : "#ffffff",
                    border: isFuture ? "1px solid #10b981" : "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    opacity: isFuture ? 1 : 0.55,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {sport ? `${sport.name} (${sport.courtName})` : `Sport #${booking.sportId}`}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isFuture ? "#047857" : "#64748b" }}>
                      {isFuture ? "UPCOMING" : "PAST"}
                    </div>
                  </div>

                  <div style={{ marginTop: 6, color: "#334155", fontSize: 14 }}>
                    Slot: {slot ? `${slot.slotDate} | ${formatSlotRange(slot.startTime, slot.endTime)}` : `#${booking.slotId}`}
                  </div>

                  <div style={{ marginTop: 4, color: "#334155", fontSize: 14 }}>
                    Amount: ₹{Number(booking.amount || 0).toLocaleString()} | Payment: {booking.paymentMode || "-"} | Status: {booking.status || "-"}
                  </div>

                  <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                    Booked on: {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
