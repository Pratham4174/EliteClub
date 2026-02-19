import { Eye, EyeOff, Gamepad2, Loader2, Shield, Smartphone, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../css/login.css";
import { api } from "../utils/api";

type LoginMode = "ADMIN" | "PLAYER";

interface LoginProps {
  adminEnabled?: boolean;
  defaultMode?: LoginMode;
}

export default function Login({
  adminEnabled = true,
  defaultMode = "ADMIN",
}: LoginProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>(defaultMode);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const adminData = await api.login(username, password);
      // Ensure a pure admin session
      localStorage.removeItem("player");
      localStorage.removeItem("isPlayerLoggedIn");
      localStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.setItem("isAdminLoggedIn", "true");
      toast.success("Admin login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      const errorMsg = err.message || "Invalid credentials";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone.trim() || !phoneRegex.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Check first to decide whether name field is needed
      try {
        await api.searchByPhone(phone);
        setIsExistingUser(true);
      } catch {
        setIsExistingUser(false);
      }

      const loadingToast = toast.loading("Sending OTP...");
      await api.sendOtp(phone);
      toast.success("OTP sent successfully!", {
        id: loadingToast,
        description: `OTP has been sent to ${phone}`,
        duration: 3000,
      });
      setOtpStep(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }

    const existingUser = isExistingUser === true;
    if (!existingUser && !name.trim()) {
      toast.error("Name is required for new user signup");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await api.verifyOtp(phone, otp, name);
      // Ensure a pure player session
      localStorage.removeItem("admin");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.setItem("player", JSON.stringify(user));
      localStorage.setItem("isPlayerLoggedIn", "true");
      toast.success("Login successful!");
      navigate("/player-dashboard");
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
      toast.error(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="flex items-center justify-center gap-3">
            <Gamepad2 size={48} />
            <Shield size={24} className="text-blue-300" />
            <Smartphone size={24} className="text-purple-300" />
          </div>
          <h1> Elite Club</h1>
          <p className="text-gray-300 mt-2">Book your favorite sports venues</p>
        </div>

        {/* Toggle */}
        {adminEnabled && (
          <div className="login-toggle">
            <button 
              className={`toggle-btn ${mode === "ADMIN" ? "active" : ""}`}
              onClick={() => setMode("ADMIN")}
            >
              <UserCog size={18} />
              Admin Login
            </button>
            <button 
              className={`toggle-btn ${mode === "PLAYER" ? "active" : ""}`}
              onClick={() => setMode("PLAYER")}
            >
              <Users size={18} />
              Player Login
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="login-error">
            <div className="flex items-center gap-2">
              <Shield size={16} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ADMIN FORM */}
        {adminEnabled && mode === "ADMIN" && (
          <form onSubmit={handleAdminLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <UserCog size={16} />
                Username
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Shield size={16} />
                Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%" }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="loading-spinner mr-2" />
                  Logging in...
                </>
              ) : (
                "Login as Admin"
              )}
            </button>
          </form>
        )}

        {/* PLAYER FORM */}
        {(mode === "PLAYER" || !adminEnabled) && (
          <div className="login-form">
            {!otpStep ? (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <Smartphone size={16} />
                    Phone Number
                  </label>
                  <div className="phone-input-group">
                    <div className="country-code">
                      +91
                    </div>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Enter your 10-digit mobile number
                  </p>
                </div>

                <button 
                  onClick={handleSendOtp}
                  className="login-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="loading-spinner mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">
                    <Shield size={16} />
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    className="form-input otp-input"
                    placeholder="1234"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-400 mt-1 text-center">
                    OTP sent to +91 {phone} (Valid for 5 minutes)
                  </p>
                </div>

                {isExistingUser === false && (
                  <div className="form-group">
                    <label className="form-label">
                      <Users size={16} />
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Required for new users
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setOtpStep(false);
                      setIsExistingUser(null);
                    }}
                    className="login-btn"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      color: "rgba(255, 255, 255, 0.8)"
                    }}
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleVerifyOtp}
                    className="login-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="loading-spinner mr-2" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Login"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Demo Credentials */}
        <div className="demo-section">
          <div className="demo-title">Demo Credentials</div>
          <div className="demo-grid">
            {adminEnabled && (
              <div className="demo-card">
                <div className="demo-role">Admin</div>
                <div className="demo-info">
                  <div>Username: admin</div>
                  <div>Password: admin123</div>
                </div>
              </div>
            )}
            <div className="demo-card">
              <div className="demo-role">Player</div>
              <div className="demo-info">
                <div>Phone: 9876543210</div>
                <div>OTP: 1234</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <div className="footer-links">
            By continuing, you agree to our{" "}
            <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>
          </div>
          <div className="support-link">
            Need help? <a href="#">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
