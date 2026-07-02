import {
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  getCancellationDetailsApi,
  cancelAppointmentByTokenApi
} from "../api/appointments";

function CancelAppointment()
{
  const { token } =
    useParams();

  const navigate =
    useNavigate();

  const [
    appointment,
    setAppointment
  ] =
    useState(null);

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    cancelled,
    setCancelled
  ] =
    useState(false);

  useEffect(() =>
  {
    loadAppointment();
  }, []);

  async function loadAppointment()
  {
    try
    {
      const response =
        await getCancellationDetailsApi(
          token
        );

      setAppointment(
        response.appointment
      );
    }
    catch(error)
    {
      alert(
        error.response?.data?.message ||
        "Invalid cancellation link."
      );
    }

    setLoading(false);
  }

  async function handleCancel()
  {
    if(
      !window.confirm(
        "Are you sure you want to cancel this booking?"
      )
    )
    {
      return;
    }

    try
    {
      await cancelAppointmentByTokenApi(
        token
      );

      setCancelled(true);
    }
    catch(error)
    {
      alert(
        error.response?.data?.message ||
        "Unable to cancel booking."
      );
    }
  }

  if(loading)
  {
    return (
      <div
        style={{
          padding:40,
          textAlign:"center"
        }}
      >
        Loading...
      </div>
    );
  }

  return (

<div
style={{
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#f5f7fb",
padding:30
}}
>

<div
style={{
background:"white",
width:550,
padding:40,
borderRadius:18,
boxShadow:"0 10px 30px rgba(0,0,0,.08)"
}}
>

<h1
style={{
marginTop:0,
color:"#150E43"
}}
>

🦷 DentConnect

</h1>

<h2>

Cancel Booking Request

</h2>

{cancelled ?

<>

<h3
style={{
color:"green"
}}
>

✅ Booking Cancelled

</h3>

<p>

Your booking request has been
cancelled successfully.

</p>

<button
onClick={() =>
navigate("/")
}
>

Return Home

</button>

</>

:

<>

<p>

<b>Patient</b>

<br/>

{appointment.guest_name}

</p>

<p>

<b>Date</b>

<br/>

{appointment.appointment_date}

</p>

<p>

<b>Time</b>

<br/>

{appointment.appointment_time}

</p>

<p>

<b>Status</b>

<br/>

{appointment.status}

</p>

<hr/>

{
appointment.status ===
"pending_verification"

?

<>

<p
style={{
color:"#C77C00"
}}
>

⚠️

You may cancel this booking
before your payment has been
verified.

</p>

<button
onClick={
handleCancel
}
style={{
padding:"12px 22px",
background:"#D9534F",
color:"white",
border:0,
borderRadius:8,
cursor:"pointer",
fontWeight:"bold"
}}
>

Cancel Booking

</button>

</>

:

<>

<p
style={{
color:"green"
}}
>

✅

Your payment has already
been verified.

</p>

<p>

Online cancellation is no
longer available.

Please contact the clinic
directly.

</p>

</>

}

</>

}

</div>

</div>

  );
}

export default CancelAppointment;