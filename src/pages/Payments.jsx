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
  const [showAddService, setShowAddService] = useState(false);
const [addingServiceId, setAddingServiceId] = useState(null);
  const [filterStatus, setFilterStatus] =
  useState("");
  const [filterMethod, setFilterMethod] =
  useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
  setCurrentPage(1);
}, [
  clinicFilter,
  filterStatus,
  filterMethod,
  searchTerm
]);

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

  const totalPages = Math.max(
  1,
  Math.ceil(filteredPayments.length / PAGE_SIZE)
);

const visiblePageCount = 5;

const startPage = Math.max(
  1,
  Math.min(
    currentPage - Math.floor(visiblePageCount / 2),
    totalPages - visiblePageCount + 1
  )
);

const pageNumbers = Array.from(
  { length: Math.min(totalPages, visiblePageCount) },
  (_, i) => startPage + i
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
  <i className="bi bi-pencil-square" aria-hidden="true"></i>
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
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage(currentPage - 1)
    }
  >
    ‹
  </button>

  {pageNumbers.map((number) => (
    <button
      key={number}
      className={`payment-page-btn ${
        currentPage === number
          ? "pagination-active"
          : ""
      }`}
      onClick={() =>
        setCurrentPage(number)
      }
    >
      {number}
    </button>
  ))}

  <button
    className="payment-page-btn"
    disabled={currentPage === totalPages}
    onClick={() =>
      setCurrentPage(currentPage + 1)
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

      
<div className="modal-body payment-details-body">

  {/* PATIENT INFORMATION + PAYMENT SUMMARY */}
  <div className="payment-details-top">

    {/* PATIENT INFORMATION */}
    <section className="payment-details-card">
      <div className="payment-details-section-heading">
        <i className="bi bi-person-circle" aria-hidden="true"></i>
        <h4>Patient Information</h4>
      </div>

      <div className="payment-details-patient">
        <div className="payment-details-avatar">
          {getInitials(editForm.guest_name)}
        </div>

        <div>
          <h5>{editForm.guest_name || "—"}</h5>
          <span>Patient</span>
        </div>
      </div>

      <div className="payment-details-info-grid">
        <div>
          <label>Clinic Branch</label>
          <p>{editForm.branch_id || "—"}</p>
        </div>

        <div>
          <label>Appointment Date</label>
          <p>{editForm.appointment_date || "—"}</p>
        </div>

        <div>
          <label>Invoice Number</label>
          <p>{editForm.invoice_number || "—"}</p>
        </div>
      </div>
    </section>

    {/* PAYMENT SUMMARY */}
    <section className="payment-details-card">
      <div className="payment-details-section-heading payment-details-purple">
        <i className="bi bi-credit-card" aria-hidden="true"></i>
        <h4>Payment Summary</h4>
      </div>

      <div className="payment-details-summary-grid">
        <div className="payment-details-summary-field">
          <label>Total Amount</label>
          <p>
            ₱{Number(editForm.total_amount || 0).toLocaleString()}
          </p>
        </div>

        <div className="payment-details-summary-field">
          <label>Amount Paid</label>
          <p>
            ₱{Number(editForm.amount_paid || 0).toLocaleString()}
          </p>
        </div>

        <div className="payment-details-summary-field">
          <label>Remaining Balance</label>
          <p className="payment-details-balance">
            ₱{Number(editForm.remaining_balance || 0).toLocaleString()}
          </p>
        </div>

        <div className="payment-details-summary-field">
          <label>Payment Status</label>
          <p
            className={`payment-status-display ${editForm.payment_status?.toLowerCase()}`}
          >
            {formatStatus(editForm.payment_status)}
          </p>
        </div>

        <div className="payment-details-summary-field payment-details-full">
          <label>Mode of Payment</label>

          {editForm.status === "rejected" ? (
            <p className="payment-details-readonly-method">
              {editForm.payment_method || "—"}
            </p>
          ) : (
            <select
              className="modal-input"
              value={editForm.payment_method || ""}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  payment_method: e.target.value,
                })
              }
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="Card">Card</option>
            </select>
          )}
        </div>
      </div>
    </section>
  </div>

  {/* SERVICES AVAILED */}
  
<section className="payment-details-card payment-details-services">
  
<div className="payment-details-section-heading pd-services-heading">
  <div className="pd-services-heading-title">
    <i className="bi bi-clipboard2-pulse" aria-hidden="true"></i>
    <h4>Services Availed</h4>
  </div>

  {editForm.payment_status !== "cancelled" &&
    editForm.payment_status !== "paid" &&
    editForm.status !== "rejected" && (
      <button
        type="button"
        className="pd-add-service-trigger"
        onClick={() => setShowAddService(true)}
      >
        <i className="bi bi-plus-circle"></i>
        Add Service
      </button>
    )}
