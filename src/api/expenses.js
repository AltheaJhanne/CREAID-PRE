import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

  export async function
archiveExpenseApi(id)
{
  const response =
    await axios.patch(
      `${API_URL}/expenses/${id}/archive`
    );

  return response.data;
}

export async function
getExpensesApi()
{
  const response =
    await axios.get(
      `${API_URL}/expenses`
    );

  return response.data;
}

export async function
createExpenseApi(data)
{
  const response =
    await axios.post(
      `${API_URL}/expenses`,
      data
    );

  return response.data;
}

export async function
updateExpenseApi(
  id,
  data
)
{
  const response =
    await axios.patch(
      `${API_URL}/expenses/${id}`,
      data
    );

  return response.data;
}

export async function
deleteExpenseApi(id)
{
  const response =
    await axios.delete(
      `${API_URL}/expenses/${id}`
    );

  return response.data;
}