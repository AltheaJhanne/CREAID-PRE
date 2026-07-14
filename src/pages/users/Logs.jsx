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

  const pageNumbers =
[
  ...Array(totalPages)
].map(
  (_, i) => i + 1
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

  useEffect(() =>
{
    fetchLogs();
},
[
    page,
    appliedFilters
]);

async function fetchLogs(
    currentPage = page
)
{
  setLoading(true);

  try
  {
    const params =
      new URLSearchParams();

    params.set(
    "page",
    currentPage
);

    if(appliedFilters.user)
    {
      params.set(
      "user",
      appliedFilters.user
    );
    }

    if(
      appliedFilters.role !==
      "All Roles"
    )
    {
      params.set(
      "role",
      appliedFilters.role
    );
    }

    if(
      appliedFilters.action !==
      "All Actions"
    )
    {
      params.set(
      "action",
      appliedFilters.action
    );
    }

    const response =
      await fetch(
        `${import.meta.env.VITE_API_URL}/users/logs?${params.toString()}`
      );

    const result =
      await response.json();

    setLogs(
      result.logs || []
    );

    setTotal(
      result.total || 0
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
            "Restore User"
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
        onClick={() =>
{
    setAppliedFilters(filters);

    setPage(1);

    if(page === 1)
    {
        fetchLogs(1);
    }
}}
      >
        Search
      </button>

      <button
        className="btn-reset"
        onClick={() =>
{
    const reset =
    {
        user: "",
        role: "All Roles",
        action: "All Actions"
    };

    setFilters(reset);

    setAppliedFilters(reset);

    setPage(1);

    if(page === 1)
    {
        fetchLogs(1);
    }
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

    {(page - 1) * 5 + 1}

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
  pageNumbers
    .slice(0, 5)
    .map(number => (

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