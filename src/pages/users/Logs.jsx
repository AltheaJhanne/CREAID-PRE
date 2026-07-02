import { useEffect, useState } from "react";
import "../../styles/users.css";

function Logs() 
{
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => 
  {
    fetchLogs();
  }, []);

  async function fetchLogs() 
  {
    setLoading(true);

    try
    {
      const response =
        await fetch(
          `${import.meta.env.VITE_API_URL}/users/logs`
        );

      const result =
        await response.json();

      console.log(
        "LOGS RESPONSE:",
        result
      );

      setLogs(
        result.logs || []
      );
    }
    catch(error)
    {
      console.error(error);
    }

    setLoading(false);
  }

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>User Logs</h2>
      </div>

      <div className="users-page-container">
        <div className="users-table">
          <div className="logs-table-header">
            <span>#</span>
            <span>User</span>
            <span>Role</span>
            <span>Action</span>
            <span>Description</span>
            <span>Date / Time</span>
          </div>

          {loading ? (
            <div className="users-empty">
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="users-empty">
              No logs found.
            </div>
          ) : (
            logs.map((log, i) => (
              <div
                key={log.id}
                className="logs-table-row"
              >
                <span>{i + 1}</span>

                <span className="link">
                  {log.user_name}
                </span>

                <span>{log.role}</span>

                <span>
                  <span
                    className={`log-badge log-badge-${log.action
                      ?.toLowerCase()
                      ?.replaceAll(" ", "-")}`}
                  >
                    {log.action}
                  </span>
                </span>

                <span>
                  {log.description}
                </span>

                <span>
                  {new Date(
                    log.created_at
                  ).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="users-footer">
          <div>
            Total Logs: {logs.length}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logs;