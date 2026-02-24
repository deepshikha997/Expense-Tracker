import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL || "/api/expenses").replace(/\/+$/, "");

const API = axios.create({
  baseURL,
  timeout: 10000,
});

export default API;
