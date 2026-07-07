import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MyAccount from "./pages/settings/MyAccount";
import Services from "./pages/Services";
import Aboutus from "./pages/Aboutus";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Calendar from "./pages/Calendar";
import Userlist from "./pages/Userlist";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import SystemData from "./pages/SystemData";
import Inbox from "./pages/Inbox";
import NewPatient from "./pages/NewPatient";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/users/Logs";
import Daily from "./pages/reports/Daily";
import Collections from "./pages/reports/collections";
import Expenses from "./pages/reports/expenses";
import Appointments from "./pages/reports/appointments";
import Patients from "./pages/users/Patients";
import Dentists from "./pages/users/Dentists";
import Layout from "./components/Layout";
import Terms from "./pages/Terms";
import Scroll from "./Scroll"; 
import Navbar from "./Navbar";
import { supabase } from './lib/supabase';
import Appointment from "./pages/appointment";
import CancelAppointment from "./pages/CancelAppointment";
import ProtectedRoute from "./components/ProtectedRoute";

async function testConnection() {
  const { data, error } = await supabase.auth.getSession()
  console.log('SESSION:', data)
  console.log('ERROR:', error)
}

testConnection()


function App() 
{
  const location = useLocation()

  const hideNavbar =
  location.pathname === '/login' ||
  location.pathname === '/users'  ||
  location.pathname === '/patients/new'  ||
  location.pathname === '/dashboard'  ||
  location.pathname === '/myaccount'  ||
  location.pathname === '/calendar'  ||
  location.pathname === '/payments'  ||
  location.pathname === '/system'  ||
  location.pathname === '/inbox'  ||
  location.pathname === '/users/logs'  ||
  location.pathname === '/reports'  ||
  location.pathname === '/reports/daily'  ||
  location.pathname === '/reports/collections'  ||
  location.pathname === '/reports/expenses'  ||
  location.pathname === '/reports/appointments' ||
  location.pathname === '/users/patients' ||
  location.pathname === '/users/dentists' ||
  location.pathname === '/reports/Daily' ||
  location.pathname === '/components/Layout';
  return (
    <>
      {!hideNavbar && <Navbar />}
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/aboutus" element={<Aboutus />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/appointment" element={<Appointment />} />
      <Route path="/cancel/:token" element={<CancelAppointment />} />
      <Route
      path="/myaccount"
      element={
        <ProtectedRoute
          allowedRoles={[
            "admin",
            "staff",
            "tester"
          ]}
        >
          <MyAccount />
        </ProtectedRoute>
      }
    />
      <Route
  element={
    <ProtectedRoute
      allowedRoles={[
        "admin",
        "staff",
        "tester"
      ]}
    >
      <Layout />
    </ProtectedRoute>
  }
>
      <Route
      path="/patients/new"
      element={
        <ProtectedRoute
          allowedRoles={[
            "admin",
            "staff",
            "tester"
          ]}
        >
          <NewPatient />
        </ProtectedRoute>
      }
    />
      <Route
      path="/dashboard"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Dashboard />
        </ProtectedRoute>
      }
    />
      <Route
      path="/calendar"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Calendar />
        </ProtectedRoute>
      }
    />
      <Route
      path="/users"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Userlist />
        </ProtectedRoute>
      }
    />
      <Route
      path="/users/patients"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Patients />
        </ProtectedRoute>
      }
    />
      <Route
      path="/users/dentists"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Dentists />
        </ProtectedRoute>
      }
    />
      <Route
      path="/payments"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Payments />
        </ProtectedRoute>
      }
    />
      <Route
      path="/system"
      element={
        <ProtectedRoute
          allowedRoles={[
            "admin",
            "staff",
            "tester"
          ]}
        >
          <SystemData />
        </ProtectedRoute>
      }
    />
      <Route
      path="/inbox"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "staff", "tester"]}
        >
          <Inbox />
        </ProtectedRoute>
      }
    />
      <Route
      path="/users/logs"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "tester"]}
        >
          <Logs />
        </ProtectedRoute>
      }
    />
      <Route
      path="/reports/appointments"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "tester"]}
        >
          <Appointments />
        </ProtectedRoute>
      }
    />
      <Route
      path="/reports"
      element={
        <ProtectedRoute
          allowedRoles={[
            "admin",
            "tester"
          ]}
        >
          <Reports />
        </ProtectedRoute>
      }
    />
      <Route
      path="/reports/collections"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "tester"]}
        >
          <Collections />
        </ProtectedRoute>
      }
    />
      <Route
      path="/reports/expenses"
      element={
        <ProtectedRoute
          allowedRoles={["admin", "tester"]}
        >
          <Expenses />
        </ProtectedRoute>
      }
    />
      <Route
      path="/reports/daily"
      element={
        <ProtectedRoute
          allowedRoles={[
            "admin",
            "tester"
          ]}
        >
          <Daily />
        </ProtectedRoute>
      }
    />
            </Route>
    </Routes>
    </>
  );
}

export default App; 

