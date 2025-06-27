import React, { createContext, useState, useEffect } from "react";
import { setTokenCookie, getTokenCookie, removeTokenCookie } from "../api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user");;
      return raw ? JSON.parse(raw) : null;
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getTokenCookie());

    useEffect(() => {
      if (user) {
        const dest = rememberMe ? localStorage : sessionStorage;
        dest.setItem("user", JSON.stringify(user));
        (rememberMe ? sessionStorage : localStorage).removeItem("user");
      }
    }, [user, rememberMe]);

    useEffect(() => {
      const token = getTokenCookie();
      setIsAuthenticated(!!token);
    }, []);
  
    const login = (userData, remember = false, token = null) => {
      setRememberMe(remember);
      setUser(userData);
      setIsAuthenticated(true);
      if (token) setTokenCookie(token, remember);
    };

    const logout = () => {
      setUser(null);
      setIsAuthenticated(false);
      removeTokenCookie();
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    };
  
    return (
      <UserContext.Provider value={{ user, login, logout, isAuthenticated, setIsAuthenticated }}>
        {children}
      </UserContext.Provider>
    );
  };
  
