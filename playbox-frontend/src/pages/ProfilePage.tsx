import { ArrowLeft, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { PlayBoxUser } from "../types";
import { api } from "../utils/api";
import { getPlayer } from "../utils/playerAuth";

export default function ProfilePage() {
  const navigate = useNavigate();
  const player = getPlayer();

  const [user, setUser] = useState<PlayBoxUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!player?.phone) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const freshUser = await api.searchByPhone(player.phone);
        setUser(freshUser);
        setName(freshUser.name || "");
        setEmail(freshUser.email || "");
        localStorage.setItem("player", JSON.stringify(freshUser));
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [player?.phone]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updated = await api.updateUserProfile({
        id: user.id,
        name: name.trim(),
        email: email.trim() || undefined,
      });

      setUser(updated);
      setName(updated.name || "");
      setEmail(updated.email || "");

      const currentPlayer = getPlayer();
      if (currentPlayer) {
        localStorage.setItem(
          "player",
          JSON.stringify({ ...currentPlayer, name: updated.name, email: updated.email })
        );
      }

      toast.success("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!player) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc" }}>
        <p style={{ color: "#334155", fontWeight: 600 }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 20 }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button
            onClick={() => navigate("/player-dashboard")}
            style={{
              border: "1px solid #cbd5e1",
              background: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <User size={20} color="#0f172a" />
            <h2 style={{ margin: 0, color: "#0f172a" }}>My Profile</h2>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                value={user?.phone || player.phone || ""}
                disabled
                style={{ ...inputStyle, background: "#f1f5f9", color: "#64748b", cursor: "not-allowed" }}
              />
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
                Phone number cannot be changed.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Add or update your email"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={saving}
              style={{
                marginTop: 4,
                border: "none",
                background: "#0f172a",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 14px",
                cursor: saving ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              <Save size={16} /> {saving ? "Saving..." : "Update Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#334155",
  fontSize: 14,
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  color: "#0f172a",
};
