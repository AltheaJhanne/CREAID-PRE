import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => 
{
  const [role, setRole] = useState(localStorage.getItem("role"));

  const permissions = 
  {
    tester: 
    {
      dashboard: ["view"],
      calendar: ["view", "manage"],
      users: ["view", "add", "edit", "delete"],
      payments: ["view", "edit", "delete"],
      reports: ["view", "generate", "export"],
      system: ["view", "edit", "configure"],
      inbox: ["view", "send"],
    },
    admin: 
    {
      dashboard: ["view"],
      calendar: ["view", "manage"],
      users: ["view", "add", "edit", "delete"],
      payments: ["view", "edit", "delete"],
      reports: ["view"],
      system: ["view", "edit"],
      inbox: ["view", "send"],
    },
    staff: 
    {
      dashboard: ["view"],
      calendar: ["view"],
      users: ["view"],
      payments: ["view"],
      reports: [],
      system: [],
      inbox: ["view", "send"],
    },
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole, // ✅ expose this
        permissions: permissions[role] || {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);