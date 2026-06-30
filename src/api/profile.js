import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

/* =========================
   GET PROFILE
========================= */
export const getProfileApi =
async (id) => {

  const response =
    await axios.get(
      `${API_URL}/profile/${id}`
    );

  return response.data;
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfileApi =
async (
  id,
  data
) => {

  const response =
    await axios.patch(
      `${API_URL}/profile/${id}`,
      data
    );

  return response.data;
};