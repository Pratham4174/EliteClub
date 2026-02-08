import { useEffect, useState } from "react";
import { getPlayer } from "../utils/playerAuth";

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const player = getPlayer();

  useEffect(() => {
    fetch(
      `http://localhost:8080/playbox/api/bookings/user/${player.id}`
    )
      .then(res => res.json())
      .then(data => setBookings(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>My Bookings</h2>

      {bookings.map(b => (
        <div key={b.id}>
          Sport ID: {b.sportId} | Slot: {b.slotId} |
          Status: {b.status}
        </div>
      ))}
    </div>
  );
}
