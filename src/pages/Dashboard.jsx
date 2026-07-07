import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, CalendarDays, CreditCard, Database, Inbox, Users } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { getAppointmentStatsApi, getBalancesApi } from "../api/appointments";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { permissions = {} } = useAuth();
  const [stats, setStats] = useState({
    scheduled: 0,
    pendingVerification: 0,
  });
  const [patientsWithBalance, setPatientsWithBalance] = useState([]);

  const can = (module, action = "view") => permissions[module]?.includes(action);

  useEffect(() => {
    async function loadDashboardBadges() {
      try {
        const [statsResponse, balancesResponse] = await Promise.all([
          getAppointmentStatsApi("week", "All"),
          getBalancesApi("All"),
        ]);

        setStats(statsResponse.stats || {});
        setPatientsWithBalance(balancesResponse.patients || []);
      } catch (error) {
        console.error("Dashboard badges failed:", error);
      }
    }

    loadDashboardBadges();
  }, []);

  const cards = useMemo(() => [
    {
      id: "calendar",
      title: "Calendar",
      icon: CalendarDays,
      to: "/calendar",
      className: "dashboard-tile-blue",
      badge: stats.pendingVerification || stats.scheduled || 0,
      module: "calendar",
    },
    {
      id: "users",
      title: "Users",
      icon: Users,
      to: "/users",
      className: "dashboard-tile-indigo",
      module: "users",
    },
    {
      id: "payments",
      title: "Payments",
      icon: CreditCard,
      to: "/payments",
      className: "dashboard-tile-teal",
      badge: patientsWithBalance.length,
      module: "payments",
    },
    {
      id: "reports",
      title: "Reports",
      icon: BarChart3,
      to: "/reports",
      className: "dashboard-tile-navy",
      module: "reports",
    },
    {
      id: "system",
      title: "System Data",
      icon: Database,
      to: "/system",
      className: "dashboard-tile-gold",
      module: "system",
    },
    {
      id: "inbox",
      title: "Inbox",
      icon: Inbox,
      to: "/inbox",
      className: "dashboard-tile-coral",
      module: "inbox",
    },
  ], [patientsWithBalance.length, stats.pendingVerification, stats.scheduled]);

  const visibleCards = cards.filter((card) => can(card.module));

  return (
    <div className="admin-container">
      <div className="admin-main">
        <main className="dashboard-tile-page">
          <div className="dashboard-tile-grid" aria-label="Dashboard modules">
            {visibleCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  type="button"
                  key={card.id}
                  className={`dashboard-tile ${card.className}`}
                  onClick={() => navigate(card.to)}
                >
                  {Number(card.badge || 0) > 0 && (
                    <span className="dashboard-tile-badge">{card.badge}</span>
                  )}
                  <span className="dashboard-tile-icon"><Icon size={34} strokeWidth={2.3} /></span>
                  <span className="dashboard-tile-title">{card.title}</span>
                  <span className="dashboard-tile-action">View <ArrowRight size={18} /></span>
                </button>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;