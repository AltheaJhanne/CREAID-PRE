import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/creaid.jpg";
import "../styles/Sidebar.css";

const NAV_ICONS = 
{
  dashboard: "📊",
  calendar:  "📅",
  users:     "👥",
  payments:  "💳",
  reports:   "📈",
  system:    "🗂️",
  inbox:     "📬",
};

function Sidebar({ collapsed, onToggle, mobileClose, isMobileDrawer }) 
{
  const { permissions = {} } = useAuth();
  const [openUsers, setOpenUsers]     = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const navClass = ({ isActive }) => isActive ? "nav-item active" : "nav-item";

  return (
    <div className={`sidebar${collapsed ? " collapsed" : ""}${isMobileDrawer ? " mobile-drawer" : ""}`}>
      <button className="sidebar-toggle" onClick={isMobileDrawer ? mobileClose : onToggle} title={isMobileDrawer ? "Close" : collapsed ? "Expand" : "Collapse"}>
        {isMobileDrawer ? "✕" : collapsed ? "›" : "‹"}
      </button>

      <img src={logo} alt="Logo" className="sidebar-logo" />
      <div className="sidebar-divider" />
      <nav className="sidebar-nav">

        <NavLink to="/dashboard" className={navClass} data-tooltip="Dashboard"
          onClick={isMobileDrawer ? mobileClose : undefined}>
          <span className="nav-icon">{NAV_ICONS.dashboard}</span>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        {permissions.calendar?.includes("view") && (
          <NavLink to="/calendar" className={navClass} data-tooltip="Calendar"
            onClick={isMobileDrawer ? mobileClose : undefined}>
            <span className="nav-icon">{NAV_ICONS.calendar}</span>
            <span className="nav-label">Calendar</span>
          </NavLink>
        )}

        {permissions.users?.includes("view") && (
          <>
            <div className={`nav-item submenu-toggle${openUsers ? " open" : ""}`} data-tooltip="Users" onClick={() => !collapsed && setOpenUsers(!openUsers)}>
              <span className="nav-icon">{NAV_ICONS.users}</span>
              <span className="nav-label">Users</span>
              <span className="chevron-icon">▼</span>
            </div>
            {openUsers && !collapsed && (
              <div className="submenu">
                <NavLink to="/users" end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>All Users</NavLink>
                <NavLink to="/users/patients" end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Patients</NavLink>
                <NavLink to="/users/dentists" end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Dentists</NavLink>
                <NavLink to="/users/logs" end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>User Logs</NavLink>
              </div>
            )}
          </>
        )}

        {permissions.payments?.includes("view") && (
          <NavLink to="/payments" className={navClass} data-tooltip="Payment" onClick={isMobileDrawer ? mobileClose : undefined}>
            <span className="nav-icon">{NAV_ICONS.payments}</span>
            <span className="nav-label">Payment</span>
          </NavLink>
        )}

        {permissions.reports?.includes("view") && (
          <>
            <div className={`nav-item submenu-toggle${openReports ? " open" : ""}`} data-tooltip="Reports" onClick={() => !collapsed && setOpenReports(!openReports)}>
              <span className="nav-icon">{NAV_ICONS.reports}</span>
              <span className="nav-label">Reports</span>
              <span className="chevron-icon">▼</span>
            </div>
            {openReports && !collapsed && (
              <div className="submenu">
                <NavLink to="/reports"              end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Summary</NavLink>
                <NavLink to="/reports/daily"        end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Daily Sales</NavLink>
                <NavLink to="/reports/collections"  end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Collections</NavLink>
                <NavLink to="/reports/expenses"     end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Expenses & Bills</NavLink>
                <NavLink to="/reports/appointments" end className={navClass} onClick={isMobileDrawer ? mobileClose : undefined}>Patient Appointments</NavLink>
              </div>
            )}
          </>
        )}

        {permissions.system?.includes("view") && (
          <NavLink to="/system" className={navClass} data-tooltip="System Data" onClick={isMobileDrawer ? mobileClose : undefined}>
            <span className="nav-icon">{NAV_ICONS.system}</span>
            <span className="nav-label">System Data</span>
          </NavLink>
        )}

        {permissions.inbox?.includes("view") && (
          <NavLink to="/inbox" className={navClass} data-tooltip="Inbox" onClick={isMobileDrawer ? mobileClose : undefined}>
            <span className="nav-icon">{NAV_ICONS.inbox}</span>
            <span className="nav-label">Inbox</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">DentConnect v1.0</p>
      </div>
    </div>
  );
}

export default Sidebar;