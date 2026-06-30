const API_BASE = "/api/files";

export async function archivePatientFileApi(
  fileId
)
{
  const response =
    await fetch(
      `/api/files/medical-files/${fileId}/archive`,
      {
        method: "PATCH"
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to archive file"
    );
  }

  return result;
}

export async function savePatientFileApi(data)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files`,
      {
        method: "POST",
        headers:
        {
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify(data)
      }
    );

  return await response.json();
}

export async function getPatientFilesApi(
  patientId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${patientId}`
    );

  return await response.json();
}

export async function deletePatientFileApi(
  fileId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${fileId}`,
      {
        method: "DELETE"
      }
    );

  return await response.json();
}

export async function getMedicalFilesApi(
  patientId
)
{
  console.log(
  "LOADING FILES FOR:",
  patientId
);

  const response =
    await fetch(
      `${API_BASE}/medical-files/${patientId}`
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Failed to load files"
    );
  }

  return result;
}

export async function uploadMedicalFileApi(
  data
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files`,
      {
        method: "POST",

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
      result.message ||
      "Upload failed"
    );
  }

  return result;
}

export async function deleteMedicalFileApi(
  fileId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${fileId}`,
      {
        method:"DELETE"
      }
    );

  const result =
    await response.json();

  if(!response.ok)
  {
    throw new Error(
      result.message ||
      "Delete failed"
    );
  }

  return result;
}

export async function getBillingDocumentsApi(
  patientId
)
{
  const response =
    await fetch(
      `/api/files/billing/${patientId}`
    );

  return await response.json();
}

export async function uploadBillingDocumentApi(
  data
)
{
  const response =
    await fetch(
      "/api/files/billing",
      {
        method:"POST",

        headers:
        {
          "Content-Type":
          "application/json"
        },

        body:
        JSON.stringify(data)
      }
    );

  return await response.json();
}

export async function archiveBillingDocumentApi(
  id
)
{
  await fetch(
    `/api/files/billing/${id}/archive`,
    {
      method:"PATCH"
    }
  );
}