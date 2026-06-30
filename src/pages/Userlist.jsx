import { useEffect, useState } from "react";
import "../styles/users.css";
import 
{
  getUsersApi,
  archiveUserApi,
  restoreUserApi,
  updateUserApi
} 
from "../api/users";

const PAGE_SIZE = 5;

const MEDICAL_CONDITIONS = [
  "kidney problems", "testing", "learning disability", "tuberculosis",
  "bleeding disorder", "brain injury", "tumors", "neurological disorder",
  "ear infection", "skin disorder", "glandular problems", "heart trouble",
  "diabetes", "mental disorder", "asthma", "rheumatic fever",
  "liver problems", "hyperactivity", "seizures", "mental retardation",
];

const DENTAL_HABITS = [
  "night time bottle feeding", "thumb sucking", "tongue thrusting",
  "teeth grinding", "nail biting", "mouth breathing",
];

function getInitials(name)
{
  const parts = name.split(",").map((s) => s.trim());
  const last = parts[0]?.[0] ?? "";
  const first = parts[1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

const AVATAR_COLORS = ["av-pink", "av-blue", "av-teal", "av-amber", "av-purple"];

function getRoleBadgeClass(role)
{
  const map = 
  {
    Patient: "role-patient",
    Staff: "role-staff",
    Dentist: "role-dentist",
    Admin: "role-admin",
  };
  return map[role] ?? "role-default";
}

function Userlist()
{
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  const [filters, setFilters] = useState({ name: "", year: "", type: "" });
  const [appliedFilters, setAppliedFilters] = useState({ name: "", year: "", type: "" });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "", middle_name: "", last_name: "",
    address: "", contact_number: "", birthdate: "",
    sex: "", email: "", blood_type: "", civil_status: "",
    occupation: "", company: "",
  });
  const [guardian, setGuardian] = useState({
    father_name: "", father_occupation: "", father_contact: "",
    mother_name: "", mother_occupation: "", mother_contact: "",
    guardian_name: "", guardian_occupation: "", guardian_contact: "",
  });
  const [medical, setMedical] = useState({
    previous_hospitalizations: "", prescribed_medications: "",
    allergies: "", family_medical_problems: "", other_concerns: "",
    medical_alert: "", conditions: [], dental_habits: [], diet: "",
  });

  useEffect(() =>
  {
    fetchUsers();
  }, [page, appliedFilters, showArchived]);

  async function fetchUsers()
  {
    try
    {
      const result = await getUsersApi({
        page,
        archived: showArchived,
        name: appliedFilters.name,
        role: appliedFilters.type,
        year: appliedFilters.year,
      });

      const formattedUsers = result.users.map((u) => ({
        id: u.id,
        first_name: u.first_name,
        middle_name: u.middle_name,
        last_name: u.last_name,
        name: `${u.last_name}, ${u.first_name}${u.middle_name ? " " + u.middle_name : ""}`,
        address: u.address,
        mobile: u.contact_number,
        role: u.role,
        birthdate: u.birthdate,
        sex: u.sex,
        email: u.email,
        blood_type: u.blood_type,
        civil_status: u.civil_status,
        occupation: u.occupation,
        company: u.company,
        created: new Date(u.created_at).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        lastOnline: "Online",
      }));

      setUsers(formattedUsers);
      setTotalUsers(result.total ?? 0);
    }
    catch (error)
    {
      console.error("Fetch users error:", error);
      alert(error.message);
    }
  }

  async function archiveUser(id)
  {
    if (!window.confirm("Archive this user?")) return;

    try
    {
      await archiveUserApi(id);
      fetchUsers();
    }
    catch (error)
    {
      console.error(error);
      alert(error.message);
    }
  }

  async function restoreUser(id)
  {
    if (!window.confirm("Restore this user?")) return;

    try
    {
      await restoreUserApi(id);
      fetchUsers();
    }
    catch (error)
    {
      console.error(error);
      alert(error.message);
    }
  }

  function editUser(user)
  {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      address: user.address || "",
      contact_number: user.mobile || "",
      birthdate: user.birthdate || "",
      sex: user.sex || "",
      email: user.email || "",
      blood_type: user.blood_type || "",
      civil_status: user.civil_status || "",
      occupation: user.occupation || "",
      company: user.company || "",
    });
    setGuardian({
      father_name: "", father_occupation: "", father_contact: "",
      mother_name: "", mother_occupation: "", mother_contact: "",
      guardian_name: "", guardian_occupation: "", guardian_contact: "",
    });
    setMedical({
      previous_hospitalizations: "", prescribed_medications: "",
      allergies: "", family_medical_problems: "", other_concerns: "",
      medical_alert: "", conditions: [], dental_habits: [], diet: "",
    });
  }

  async function saveEditUser()
  {
    try
    {
      await updateUserApi(editingUser.id, 
      {
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        last_name: editForm.last_name,
        address: editForm.address,
        contact_number: editForm.contact_number,
      });
      setEditingUser(null);
      fetchUsers();
    }
    catch (error)
    {
      console.error(error);
      alert(error.message);
    }
  }

  function toggleCheckbox(field, value)
  {
    setMedical((prev) =>
    {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function handleGo()
  {
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  function handleClear()
  {
    const empty = { name: "", year: "", type: "" };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, totalUsers);
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  const isPatient = editingUser?.role?.toLowerCase() === "patient";

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>{showArchived ? "Archived Users" : "Users"}</h2>
        <span className="users-total-badge">{totalUsers} total users</span>
        <button className="btn-go" style={{ marginLeft: "auto" }} onClick={() => {setShowArchived(!showArchived);  setPage(1);}}>
          {showArchived ? "Show Active Users" : "Show Archived Users"}
        </button>
      </div>

      <div className="users-page-container">
        <div className="users-filter-container">
          <div className="filter-group">
            <label className="filter-field-label">Name</label>
            <input type="text"placeholder="Search by name…"value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleGo()}/>
          </div>
          
          <div className="filter-group">
            <label className="filter-field-label">Year</label>
            <input type="text" placeholder="2024" className="filter-input-narrow" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleGo()}/>
          </div>
          
          <div className="filter-group">
            <label className="filter-field-label">Type</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All</option>
              <option value="Admin">Admin</option>
              <option value="Patient">Patient</option>
              <option value="Staff">Staff</option>
              <option value="Dentist">Dentist</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn-go" onClick={handleGo}>Apply</button>
            <button className="btn-clear" onClick={handleClear}>Clear</button>
          </div>
        </div>

        <div className="users-table">
          <div className="users-table-header">
            <span></span>
            <span></span>
            <span>Name</span>
            <span>ID</span>
            <span>Mobile</span>
            <span>Role</span>
            <span>Created</span>
            <span>Status</span>
          </div>

          {users.length === 0 ? (
            <div className="users-empty">No users found.</div>
          ) : (
            users.map((u, i) => (
              <div key={u.id} className="users-table-row">
                <span className="row-actions">
                  <button className="edit-btn" title="Edit user" onClick={() => editUser(u)}>✏️</button>
                  {showArchived ? (
                    <button className="edit-btn" title="Restore user" onClick={() => restoreUser(u.id)}>↩️</button>
                  ) : (
                    <button className="edit-btn" title="Archive user" onClick={() => archiveUser(u.id)}>📁</button>
                  )}
                </span>
                <span>
                  <div className={`user-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{getInitials(u.name)}</div>
                </span>
                <span className="link">{u.name}</span>
                <span className="id-text">{u.id}</span>
                <span className={!u.mobile ? "text-muted" : ""}>{u.mobile || "—"}</span>
                <span>
                  {u.role && <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>}
                </span>
                <span className="text-muted">{u.created}</span>
                <span>
                  <span className="status-online">
                    <span className="status-dot" />
                    Online
                  </span>
                </span>
              </div>
            ))
          )}
        </div>

        <div className="users-footer">
          <span className="page-info">
            {totalUsers > 0 ? `Showing ${pageStart}–${pageEnd} of ${totalUsers} users` : "No users"}
          </span>
          <div className="pagination">
            <button className={`pagination-btn ${page === 1 ? "pagination-disabled" : ""}`} onClick={() => page > 1 && setPage(page - 1)} disabled={page === 1}>‹</button>
            {pageNumbers.map((n) => (
              <button key={n} className={`pagination-btn ${n === page ? "pagination-active" : ""}`} onClick={() => setPage(n)}>{n}</button>
            ))}
            <button className={`pagination-btn ${page >= totalPages ? "pagination-disabled" : ""}`} onClick={() => page < totalPages && setPage(page + 1)} disabled={page >= totalPages}>›</button>
          </div>
        </div>

      </div>

      {editingUser && (
        <div className="edit-modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingUser(null)}>
          <div className="edit-modal">
            <div className="modal-left">
              <div className={`modal-left-avatar ${AVATAR_COLORS[users.findIndex(u => u.id === editingUser.id) % AVATAR_COLORS.length]}`}>
                {getInitials(`${editingUser.last_name}, ${editingUser.first_name}`)}
              </div>

              <div className="modal-left-name">{editingUser.last_name}, {editingUser.first_name} {editingUser.middle_name}</div>
              <div className="modal-left-meta">
                <span className={`role-badge ${getRoleBadgeClass(editingUser.role)}`}>{editingUser.role}</span>
                <div className="modal-left-id">{editingUser.id}</div>
                <div className="modal-left-row">Created: {editingUser.created}</div>
                <span className="status-online" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  <span className="status-dot" /> Online
                </span>
              </div>
            </div>

            <div className="modal-right">
              <div className="modal-right-header">
                <h3>Edit {isPatient ? "Patient" : "User"}</h3>
                <button className="modal-close-btn" onClick={() => setEditingUser(null)}>✕</button>
              </div>

              <div className="modal-section-title">Personal Information</div>
              <div className="modal-row">
                <div className="modal-field">
                  <label>Full Name</label>
                  <div className="modal-field-static">{`${editForm.last_name}, ${editForm.first_name} ${editForm.middle_name}` || "—"}</div>
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Birthdate</label>
                  <div className="modal-field-static">{editForm.birthdate || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Sex</label>
                  <div className="modal-field-static">{editForm.sex || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Blood Type</label>
                  <div className="modal-field-static">{editForm.blood_type || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Civil Status</label>
                  <div className="modal-field-static">{editForm.civil_status || "—"}</div>
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field" style={{ flex: 2 }}>
                  <label>Address</label>
                  <div className="modal-field-static">{editForm.address || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Contact No.</label>
                  <div className="modal-field-static">{editForm.contact_number || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Email</label>
                  <div className="modal-field-static">{editForm.email || "—"}</div>
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Occupation</label>
                  <div className="modal-field-static">{editForm.occupation || "—"}</div>
                </div>

                <div className="modal-field">
                  <label>Company</label>
                  <div className="modal-field-static">{editForm.company || "—"}</div>
                </div>
              </div>

              {isPatient && (
                <>
                  <div className="modal-section-title">Guardian Information</div>
                  {[
                    { label: "Father", prefix: "father" },
                    { label: "Mother", prefix: "mother" },
                    { label: "Guardian", prefix: "guardian" },
                  ].map(({ label, prefix }) => (
                    <div className="modal-row" key={prefix}>
                      <div className="modal-field">
                        <label>{label}'s Name</label>
                        <div className="modal-field-static">{guardian[`${prefix}_name`] || "—"}</div>
                      </div>

                      <div className="modal-field">
                        <label>Occupation</label>
                        <div className="modal-field-static">{guardian[`${prefix}_occupation`] || "—"}</div>
                      </div>

                      <div className="modal-field">
                        <label>Contact No.</label>
                        <div className="modal-field-static">{guardian[`${prefix}_contact`] || "—"}</div>
                      </div>
                    </div>
                  ))}

                  <div className="modal-section-title">Medical Information</div>
                  {[
                    { label: "Previous Hospitalizations", field: "previous_hospitalizations" },
                    { label: "Prescribed Medications", field: "prescribed_medications" },
                    { label: "Allergies to Medications", field: "allergies" },
                    { label: "Family Medical Problems", field: "family_medical_problems" },
                    { label: "Other Medical Concerns", field: "other_concerns" },
                    { label: "Medical Alert", field: "medical_alert" },
                    { label: "Patient's Diet", field: "diet" },
                  ].map(({ label, field }) => (
                    <div className="modal-field" key={field}>
                      <label>{label}</label>
                      <div className="modal-field-static">{medical[field] || "—"}</div>
                    </div>
                  ))}

                  <div className="modal-section-title">Medical Conditions</div>
                  <div className="modal-checkbox-group">
                    {MEDICAL_CONDITIONS.map((c) => (
                      <label key={c}>
                        <input type="checkbox" checked={medical.conditions.includes(c)} onChange={() => toggleCheckbox("conditions", c)} />
                        {c}
                      </label>
                    ))}
                  </div>

                  <div className="modal-section-title">Dental Habits</div>
                  <div className="modal-checkbox-group">
                    {DENTAL_HABITS.map((h) => (
                      <label key={h}>
                        <input type="checkbox" checked={medical.dental_habits.includes(h)} onChange={() => toggleCheckbox("dental_habits", h)} />
                        {h}
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="edit-modal-actions">
                <button className="btn-clear" onClick={() => setEditingUser(null)}>Cancel</button>
                <button className="btn-go" onClick={saveEditUser}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Userlist;