import { useEffect, useState } from "react";
import { getPlayer } from "../utils/playerAuth";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const player = getPlayer();
    fetch(`http://localhost:8080/playbox/api/users/${player.id}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  const updateProfile = async () => {
    await fetch(
      "http://localhost:8080/playbox/api/users/update",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      }
    );
    alert("Profile Updated");
  };

  if (!user) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2>My Profile</h2>

      <input
        value={user.name}
        onChange={(e) =>
          setUser({ ...user, name: e.target.value })
        }
      />

      <input value={user.phone} disabled />

      <input
        value={user.email || ""}
        onChange={(e) =>
          setUser({ ...user, email: e.target.value })
        }
      />

      <button onClick={updateProfile}>Update</button>
    </div>
  );
}
