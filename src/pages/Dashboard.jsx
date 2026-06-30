import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";

import {
  getAppointmentStatsApi,
  getTreatmentStatsApi,
  getBalancesApi,
  getAppointmentsApi
} from "../api/appointments";

function Dashboard() 
{
  const navigate = useNavigate();
  const { permissions = {} } = useAuth();
  const [period, setPeriod] = useState("Week");
  const [patientsWithBalance, setPatientsWithBalance] = useState([]);
  const [stats, setStats] = useState({
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    pendingVerification: 0,
    revenue: 0,
  });
  const [clinicFilter, setClinicFilter] = useState("All");
  const [treatments, setTreatments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);

  const [reminders] = useState([
    { id: 1, type: "appointment", text: "Maria Santos — cleaning at 2:00 PM today" },
    { id: 2, type: "followup", text: "Carlos Reyes — overdue for 6-month checkup" },
    { id: 3, type: "note", text: "Restock anesthetic supplies before Friday" },
    { id: 4, type: "appointment", text: "Anna Cruz — root canal follow-up tomorrow" },
    { id: 5, type: "followup", text: "Jake Tan — balance unpaid for 30+ days" },
  ]);

  const reminderTypeLabel = 
  {
    appointment: "Appointment",
    followup: "Follow-up",
    note: "Note",
  };

  const leaveIcon = 
  {
    "Sick Leave": "🤒",
    "Vacation Leave": "🏖️",
    "Emergency Leave": "🚨",
    "Maternity / Paternity Leave": "👶",
  };

  const can = (module, action) => 
  {
    return permissions[module]?.includes(action);
  };

  const fetchStats = async () =>
{
  console.log("fetchStats() started");

  try
  {
    const response =
      await getAppointmentStatsApi(
        period.toLowerCase(),
        clinicFilter
      );

    console.log(
      "STATS RESPONSE:",
      response
    );

    setStats(
      response.stats
    );
  }
  catch(error)
  {
    console.error(
      "fetchStats ERROR:",
      error
    );
  }
};

  const fetchBalances = async () => 
  {
    try 
    {
      const response = await getBalancesApi();
      setPatientsWithBalance(response.patients || []);
    } 
    catch (error) 
    {
      console.error(error);
    }
  };

  const fetchPendingAppointments = async () =>
{
  try
  {
    const response =
      await getAppointmentsApi();

    const pending =
      (response.appointments || []).filter(
        appointment =>
          appointment.status ===
          "pending_verification"
      );

    setPendingAppointments(
      pending
    );
  }
  catch(error)
  {
    console.error(error);
  }
};

const fetchTreatments = async () =>
{
  try
  {
    const response =
      await getTreatmentStatsApi(
        period.toLowerCase(),
        clinicFilter
      );

    setTreatments(
      response.treatments || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
};

useEffect(() =>
{
  fetchStats();
  fetchBalances();
  fetchPendingAppointments();
  fetchTreatments();
}, [period, clinicFilter]);

  const totalBalance = patientsWithBalance.reduce(
    (sum, p) => sum + Number(p.remaining_balance),
    0
  );

  const dateRangeLabel = () => 
  {
    const now = new Date();

    if (period === "Day") 
    {
      return now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    if (period === "Week") 
    {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `${fmt(start)} – ${fmt(end)}`;
    }

    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const goToDentistLeave = () => 
  {
    navigate("/users");
  };

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="dashboard-content">
          <div className="dash-row-filter">
            <div className="filter-pill">
              <div className="filter-buttons">
                {["Month", "Week", "Day"].map((p) => (
                  <button key={p} className={period === p ? "active" : ""} onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="date-range-pill">{dateRangeLabel()}</div>
          </div>

          <div className="dash-three-col">
            <div className="col-left">

              {can("payments", "view") && (
                <div className="payments-card">
                  <div className="pending-icon-wrap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FA1377" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                  </div>

                  <div className="pending-info">
                    <div className="pending-header">Pending Appointments</div>
                    <div className="pending-count">{stats.pendingVerification}</div>
                    <div className="pending-sub">Awaiting verification</div>
                  </div>
                  <button
                    className="pending-review-btn"
                    onClick={() =>
                    navigate("/calendar")
                    }
                    >
                    Review →
                    </button>
                </div>
              )}

              {can("payments", "view") && (
                <div className="balance-card">
                  <div className="balance-card-header">
                    <h3>Patients w/ Balance</h3>
                    <span className="see-all" onClick={() => navigate("/payments")}>See All</span>
                  </div>
                  {patientsWithBalance.length === 0 ? (
                    <div className="empty-placeholder">No outstanding balances</div>
                  ) : (
                    <div className="balance-summary">
                      <div className="balance-summary-stat">
                        <div className="balance-summary-value">{patientsWithBalance.length}</div>
                        <div className="balance-summary-label">patients</div>
                      </div>

                      <div className="balance-summary-divider" />
                      <div className="balance-summary-stat">
                        <div className="balance-summary-value pink">₱{totalBalance.toLocaleString()}</div>
                        <div className="balance-summary-label">total owed</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="reminders-card">
                <div className="reminders-card-header"><h3>Reminders</h3></div>
                {reminders.length === 0 ? (
                  <div className="empty-placeholder">No reminders right now</div>
                ) : (
                  <div className="reminders-list">
                    {reminders.map((r) => (
                      <div className="reminder-item" key={r.id}>
                        <span className={`reminder-dot reminder-dot-${r.type}`} />
                        <span className={`reminder-tag reminder-tag-${r.type}`}>{reminderTypeLabel[r.type]}</span>
                        <span className="reminder-text">{r.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="col-center">

              {can("inbox", "view") && (
                <div className="inbox-card">
                  <div className="inbox-header-row">
                    <div className="inbox-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16v16H4z"/>
                        <path d="M4 6l8 6 8-6"/>
                      </svg>
                    </div>

                    <div className="inbox-info">
                      <div className="inbox-header">Inbox</div>
                      <div className="inbox-count">0</div>
                      <div className="inbox-sub">Unread messages</div>
                    </div>
                    <button className="inbox-open-btn" onClick={() => navigate("/inbox")}>Open →</button>
                  </div>
                </div>
              )}

              {true && (
                <div className="leave-card" onClick={goToDentistLeave} role="button" tabIndex={0}>
                  <div className="leave-card-header-row">
                    <div className="leave-card-icon-wrap">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ED93B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>

                    <div className="leave-card-info">
                      <div className="leave-card-header">Dentist Leave Requests</div>
                      <div className="leave-card-count">0</div>
                      <div className="leave-card-sub">Awaiting your review</div>
                    </div>
                    <span className="leave-card-link">View All →</span>
                  </div>
                </div>
              )}

            </div>

            <div className="col-right">
              <div className="sales-card">
                <div className="sales-header">
                  <h4>Total Sales</h4>
                  <span className="sales-period-badge">{period}</span>
                </div>
                <p className="amount">₱{stats.revenue?.toLocaleString()}</p>
                {can("reports", "view") && (
                  <span className="report-link" onClick={() => navigate("/reports")}>View full report →</span>
                )}
              </div>

              <div className="stats-row">
                <div className="stat-card stat-lpink">
                  <div className="stat-icon-wrap stat-icon-lpink">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ED93B1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>

                  <div className="stat-title">Cancelled</div>
                  <div className="stat-value">{stats.cancelled}</div>
                </div>

                <div className="stat-card stat-lpurp">
                  <div className="stat-icon-wrap stat-icon-lpurp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AFA9EC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>

                  <div className="stat-title">No-shows</div>
                  <div className="stat-value">{stats.noShow}</div>
                </div>

                <div className="stat-card stat-purple">
                  <div className="stat-icon-wrap stat-icon-purple">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>

                  <div className="stat-title">Scheduled</div>
                  <div className="stat-value">{stats.scheduled}</div>
                </div>

                <div className="stat-card stat-pink">
                  <div className="stat-icon-wrap stat-icon-pink">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FA1377" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>

                  <div className="stat-title">Completed</div>
                  <div className="stat-value">{stats.completed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;