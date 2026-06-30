const API_BASE = "/api/users";

// CREATE USER / PATIENT
export async function createUserApi(data)
{
  const response =
    await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body:
        JSON.stringify(data),
    });

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to create user"
    );
  }

  return result;
}

// GET USERS
export async function getUsersApi({
  page,
  archived,
  name,
  role,
  year,
  all
})
{
  const params =
    new URLSearchParams();

  if (page !== undefined)
{
  params.set("page", page);
}
  if(all !== undefined)
{
  params.set(
    "all",
    all
  );
}
  if(
    archived !== undefined
  )
  {
    params.set(
      "archived",
      archived
    );
  }

  if(name)
  {
    params.set(
      "name",
      name
    );
  }

  if(role)
  {
    params.set(
      "role",
      role
    );
  }

  if(year)
  {
    params.set(
      "year",
      year
    );
  }

  const response =
    await fetch(
      `${API_BASE}?${params.toString()}`
    );

  const text =
  await response.text();

let result = {};

try {
  result = text ? JSON.parse(text) : {};
} catch {
  throw new Error(
    `Server returned invalid response: ${text || response.status}`
  );
}

if (!response.ok) {
  throw new Error(
    result.message ||
    `Failed to fetch users. Status: ${response.status}`
  );
}

  return result;
}

// ARCHIVE USER
export async function archiveUserApi(id)
{
  const response =
    await fetch(
      `${API_BASE}/${id}/archive`,
      {
        method: "PATCH",
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to archive user"
    );
  }

  return result;
}

// RESTORE USER
export async function restoreUserApi(id)
{
  const response =
    await fetch(
      `${API_BASE}/${id}/restore`,
      {
        method: "PATCH",
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to restore user"
    );
  }

  return result;
}

// UPDATE USER
export async function updateUserApi(
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
            "application/json",
        },
        body:
          JSON.stringify(data),
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to update user"
    );
  }

  return result;
}

// GET DENTISTS
export async function getDentistsApi()
{
  const response =
    await getUsersApi({
      archived: false,
      role: "dentist",
      all: true
    });

  return {
    dentists:
      response.users || []
  };
}

// GET PATIENTS
export async function getPatientsApi()
{
  const response =
    await getUsersApi({
      page: 1,
      role: "patient",
    });

  return {
    patients:
      response.users || [],
  };
}

export async function getLeaveRequestsApi(
  dentistId
)
{
  const response =
    await fetch(
      `/api/appointments/dentists/${dentistId}/leave-requests`
    );

  return response.json();
}

export async function reviewLeaveRequestApi(
  id,
  data
)
{
  const response =
    await fetch(
      `/api/appointments/leave-requests/${id}`,
      {
        method: "PATCH",

        headers:
        {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(data)
      }
    );

  return response.json();
}

export async function saveDentistScheduleApi(
  dentistId,
  data
)
{
  const response =
    await fetch(
      `/api/users/${dentistId}/schedule`,
      {
        method: "PATCH",

        headers:
        {
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

export async function getDentistScheduleApi(
  dentistId
)
{
  const response =
    await fetch(
      `/api/users/${dentistId}/schedule`
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
