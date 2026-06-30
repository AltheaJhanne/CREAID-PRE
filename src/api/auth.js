import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

/* =========================
   LOGIN
========================= */
export const loginApi =
async (
  email,
  password
) => {

  const response =
    await axios.post(
      `${API_URL}/auth/login`,
      {
        email,
        password
      }
    );

  return response.data;
};

/* =========================
   LOGOUT
========================= */
export const logout =
async () => {

  return axios.post(
    `${API_URL}/logout`
  );
};