</div>

  <div className="payment-details-service-table">
    <div className="payment-details-service-header">
      <span>Service Name</span>
      <span>Price</span>
      <span>Action</span>
    </div>

    {services.length > 0 ? (
      services.map((service) => (
        <div
          className="payment-details-service-row"
          key={service.id}
        >
          <span className="payment-details-service-name">
            {service.service_name}

            {service.service_status === "not_performed" && (
              <span className="payment-details-not-performed-label">
                Not Performed
              </span>
            )}
          </span>

          <strong>
            ₱{Number(service.price).toLocaleString()}
          </strong>

          <div className="payment-details-service-action">
            {editForm.payment_status !== "cancelled" &&
            editForm.payment_status !== "paid" &&
            editForm.status !== "rejected" ? (
              service.service_status === "not_performed" ? (
                <button
                  type="button"
                  className="btn-performed"
                  onClick={() => handlePerformed(service)}
                >
                  Undo
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-not-performed"
                  onClick={() => handleNotPerformed(service)}
                >
                  Not Performed
                </button>
              )
            ) : (
              <span className="payment-details-no-action">—</span>
            )}
          </div>
        </div>
      ))
    ) : (
      <div className="payment-details-empty">
        No services found.
      </div>
    )}
  </div>
</section>
</div>

{/* FOOTER ACTIONS */}
<div className="modal-footer payment-details-footer">


{/* ADD SERVICE SELECTION PANEL */}
{showAddService && (
  <div
    className="pd-service-overlay"
    onClick={() => setShowAddService(false)}
  >
    <div
      className="pd-service-picker"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pd-service-picker-header">
        <div>
          <h4>Select a Service</h4>
          <p>Choose a service to add to this payment.</p>
        </div>

        <button
          type="button"
          className="pd-service-picker-close"
          onClick={() => setShowAddService(false)}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <div className="pd-service-picker-list">
        {allServices.length > 0 ? (
          allServices.map((service) => (
            <div
              className="pd-service-picker-item"
              key={service.id}
            >
              <div className="pd-service-picker-info">
                <span className="pd-service-picker-name">
                  {service.name}
                </span>

                <span className="pd-service-picker-price">
                  ₱{Number(service.price || 0).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                className="pd-service-picker-add"
                disabled={addingServiceId !== null}
                onClick={async () => {
                  try {
                    setAddingServiceId(service.id);

                    // Existing business process
                    await addServiceToPaymentApi(
                      editingPayment.id,
                      service.id
                    );

                    // Existing payment and service refresh
                    const updatedPayments = await loadPayments();

                    const updatedPayment = updatedPayments.find(
                      (p) => p.id === editingPayment.id
                    );

                    await handleEdit(
                      updatedPayment || editingPayment
                    );

                    setShowAddService(false);
                  } catch (error) {
                    console.error(
                      "Error adding service:",
                      error
                    );
                  } finally {
                    setAddingServiceId(null);
                  }
                }}
              >
                <i className="bi bi-plus-lg"></i>
                {addingServiceId === service.id
                  ? "Adding..."
                  : "Add"}
              </button>
            </div>
          ))
        ) : (
          <p className="pd-service-picker-empty">
            No available services found.
          </p>
        )}
      </div>
    </div>
  </div>
)}

  {/* ACTION BUTTONS */}
  <div className="payment-details-footer-actions">

    {editForm.payment_status === "cancelled" ? (
      <button
        type="button"
        className="payment-details-action payment-details-action-green"
        onClick={handleReinstate}
      >
        <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
        Reinstate Appointment
      </button>
    ) : (
      editForm.payment_status !== "paid" &&
      editForm.status !== "rejected" && (
        <button
          type="button"
          className="payment-details-action payment-details-action-red"
          onClick={handleCancelPayment}
        >
          <i className="bi bi-x-circle" aria-hidden="true"></i>
          Cancel / No Show
        </button>
      )
    )}

    {editForm.payment_status !== "cancelled" &&
      editForm.status !== "rejected" &&
      (editForm.payment_status === "paid" ? (
        <button
          type="button"
          className="payment-details-action payment-details-action-amber"
          onClick={handleUndoPaid}
        >
          <i className="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
          Undo Fully Paid
        </button>
      ) : (
        <button
          type="button"
          className="payment-details-action payment-details-action-green"
          onClick={handleMarkPaid}
        >
          <i className="bi bi-check-circle" aria-hidden="true"></i>
          Mark Fully Paid
        </button>
      ))}

    <button
      type="button"
      className="payment-details-action payment-details-action-purple"
      onClick={handleGenerateInvoice}
    >
      <i className="bi bi-file-earmark-arrow-down" aria-hidden="true"></i>
      Download Invoice PDF
    </button>

    {editForm.payment_status === "paid" && (
      <button
        type="button"
        className="payment-details-action payment-details-action-purple"
        onClick={handleGenerateOfficialReceipt}
      >
        <i className="bi bi-receipt" aria-hidden="true"></i>
        Download Official Receipt
      </button>
    )}

    <button
      type="button"
      className="payment-details-action payment-details-action-pink"
      onClick={() => setShowReceipt(true)}
    >
      <i className="bi bi-receipt-cutoff" aria-hidden="true"></i>
      View Downpayment Receipt
    </button>

    <button
      type="button"
      className="payment-details-action payment-details-action-close"
      onClick={handleCancel}
    >
      <i className="bi bi-x-lg" aria-hidden="true"></i>
      Close
    </button>

  </div>
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