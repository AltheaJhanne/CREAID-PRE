import { useEffect, useState } from "react";
import "../styles/payment.css";
import {
  getPaymentsApi,
  getAppointmentServicesApi,
  markPaymentPaidApi,
  cancelPaymentApi,
  undoPaymentPaidApi,
  reinstatePaymentApi,
  addServiceToPaymentApi,
  markServiceNotPerformedApi,
  markServicePerformedApi
}
from "../api/appointments";

import {
  getServicesApi
}
from "../api/services";

import { jsPDF } from "jspdf";

import axios from "axios";

const AVATAR_PALETTES = [
  { bg: "#fce4ec", color: "#c62828" },
  { bg: "#e8eaf6", color: "#283593" },
  { bg: "#e8f5e9", color: "#2e7d32" },
  { bg: "#fff8e1", color: "#f57f17" },
  { bg: "#e3f2fd", color: "#1565c0" },
  { bg: "#f3e5f5", color: "#6a1b9a" },
];

function formatStatus(status = "")
{
  switch(status.toLowerCase())
  {
    case "downpayment_paid":
      return "Downpayment";

    case "pending_verification":
      return "For Verification";

    case "no_show":
      return "No Show";

    case "cancelled":
      return "Cancelled";

    case "paid":
      return "Paid";

    case "pending":
      return "Pending";

    default:
      return status;
  }
}

