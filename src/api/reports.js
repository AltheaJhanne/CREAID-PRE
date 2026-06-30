import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

/* SUMMARY REPORT */
export async function
getReportsSummaryApi(filters)
{
  const response =
    await axios.get(
      `${API_URL}/reports/summary`,
      {
        params: filters
      }
    );

  return response.data;
}

/* DAILY REPORT */
export async function
getDailyReportApi(filters)
{
  const response =
    await axios.get(
      `${API_URL}/reports/daily`,
      {
        params: filters
      }
    );

  return response.data;
}

export async function
getMonthlySummaryApi(
  month,
  year,
  clinic = "All Clinics"
)
{
  const response =
    await axios.get(
      `${API_URL}/reports/monthly-summary`,
      {
        params:
        {
          month,
          year,
          clinic
        }
      }
    );

  return response.data;
}

export async function
getCollectionsReportApi(filters)
{
  const response =
    await axios.get(
      `${API_URL}/reports/collections`,
      {
        params: filters
      }
    );

  return response.data;
}

export async function
getAppointmentsReportApi(filters)
{
  const response =
    await axios.get(
      `${API_URL}/reports/appointments`,
      {
        params: filters
      }
    );

  return response.data;
}