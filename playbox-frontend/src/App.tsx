import { useState } from "react";

const BACKEND_URL = "http://localhost:8080";

interface ScanResponse {
  status: "NEW_CARD" | "EXISTING_USER";
  name?: string;
  balance?: number;
}

interface PlayBoxUser {
  id: number;
  name: string;
  cardUid: string;
  balance: number;
}

export default function App() {
  const [cardUid, setCardUid] = useState("");
  const [activeUid, setActiveUid] = useState("");

  const [name, setName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState("Waiting for RFID scan…");

  const [amount, setAmount] = useState<number>(500);

  // ✅ Create user states
  const [isNewUser, setIsNewUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // ✅ Transaction loading
  const [isTxnLoading, setIsTxnLoading] = useState(false);

  /* ---------- RFID Scan ---------- */
  const handleScan = async (uid: string) => {
    if (!uid.trim()) return;

    setStatus("Scanning card…");

    try {
      const res = await fetch(`${BACKEND_URL}/api/rfid/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardUid: uid }),
      });

      const data: ScanResponse = await res.json();
      setActiveUid(uid);

      if (data.status === "NEW_CARD") {
        setName(null);
        setBalance(null);
        setIsNewUser(true);
        setStatus("New RFID detected. Create user profile.");
      } else {
        setName(data.name || "");
        setBalance(data.balance ?? 0);
        setIsNewUser(false);
        setStatus("User found ✅");
      }
    } catch {
      setStatus("Backend connection error ❌");
    } finally {
      setCardUid("");
    }
  };

  /* ---------- CREATE USER ---------- */
  const createUser = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setStatus("Name & phone are required ❌");
      return;
    }

    setStatus("Creating user…");

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardUid: activeUid,
          name: newName,
          phone: newPhone,
          email: newEmail || null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setStatus(msg || "User creation failed ❌");
        return;
      }

      const user: PlayBoxUser = await res.json();
      setName(user.name);
      setBalance(user.balance);
      setIsNewUser(false);

      setNewName("");
      setNewPhone("");
      setNewEmail("");

      setStatus("User created successfully ✅");
    } catch {
      setStatus("Backend error while creating user ❌");
    }
  };

  /* ---------- ADD BALANCE ---------- */
  const addAmount = async () => {
    if (amount < 500) {
      setStatus("Minimum add amount is ₹500 ❌");
      return;
    }

    setIsTxnLoading(true);
    setStatus("Adding amount…");

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/add?cardUid=${activeUid}&amount=${amount}`,
        { method: "POST" }
      );

      const user: PlayBoxUser = await res.json();
      setBalance(user.balance);
      setStatus("Amount added ✅");
    } catch {
      setStatus("Failed to add balance ❌");
    } finally {
      setIsTxnLoading(false);
    }
  };

  /* ---------- DEDUCT BALANCE ---------- */
  const deductAmount = async () => {
    if (amount <= 0) {
      setStatus("Enter a valid amount ❌");
      return;
    }

    setIsTxnLoading(true);
    setStatus("Deducting amount…");

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/deduct?cardUid=${activeUid}&amount=${amount}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error();

      const user: PlayBoxUser = await res.json();
      setBalance(user.balance);
      setStatus("Amount deducted ✅");
    } catch {
      setStatus("Insufficient balance ❌");
    } finally {
      setIsTxnLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>PlayBox RFID System</h1>

      {/* RFID INPUT */}
      <input
        autoFocus
        placeholder="Tap RFID card"
        value={cardUid}
        onChange={(e) => setCardUid(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleScan(cardUid)}
        style={{ padding: 12, fontSize: 18 }}
      />

      {activeUid && (
        <p>
          <strong>RFID:</strong> {activeUid}
        </p>
      )}

      <p>{status}</p>

      {/* CREATE USER */}
      {isNewUser && (
        <div>
          <h2>Create New User</h2>

          <input value={activeUid} readOnly /><br /><br />

          <input
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          /><br /><br />

          <input
            placeholder="Phone"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          /><br /><br />

          <input
            placeholder="Email (optional)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          /><br /><br />

          <button onClick={createUser}>✅ Create User</button>
        </div>
      )}

      {/* EXISTING USER */}
      {name && !isNewUser && (
        <div style={{ marginTop: 20 }}>
          <h2>{name}</h2>
          <h1>₹ {balance}</h1>

          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ padding: 10, width: 200 }}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={addAmount} disabled={isTxnLoading}>
              {isTxnLoading ? "Adding…" : "➕ Add (₹500 min)"}
            </button>

            <button
              onClick={deductAmount}
              disabled={isTxnLoading}
              style={{ marginLeft: 10 }}
            >
              {isTxnLoading ? "Deducting…" : "➖ Deduct"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
