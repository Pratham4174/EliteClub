import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlayer } from "../utils/playerAuth";
import { formatSlotRange, isPresentOrFutureSlot } from "../utils/formatters";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export default function SlotPage() {
  const { sportId } = useParams();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<"WALLET" | "CASH" | "ONLINE">("WALLET");
  const [bookingSlotId, setBookingSlotId] = useState<number | null>(null);
  const player = getPlayer();

  useEffect(() => {
    if (!sportId) return;
  
    api.getSlots(Number(sportId), date)
      .then(setSlots)
      .catch(console.error);
  
  }, [sportId, date]);
  

  const bookSlot = async (slotId: number) => {
    if (!player?.id) {
      alert("Please login again to continue booking.");
      return;
    }

    try {
      setBookingSlotId(slotId);
      await api.bookSlot(
        player.id,
        slotId,
        paymentMode
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
  
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Select Slot</h2>
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

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={new Date().toISOString().slice(0, 10)}
      />

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
          Payment Option
        </label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value as "WALLET" | "CASH" | "ONLINE")}
          style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
        >
          <option value="WALLET">Wallet</option>
          <option value="CASH">Cash (Pay at venue)</option>
          <option value="ONLINE">Online</option>
        </select>
      </div>

      <div style={{ marginTop: 20 }}>
        {visibleSlots.length === 0 && (
          <p style={{ color: "#6b7280" }}>No present/future slots available for selected date.</p>
        )}
        {visibleSlots.map(slot => (
          <div
            key={slot.id}
            style={{
              padding: 10,
              marginBottom: 10,
              border: "1px solid #ccc",
              borderRadius: 6
            }}
          >
            {formatSlotRange(slot.startTime, slot.endTime)}
            {slot.booked ? (
              <span style={{ color: "red", marginLeft: 10 }}>
                Booked
              </span>
            ) : (
              <button
                style={{ marginLeft: 20 }}
                disabled={bookingSlotId === slot.id}
                onClick={() => bookSlot(slot.id)}
              >
                {bookingSlotId === slot.id ? "Booking..." : "Book"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
