import Cookies from "js-cookie";

export const API_URL = "https://dpdzero-9naj.onrender.com";

export const setTokenCookie = (token, remember = false) => {
  Cookies.set("token", token, remember ? { expires: 3600 } : undefined);
};

export const getTokenCookie = () => {
  return Cookies.get("token");
};

export const removeTokenCookie = () => {
  Cookies.remove("token");
};
