import { supabase } from "../../lib/supabase";
import { useState, useRef, useEffect } from "react";
import "../../styles/patients.css";
import { downloadFile } from "../../lib/downloadFile";
import {
  getPatientsApi,
  getPatientNotesApi,
  savePatientNotesApi
}
from "../../api/patients";
import {
  getFullPatientApi
}
from "../../api/users";
import { getPatientLastVisitApi } from "../../api/appointments";
import {
  savePatientFileApi,
  getPatientFilesApi,
  archivePatientFileApi
} from "../../api/files";
import {
  getBillingDocumentsApi,
  archiveBillingDocumentApi,
  restoreBillingDocumentApi,
  restorePatientFileApi
} from "../../api/files";


function calculateAge(birthdate)
{
  if(!birthdate)
  {
    return "";
  }

  const today =
    new Date();

  const birth =
    new Date(birthdate);

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
      today.getDate() <
      birth.getDate()
    )
  )
  {
    age--;
  }

  return age;
}
const FILE_ICON =
{
  xray: "🦷",
  lab: "🧪",
  clearance: "🏥",
  consent: "✍️",
  prescription: "💊",
  referral: "📨",
  other: "📎"
};

function Patients() 
{
  const [patients, setPatients] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [lastVisit, setLastVisit] = useState("No visits yet");
  const [selectedFileType, setSelectedFileType] = useState("other");
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [showAddModal, setShowAddModal]   = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const [activeTab, setActiveTab]         = useState("info");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [newForm, setNewForm]             = useState({ name: "", age: "", contact: "", email: "", dentist: "Dr. Vannesa Cruz" });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [billingDocuments, setBillingDocuments] = useState([]);
  const [archivedMedicalFiles, setArchivedMedicalFiles] = useState([]);
  const [archivedBillingDocuments, setArchivedBillingDocuments] = useState([]);
  const [
  showArchivedMedical,
  setShowArchivedMedical
] = useState(false);

const [
  showArchivedBilling,
  setShowArchivedBilling
] = useState(false);
  const [notesSaving, setNotesSaving] =
  useState(false);
  const [notes, setNotes] = useState("");
  const [fullPatient, setFullPatient] =
  useState(null);
  const fileInputRef = useRef(null);
  useEffect(() =>
{
  loadPatients();
}, []);

async function savePatientNotes()
{
  if(!selectedPatient)
  {
    return;
  }

  if(selectedPatient.is_guest)
  {
    alert(
      "Notes are only available for registered patients."
    );

    return;
  }

  try
  {
    setNotesSaving(true);

    const response =
      await savePatientNotesApi(
        selectedPatient.id,
        notes
      );

    if(!response.success)
    {
      throw new Error(
        response.message
      );
    }

    alert(
      "Notes saved successfully."
    );
  }
  catch(error)
  {
    console.error(error);

    alert(
      "Failed to save notes."
    );
  }
  finally
  {
    setNotesSaving(false);
  }
}

async function loadPatientBillingDocuments(
  patient
)
{
  try
  {
    const response =
      await getBillingDocumentsApi(
        patient.id
      );

    setBillingDocuments(
      response.documents || []
    );
  }
  catch(error)
  {
    console.error(error);

    setBillingDocuments([]);
  }
}

async function archiveRecord(
  fileId
)
{
  const confirmArchive =
    window.confirm(
      "Archive this file? It will no longer appear in the patient's active files."
    );

  if(!confirmArchive)
  {
    return;
  }

  try
  {
    await archivePatientFileApi(
      fileId
    );

    await loadPatientFiles(
    selectedPatient.id
  );

  await loadArchivedFiles(
    selectedPatient.id
  );
  }
  catch(error)
  {
    console.error(error);

    alert(
      "Failed to archive file."
    );
  }
}

async function loadPatients()
{
  try
  {
    const response =
      await getPatientsApi();

    console.log(
      "RAW RESPONSE:",
      response
    );

    console.log(
      "RESPONSE PATIENTS:",
      response.patients?.length
    );

    setPatients(
      response.patients || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}
async function loadLastVisit(
  patientId
)
{
  try
  {
    const response =
      await getPatientLastVisitApi(
        patientId
      );

    setLastVisit(
      response.lastVisit ||
      "No visits yet"
    );
  }
  catch(error)
  {
    console.error(error);

    setLastVisit(
      "No visits yet"
    );
  }
}
  const filtered = patients.filter((p) =>
{
  const fullName =
    `${p.first_name || ""}
     ${p.last_name || ""}`
      .toLowerCase();

  const matchSearch =
    fullName.includes(
      (search || "").toLowerCase()
    );

  const matchStatus =
    filterStatus === "All"
      ? true
      : filterStatus === "Active"
        ? !p.is_archived
        : p.is_archived;

  return matchSearch && matchStatus;
});

  const selectedPatient = selected ? patients.find((p) => p.id === selected) : null;

  
async function handleFileUpload(
  files,
  patientId
)
{
  if(
    !files ||
    files.length === 0
  )
  {
    return;
  }

  try
  {
    for(const file of files)
    {
      const filePath =
        `${patientId}/${
          Date.now()
        }-${file.name}`;

      const {
        error: uploadError
      } =
      await supabase.storage
        .from(
          "medical-files"
        )
        .upload(
          filePath,
          file
        );

      if(uploadError)
      {
        throw uploadError;
      }

      const {
        data
      } =
      supabase.storage
        .from(
          "medical-files"
        )
        .getPublicUrl(
          filePath
        );

      await savePatientFileApi({
  patient_id: patientId,
  file_name: file.name,
  storage_path: filePath,
  mime_type: file.type,
  size_bytes: file.size,
  taken_at: new Date().toISOString(),
  file_type: selectedFileType
});
    }

    loadPatientFiles(
      patientId
    );
  }
  catch(error)
  {
    console.error(
      error
    );
  }
}

async function loadPatientFiles(
  patientId
)
{
  try
  {
    const response =
      await getPatientFilesApi(
        patientId
      );

    const records =
(response.files || [])
.map(file => ({
  id: file.id,
  name: file.file_name,
  file_name: file.file_name,
  file_url: file.file_url,
  mime_type: file.mime_type,
  type: file.file_type,
  date: file.created_at?.split("T")[0],
  size:
  file.size_bytes
    ? `${Math.round(file.size_bytes / 1024)} KB`
    : "",

notes:
  file.notes || "",

is_note:
  !file.size_bytes || file.size_bytes === 0
}));

    console.log(
      "RECORDS:",
      records
    );

    setPatientFiles(
      records
    );
  }
  catch(error)
  {
    console.error(error);

    setPatientFiles([]);
  }
}

async function loadArchivedFiles(patientId)
{
  try
  {
    const medical =
      await getPatientFilesApi(
        patientId,
        {
          archived:true
        }
      );

    const billing =
      await getBillingDocumentsApi(
        patientId,
        {
          archived:true
        }
      );

    setArchivedMedicalFiles(

  (medical.files || []).map(file => ({
    id: file.id,
    name: file.file_name,
    file_name: file.file_name,
    file_url: file.file_url,
    mime_type: file.mime_type,
    type: file.file_type,
    date: file.created_at?.split("T")[0],
    size:
      file.size_bytes
        ? `${Math.round(file.size_bytes / 1024)} KB`
        : "",

    notes:
      file.notes || "",

    is_note:
      !file.size_bytes ||
      file.size_bytes === 0
  }))

);

    setArchivedBillingDocuments(

  (billing.documents || []).map(doc => ({
    id: doc.id,
    name: doc.file_name,
    file_name: doc.file_name,
    file_url: doc.file_url,
    mime_type: doc.mime_type,
    type: doc.document_type,
    date: doc.created_at?.split("T")[0],
    uploaded_by: doc.uploaded_by,
    size:
      doc.size_bytes
        ? `${Math.round(doc.size_bytes / 1024)} KB`
        : ""
  }))

);
  }
  catch(error)
  {
    console.error(error);

    setArchivedMedicalFiles([]);
    setArchivedBillingDocuments([]);
  }
}

  function handleDrop(e, patientId) 
  {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files, patientId);
  }


  function handleAddPatient() 
  {
    if (!newForm.name.trim() || !newForm.age) return;
    const newP = 
    {
      id:              Date.now(),
      name:            newForm.name,
      age:             Number(newForm.age),
      contact:         newForm.contact,
      email:           newForm.email,
      lastVisit:       new Date().toISOString().split("T")[0],
      assignedDentist: newForm.dentist,
      status:          "Active",
      avatar:          newForm.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      records:         [],
      notes:           "",
    };
    setPatients((prev) => [newP, ...prev]);
    setSelected(newP.id);
    setActiveTab("info");
    setShowAddModal(false);
    setNewForm({ name: "", age: "", contact: "", email: "", dentist: "Dr. Vannesa Cruz" });
  }

async function handleSelectPatient(patientId)
{
  setSelected(patientId);

  const full =
  await getFullPatientApi(
    patientId
  );

setFullPatient(full);

  const noteResponse =
  await getPatientNotesApi(
    patientId
  );

setNotes(
  noteResponse.note || ""
);

  const patient =
  patients.find(
    p => p.id === patientId
  );

if(!patient)
{
  return;
}

setSelected(patientId);

// Guests cannot have saved notes yet
if(patient.is_guest)
{
  setNotes("");

  return;
}

setNotes(
  noteResponse.note || ""
);

  await loadPatientBillingDocuments(
    patient
  );

  if(patient.is_guest)
  {
    setPatientFiles([]);
    setLastVisit("Guest Appointment");
    return;
  }

  loadPatientFiles(patient.id);
  loadArchivedFiles(patient.id);
  loadLastVisit(patient.id);
}

console.log("GUARDIAN", fullPatient?.guardian);
console.log("MEDICAL", fullPatient?.medical);

  return (
    <div className="patients-root">

      <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle patient list">
        {sidebarOpen ? "✕" : "🦷 Patients"}
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`patients-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <span className="title-icon">🦷</span> Patients
          </h1>
        </div>

        <div className="sidebar-filters">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input className="search-input" placeholder="Search name or dentist…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-pills">
            {["All", "Active", "Inactive"].map((s) => (
              <button key={s} className={`pill ${filterStatus === s ? "pill-active" : ""}`} onClick={() => setFilterStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <ul className="patient-list">
            {filtered.map((p) => (
                <li key={p.id} className={`patient-item ${selected === p.id ? "patient-item-selected" : ""}`} onClick={() => handleSelectPatient(p.id)}>
                    <div className="patient-avatar">
  {
    p.avatar_url ? (
      <img
        src={p.avatar_url}
        alt={`${p.first_name} ${p.last_name}`}
        className="patient-avatar-img"
        onError={(e) =>
        {
          e.currentTarget.src =
            "/default-avatar.png";
        }}
      />
    ) : (
      <>
        {(p.first_name?.[0] || "")}
        {(p.last_name?.[0] || "")}
      </>
    )
  }
</div>
                    <div className="patient-meta">
                        <span className="patient-name">{p.first_name} {" "} {p.last_name}</span>
                        <span className="patient-sub">{p.email}</span>
                    </div>
                    {
  p.is_guest
  ? (
      <span className="guest-badge">
        Guest
      </span>
    )
  : (
      <span
        className={`status-badge ${
          p.is_archived
            ? "status-inactive"
            : "status-active"
        }`}
      >
        {
          p.is_archived
            ? "Inactive"
            : "Active"
        }
      </span>
    )
}
                </li>
            ))}
            {filtered.length === 0 && <li className="empty-list">No patients found.</li>}
        </ul>
      </aside>

      <main className="patients-detail">
        {!selectedPatient ? (
          <div className="detail-empty">
            <div className="empty-icon">🦷</div>
            <p>Select a patient to view their profile</p>
          </div>
        ) : (
          <div className="detail-content">
            <div className="detail-hero">
              <div className="detail-avatar">
{
  selectedPatient.avatar_url ? (
    <img
      src={selectedPatient.avatar_url}
      alt={selectedPatient.full_name}
      className="detail-avatar-img"
    />
  ) : (
    <>
      {(selectedPatient.first_name?.[0] || "")}
      {(selectedPatient.last_name?.[0] || "")}
    </>
  )
}
</div>
              <div className="detail-hero-info">
                <h2 className="detail-name">{selectedPatient.first_name} {" "} {selectedPatient.last_name}</h2>
                <p className="detail-sub">Age {calculateAge(selectedPatient.birthdate)} · {selectedPatient.contact_number}</p>
                <p className="detail-sub">{selectedPatient.email}</p>
              </div>

              <div className="detail-hero-meta">
                <span className={`status-badge-lg ${selectedPatient.is_archived === false ? "status-active" : "status-inactive"}`}>
                  {selectedPatient.is_archived ? "Inactive" : "Active"}
                </span>
                <p className="last-visit">Last Visit: {selectedPatient.is_guest ? "Guest Patient" : lastVisit || "-"}</p>
              </div>
            </div>

            <div className="detail-tabs">
              {[
              "info",
              "medical",
              "billing",
              "notes"
            ].map((tab) => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab === "info" &&
                  "📋 Information"}

                  {tab === "medical" &&
                  `📁 Medical Files (${patientFiles.length})`}

                  {tab === "billing" &&
                  "🧾 Billing Documents"}

                  {tab === "notes" &&
                  "📝 Notes"}
                </button>
              ))}
            </div>

            {activeTab === "info" && (
  <div className="tab-panel patient-info-panel">

    <section className="info-section">
      <h3>Personal Details</h3>

      <div className="info-clean-grid">
        <div>
          <label>Last Name</label>
          <p>{selectedPatient.last_name || "-"}</p>
        </div>

        <div>
          <label>First Name</label>
          <p>{selectedPatient.first_name || "-"}</p>
        </div>

        <div>
          <label>Middle Name</label>
          <p>{selectedPatient.middle_name || "-"}</p>
        </div>

        <div>
          <label>Suffix</label>
          <p>{selectedPatient.suffix || "—"}</p>
        </div>

        <div>
          <label>Birthdate</label>
          <p>{selectedPatient.birthdate || "-"}</p>
        </div>

        <div>
          <label>Age</label>
          <p>{calculateAge(selectedPatient.birthdate) || "-"}</p>
        </div>

        <div>
          <label>Sex</label>
          <p>{selectedPatient.sex || "-"}</p>
        </div>

        <div>
          <label>Civil Status</label>
          <p>{selectedPatient.civilstatus || "-"}</p>
        </div>

        <div>
          <label>Phone Number</label>
          <p>{selectedPatient.contact_number || "-"}</p>
        </div>

        <div>
          <label>Email</label>
          <p>{selectedPatient.email || "No email"}</p>
        </div>

        <div>
          <label>Occupation</label>
          <p>{selectedPatient.occupation || "-"}</p>
        </div>

        <div>
          <label>Company</label>
          <p>{selectedPatient.company || "-"}</p>
        </div>

        <div>
          <label>School</label>
          <p>{selectedPatient.school || "-"}</p>
        </div>

        <div>
          <label>Blood Type</label>
          <p>{selectedPatient.bloodtype || "-"}</p>
        </div>

        <div>
          <label>Weight</label>
          <p>{selectedPatient.weight || "-"}</p>
        </div>

        <div>
          <label>Height</label>
          <p>{selectedPatient.height || "-"}</p>
        </div>

        <div>
          <label>Registered Since</label>
          <p>{selectedPatient.created_at?.split("T")[0] || "-"}</p>
        </div>

        <div>
          <label>Last Visit</label>
          <p>{selectedPatient.is_guest ? "Guest Patient" : lastVisit || "-"}</p>
        </div>

        <div className="full">
          <label>Address</label>
          <p>{selectedPatient.address || "-"}</p>
        </div>
      </div>
    </section>

    {
  fullPatient?.guardian?.id && (

    <section className="info-section">

      <h3>
        Guardian Information
      </h3>

      <div className="info-clean-grid">

        <div>
          <label>Father's Name</label>
          <p>{fullPatient.guardian.father_name || "-"}</p>
        </div>

        <div>
          <label>Father's Contact</label>
          <p>{fullPatient.guardian.father_contact || "-"}</p>
        </div>

        <div>
          <label>Father's Occupation</label>
          <p>{fullPatient.guardian.father_occupation || "-"}</p>
        </div>

        <div>
          <label>Mother's Name</label>
          <p>{fullPatient.guardian.mother_name || "-"}</p>
        </div>

        <div>
          <label>Mother's Contact</label>
          <p>{fullPatient.guardian.mother_contact || "-"}</p>
        </div>

        <div>
          <label>Mother's Occupation</label>
          <p>{fullPatient.guardian.mother_occupation || "-"}</p>
        </div>

        <div>
          <label>Guardian Name</label>
          <p>{fullPatient.guardian.guardian_name || "-"}</p>
        </div>

        <div>
          <label>Guardian Contact</label>
          <p>{fullPatient.guardian.guardian_contact || "-"}</p>
        </div>

        <div>
          <label>Guardian Occupation</label>
          <p>{fullPatient.guardian.guardian_occupation || "-"}</p>
        </div>

      </div>

    </section>

  )
}

{
  fullPatient?.medical?.id && (

    <section className="info-section">

      <h3>
        Medical Summary
      </h3>

      <div className="info-clean-grid">

        <div>
          <label>Last Dental Visit</label>
          <p>{fullPatient.medical.last_dental_visit || "-"}</p>
        </div>

        <div>
          <label>Good Health</label>
          <p>{fullPatient.medical.good_health === "yes" ? "Yes" : "No"}</p>
        </div>

        <div>
          <label>Medical Treatment</label>
          <p>{fullPatient.medical.under_medical_treatment === "yes" ? "Yes" : "No"}</p>
        </div>

        <div>
          <label>Taking Medication</label>
          <p>{fullPatient.medical.taking_medication === "yes" ? "Yes" : "No"}</p>
        </div>

        <div className="full">
          <label>Medical Conditions</label>
          <p>
            {
              fullPatient.medical.conditions?.length
                ? fullPatient.medical.conditions.join(", ")
                : "-"
            }
          </p>
        </div>

        <div className="full">
          <label>Allergies</label>
          <p>
            {
              [
                fullPatient.medical.allergy_penicillin_antibiotics && "Penicillin",
                fullPatient.medical.allergy_aspirin && "Aspirin",
                fullPatient.medical.allergy_latex && "Latex",
                fullPatient.medical.allergy_local_anesthetic && "Local Anesthetic",
                fullPatient.medical.allergy_sulfa_drugs && "Sulfa Drugs",
                fullPatient.medical.allergy_others
              ]
              .filter(Boolean)
              .join(", ") || "None"
            }
          </p>
        </div>

        <div className="full">
          <label>Current Medication</label>
          <p>
            {
              fullPatient.medical.prescribed_medications ||
              fullPatient.medical.medication_details ||
              "-"
            }
          </p>
        </div>

        <div className="full">
          <label>Dental Habits</label>
          <p>
            {
              fullPatient.medical.dental_habits?.length
                ? fullPatient.medical.dental_habits.join(", ")
                : "-"
            }
          </p>
        </div>

        <div className="full">
          <label>Medical Alert</label>
          <p>{fullPatient.medical.medical_alert || "None"}</p>
        </div>

        <div className="full">
          <label>Other Medical Concerns</label>
          <p>{fullPatient.medical.other_medical_concerns || "None"}</p>
        </div>

      </div>

    </section>

  )
}

  </div>
)}

          {activeTab === "medical" && (
            <div className="tab-panel">
              <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "15px"
  }}
>
  <button
  className="archive-toggle-btn"
    onClick={() =>
      setShowArchivedMedical(
        !showArchivedMedical
      )
    }
  >
    {
      showArchivedMedical
        ? "Show Active Files"
        : "Show Archived Files"
    }
  </button>
</div>
                {(
                  showArchivedMedical
                  ? archivedMedicalFiles
                  : patientFiles
                  ).length === 0 ? (
                  <div className="billing-empty">

                  <div className="billing-icon">

                  📁

                  </div>

                  <h3>

                  No Medical Files

                  </h3>

                  <p>

                  Files uploaded by the
                  patient or dentist
                  will appear here.

                  </p>

                  </div>
                ) : (
                  <ul className="file-list">
                    {(
                    showArchivedMedical
                      ? archivedMedicalFiles
                      : patientFiles
                  ).map((r) => (
                      <li key={r.id} className="file-item">
                        <span className="file-type-icon">
                        {FILE_ICON[r.type] || "📎"}
                      </span>

                      <div className="file-meta">

                        <span className={`file-badge ${r.type}`}>
                          {r.type}
                        </span>

                        <span className="file-name">
                          {r.name}
                        </span>

                        <span className="file-date">
                          {r.date} • {r.size}
                        </span>

                        <span className="file-uploaded">
                          Uploaded by: Patient
                        </span>

                      </div>

                        <div className="file-actions">

                <button
                  className="file-btn file-btn-view"
                  onClick={() =>
                  {
                    console.log(
                      "PREVIEW:",
                      r
                    );

                    setPreviewFile(r);
                  }}
                >
                  View
                </button>

                <button
                type="button"
                className="file-btn file-btn-download"
                onClick={() =>
                  downloadFile(
                    r.file_url,
                    r.file_name || r.name || "medical-file"
                  )
                }
              >
                Download
              </button>

                <button
  className="file-btn file-btn-print"
  onClick={() =>
  {
    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    if (r.mime_type?.includes("image"))
    {
      printWindow.document.write(`
        <html>
          <head>
            <title>${r.file_name}</title>
            <style>
              body{
                margin:0;
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
              }

              img{
                max-width:100%;
                max-height:100%;
              }
            </style>
          </head>

          <body>

            <img
              src="${r.file_url}"
              onload="window.print();window.onafterprint=()=>window.close();"
            />

          </body>
        </html>
      `);
    }
    else
    {
      printWindow.location.href = r.file_url;

      printWindow.onload = () =>
      {
        printWindow.print();

        printWindow.onafterprint =
          () => printWindow.close();
      };
    }
  }}
>
  Print
</button>

                {
  showArchivedMedical
  ? (
      <button
        className="file-btn file-btn-unarchive"
        onClick={async () =>
        {
          await restorePatientFileApi(
            r.id
          );

          await loadPatientFiles(
            selectedPatient.id
          );

          await loadArchivedFiles(
            selectedPatient.id
          );
        }}
      >
        Unarchive
      </button>
    )
  : (
      <button
        className="file-btn file-btn-archive"
        onClick={() =>
          archiveRecord(r.id)
        }
      >
        Archive
      </button>
    )
}

              </div>
                      </li>
                    ))}
                  </ul>
                )}
                {
  previewFile && (
    <div
      className="preview-overlay"
      onClick={() => setPreviewFile(null)}
    >
      <div
        className="preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="preview-close"
          onClick={() => setPreviewFile(null)}
        >
          ✕
        </button>

        {
          previewFile.mime_type?.includes("image")
          ? (
              <img
                src={previewFile.file_url}
                alt={previewFile.file_name}
                className="preview-image"
              />
            )
          : previewFile.mime_type?.includes("pdf")
          ? (
              <iframe
                src={previewFile.file_url}
                className="preview-pdf"
              />
            )
          : (
              <button
              type="button"
              className="download-btn"
              onClick={() =>
                downloadFile(
                  previewFile.file_url,
                  previewFile.file_name || previewFile.name || "medical-file"
                )
              }
            >
              Download File
            </button>
            )
        }
      </div>
    </div>
  )
}
            </div>
            )}

            {activeTab === "billing" && (

<div className="tab-panel">

<div className="medical-header">


  <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "15px"
  }}
>
  <button
    className="archive-toggle-btn"
    onClick={() =>
    setShowArchivedBilling(
    !showArchivedBilling
  )
}
  >
    {
      showArchivedBilling
        ? "Show Active Files"
        : "Show Archived Files"
    }
  </button>
</div>

</div>

{
(
showArchivedBilling
? archivedBillingDocuments
: billingDocuments
).length === 0
?

(

<div className="billing-empty">

<div className="billing-icon">
🧾
</div>

<h3>
No Billing Documents
</h3>

<p>
Official Receipts and Invoices will appear here.
</p>

</div>

)

:

(

<ul className="file-list">

{

(
  showArchivedBilling
    ? archivedBillingDocuments
    : billingDocuments
).map(doc => (

<li
key={doc.id}
className="file-item"
>

<span className="file-type-icon">

🧾

</span>

<span
className={`file-badge ${doc.document_type}`}
>

{

doc.document_type === "receipt"

?

"Receipt"

:

"Invoice"

}

</span>

<div className="file-meta">

<span className="file-name">

{doc.file_name || doc.name || doc.title}

</span>

<span className="file-date">

{
new Date(
doc.created_at
).toLocaleDateString()
}

</span>

<span className="file-uploaded">

Uploaded by:

<strong>

{" "}
{doc.uploaded_by || "Staff"}

</strong>

</span>

</div>

<div className="file-actions">

<a
  href={doc.file_url}
  target="_blank"
  rel="noreferrer"
  className="file-btn file-btn-view"
>
  View
</a>

<button
  type="button"
  className="file-btn file-btn-download"
  onClick={() =>
    downloadFile(
      doc.file_url,
      doc.file_name || doc.title || "billing-document"
    )
  }
>
  Download
</button>

{
  showArchivedBilling
  ? (
      <button
        className="file-btn file-btn-unarchive"
        onClick={async () =>
        {
          await restoreBillingDocumentApi(
            doc.id
          );

          await loadPatientBillingDocuments(
            selectedPatient
          );

          await loadArchivedFiles(
            selectedPatient.id
          );
        }}
      >
        ↩ Unarchive
      </button>
    )
  : (
      <button
        className="file-btn file-btn-archive"
        onClick={async () =>
        {
          if(
            !window.confirm(
              "Archive this billing document?"
            )
          )
          {
            return;
          }

          await archiveBillingDocumentApi(
            doc.id
          );

          await loadPatientBillingDocuments(
            selectedPatient
          );

          await loadArchivedFiles(
            selectedPatient.id
          );
        }}
      >
        📦 Archive
      </button>
    )
}

</div>

</li>

))

}

</ul>

)

}

</div>

)}

            {activeTab === "notes" && (
              <div className="tab-panel">
                <textarea
  className="notes-textarea"
  value={notes}
  onChange={(e) =>
    setNotes(e.target.value)
  }
/>

<div className="notes-actions">

  <button
    className="save-notes-btn"
    onClick={savePatientNotes}
    disabled={notesSaving}
  >
    {
      notesSaving
        ? "Saving..."
        : "Save Notes"
    }
  </button>

</div>

                <p className="notes-hint">
                  {
                    notesSaving
                      ? "Saving notes..."
                      : "Click Save Notes to save your changes."
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h3>New Patient</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="Juan Dela Cruz" />
                </div>

                <div className="form-group">
                  <label>Age *</label>
                  <input type="number" value={newForm.age} onChange={(e) => setNewForm((f) => ({ ...f, age: e.target.value }))} placeholder="30" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact</label>
                  <input value={newForm.contact} onChange={(e) => setNewForm((f) => ({ ...f, contact: e.target.value }))} placeholder="+63 9XX XXX XXXX" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="patient@email.com" />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Dentist</label>
                <select value={newForm.dentist} onChange={(e) => setNewForm((f) => ({ ...f, dentist: e.target.value }))}>
                  <option>Dr. Vannesa Cruz</option>
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddPatient}>Add Patient</button>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}

export default Patients;