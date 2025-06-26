import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user");;
      return raw ? JSON.parse(raw) : null;
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!(localStorage.getItem("token") || sessionStorage.getItem("token")));

    useEffect(() => {
      if (user) {
        const dest = rememberMe ? localStorage : sessionStorage;
        dest.setItem("user", JSON.stringify(user));
        (rememberMe ? sessionStorage : localStorage).removeItem("user");
      }
    }, [user, rememberMe]);

    useEffect(() => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsAuthenticated(!!token);
    }, []);
  
    const login = (userData, remember = false) => {
      setRememberMe(remember);
      setUser(userData);
      setIsAuthenticated(true);
    };

    const logout = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    };
  
    return (
      <UserContext.Provider value={{ user, login, logout, isAuthenticated, setIsAuthenticated }}>
        {children}
      </UserContext.Provider>
    );
  };
  
