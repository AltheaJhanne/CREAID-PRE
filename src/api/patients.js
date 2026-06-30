import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

// GET ALL PATIENTS
export async function getPatientsApi()
{
  console.log(
    "PATIENT API FILE CALLED"
  );

  const response =
    await axios.get(
      `${API_URL}/patients`
    );

  console.log(
    "API PATIENTS:",
    response.data.patients?.length || 0
  );

  return response.data;
}

// GET SINGLE PATIENT DETAILS
export const getPatientDetailsApi =
async (id) =>
{
  const response =
    await axios.get(
      `${API_URL}/patients/${id}`
    );

  return response.data;
};

// ADD PATIENT RECORD
export const addPatientRecordApi =
async (patientId, data) =>
{
  const response =
    await axios.post(
      `${API_URL}/patients/${patientId}/records`,
      data
    );

  return response.data;
};

// GET PATIENT RECORDS
export const getPatientRecordsApi =
async (patientId) =>
{
  const response =
    await axios.get(
      `${API_URL}/patients/${patientId}/records`
    );

  return response.data;
}

export async function getPatientNotesApi(
  patientId
)
{
  const response =
    await fetch(
      `/api/patients/${patientId}/notes`
    );

  return await response.json();
}

export async function savePatientNotesApi(
  patientId,
  note
)
{
  const response =
    await fetch(
      `/api/patients/${patientId}/notes`,
      {
        method: "POST",

        headers:
        {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            note
          })
      }
    );

  return await response.json();
};