import { useEffect, useState } from "react";
import "../styles/users.css";
import
{
  getUsersApi,
  archiveUserApi,
  restoreUserApi,
  updateUserApi,
  getFullPatientApi
}
from "../api/users";

const PAGE_SIZE = 5;

function isUserActive(user)
{
  return user.is_online === true;
}

function formatLastSeen(value) {
  if (!value) return "Never";
  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 60 * 1000) return "just now";
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
const MEDICAL_CONDITIONS = [
  "High Blood Pressure",
  "Low Blood Pressure",
  "Epilepsy / Convulsions",
  "AIDS / HIV Infection",
  "Sexually Transmitted Diseases",
  "Stomach Troubles / Ulcers",
  "Fainting Seizure",
  "Rapid Weight Loss",
  "Radiation Therapy",
  "Joint Replacement / Implant",
  "Sinus Surgery",
  "Heart Attack",
  "Thyroid Problem",
  "Heart Disease",
  "Heart Murmur",
  "Hepatitis / Liver Disease",
  "Rheumatic Fever",
  "Hay Fever / Allergies",
  "Respiratory Problems",
  "Tuberculosis",
  "Kidney Disease",
  "Diabetes",
  "Chest Pain",
  "Stroke",
  "Cancer / Tumors",
  "Anemia",
  "Angina",
  "Emphysema",
  "Bleeding Problems",
  "Head Disease",
  "Head Injuries",
  "Learning Disability",
  "Bleeding Disorder",
  "Brain Injury",
  "Neurological Disorder",
  "Ear Infection",
  "Skin Disorder",
  "Glandular Problems",
  "Mental Disorder",
  "Asthma",
  "Liver Problems",
  "Hyperactivity",
  "Seizures"
];