function getInitials(name = "")
{
  return name
    .trim()
    .split(" ")
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function getAvatarPalette(name = "")
{
  const index =
    name.charCodeAt(0) %
    AVATAR_PALETTES.length;

  return AVATAR_PALETTES[index];
}

const PAGE_SIZE = 6;

function Payment() 
{
  const [payments, setPayments] = useState([]);
  const [highlightedId, setHighlightedId] =
useState(
  localStorage.getItem(
    "highlightPaymentId"
  )
);
const [showReceipt, setShowReceipt] =
  useState(false);
const [clinicFilter, setClinicFilter] = useState("All");
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [services, setServices] = useState([]);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [filterStatus, setFilterStatus] =
  useState("");
  const [filterMethod, setFilterMethod] =
  useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() =>
{
  loadPayments();
  loadServices();
}, []);


async function handleMarkPaid()
{
  try
  {
    await markPaymentPaidApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleCancelPayment()
{
  try
  {
    await cancelPaymentApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleNotPerformed(service)
{
  try
  {
    await markServiceNotPerformedApi(service.id);

    const updatedPayments =
      await loadPayments();

    const updatedPayment =
      updatedPayments.find(
        p => p.id === editingPayment.id
      );

    if(updatedPayment)
    {
      await handleEdit(updatedPayment);
    }
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handlePerformed(
  service
)
{
  try
  {
    await markServicePerformedApi(
      service.id
    );

    await handleEdit(
      editingPayment
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

async function loadPayments()
{
  try
  {
    const response =
      await getPaymentsApi();

    const list =
      response.payments || [];

    console.log(
      "STATUSES:",
      list.map(
        p => p.payment_status
      )
    );

    setPayments(list);

    return list;
  }
  catch(error)
  {
    console.error(error);

    return [];
  }
}

const filteredPayments =
  payments.filter(payment =>
  {
    if (
  clinicFilter !== "All" &&
  (payment.branch_id || "")
    .trim()
    .toLowerCase() !==
  clinicFilter
    .trim()
    .toLowerCase()
)
{
  return false;
}
    const search =
      searchTerm.toLowerCase();

    const matchesSearch =
      payment.guest_name
        ?.toLowerCase()
        .includes(search)
      ||
      payment.payment_method
        ?.toLowerCase()
        .includes(search)
      ||
      payment.payment_status
      ?.toLowerCase()
      .includes(search)
      ||
      payment.status
      ?.toLowerCase()
      .includes(search);

    if(!matchesSearch)
    {
      return false;
    }

    let matchesStatus = true;

if(filterStatus === "today")
{
  matchesStatus =
    payment.appointment_date ===
    new Date()
      .toISOString()
      .split("T")[0];
}
else if(filterStatus === "pending")
{
  matchesStatus =
    [
      "pending",
      "downpayment_paid"
    ].includes(
      payment.payment_status
        ?.toLowerCase()
    );
}
else if(filterStatus)
{
  matchesStatus =
    payment.payment_status
      ?.toLowerCase()
      === filterStatus;
}

const matchesMethod =
  !filterMethod ||
  (payment.payment_method || "")
    .trim()
    .toLowerCase() ===
  filterMethod
    .trim()
    .toLowerCase();

return (
  matchesStatus &&
  matchesMethod
);
  });

  const totalPages =
  Math.max(
    1,
    Math.ceil(
      filteredPayments.length /
      PAGE_SIZE
    )
  );

const paginatedPayments =
  filteredPayments.slice(
    (currentPage - 1) *
      PAGE_SIZE,
    currentPage *
      PAGE_SIZE
  );
  

  const totalCollected =
  filteredPayments.reduce(
    (sum, p) =>
      sum +
      Number(
        p.amount_paid || 0
      ),
    0
  );

const totalOutstanding =
  filteredPayments.reduce(
    (sum, p) =>
      sum +
      Number(
        p.remaining_balance || 0
      ),
    0
  );

const paidCount =
  filteredPayments.filter(
    p =>
      p.payment_status?.toLowerCase() ===
      "paid"
  ).length;

const cancelledCount =
  filteredPayments.filter(
    p =>
      p.payment_status?.toLowerCase() ===
      "cancelled"
  ).length;

async function loadServices()
{
  try
  {
    const response =
      await axios.get(
        `${import.meta.env.VITE_API_URL}/services`
      );

    setAllServices(
      response.data.services || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

  async function handleEdit(p)
{
  setEditingPayment(p);
  setEditForm({ ...p });

  try
  {
    const response =
      await getAppointmentServicesApi(
        p.id
      );

    console.log(
      "SERVICES:",
      response.services
    );

    console.log(
  "EDIT PAYMENT:",
  p
);

    setServices(
      response.services || []
    );
  }
  catch(error)
  {
    console.error(error);

    setServices([]);
  }
}

function handleGenerateInvoice()
{
  const doc =
    new jsPDF();

  doc.setFontSize(20);

  doc.text(
    "JUANA SMILE DENTAL CLINIC",
    20,
    20
  );

  doc.setFontSize(14);

  doc.text(
    "INVOICE",
    20,
    30
  );

  doc.line(
    20,
    35,
    190,
    35
  );

  let y = 50;

  doc.text(
    `Invoice #: ${
      editForm.invoice_number ||
      `INV-${editForm.id?.slice(0,8).toUpperCase()}`
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Patient: ${
      editForm.guest_name
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Clinic: ${
      editForm.branch_id
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Date: ${
      editForm.appointment_date
    }`,
    20,
    y
  );

  y += 15;

  doc.text(
    "Services",
    20,
    y
  );

  y += 10;

  services.forEach(
    service =>
    {
      doc.text(
        `${service.service_name}`,
        20,
        y
      );

      doc.text(
        `PHP ${Number(
          service.price
        ).toLocaleString()}`,
        140,
        y
      );

      y += 8;
    }
  );

  y += 10;

  doc.text(
    `Total Amount: PHP ${Number(
      editForm.total_amount || 0
    ).toLocaleString()}`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Amount Paid: PHP ${Number(
      editForm.amount_paid || 0
    ).toLocaleString()}`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Remaining Balance: PHP ${Number(
      editForm.remaining_balance || 0
    ).toLocaleString()}`,
    20,
    y
  );

  doc.save(
    `Invoice-${
      editForm.guest_name
        ?.replaceAll(" ","-")
    }.pdf`
  );
}

function handleGenerateOfficialReceipt()
{
  const doc =
    new jsPDF();

  doc.setFontSize(20);

  doc.text(
    "JUANA SMILE DENTAL CLINIC",
    20,
    20
  );

  doc.setFontSize(14);

  doc.text(
    "OFFICIAL RECEIPT",
    20,
    30
  );

  doc.line(
    20,
    35,
    190,
    35
  );

  let y = 50;

  doc.text(
    `Receipt No: OR-${
      editForm.id
        ?.slice(0,8)
        .toUpperCase()
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Patient: ${
      editForm.guest_name
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Branch: ${
      editForm.branch_id
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Payment Method: ${
      editForm.payment_method
    }`,
    20,
    y
  );

  y += 10;

  doc.text(
    `Date Paid: ${
      new Date()
      .toLocaleDateString()
    }`,
    20,
    y
  );

  y += 15;

  doc.setFontSize(16);

  doc.text(
    `Amount Received: PHP ${Number(
      editForm.total_amount || 0
    ).toLocaleString()}`,
    20,
    y
  );

  y += 20;

  doc.setFontSize(12);

  doc.text(
    "Payment received in full for dental services rendered.",
    20,
    y
  );

  y += 30;

  doc.text(
    "________________________",
    20,
    y
  );

  y += 10;

  doc.text(
    "Authorized Signature",
    20,
    y
  );

  doc.save(
    `Official-Receipt-${
      editForm.guest_name
        ?.replaceAll(" ","-")
    }.pdf`
  );
}

  function handleSave() 
  {
    setPayments(payments.map(p => p.id === editingPayment.id ? { ...editForm } : p));
    setEditingPayment(null);
    setEditForm({});
  }

  function handleCancel() {
  setEditingPayment(null);
  setEditForm({});
  setServices([]);
}

async function handleUndoPaid()
{
  try
  {
    await undoPaymentPaidApi(
      editingPayment.id
    );

    const updatedPayments =
      await loadPayments();

    const updatedPayment =
      updatedPayments.find(
        p =>
          p.id ===
          editingPayment.id
      );

    if(updatedPayment)
    {
      setEditingPayment(
        updatedPayment
      );

      setEditForm(
        updatedPayment
      );
    }
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleReinstate()
{
  try
  {
    await reinstatePaymentApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>Payment</h2>
      </div>

      <div className="users-page-container">

      <div className="payment-toolbar">

  <div className="payment-search-wrap">

  <svg
    className="payment-search-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"/>
    <line
      x1="21"
      y1="21"
      x2="16.65"
      y2="16.65"
    />
  </svg>

  <input
    type="text"
    className="payment-search-input"
    placeholder="Search patient, payment method, or status..."
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(
        e.target.value
      )
    }
  />

</div>

  <select
  className="payment-clinic-filter"
  value={clinicFilter}
  onChange={(e) =>
    setClinicFilter(
      e.target.value
    )
  }
>
  <option value="All">
    All Clinics
  </option>

  <option value="Hagonoy">
    Hagonoy
  </option>

  <option value="Paombong">
    Paombong
  </option>
</select>
<select
  className="payment-filter-select"
  value={filterStatus}
  onChange={(e) =>
    setFilterStatus(
      e.target.value
    )
  }
>
  <option value="">
    All Statuses
  </option>

  <option value="today">
  Today
</option>

  <option value="paid">
    Paid
  </option>

  <option value="pending">
    Pending
  </option>

  <option value="cancelled">
    Cancelled
  </option>
</select>

<select
  className="payment-filter-select"
  value={filterMethod}
  onChange={(e) =>
    setFilterMethod(
      e.target.value
    )
  }
>
  <option value="">
    All Methods
  </option>

  <option value="gcash">
    GCash
  </option>

  <option value="cash">
    Cash
  </option>

  <option value="visa">
    Visa
  </option>

  <option value="mastercard">
    Mastercard
  </option>

  <option value="jcb">
    JCB
  </option>

  <option value="card">
    Card
  </option>
</select>
</div>

<div className="payment-metrics">

  <div className="payment-metric-card">
    <div className="pmc-label">
      Total Collected
    </div>

    <div className="pmc-value">
      ₱{totalCollected.toLocaleString()}
    </div>

    <div className="pmc-sub">
      {paidCount} paid records
    </div>
  </div>

  <div className="payment-metric-card">
    <div className="pmc-label">
      Outstanding
    </div>

    <div className="pmc-value pmc-value--danger">
      ₱{totalOutstanding.toLocaleString()}
    </div>

    <div className="pmc-sub">
      Remaining balances
    </div>
  </div>

  <div className="payment-metric-card">
    <div className="pmc-label">
      Total Records
    </div>

    <div className="pmc-value">
      {filteredPayments.length}
    </div>

    <div className="pmc-sub">
      Payment entries
    </div>
  </div>

  <div className="payment-metric-card">
    <div className="pmc-label">
      Cancelled
    </div>

    <div className="pmc-value">
      {cancelledCount}
    </div>

    <div className="pmc-sub">
      Cancelled records
    </div>
  </div>

</div>
        <div className="payment-table">
          <div className="payment-table-header">
            <span>Name</span>
            <span>Clinic</span>
            <span>Invoice</span>
            <span>Amount</span>
            <span>Balance</span>
            <span>Mode of Payment</span>
            <span>Status</span>
            <span></span>
          </div>

          {payments.length === 0 ? (
            <div className="users-empty">No payments found.</div>
          ) : (
            paginatedPayments.map((p) => (
              <div
  key={p.id}
  className={`payment-table-row ${
    highlightedId === p.id
      ? "highlight-payment"
      : ""
  }`}
>
                <span className="payment-name-cell">

  <span
    className="payment-avatar"
    style={{
      background:
        getAvatarPalette(
          p.guest_name || ""
        ).bg,

      color:
        getAvatarPalette(
          p.guest_name || ""
        ).color
    }}
  >
    {
      getInitials(
        p.guest_name
      )
    }
  </span>

  <span className="payment-name-text">
    {p.guest_name}
  </span>

</span>
                <span>{p.branch_id || "—"}</span>
                <span className="payment-invoice-text">
                {p.invoice_number || "-"}
                </span>
                <span className="payment-amount-text">
                ₱{Number(p.total_amount).toLocaleString()}
                </span>
                <span className="payment-balance-text">
                ₱{Number(p.remaining_balance).toLocaleString()}
                </span>
                <span>
                  {p.payment_method}
                  </span>
                <span
  className={`payment-status ${
    p.status === "cancelled" &&
    p.rejection_reason
      ? "payment-status-cancelled"
      : `payment-status-${p.payment_status?.toLowerCase()}`
  }`}
>
  {
    p.status === "cancelled" &&
    p.rejection_reason
    ? "Rejected"
    : formatStatus(p.payment_status)
  }
</span>
                <span className="payment-row-actions">
                  <button
  className="btn-edit-icon"
  onClick={(e) => {

    e.stopPropagation();

    localStorage.removeItem(
      "highlightPaymentId"
    );

    setHighlightedId(null);

    handleEdit(p);
  }}
>
  ✏️
</button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="payment-pagination">

  <span className="payment-pagination-info">
    Showing
    {" "}
    {(currentPage - 1) *
      PAGE_SIZE + 1}
    -
    {Math.min(
      currentPage *
      PAGE_SIZE,
      filteredPayments.length
    )}
    {" "}
    of
    {" "}
    {filteredPayments.length}
  </span>

  <div className="payment-pagination-controls">

    <button
      className="payment-page-btn"
      disabled={
        currentPage === 1
      }
      onClick={() =>
        setCurrentPage(
          currentPage - 1
        )
      }
    >
      ‹
    </button>

    <span>
      Page {currentPage}
      {" / "}
      {totalPages}
    </span>

    <button
      className="payment-page-btn"
      disabled={
        currentPage === totalPages
      }
      onClick={() =>
        setCurrentPage(
          currentPage + 1
        )
      }
    >
      ›
    </button>

  </div>

</div>

      {editingPayment && (
  <div
    className="modal-overlay"
    onClick={handleCancel}
  >
    <div
  className="payment-modal"
  onClick={(e) => e.stopPropagation()}
>
      <div className="modal-header">
        <h3>Payment Details</h3>
      </div>

      <div className="modal-body">

        <div className="modal-field">
          <label>Patient</label>
          <p className="modal-readonly">
            {editForm.guest_name}
          </p>
        </div>

        <div className="modal-field">
          <label>Total Amount</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.total_amount || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
          <label>Amount Paid</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.amount_paid || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
          <label>Remaining Balance</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.remaining_balance || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
  <label>Mode of Payment</label>

  {editForm.status === "rejected" ? (

    <p className="modal-readonly">
      {editForm.payment_method}
    </p>

  ) : (

    <select
      className="modal-input"
      value={
        editForm.payment_method || ""
      }
      onChange={(e) =>
        setEditForm({
          ...editForm,
          payment_method:
            e.target.value
        })
      }
    >
      <option value="Cash">
        Cash
      </option>

      <option value="GCash">
        GCash
      </option>

      <option value="Card">
        Card
      </option>
    </select>

  )}
</div>

        <div className="modal-field">
  <label>Payment Status</label>

  <p
    className={`payment-status-display ${editForm.payment_status?.toLowerCase()}`}
  >
    {editForm.payment_status}
  </p>
</div>

        <div
          className="modal-field"
          style={{
            gridColumn: "1 / -1"
          }}
        >
          <label>
            Services Availed
          </label>

          <div className="services-list">

            {services.filter(
  service =>
    service.service_status !==
    "not_performed"
).length > 0 ? (

  services
    .filter(
      service =>
        service.service_status !==
        "not_performed"
    )
    .map((service) => (
                <div
                  key={service.id}
                  className="service-item"
                >
                  <span>
                    {service.service_name}
                  </span>

                  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" && (

<div className="service-actions">

  <strong>
    ₱{Number(
      service.price
    ).toLocaleString()}
  </strong>

  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" &&
 editForm.status !== "rejected" && (

    service.service_status === "not_performed" ? (

      <button
        className="btn-performed"
        onClick={() =>
          handlePerformed(service)
        }
      >
        Undo
      </button>

    ) : (

      <button
        className="btn-not-performed"
        onClick={() =>
          handleNotPerformed(service)
        }
      >
        Not Performed
      </button>

    )

  )}

</div>

)}
                </div>
              ))
            ) : (
              <p>
                No services found.
              </p>
            )}

          </div>
        </div>

      </div>


        <div className="modal-footer">

  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" &&
 editForm.status !== "rejected" && (

<select
      className="modal-input"
      onChange={async (e) =>
      {
        if(!e.target.value)
        {
          return;
        }

        try
        {
          await addServiceToPaymentApi(
            editingPayment.id,
            e.target.value
          );

          await handleEdit(
            editingPayment
          );

          await loadPayments();
        }
        catch(error)
        {
          console.error(error);
        }
      }}
    >
      <option value="">
        + Add Service
      </option>

      {allServices.map(service => (

        <option
          key={service.id}
          value={service.id}
        >
          {service.name}
          {" - ₱"}
          {service.price}
        </option>

      ))}
    </select>

  )}

  {editForm.payment_status === "cancelled" ? (

  <button
    className="btn-reinstate"
    onClick={handleReinstate}
  >
    Reinstate Appointment
  </button>

) : (

  editForm.payment_status !== "paid" &&
  editForm.status !== "rejected" && (

    <button
      className="btn-cancel-payment"
      onClick={handleCancelPayment}
    >
      Cancel / No Show
    </button>

  )

)}

  {editForm.payment_status !== "cancelled" &&
 editForm.status !== "rejected" && (

    editForm.payment_status === "paid" ? (

      <button
        className="btn-warning"
        onClick={handleUndoPaid}
      >
        Undo Fully Paid
      </button>

    ) : (

      <button
        className="btn-save"
        onClick={handleMarkPaid}
      >
        Mark Fully Paid
      </button>

    )

  )}

  <button
  className="btn-save"
  onClick={() =>
    handleGenerateInvoice()
  }
>
  Download Invoice PDF
</button>

{editForm.payment_status === "paid" && (

  <button
  className="btn-save"
  onClick={() =>
    handleGenerateOfficialReceipt()
  }
>
  Download Official Receipt
</button>

)}

<button
  className="btn-save"
  onClick={() =>
    setShowReceipt(true)
  }
>
  View Dowmpayment Receipt
</button>

  <button
    className="btn-cancel-edit"
    onClick={handleCancel}
  >
    Close
  </button>

</div>

      </div>
      {showReceipt && (
  <div
    className="modal-overlay"
    onClick={() =>
      setShowReceipt(false)
    }
  >
    <div className="payment-modal receipt-modal"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <div className="modal-header">
        <h3>Receipt Preview</h3>
      </div>

      <div
  className="modal-body"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "auto",
    maxHeight: "80vh",
    padding: "20px"
  }}
>

<img
  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${editForm.receipt_url}`}
  alt="Receipt"
  onClick={() =>
    window.open(
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${editForm.receipt_url}`,
      "_blank"
    )
  }
  style={{
    width: "auto",
    maxWidth: "100%",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: "10px",
    cursor: "zoom-in"
  }}
/>
      </div>

      <div className="modal-footer">
        <a
  href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${editForm.receipt_url}`}
  download
  target="_blank"
  rel="noopener noreferrer"
  className="btn-save"
>
  Download Receipt
</a>
        <button
          className="btn-cancel-edit"
          onClick={() =>
            setShowReceipt(false)
          }
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
)}
    </div>
  );
}

export default Payment;