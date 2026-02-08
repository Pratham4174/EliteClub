import { Eye, EyeOff, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import { api } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"ADMIN" | "PLAYER">("ADMIN");

  // Admin states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Player states
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [otpStep, setOtpStep] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // ADMIN LOGIN
  // =========================
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const adminData = await api.login(username, password);

      localStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.setItem("isAdminLoggedIn", "true");

      navigate("/dashboard"); // ✅ no reload
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PLAYER SEND OTP
  // =========================
  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError("Enter phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.sendOtp(phone);
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PLAYER VERIFY OTP
  // =========================
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Enter OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await api.verifyOtp(phone, otp, name);

      localStorage.setItem("player", JSON.stringify(user));
      localStorage.setItem("isPlayerLoggedIn", "true");

      navigate("/player-dashboard"); // ✅ no reload
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Gamepad2 size={48} />
          <h1>🎮 PlayBox Arena</h1>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setMode("ADMIN")}>
            Admin Login
          </button>
          <button onClick={() => setMode("PLAYER")}>
            Player Login
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {/* ADMIN FORM */}
        {mode === "ADMIN" && (
          <form onSubmit={handleAdminLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* PLAYER FORM */}
        {mode === "PLAYER" && (
          <div>
            {!otpStep ? (
              <>
                <input
                  type="text"
                  placeholder="Enter Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button onClick={handleSendOtp}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Enter Name (if new)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <button onClick={handleVerifyOtp}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
