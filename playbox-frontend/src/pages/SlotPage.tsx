import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlayer } from "../utils/playerAuth";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export default function SlotPage() {
  const { sportId } = useParams();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [date, setDate] = useState("2026-02-08");
  const player = getPlayer();

  useEffect(() => {
    if (!sportId) return;
  
    api.getSlots(Number(sportId), date)
      .then(setSlots)
      .catch(console.error);
  
  }, [sportId, date]);
  

  const bookSlot = async (slotId: number) => {
    try {
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
    }
  };
  
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Select Slot</h2>

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div style={{ marginTop: 20 }}>
        {slots.map(slot => (
          <div
            key={slot.id}
            style={{
              padding: 10,
              marginBottom: 10,
              border: "1px solid #ccc",
              borderRadius: 6
            }}
          >
            {slot.startTime} - {slot.endTime}
            {slot.booked ? (
              <span style={{ color: "red", marginLeft: 10 }}>
                Booked
              </span>
            ) : (
              <button
                style={{ marginLeft: 20 }}
                onClick={() => bookSlot(slot.id)}
              >
                Book
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
