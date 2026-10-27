import { useEffect, useState } from "react";
import "../../styles/users.css";

function Logs() 
{
  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
  useState(1);

  const [total, setTotal] =
    useState(0);

  const totalPages =
  Math.max(
    1,
    Math.ceil(total / 5)
  );

  const visiblePageCount = 5;

const startPage = Math.max(
  1,
  Math.min(
    page - Math.floor(visiblePageCount / 2),
    totalPages - visiblePageCount + 1
  )
);

const pageNumbers = Array.from(
  { length: Math.min(totalPages, visiblePageCount) },
  (_, i) => startPage + i
);

  const [appliedFilters, setAppliedFilters] =
  useState({
    user:"",
    role:"All Roles",
    action:"All Actions"
  });

  const [filters, setFilters] =
    useState({
      user: "",
      role: "All Roles",
      action: "All Actions"
    });

 
useEffect(() => {
  const controller = new AbortController();

  async function fetchLogs() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));

      if (appliedFilters.user.trim()) {
        params.set("user", appliedFilters.user.trim());
      }

      if (appliedFilters.role !== "All Roles") {
        params.set("role", appliedFilters.role);
      }

      if (appliedFilters.action !== "All Actions") {
        params.set("action", appliedFilters.action);
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/logs?${params.toString()}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user logs");
      }

      const result = await response.json();

      if (!controller.signal.aborted) {
        setLogs(result.logs || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching logs:", error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  fetchLogs();

  return () => {
    controller.abort();
  };
}, [page, appliedFilters]);

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>User Logs</h2>
      </div>

      <div className="users-page-container">
        <div className="users-filter-container">

  <div className="filter-left">

    <div className="filter-row">

      <span className="filter-label">
        User
      </span>

      <input
        type="text"
        placeholder="Search user..."
        value={filters.user}
        onChange={(e)=>
          setFilters({
            ...filters,
            user:e.target.value
          })
        }
      />

      <span className="filter-label">
        Role
      </span>

      <select
        value={filters.role}
        onChange={(e)=>
          setFilters({
            ...filters,
            role:e.target.value
          })
        }
      >
        <option>
          All Roles
        </option>

        <option>
          Admin
        </option>

        <option>
          Staff
        </option>

      </select>

      <span className="filter-label">
        Action
      </span>

      <select
        value={filters.action}
        onChange={(e)=>
          setFilters({
            ...filters,
            action:e.target.value
          })
        }
      >

        <option>
          All Actions
        </option>

        {
          [
            "Login",
            "Logout",
            "Create User",
            "Update User",
            "Archive User",
            "Restore User",
            "Create Appointment"
          ].map(action => (

            <option
              key={action}
            >
              {action}
            </option>

          ))
        }

      </select>

      <button
  className="btn-go"
  onClick={() => {
    setAppliedFilters({ ...filters });
    setPage(1);
  }}
>
  Search
</button>

      <button
  className="btn-reset"
  onClick={() => {
    const reset = {
      user: "",
      role: "All Roles",
      action: "All Actions"
    };

    setFilters(reset);
    setAppliedFilters(reset);
    setPage(1);
  }}
>
  Reset
</button>

    </div>

  </div>

</div>
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

    Showing

    {" "}

    {total === 0 ? 0 : (page - 1) * 5 + 1}

    -

    {Math.min(page * 5, total)}

    {" "}of{" "}

    {total}

    logs

  </div>

  <div className="users-pagination">

  <button
    disabled={page === 1}
    onClick={() =>
      setPage(page - 1)
    }
  >
    Previous
  </button>

  {
  pageNumbers.map(number => (

      <button
        key={number}
        className={
          page === number
            ? "page-active"
            : ""
        }
        onClick={() =>
          setPage(number)
        }
      >
        {number}
      </button>

    ))
}

  <button
    disabled={
      page === totalPages
    }
    onClick={() =>
      setPage(page + 1)
    }
  >
    Next
  </button>

</div>

</div>
      </div>
    </div>
  );
}

export default Logs;