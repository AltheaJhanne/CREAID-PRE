const API_BASE =
  `${import.meta.env.VITE_API_URL}/leave-requests`;

export async function getLeaveRequestsApi(
  dentistId
)
{
  const response =
    await fetch(
      `${API_BASE}/dentists/${dentistId}/leave-requests`
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message
    );
  }

  return result;
}

export async function updateLeaveRequestApi(
  id,
  data
)
{
  const response =
    await fetch(
      `${API_BASE}/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(data)
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message
    );
  }

  return result;
}