import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

interface Sport {
  id: number;
  name: string;
  pricePerHour: number;
}

export default function SportPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSports()
      .then(setSports)
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Select Sport</h2>

      <div style={{ marginTop: 20 }}>
        {sports.map((sport) => (
          <div
            key={sport.id}
            style={{
              padding: 15,
              marginBottom: 15,
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer"
            }}
            onClick={() => navigate(`/book-slot/${sport.id}`)}
          >
            <h3>{sport.name}</h3>
            <p>₹ {sport.pricePerHour} per hour</p>
          </div>
        ))}
      </div>
    </div>
  );
}
