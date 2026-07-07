import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout()
{
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh"
      }}
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed(prev => !prev)
        }
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0
        }}
      >
        <Topbar />

        <main
        style={{
          flex: 1,
          overflowY: "auto",
          boxSizing: "border-box"
        }}
      >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;