export const isAdminLoggedIn = () => {
    return localStorage.getItem("isAdminLoggedIn") === "true";
  };
  
  export const getAdmin = () => {
    const admin = localStorage.getItem("admin");
    return admin ? JSON.parse(admin) : null;
  };
  
  export const logout = (): void => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("admin");
    // Optional: Clear all localStorage for the app
    // localStorage.clear();
    // Redirect to login page
    window.location.href = "/login";
  };