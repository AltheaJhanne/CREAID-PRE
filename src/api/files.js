const API_BASE =
  `${import.meta.env.VITE_API_URL}/files`;

export async function archivePatientFileApi(
  fileId
)
{
  const response =
    await fetch(`${API_BASE}/medical-files/${fileId}/archive`,
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
  patientId,
  options = {}
)
{
  const params =
    new URLSearchParams();

  if(options.archived)
  {
    params.set(
      "archived",
      "true"
    );
  }

  const url =
    `${API_BASE}/medical-files/${patientId}${
      params.toString()
        ? `?${params}`
        : ""
    }`;

  const response =
    await fetch(url);

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
  patientId,
  options = {}
)
{
  const params =
    new URLSearchParams();

  if(options.archived)
  {
    params.set(
      "archived",
      "true"
    );
  }

  const url =
    `${API_BASE}/billing/${patientId}${
      params.toString()
        ? `?${params}`
        : ""
    }`;

  const response =
    await fetch(url);

  return await response.json();
}

export async function uploadBillingDocumentApi(
  data
)
{
  const response =
    await fetch(`${API_BASE}/billing`,
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
  await fetch(`${API_BASE}/billing/${id}/archive`,
    {
      method:"PATCH"
    }
  );
}

export async function restorePatientFileApi(
  fileId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${fileId}/restore`,
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
      "Failed to restore file"
    );
  }

  return result;
}

export async function restoreBillingDocumentApi(
  id
)
{
  const response =
    await fetch(
      `${API_BASE}/billing/${id}/restore`,
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
      "Failed to restore billing document"
    );
  }

  return result;
}