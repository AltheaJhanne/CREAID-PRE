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
      <Route path="/myaccount" element={<MyAccount />} />
      <Route path="/patients/new" element={<NewPatient />} />
      <Route element={<Layout />}>
      <Route path="/reports/appointments" element={<Appointments />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/users" element={<Userlist />} /> 
      <Route path="/users/patients" element={<Patients />} />
      <Route path="/users/dentists" element={<Dentists />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/system" element={<SystemData />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/users/logs" element={<Logs />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/collections" element={<Collections />} />
      <Route path="/reports/expenses" element={<Expenses />} />
      <Route path="/reports/daily" element={<Daily />} />
            </Route>
    </Routes>
    </>
  );
}

export default App; 

