export const isPlayerLoggedIn = (): boolean => {
    return localStorage.getItem("isPlayerLoggedIn") === "true";
  };
  
  export const getPlayer = () => {
    const data = localStorage.getItem("player");
    return data ? JSON.parse(data) : null;
  };
  
  export const playerLogout = () => {
    localStorage.removeItem("player");
    localStorage.removeItem("isPlayerLoggedIn");
  };
  