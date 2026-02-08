import { useEffect, useState } from "react";
import { getPlayer } from "../utils/playerAuth";

export default function MyTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const player = getPlayer();

  useEffect(() => {
    fetch(
      `http://localhost:8080/playbox/api/transactions/user/${player.id}`
    )
      .then(res => res.json())
      .then(data => setTransactions(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>My Transactions</h2>

      {transactions.map(txn => (
        <div key={txn.id}>
          {txn.type} - ₹{txn.amount} - {txn.timestamp}
        </div>
      ))}
    </div>
  );
}
