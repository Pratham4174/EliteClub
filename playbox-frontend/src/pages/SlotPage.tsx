import { api } from "@/utils/api";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { PlayBoxUser } from "../types";
import { getPlayer } from "../utils/playerAuth";
import { formatSlotRange, isPresentOrFutureSlot } from "../utils/formatters";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  booked: boolean;
}

function formatSelectedDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SlotPage() {
  const { sportId } = useParams();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [sportName, setSportName] = useState<string>("Sport");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [playerData, setPlayerData] = useState<PlayBoxUser | null>(null);
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const player = getPlayer();
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!player?.phone) return;

    api.searchByPhone(player.phone)
      .then((freshUser) => setPlayerData(freshUser))
      .catch(console.error);
  }, [player?.phone]);

  useEffect(() => {
    if (!sportId) return;
  
    api.getSlots(Number(sportId), date)
      .then(setSlots)
      .catch(console.error);
  
  }, [sportId, date]);

  useEffect(() => {
    if (!sportId) return;
    api.getSports()
      .then((sports) => {
        const matched = sports.find((sport) => sport.id === Number(sportId));
        if (matched) {
          setSportName(matched.name);
        }
      })
      .catch(console.error);
  }, [sportId]);
  

  const bookSlot = async (slotId: number) => {
    if (!player?.id) {
      alert("Please login again to continue booking.");
      return;
    }

    const selectedSlot = visibleSlots.find((slot) => slot.id === slotId);
    const slotRange = selectedSlot ? formatSlotRange(selectedSlot.startTime, selectedSlot.endTime) : "N/A";
    const confirmed = window.confirm(
      `Please confirm booking:\nSport: ${sportName}\nDate: ${date}\nSlot: ${slotRange}\nPayment: Elite Card Wallet`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBookingSlotId(slotId);
      await api.bookSlot(
        player.id,
        slotId,
        "WALLET"
      );
  
      alert("Slot booked successfully!");
  
      // Refresh slots after booking
      const updatedSlots = await api.getSlots(
        Number(sportId),
        date
      );
  
      setSlots(updatedSlots);
  
    } catch (error: any) {
      alert(error.message);
    } finally {
      setBookingSlotId(null);
    }
  };

  const visibleSlots = slots.filter((slot) =>
    isPresentOrFutureSlot(date, slot.startTime, slot.endTime)
  );
  const hasEliteCard = Boolean(playerData?.cardUid && playerData.cardUid.trim().length > 0);
  
  
  return (
    <div
      style={{
        padding: 16,
        background: "linear-gradient(180deg, #eff6ff 0%, #f8fafc 38%, #ffffff 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ marginTop: 0, marginBottom: 6, color: "#0f172a" }}>
        Select Slot for {sportName}
      </h2>
      <p style={{ marginTop: 0, color: "#475569", fontSize: 13 }}>
        Today slots are shown by default. You can switch to a future date.
      </p>
      <p
        style={{
          marginTop: 8,
          marginBottom: 16,
          background: "#ecfdf5",
          border: "1px solid #10b981",
          color: "#065f46",
          padding: "10px 12px",
          borderRadius: 8,
          fontSize: 14
        }}
      >
        Please get your Elite Club card at venue and get exclusive benefits.
      </p>

      {!hasEliteCard && (
        <div
          style={{
            marginBottom: 16,
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            color: "#92400e",
            padding: "10px 12px",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Get your Elite Card Now to reserve slots.
        </div>
      )}

      <div
        style={{
          marginBottom: 12,
          padding: "12px",
          borderRadius: 12,
          border: "1px solid #bfdbfe",
          background: "#dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ color: "#1e3a8a", fontWeight: 700 }}>
          Showing slots for: {formatSelectedDate(date)}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCalendarOpen(true);
            setTimeout(() => {
              dateInputRef.current?.showPicker?.();
              dateInputRef.current?.focus();
            }, 0);
          }}
          style={{
            border: "1px solid #2563eb",
            background: "#1d4ed8",
            color: "#ffffff",
            borderRadius: 999,
            padding: "9px 14px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(37, 99, 235, 0.25)",
          }}
        >
          Change Date
        </button>
      </div>

      {isCalendarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setIsCalendarOpen(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #dbeafe",
              boxShadow: "0 14px 40px rgba(15, 23, 42, 0.2)",
              width: "min(360px, 100%)",
              padding: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              Pick Booking Date
            </div>
            <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 13 }}>
              Select a date from today onward.
            </p>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIsCalendarOpen(false);
              }}
              min={new Date().toISOString().slice(0, 10)}
              style={{
                width: "100%",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 15,
                color: "#0f172a",
                background: "#f8fbff",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              style={{
                marginTop: 10,
                width: "100%",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#0f172a",
                borderRadius: 10,
                padding: "9px 10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, marginBottom: 8, color: "#334155", fontWeight: 600 }}>
        Payment Mode: Elite Card Wallet
      </div>

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              border: "1.5px solid #16a34a",
              color: "#15803d",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              background: "#f0fdf4",
            }}
          >
            Green = Available
          </span>
          <span
            style={{
              border: "1.5px solid #dc2626",
              color: "#b91c1c",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 700,
              background: "#fef2f2",
            }}
          >
            Red = Booked
          </span>
        </div>
        {!hasEliteCard && (
          <p style={{ color: "#6b7280" }}>Reservation is disabled until card assignment.</p>
        )}
        {visibleSlots.length === 0 && (
          <p style={{ color: "#6b7280" }}>No present/future slots available for selected date.</p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {visibleSlots.map(slot => (
            <div
              key={slot.id}
              style={{
                padding: 12,
                border: slot.booked ? "2px solid #ef4444" : "2px solid #22c55e",
                borderRadius: 12,
                background: slot.booked ? "#fff5f5" : "#f4fff6",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
                  {formatSlotRange(slot.startTime, slot.endTime)}
                </div>
                <div style={{ fontSize: 12, color: slot.booked ? "#b91c1c" : "#15803d", fontWeight: 700 }}>
                  {slot.booked ? "Booked" : "Available"}
                </div>
              </div>
              {slot.booked ? (
                <span style={{ color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>
                  Not Available
                </span>
              ) : (
                <button
                  style={{
                    border: "none",
                    background: "#16a34a",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  disabled={bookingSlotId === slot.id || !hasEliteCard}
                  onClick={() => bookSlot(slot.id)}
                >
                  {bookingSlotId === slot.id ? "Booking..." : "Book This Slot"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
