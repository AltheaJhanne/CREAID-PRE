import { useEffect, useState } from "react";
import "../../styles/users.css";

const PAGE_SIZE = 10;

function Logs() 
{
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => 
  {
    fetchLogs();
  }, [page]);

  async function fetchLogs() 
  {
    setLoading(true);
    //waiting sa backend
    setLoading(false);
  }

  const totalPages = Math.ceil(totalLogs / PAGE_SIZE);

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>User Logs</h2>
      </div>

      <div className="users-page-container">
        <div className="users-table">
          <div className="logs-table-header">
            <span>#</span>
            <span>Username</span>
            <span>Role</span>
            <span>IP Address</span>
            <span>Action</span>
            <span>Date / Time</span>
          </div>

          {loading ? (
            <div className="users-empty">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="users-empty">No logs found.</div>
          ) : (
            logs.map((log, i) => (
              <div key={log.id} className="logs-table-row">
                <span>{log.id}</span>
                <span className="link">{log.username}</span>
                <span>{log.role}</span>
                <span className="log-ip">{log.ip}</span>
                <span>
                  <span className={`log-badge log-badge-${log.action?.toLowerCase()}`}>
                    {log.action}
                  </span>
                </span>
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="users-footer">
          <div className="pagination">
            <span className={page === 1 ? "pagination-disabled" : "pagination-btn"} onClick={() => page > 1 && setPage(page - 1)}>
              « Previous
            </span>
            <strong>{page}</strong>
            <span className={page >= totalPages ? "pagination-disabled" : "pagination-btn"} onClick={() => page < totalPages && setPage(page + 1)}>
              Next »
            </span>
          </div>
          <div>Total Logs: {totalLogs}</div>
        </div>
      </div>
    </div>
  );
}

export default Logs;