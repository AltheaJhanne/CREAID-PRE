import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getDashboardStats = (period) => {
  return axios.get(`${API_URL}/dashboard/stats`, {
    params: { period }
  });
};

export const getChartData = (period) => {
  return axios.get(`${API_URL}/dashboard/charts`, {
    params: { period }
  });
};