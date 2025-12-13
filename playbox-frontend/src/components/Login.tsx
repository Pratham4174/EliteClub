import { Eye, EyeOff, Gamepad2, LogIn } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";
import { api } from "../utils/api"; // Import the API

interface LoginProps {
  onLogin: (isLoggedIn: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use the API function instead of direct fetch
      const adminData = await api.login(username, password);
      
      // Store admin data in localStorage
      localStorage.setItem("admin", JSON.stringify(adminData));
      localStorage.setItem("isAdminLoggedIn", "true");
      
      // Call parent callback
      onLogin(true);
      
      // Navigate to main app
      navigate("/dashboard");
      
    } catch (err: any) {
      setError(err.message || "Invalid username or password");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'STAFF' | 'MANAGER' | 'OWNER') => {
    // Demo credentials for testing
    const demoCredentials = {
      STAFF: { username: "staff", password: "staff123" },
      MANAGER: { username: "manager", password: "manager123" },
      OWNER: { username: "admin", password: "admin123" }
    };
    
    setUsername(demoCredentials[role].username);
    setPassword(demoCredentials[role].password);
    setError(`Demo ${role.toLowerCase()} credentials loaded. Click Login to continue.`);
  };

  return (
    <div className="login-container">
      {/* Background Animation */}
      <div className="login-bg-animation"></div>
      
      {/* Main Login Card */}
      <div className="login-card">
        {/* Logo Header */}
        <div className="login-header">
          <div className="login-logo">
            <Gamepad2 size={48} />
          </div>
          <h1 className="login-title">🎮 PlayBox Arena</h1>
          <p className="login-subtitle">Admin Dashboard Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="input-group">
            <label className="input-label">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="login-input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="button" className="forgot-password">
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Login Buttons */}
        <div className="demo-section">
          <p className="demo-label">Quick Demo Access</p>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleDemoLogin('STAFF')}
              className="demo-btn staff"
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('MANAGER')}
              className="demo-btn manager"
            >
              Manager Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('OWNER')}
              className="demo-btn owner"
            >
              Owner Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-text">
            © {new Date().getFullYear()} PlayBox Sports Arena. All rights reserved.
          </p>
          <p className="footer-hint">
            Ensure you have proper authorization to access this dashboard
          </p>
        </div>
      </div>
    </div>
  );
}