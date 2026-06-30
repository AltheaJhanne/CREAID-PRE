import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

  export async function rejectAppointmentApi(
  id,
  rejection_reason
)
{
  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/reject`,
      {
        rejection_reason
      }
    );

  return response.data;
}

  export async function rescheduleAppointmentApi(
  id,
  data
)
{
  const response =
    await fetch(
      `/api/appointments/${id}/reschedule`,
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

  return response.json();
}

  export const markServiceNotPerformedApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/services/${id}/not-performed`
    );

  return response.data;
};

export const markServicePerformedApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/services/${id}/performed`
    );

  return response.data;
};

  export const addServiceToPaymentApi =
async (
  appointmentId,
  serviceId
) => {

  const response =
    await axios.post(
      `${API_URL}/appointments/${appointmentId}/add-service`,
      {
        service_id:
          serviceId
      }
    );

  return response.data;
};

  // services.js
export const getServicesApi =
async () => {

  const response =
    await axios.get(
      `${API_URL}/services`
    );

  return response.data;
};

  export const reinstatePaymentApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/reinstate-payment`
    );

  return response.data;
};

  

  export const confirmDownpaymentApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/confirm-downpayment`
    );

  return response.data;
};

  export const undoPaymentPaidApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/undo-paid`
    );

  return response.data;
};

  export const markPaymentPaidApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/mark-paid`
    );

  return response.data;
};


export const cancelPaymentApi =
async (id) => {

  const response =
    await axios.patch(
      `${API_URL}/appointments/${id}/cancel-payment`
    );

  return response.data;
};

  export const getAppointmentServicesApi =
async (appointmentId) => {

  const response =
    await axios.get(
      `${API_URL}/appointments/${appointmentId}/services`
    );

  return response.data;
};

  export const getPaymentsApi =
async () => {

  const response =
    await axios.get(
      `${API_URL}/appointments/payments`
    );

  return response.data;
};

  export const getBalancesApi =
async (clinic = "All") => {

  const response =
    await axios.get(
      `${API_URL}/appointments/balances`,
      {
        params: { clinic }
      }
    );

  return response.data;
};

export const getTreatmentStatsApi =
async (period, clinic = "All") => {

  const response =
    await axios.get(
      `${API_URL}/appointments/treatment-stats`,
      {
        params: {
          period,
          clinic
        }
      }
    );

  return response.data;
};

export const getAppointmentStatsApi =
async (period, clinic = "All") => {

  const response =
    await axios.get(
      `${API_URL}/appointments/stats`,
      {
        params: {
          period,
          clinic
        }
      }
    );

  return response.data;
};

export const createAppointmentApi =
async (data) => {

  const response =
    await axios.post(
      `${API_URL}/appointments`,
      data
    );

  return response.data;
};

export const getAppointmentsApi =
async () => {

  const response =
    await axios.get(
      `${API_URL}/appointments`
    );

  return response.data;
};

export const updateAppointmentStatusApi = async (id, status) => {
  const response = await axios.patch(
    `${API_URL}/appointments/${id}/status`,
    { status }
  );

  return response.data;
}

export async function getPatientLastVisitApi(
  patientId
)
{
  const response =
    await fetch(
      `/api/appointments/patients/${patientId}/last-visit`
    );

  return await response.json();
};

export const getMyPatientsApi =
async (dentistId) => {

  const response =
    await axios.get(
      `${API_URL}/appointments/dentists/${dentistId}/my-patients`
    );

  return response.data;
};

export const getDentistEarningsApi =
async (dentistId) => {

  const response =
    await axios.get(
      `${API_URL}/appointments/dentists/${dentistId}/earnings`
    );

  return response.data;
};