const DENTAL_HABITS = [
  "Night Time Bottle Feeding",
  "Thumb Sucking",
  "Tongue Thrusting",
  "Teeth Grinding",
  "Nail Biting",
  "Mouth Breathing"
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

function calculateAge(birthdate)
{
  if(!birthdate) return null;

  const today = new Date();
  const birth = new Date(birthdate);

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDiff =
    today.getMonth() -
    birth.getMonth();

  if(
    monthDiff < 0 ||
    (
      monthDiff === 0 &&
      today.getDate() < birth.getDate()
    )
  )
  {
    age--;
  }

  return age;
}

function Userlist()
{
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const currentRole = String(localStorage.getItem("role") || "").toLowerCase();
  const canEditUsers = ["admin", "tester"].includes(currentRole);

  const [filters, setFilters] = useState({ name: "", year: "", type: "" });
  const [appliedFilters, setAppliedFilters] = useState({ name: "", year: "", type: "" });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",

    address: "",
    contact_number: "",

    birthdate: "",
    sex: "",
    email: "",

    bloodtype: "",
    civilstatus: "",

    occupation: "",
    company: ""
});
  const [guardian, setGuardian] = useState({
    father_name: "", father_occupation: "", father_contact: "",
    mother_name: "", mother_occupation: "", mother_contact: "",
    guardian_name: "", guardian_occupation: "", guardian_contact:"",
    physician_name:"", physician_specialty:"", physician_office_address:"", physician_office_number:""
  });
  const [medical, setMedical] = useState({
  last_dental_visit: "",

  good_health: "",
  under_medical_treatment: "",
  medical_treatment_condition: "",

  serious_illness: "",
  serious_illness_details: "",

  hospitalized: "",
  hospitalized_details: "",

  taking_medication: "",
  medication_details: "",

  use_tobacco: "",
  use_alcohol_drugs: "",

  allergy_local_anesthetic: false,
  allergy_latex: false,
  allergy_aspirin: false,
  allergy_penicillin_antibiotics: false,
  allergy_sulfa_drugs: false,
  allergy_others: "",

  bleeding_time: "",

  is_pregnant: "",
  is_nursing: "",
  taking_birth_control: "",

  previous_hospitalizations: "",
  prescribed_medications: "",
  allergies: "",
  family_medical_problems: "",
  other_concerns: "",
  medical_alert: "",
  diet: "",

  conditions: [],
  dental_habits: []
});

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
      bloodtype: u.bloodtype,
      civilstatus: u.civilstatus,
      occupation: u.occupation,
      company: u.company,
        created: new Date(u.created_at).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric",
        }),
        is_archived: Boolean(u.is_archived),
        is_online: u.is_online,
        last_seen_at: u.last_seen_at,
        isActiveNow: isUserActive(u),
        lastOnline:
        u.is_online
          ? "Online"
          : formatLastSeen(u.last_seen_at),
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

  async function editUser(user)
{
  try
  {
    const result =
      await getFullPatientApi(user.id);

    const fullUser =
      result.user;

    const guardianData =
      result.guardian || {};

    const medicalData =
      result.medical || {};

    setEditingUser({
    ...user,
    ...fullUser
  });

    /* -------------------------
       PERSONAL
    -------------------------- */

    setEditForm({
      first_name:
        fullUser.first_name || "",

      middle_name:
        fullUser.middle_name || "",

      last_name:
        fullUser.last_name || "",

      address:
        fullUser.address || "",

      contact_number:
        fullUser.contact_number || "",

      birthdate:
        fullUser.birthdate || "",

      sex:
        fullUser.sex || "",

      email:
        fullUser.email || "",

      bloodtype:
        fullUser.bloodtype || "",

      civilstatus:
        fullUser.civilstatus || "",

      occupation:
        fullUser.occupation || "",

      company:
        fullUser.company || ""
    });

    /* -------------------------
       GUARDIAN
    -------------------------- */

    setGuardian({
      father_name:
        guardianData.father_name || "",

      father_occupation:
        guardianData.father_occupation || "",

      father_contact:
        guardianData.father_contact || "",

      mother_name:
        guardianData.mother_name || "",

      mother_occupation:
        guardianData.mother_occupation || "",

      mother_contact:
        guardianData.mother_contact || "",

      guardian_name:
      guardianData.guardian_name || "",

    guardian_occupation:
      guardianData.guardian_occupation || "",

    guardian_contact:
      guardianData.guardian_contact || "",

    physician_name:
      guardianData.physician_name || "",

    physician_specialty:
      guardianData.physician_specialty || "",

    physician_office_address:
      guardianData.physician_office_address || "",

    physician_office_number:
      guardianData.physician_office_number || ""
    });

    /* -------------------------
       MEDICAL
    -------------------------- */

    setMedical({
  last_dental_visit: medicalData.last_dental_visit || "",

  good_health: medicalData.good_health || "",
  under_medical_treatment: medicalData.under_medical_treatment || "",
  medical_treatment_condition: medicalData.medical_treatment_condition || "",

  serious_illness: medicalData.serious_illness || "",
  serious_illness_details: medicalData.serious_illness_details || "",

  hospitalized: medicalData.hospitalized || "",
  hospitalized_details: medicalData.hospitalized_details || "",

  taking_medication: medicalData.taking_medication || "",
  medication_details: medicalData.medication_details || "",

  use_tobacco: medicalData.use_tobacco || "",
  use_alcohol_drugs: medicalData.use_alcohol_drugs || "",

  allergy_local_anesthetic: Boolean(medicalData.allergy_local_anesthetic),
  allergy_latex: Boolean(medicalData.allergy_latex),
  allergy_aspirin: Boolean(medicalData.allergy_aspirin),
  allergy_penicillin_antibiotics: Boolean(medicalData.allergy_penicillin_antibiotics),
  allergy_sulfa_drugs: Boolean(medicalData.allergy_sulfa_drugs),
  allergy_others: medicalData.allergy_others || "",

  bleeding_time: medicalData.bleeding_time || "",

  is_pregnant: medicalData.is_pregnant || "",
  is_nursing: medicalData.is_nursing || "",
  taking_birth_control: medicalData.taking_birth_control || "",

  previous_hospitalizations: medicalData.previous_hospitalizations || "",
  prescribed_medications: medicalData.prescribed_medications || "",
  allergies: medicalData.allergies || "",
  family_medical_problems: medicalData.family_medical_problems || "",
  other_concerns: medicalData.other_medical_concerns || "",
  medical_alert: medicalData.medical_alert || "",
  diet: medicalData.patient_diet || "",

  conditions: medicalData.conditions || [],
  dental_habits: medicalData.dental_habits || []
});

  }
  catch(error)
  {
    console.error(error);

    alert(error.message);
  }
}

  async function saveEditUser()
{
  try
  {
    const payload =
    {
      user:
      {
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        last_name: editForm.last_name,

        address: editForm.address,
        contact_number: editForm.contact_number,

        birthdate: editForm.birthdate,
        sex: editForm.sex,
        email: editForm.email,

        bloodtype: editForm.bloodtype,
        civilstatus: editForm.civilstatus,

        occupation: editForm.occupation,
        company: editForm.company
      },

    guardian:
    isMinor
    ?
    {
      father_name: guardian.father_name,
      father_occupation: guardian.father_occupation,
      father_contact: guardian.father_contact,

      mother_name: guardian.mother_name,
      mother_occupation: guardian.mother_occupation,
      mother_contact: guardian.mother_contact,

      guardian_name: guardian.guardian_name,
      guardian_occupation: guardian.guardian_occupation,
      guardian_contact: guardian.guardian_contact,

      physician_name:
      guardian.physician_name,

      physician_specialty:
        guardian.physician_specialty,

      physician_office_address:
        guardian.physician_office_address,

      physician_office_number:
        guardian.physician_office_number
    }
    :
    null,

      medical:
{
  last_dental_visit:
    medical.last_dental_visit,

  good_health:
    medical.good_health,

  under_medical_treatment:
    medical.under_medical_treatment,

  medical_treatment_condition:
    medical.medical_treatment_condition,

  serious_illness:
    medical.serious_illness,

  serious_illness_details:
    medical.serious_illness_details,

  hospitalized:
    medical.hospitalized,

  hospitalized_details:
    medical.hospitalized_details,

  taking_medication:
    medical.taking_medication,

  medication_details:
    medical.medication_details,

  use_tobacco:
    medical.use_tobacco,

  use_alcohol_drugs:
    medical.use_alcohol_drugs,

  allergy_local_anesthetic:
    medical.allergy_local_anesthetic,

  allergy_latex:
    medical.allergy_latex,

  allergy_aspirin:
    medical.allergy_aspirin,

  allergy_penicillin_antibiotics:
    medical.allergy_penicillin_antibiotics,

  allergy_sulfa_drugs:
    medical.allergy_sulfa_drugs,

  allergy_others:
    medical.allergy_others,

  bleeding_time:
    medical.bleeding_time,

  is_pregnant:
    medical.is_pregnant,

  is_nursing:
    medical.is_nursing,

  taking_birth_control:
    medical.taking_birth_control,

  previous_hospitalizations:
    medical.previous_hospitalizations,

  prescribed_medications:
    medical.prescribed_medications,

  allergies:
    medical.allergies,

  family_medical_problems:
    medical.family_medical_problems,

  other_medical_concerns:
    medical.other_concerns,

  medical_alert:
    medical.medical_alert,

  patient_diet:
    medical.diet,

  conditions:
    medical.conditions,

  dental_habits:
    medical.dental_habits
}
    };

    console.log("UPDATE PAYLOAD:", payload);

    const result =
      await updateUserApi(
        editingUser.id,
        payload
      );

    console.log(result);

    alert("Patient successfully updated!");

    setEditingUser(null);

    fetchUsers();
  }
  catch(error)
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

  function handleMedicalInput(field, value)
{
  setMedical((prev) => ({
    ...prev,
    [field]: value
  }));
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

  useEffect(() =>
{
  fetchUsers();
}, [page, appliedFilters, showArchived]);

useEffect(() =>
{
  setPage(1);
}, [showArchived]);

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE);
  const pageStart = (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, totalUsers);
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  const isPatient = editingUser?.role?.toLowerCase() === "patient";
  const patientAge =
  calculateAge(editForm.birthdate);

const isMinor =
  patientAge !== null &&
  patientAge < 18;

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
                  {canEditUsers ? (
                    <>
                      <button className="edit-btn" title="Edit user" onClick={() => editUser(u)}>Edit</button>
                      {showArchived ? (
                        <button className="edit-btn" title="Restore user" onClick={() => restoreUser(u.id)}>Restore</button>
                      ) : (
                        <button className="edit-btn" title="Archive user" onClick={() => archiveUser(u.id)}>Archive</button>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">-</span>
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
                  <span className={u.isActiveNow ? "status-online" : "status-offline"} title={`Last seen ${u.lastOnline}`}>
                    <span className="status-dot" />
                    {u.isActiveNow ? "Active" : "Inactive"}
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
                <span className={editingUser.isActiveNow ? "status-online" : "status-offline"} style={{ fontSize: "11px", padding: "2px 8px" }} title={`Last seen ${editingUser.lastOnline}`}>
                  <span className="status-dot" /> {editingUser.isActiveNow ? "Active" : "Inactive"}
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
                {["first_name", "middle_name", "last_name"].map((field) => (
                  <div className="modal-field" key={field}>
                    <label>{field.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</label>
                    <input className="modal-input" value={editForm[field] || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })} />
                  </div>
                ))}
              </div>

              <div className="modal-row">
                {[
                { key: "birthdate", label: "Birthdate", type: "date" },
                { key: "sex", label: "Sex", type: "text" },
                { key: "bloodtype", label: "Blood Type", type: "text" },
                { key: "civilstatus", label: "Civil Status", type: "text" },
              ].map(({ key, label, type }) => (
                <div className="modal-field" key={key}>
                  <label>{label}</label>

                  <input
                    className="modal-input"
                    type={type}
                    value={editForm[key] || ""}
                    disabled={!canEditUsers}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        [key]: e.target.value
                      })
                    }
                  />
                </div>
              ))}
              </div>

              <div className="modal-row">
                <div className="modal-field" style={{ flex: 2 }}>
                  <label>Address</label>
                  <input className="modal-input" value={editForm.address || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Contact No.</label>
                  <input className="modal-input" value={editForm.contact_number || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Email</label>
                  <input className="modal-input" type="email" value={editForm.email || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label>Occupation</label>
                  <input className="modal-input" value={editForm.occupation || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
                </div>
                <div className="modal-field">
                  <label>Company</label>
                  <input className="modal-input" value={editForm.company || ""} disabled={!canEditUsers} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                </div>
              </div>
              {isPatient && (
  <>
    {isMinor && (
      <>
        <div className="modal-section-title">
          Guardian Information
        </div>

        {[
          { label: "Father", prefix: "father" },
          { label: "Mother", prefix: "mother" },
          { label: "Guardian", prefix: "guardian" },
        ].map(({ label, prefix }) => (
          <div className="modal-row" key={prefix}>

            <div className="modal-field">
              <label>{label}'s Name</label>

              <input
                className="modal-input"
                value={guardian[`${prefix}_name`] || ""}
                onChange={(e) =>
                  setGuardian({
                    ...guardian,
                    [`${prefix}_name`]: e.target.value
                  })
                }
              />
            </div>

            <div className="modal-field">
              <label>Occupation</label>

              <input
                className="modal-input"
                value={guardian[`${prefix}_occupation`] || ""}
                onChange={(e) =>
                  setGuardian({
                    ...guardian,
                    [`${prefix}_occupation`]: e.target.value
                  })
                }
              />
            </div>

            <div className="modal-field">
              <label>Contact No.</label>

              <input
                className="modal-input"
                value={guardian[`${prefix}_contact`] || ""}
                onChange={(e) =>
                  setGuardian({
                    ...guardian,
                    [`${prefix}_contact`]: e.target.value
                  })
                }
              />
            </div>

          </div>
        ))}

        <div className="modal-section-title">
          Physician Information
        </div>

        <div className="modal-row">

          <div className="modal-field">
            <label>Physician Name</label>

            <input
              className="modal-input"
              value={guardian.physician_name || ""}
              onChange={(e) =>
                setGuardian({
                  ...guardian,
                  physician_name: e.target.value
                })
              }
            />
          </div>

          <div className="modal-field">
            <label>Specialty</label>

            <input
              className="modal-input"
              value={guardian.physician_specialty || ""}
              onChange={(e) =>
                setGuardian({
                  ...guardian,
                  physician_specialty: e.target.value
                })
              }
            />
          </div>

        </div>

        <div className="modal-row">

          <div className="modal-field">
            <label>Office Address</label>

            <input
              className="modal-input"
              value={guardian.physician_office_address || ""}
              onChange={(e) =>
                setGuardian({
                  ...guardian,
                  physician_office_address: e.target.value
                })
              }
            />
          </div>

          <div className="modal-field">
            <label>Office Number</label>

            <input
              className="modal-input"
              value={guardian.physician_office_number || ""}
              onChange={(e) =>
                setGuardian({
                  ...guardian,
                  physician_office_number: e.target.value
                })
              }
            />
          </div>

        </div>
      </>
    )}

                  <div className="modal-section-title">
  Medical Questionnaire
</div>

<div className="modal-row">
  <div className="modal-field">
    <label>Last Dental Visit</label>
    <input
      className="modal-input"
      type="date"
      value={medical.last_dental_visit || ""}
      onChange={(e) =>
        handleMedicalInput("last_dental_visit", e.target.value)
      }
    />
  </div>

  <div className="modal-field">
    <label>Bleeding Time</label>
    <input
      className="modal-input"
      value={medical.bleeding_time || ""}
      onChange={(e) =>
        handleMedicalInput("bleeding_time", e.target.value)
      }
    />
  </div>
</div>

{[
  { label: "Are you in good health?", field: "good_health" },
  { label: "Are you under medical treatment now?", field: "under_medical_treatment", sub: "medical_treatment_condition", placeholder: "Condition being treated" },
  { label: "Have you ever had a serious illness or surgical operation?", field: "serious_illness", sub: "serious_illness_details", placeholder: "When and why?" },
  { label: "Have you ever been hospitalized?", field: "hospitalized", sub: "hospitalized_details", placeholder: "When and why?" },
  { label: "Are you taking medication?", field: "taking_medication", sub: "medication_details", placeholder: "Specify medication" },
  { label: "Do you use tobacco products?", field: "use_tobacco" },
  { label: "Do you use alcohol or dangerous drugs?", field: "use_alcohol_drugs" },
  { label: "Are you pregnant?", field: "is_pregnant" },
  { label: "Are you nursing?", field: "is_nursing" },
  { label: "Are you taking birth control pills?", field: "taking_birth_control" },
].map(({ label, field, sub, placeholder }) => (
  <div className="modal-field" key={field}>
    <label>{label}</label>

    <div className="yesno-options">
      <label>
        <input
          type="radio"
          checked={medical[field] === "yes"}
          onChange={() => handleMedicalInput(field, "yes")}
        />
        Yes
      </label>

      <label>
        <input
          type="radio"
          checked={medical[field] === "no"}
          onChange={() => handleMedicalInput(field, "no")}
        />
        No
      </label>
    </div>

    {sub && medical[field] === "yes" && (
      <input
        className="modal-input"
        style={{ marginTop: "8px" }}
        placeholder={placeholder}
        value={medical[sub] || ""}
        onChange={(e) =>
          handleMedicalInput(sub, e.target.value)
        }
      />
    )}
  </div>
))}

<div className="modal-section-title">
  Allergies
</div>

<div className="modal-checkbox-group">
  {[
    { label: "Local Anesthetic", field: "allergy_local_anesthetic" },
    { label: "Latex", field: "allergy_latex" },
    { label: "Aspirin", field: "allergy_aspirin" },
    { label: "Penicillin / Antibiotics", field: "allergy_penicillin_antibiotics" },
    { label: "Sulfa Drugs", field: "allergy_sulfa_drugs" },
  ].map(({ label, field }) => (
    <label key={field}>
      <input
        type="checkbox"
        checked={Boolean(medical[field])}
        onChange={(e) =>
          handleMedicalInput(field, e.target.checked)
        }
      />
      {label}
    </label>
  ))}
</div>

<div className="modal-field">
  <label>Other Allergies</label>
  <input
    className="modal-input"
    value={medical.allergy_others || ""}
    onChange={(e) =>
      handleMedicalInput("allergy_others", e.target.value)
    }
  />
</div>

<div className="modal-section-title">
  Other Medical Information
</div>

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
    <input
      className="modal-input"
      value={medical[field] || ""}
      onChange={(e) =>
        handleMedicalInput(field, e.target.value)
      }
    />
  </div>
))}

                  <div className="modal-section-title">Medical Conditions</div>
                  <div className="modal-checkbox-group">
                    {MEDICAL_CONDITIONS.map((c) => (
                      <label key={c}>
                        <input type="checkbox" checked={medical.conditions?.includes(c)} onChange={() => toggleCheckbox("conditions", c)} />
                        {c}
                      </label>
                    ))}
                  </div>

                  <div className="modal-section-title">Dental Habits</div>
                  <div className="modal-checkbox-group">
                    {DENTAL_HABITS.map((h) => (
                      <label key={h}>
                        <input type="checkbox" checked={medical.dental_habits?.includes(h)} onChange={() => toggleCheckbox("dental_habits", h)} />
                        {h}
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="edit-modal-actions">
                <button className="btn-clear" onClick={() => setEditingUser(null)}>Cancel</button>
                {canEditUsers && (<button className="btn-go" onClick={saveEditUser}>Save Changes</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Userlist;


