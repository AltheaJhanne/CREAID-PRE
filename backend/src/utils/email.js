import nodemailer from "nodemailer";

const transporter =
  nodemailer.createTransport({
    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

export async function sendAppointmentEmail({
  to,
  name,
  dentist,
  date,
  time,
  totalAmount,
  downpayment,
  cancelLink
})
{
  await transporter.sendMail({
    from: `"DentConnect" <${process.env.EMAIL_USER}>`,

    to,

    subject:
    "🦷 DentConnect - Appointment Request Received",

    html: `
<!DOCTYPE html>

<html>

<body
style="
font-family:Arial,sans-serif;
background:#F5F7FB;
padding:30px;
">

<div
style="
max-width:650px;
margin:auto;
background:white;
border-radius:16px;
padding:35px;
box-shadow:0 10px 25px rgba(0,0,0,.08);
">

<h1
style="
margin-top:0;
color:#150E43;
">
🦷 DentConnect
</h1>

<h2
style="
margin-bottom:8px;
color:#150E43;
">
Appointment Request Received
</h2>

<p
style="
font-size:16px;
line-height:1.6;
">

Hello
<strong>${name}</strong>,

</p>

<p
style="
font-size:16px;
line-height:1.7;
">

Thank you for choosing
<b>DentConnect</b>.

We have successfully received your
appointment request.

</p>

<div
style="
background:#FFF7E6;
border-left:5px solid #F4B400;
padding:18px;
border-radius:10px;
margin:25px 0;
">

<b>
🟡 Current Status
</b>

<br><br>

Your appointment is currently
<b>Pending Payment Verification.</b>

<br><br>

Our staff will review your submitted
payment.

Once verified, you will receive
another email confirming that your
appointment has been officially
scheduled.

</div>

<hr>

<h3>
Appointment Details
</h3>

<table
style="
width:100%;
border-collapse:collapse;
">

<tr>

<td><b>Dentist</b></td>

<td>${dentist}</td>

</tr>

<tr>

<td><b>Date</b></td>

<td>${date}</td>

</tr>

<tr>

<td><b>Time</b></td>

<td>${time}</td>

</tr>

<tr>

<td><b>Total Fee</b></td>

<td>
₱${Number(totalAmount).toLocaleString()}
</td>

</tr>

<tr>

<td><b>Downpayment</b></td>

<td>
₱${Number(downpayment).toLocaleString()}
</td>

</tr>

</table>

<br>

<div
style="
text-align:center;
margin-top:35px;
">

<a
href="${cancelLink}"

style="
background:#D9534F;
padding:14px 28px;
color:white;
text-decoration:none;
border-radius:8px;
font-weight:bold;
display:inline-block;
">

Cancel Booking Request

</a>

</div>

<p
style="
margin-top:35px;
font-size:13px;
color:#666;
text-align:center;
">

You may cancel this booking request
until your payment has been verified.

After payment verification,
please contact the clinic directly
for cancellation requests.

</p>

</div>

</body>

</html>
`
  });
}

export async function sendAppointmentConfirmedEmail({
  to,
  name,
  dentist,
  date,
  time,
  totalAmount
})
{
  await transporter.sendMail({

    from:
      `"DentConnect" <${process.env.EMAIL_USER}>`,

    to,

    subject:
      "🦷 DentConnect - Appointment Confirmed",

    html: `
<!DOCTYPE html>

<html>

<body style="
font-family:Arial,sans-serif;
background:#F5F7FB;
padding:30px;
">

<div style="
max-width:650px;
margin:auto;
background:white;
padding:35px;
border-radius:16px;
box-shadow:0 10px 25px rgba(0,0,0,.08);
">

<h1 style="color:#150E43;">
🦷 DentConnect
</h1>

<h2 style="color:#2E7D32;">
✅ Appointment Confirmed
</h2>

<p>

Hello
<strong>${name}</strong>,

</p>

<p>

Good news!

Your payment has been verified by
our clinic staff.

Your appointment has now been
officially scheduled.

</p>

<div style="
background:#E8F5E9;
border-left:5px solid #43A047;
padding:18px;
border-radius:10px;
margin:25px 0;
">

<b>
🟢 Status
</b>

<br><br>

Your appointment is now confirmed.

</div>

<hr>

<h3>
Appointment Details
</h3>

<table
style="
width:100%;
">

<tr>

<td><b>Dentist</b></td>

<td>${dentist}</td>

</tr>

<tr>

<td><b>Date</b></td>

<td>${date}</td>

</tr>

<tr>

<td><b>Time</b></td>

<td>${time}</td>

</tr>

<tr>

<td><b>Total Fee</b></td>

<td>
₱${Number(totalAmount).toLocaleString()}
</td>

</tr>

</table>

<br>

<p>

We look forward to seeing you.

Thank you for choosing
DentConnect.

</p>

</div>

</body>

</html>
`
  });
}