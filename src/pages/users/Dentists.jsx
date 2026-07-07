import { useState, useEffect, useRef } from "react";
import "../../styles/dentists.css";
import { getDentistsApi, saveDentistScheduleApi, getDentistScheduleApi } from "../../api/users";
import { getPatientRecordsApi } from "../../api/patients";
import { getMyPatientsApi, getDentistEarningsApi} from "../../api/appointments";
import { getLeaveRequestsApi, updateLeaveRequestApi } from "../../api/leaveRequest";
import
{
getMedicalFilesApi,
deleteMedicalFileApi,
archivePatientFileApi,
restorePatientFileApi
}
from "../../api/files";
import {
  getBillingDocumentsApi,
  archiveBillingDocumentApi,
  restoreBillingDocumentApi
}
from "../../api/files";
import { supabase } from "../../lib/supabase";

const LEAVE_ICON = {
  "Sick Leave": "🤒",
  "Vacation Leave": "🏖️",
  "Emergency Leave": "🚨",
  "Maternity Leave": "👶",
  "Paternity Leave": "👨‍👦",
  "Medical Leave": "🏥"
};

function Dentists() 
{
    const [dentists, setDentists]       = useState([]);
    const [myPatients, setMyPatients] = useState([]);
    const [selected, setSelected]       = useState(null);
    const [activeTab, setActiveTab]     = useState("overview");
    const [search, setSearch]           = useState("");
    const [patientSearch, setPatientSearch] = useState("");
    const [showFormModal, setShowFormModal] = useState(null);
    const [esignMode, setEsignMode]     = useState(false);
    const [signatureText, setSignatureText] = useState("");
    const [signed, setSigned]           = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [recordTab, setRecordTab] = useState("info");
    const [ selectedTreatment, setSelectedTreatment ] = useState(null);
    const [ showTreatmentModal, setShowTreatmentModal ] = useState(false);
    const [selectedRecordPatient, setSelectedRecordPatient] = useState(null);
    const [patientRecords, setPatientRecords] = useState([]);
    const [requestAction, setRequestAction] = useState({});
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [earnings, setEarnings] = useState([]);
    const [branchFilter, setBranchFilter] = useState("All");
    const [dailyCommission, setDailyCommission] = useState(0);
    const [totalCommission, setTotalCommission] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0); 
    const printRef = useRef();
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [templateSearch, setTemplateSearch] = useState("");
    const [templateFilter, setTemplateFilter] = useState("all");
    const [showRemarkModal, setShowRemarkModal] = useState(null);
    const [remarkInput, setRemarkInput] = useState("");
    const [lunchBreak, setLunchBreak] =
    useState({
      start: "12:00",
      end: "13:00",
      applies_to: "all_days"
    });
    const [customLunchDays, setCustomLunchDays] =
    useState([]);
    const [availability, setAvailability] = useState({status: "Available", note: ""});

    const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const [
medicalFiles,
setMedicalFiles
] =
useState([]);

const [
archivedMedicalFiles,
setArchivedMedicalFiles
] =
useState([]);

const [
showArchivedMedical,
setShowArchivedMedical
] =
useState(false);

const [
showUploadModal,
setShowUploadModal
]
=
useState(false);

const [
selectedUploadType,
setSelectedUploadType
]
=
useState("xray");

const [
selectedUploadFile,
setSelectedUploadFile
]
=
useState(null);

const [
billingDocuments,
setBillingDocuments
] = useState([]);

const [
archivedBillingDocuments,
setArchivedBillingDocuments
] = useState([]);

const [
showArchivedBilling,
setShowArchivedBilling
] = useState(false);


const fileInputRef =
useRef(null);

function toggleCustomLunchDay(day)
{
  setCustomLunchDays((prev) =>
    prev.includes(day)
      ? prev.filter((d) => d !== day)
      : [...prev, day]
  );
}

function getLunchAppliesToValue()
{
  if(lunchBreak.applies_to === "custom")
  {
    return `custom:${customLunchDays.join(",")}`;
  }

  return lunchBreak.applies_to;
}

const [workingHours,
setWorkingHours] =
useState(
  DAYS.reduce(
    (acc, day) =>
    {
      acc[day] = {
        start: "10:00",
        end: "17:00",
        is_off: false
      };

      return acc;
    },
    {}
  )
);


const pendingCount =
  leaveRequests.filter(
    r => r.status?.toLowerCase() === "pending"
  ).length;
    const filtered =
  dentists.filter((d) =>
  {
    const fullName =
      `${d.first_name || ""}
       ${d.last_name || ""}`
      .toLowerCase();

    const matchesSearch =
      fullName.includes(
        (search || "")
          .toLowerCase()
      );

    const matchesBranch =
      branchFilter === "All" ||
      (d.branch_id || "").trim().toLowerCase() ===
      branchFilter.trim().toLowerCase();

    return (
      matchesSearch &&
      matchesBranch
    );
  });
    

  useEffect(() =>
{
  loadDentists();
  loadTemplates();
}, []);


async function handleLeaveAction(
  leaveId,
  status
)
{
  try
  {
    console.log(
      "STATUS BEING SENT:",
      status
    );

    const result =
      await updateLeaveRequestApi(
        leaveId,
        {
          status,
          staff_note: remarkInput
        }
      );

    console.log(
      "UPDATE RESULT:",
      result
    );

    const leaveResponse =
      await getLeaveRequestsApi(
        selectedDentist.id
      );

    setLeaveRequests(
      leaveResponse.requests || []
    );

    setRemarkInput("");

    setShowRemarkModal(null);
  }
  catch(error)
  {
    console.error(
      "LEAVE UPDATE ERROR:",
      error
    );

    alert(error.message);
  }
}

function handlePrint()
{
  const printContents =
    printRef.current.innerHTML;

  const printWindow =
    window.open("", "", "width=900,height=700");

  printWindow.document.write(`
    <html>
      <head>
        <title>DentConnect Form</title>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function formatWorkingHours(hours)
{
  if (!hours) return "";

  const activeDays =
    Object.entries(hours)
      .filter(([_, day]) => !day.is_off);

  if (!activeDays.length)
    return "Unavailable";

  const firstDay =
    activeDays[0][0];

  const lastDay =
    activeDays[
      activeDays.length - 1
    ][0];

  const first =
    activeDays[0][1];

  function format(time)
  {
    const [h, m] =
      time.split(":");

    const hour =
      Number(h);

    const suffix =
      hour >= 12
        ? "PM"
        : "AM";

    const display =
      hour > 12
        ? hour - 12
        : hour;

    return `${display}:${m} ${suffix}`;
  }

  return `${firstDay.slice(0,3)}–${lastDay.slice(0,3)} ${format(first.start)}–${format(first.end)}`;
}

function handleViewTreatment(
  record
)
{
  setSelectedTreatment(
    record
  );

  setShowTreatmentModal(
    true
  );
}
async function handleViewRecord(
  patient
)
{
  setSelectedRecordPatient(patient);

  setRecordTab("info");

  try
  {
    const
[
recordResponse,
fileResponse,
archivedFileResponse,
billingResponse,
archivedBillingResponse
]
=
await Promise.all([

  getPatientRecordsApi(
    patient.id
  ),

  getMedicalFilesApi(
    patient.id
  ),

  getMedicalFilesApi(
    patient.id,
    {
      archived: true
    }
  ),

  getBillingDocumentsApi(
    patient.id
  ),

  getBillingDocumentsApi(
    patient.id,
    {
      archived: true
    }
  )

]);

    setPatientRecords(
      recordResponse.records || []
    );

    setMedicalFiles(
      fileResponse.files || []
    );

    setBillingDocuments(
      billingResponse.documents || []
    );

    setArchivedBillingDocuments(
  archivedBillingResponse.documents || []
);
  }
  catch(error)
  {
    console.error(error);

    setPatientRecords([]);

    setMedicalFiles([]);
  }

  setShowRecordModal(true);
}

async function refreshMedicalFiles()
{
  if(!selectedRecordPatient)
  {
    return;
  }

  try
  {
    const response =
      await getMedicalFilesApi(
        selectedRecordPatient.id
      );

    setMedicalFiles(
      response.files || []
    );

    await loadArchivedMedicalFiles();

  }
  catch(error)
  {
    console.error(error);
  }
}

async function loadArchivedMedicalFiles()
{
  if(!selectedRecordPatient)
  {
    return;
  }

  try
  {
    const response =
      await getMedicalFilesApi(
        selectedRecordPatient.id,
        {
          archived: true
        }
      );

    setArchivedMedicalFiles(
      response.files || []
    );
  }
  catch(error)
  {
    console.error(error);

    setArchivedMedicalFiles([]);
  }
}

async function handleDeleteMedicalFile(
  id
)
{
  if(
    !window.confirm(
      "Delete this file?"
    )
  )
  {
    return;
  }

  try
  {
    await deleteMedicalFileApi(id);

    refreshMedicalFiles();
  }
  catch(error)
  {
    console.error(error);

    alert(
      "Unable to delete file."
    );
  }
}

async function handleArchiveMedicalFile(
  id
)
{
  const confirmed =
    window.confirm(
      "Archive this medical file?"
    );

  if(!confirmed)
  {
    return;
  }

  try
  {
    await archivePatientFileApi(
      id
    );

    await refreshMedicalFiles();

    alert(
      "Medical file archived successfully."
    );
  }
  catch(error)
  {
    console.error(error);

    alert(
      "Unable to archive file."
    );
  }
}

async function handleUploadMedicalFile()
{
  console.log("UPLOAD BUTTON CLICKED");

  const file =
    selectedUploadFile;

  if(
    !file ||
    !selectedRecordPatient
  )
  {
    alert(
      "Please choose a file."
    );
    return;
  }

  try
  {
    const filePath =
      `${selectedRecordPatient.id}/${Date.now()}-${file.name}`;

    const {
      error: uploadError
    } =
    await supabase.storage
      .from("medical-files")
      .upload(
        filePath,
        file,
        {
          upsert: true
        }
      );

    if(uploadError)
    {
      throw uploadError;
    }

    await uploadMedicalFileApi({

      patient_id:
        selectedRecordPatient.is_guest
          ? null
          : selectedRecordPatient.id,

      guest_email:
        selectedRecordPatient.email,

      guest_contact:
        selectedRecordPatient.contact_number,

      uploaded_by:
        selectedDentist?.id || null,

      uploaded_by_role:
        "staff",

      document_category:
        selectedUploadType,

      file_type:
        selectedUploadType,

      file_name:
        file.name,

      storage_path:
        filePath,

      mime_type:
        file.type,

      size_bytes:
        file.size,

      taken_at:
        new Date().toISOString()

    });

    await refreshMedicalFiles();

    setSelectedUploadFile(null);

    setShowUploadModal(false);

    alert(
      "Medical file uploaded."
    );
  }
  catch(error)
  {
    console.error(error);

    alert("Upload failed.");
  }
}

async function handleArchiveBillingDocument(
  id
)
{
  try
  {
    await archiveBillingDocumentApi(id);

    const active =
      await getBillingDocumentsApi(
        selectedRecordPatient.id
      );

    const archived =
      await getBillingDocumentsApi(
        selectedRecordPatient.id,
        {
          archived: true
        }
      );

    setBillingDocuments(
      active.documents || []
    );

    setArchivedBillingDocuments(
      archived.documents || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleDownloadPdf()
{
  const element =
    printRef.current;

  const canvas =
    await html2canvas(element);

  const imgData =
    canvas.toDataURL("image/png");

  const pdf =
    new jsPDF("p", "mm", "a4");

  const pdfWidth =
    pdf.internal.pageSize.getWidth();

  const pdfHeight =
    (canvas.height * pdfWidth) /
    canvas.width;

  pdf.addImage(
    imgData,
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  pdf.save(
    `${showFormModal.label}.pdf`
  );
}

async function loadTemplates()
{
  const {
    data,
    error
  } =
  await supabase
    .from("templates")
    .select("*")
    .eq(
      "is_archived",
      false
    )
    .order(
      "name"
    );

  if(error)
  {
    console.log(error);
    return;
  }

  const withUrls =
    await Promise.all(
      (data || []).map(
        async(template)=>
        {
          let url = "";

          if(template.file_url)
          {
            const {
              data:signed
            } =
            await supabase
              .storage
              .from("template-files")
              .createSignedUrl(
                template.file_url,
                60 * 60
              );

            url =
              signed?.signedUrl || "";
          }

          return {
            ...template,
            url
          };
        }
      )
    );

  setTemplates(
    withUrls
  );
}

async function loadDentists()
{
  try
  {
    const response =
      await getDentistsApi();

    console.table(
    response.dentists.map(d => ({
    name: `${d.first_name} ${d.last_name}`,
    branch: d.branch_id
  }))
);

    setDentists(
      response.dentists || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}
    const selectedDentist = dentists.find(d => d.id === selected);

    function handleRequestAction(dentistId, reqId, action) 
    {
        setRequestAction((prev) => ({ ...prev, [`${dentistId}-${reqId}`]: action }));
    }

    function handleESign(e) {
    e.preventDefault();

    if(signatureText.trim().length > 2)
    {
        setSigned(true);
        setEsignMode(false);
    }
}

    async function handleSelectDentist(id)
{
    setSelected(id);
    setActiveTab("overview");
    setSidebarOpen(false);
    const leaveResponse =
  await getLeaveRequestsApi(id);

console.log(
  "LEAVE RESPONSE:",
  leaveResponse
);

setLeaveRequests(
  leaveResponse.requests || []
);

    try
    {
        const patientResponse =
            await getMyPatientsApi(id);

        setMyPatients(
            patientResponse.patients || []
        );

        const earningsResponse =
            await getDentistEarningsApi(id);

        const earningsData =
            earningsResponse.detailedEarnings ||
            earningsResponse.earnings ||
            [];

        setEarnings(
            earningsData
        );
        const leaveResponse =
          await getLeaveRequestsApi(id);
          setLeaveRequests(leaveResponse.requests || []);

          setTotalCommission(
          earningsResponse.totalCommission || 0
          );

          setTotalEarnings(
          earningsResponse.totalEarnings || 0
          );

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const todayCommission =
            earningsData
                .filter(
                    row =>
                        row.appointment_date === today
                )
                .reduce(
                    (sum, row) =>
                        sum +
                        Number(row.commission || 0),
                    0
                );

        setDailyCommission(
            todayCommission
        );

        console.log(
            "PATIENTS:",
            patientResponse.patients
        );

        console.log(
            "EARNINGS:",
            earningsData
        );
    }
    catch(error)
    {
        console.error(error);
    }

    const scheduleResponse =
  await getDentistScheduleApi(id);
  if(scheduleResponse.lunch)
{
  const savedAppliesTo =
    scheduleResponse.lunch.applies_to ||
    "all_days";

  if(savedAppliesTo.startsWith("custom:"))
  {
    setLunchBreak({
      start:
        scheduleResponse.lunch
          .lunch_start
          ?.slice(0, 5) ||
        "12:00",

      end:
        scheduleResponse.lunch
          .lunch_end
          ?.slice(0, 5) ||
        "13:00",

      applies_to:
        "custom"
    });

    setCustomLunchDays(
      savedAppliesTo
        .replace("custom:", "")
        .split(",")
        .filter(Boolean)
    );
  }
  else
  {
    setLunchBreak({
      start:
        scheduleResponse.lunch
          .lunch_start
          ?.slice(0, 5) ||
        "12:00",

      end:
        scheduleResponse.lunch
          .lunch_end
          ?.slice(0, 5) ||
        "13:00",

      applies_to:
        savedAppliesTo
    });

    setCustomLunchDays([]);
  }
}
else
{
  setLunchBreak({
    start: "12:00",
    end: "13:00",
    applies_to: "all_days"
  });

  setCustomLunchDays([]);
}

console.log(
  "SCHEDULE:",
  scheduleResponse
);
if(scheduleResponse.hours?.length)
{
  const hours = {};

  scheduleResponse.hours.forEach(
    (row) =>
    {
      hours[row.day_name] = {
        start:
          row.start_time.slice(0, 5),

        end:
          row.end_time.slice(0, 5),

        is_off:
          row.is_off
      };
    }
  );

  setWorkingHours(hours);
}
}


    const STATUS_COLOR = 
    {
        Available:  "status-available",
        Busy:       "status-busy",
        "Off-Duty": "status-off",
    };

async function handleSaveSchedule()
{
  if(!selectedDentist)
  {
    return;
  }

  try
  {
    console.log(
  "SENDING WORKING HOURS:",
  workingHours
);

   const response =
  await saveDentistScheduleApi(
    selectedDentist.id,
    {
      workingHours,

      lunchBreak:
      {
        start:
          lunchBreak.start,

        end:
          lunchBreak.end,

        applies_to:
          getLunchAppliesToValue()
      }
    }
  );

    console.log(
      "SAVE RESPONSE:",
      response
    );

    alert(
      "Schedule saved successfully."
    );
  }
  catch(error)
  {
    console.error(error);

    alert(
      "Failed to save schedule."
    );
  }
}

function downloadTemplate(template)
{
  const link = document.createElement("a");

  link.href = template.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = template.name || "template";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function printTemplate(template)
{
  const printWindow = window.open("", "_blank");

  if(!printWindow)
  {
    alert("Please allow pop-ups to print this file.");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${template.name}</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: white;
          }

          img {
            max-width: 100%;
            max-height: 100vh;
            object-fit: contain;
          }
        </style>
      </head>

      <body>
        <img src="${template.url}" onload="window.focus(); window.print();" />
      </body>
    </html>
  `);

  printWindow.document.close();
}

async function downloadTemplate(template)
{
  try
  {
    const response = await fetch(template.url);

    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = blobUrl;

    link.download =
      template.name ||
      "download";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  }
  catch(error)
  {
    console.error(error);

    alert("Unable to download file.");
  }
}

const KNOWN_TEMPLATE_TYPES = [
  "consent",
  "clearance",
  "prescription",
  "referral",
  "xray"
];

const filteredTemplates = templates.filter((template) =>
{
  const matchesSearch =
    (template.name || "")
      .toLowerCase()
      .includes(templateSearch.toLowerCase());

  const type =
    (template.type || "")
      .toLowerCase();

  const matchesType =
    templateFilter === "all"
      ? true
      : templateFilter === "other"
        ? !KNOWN_TEMPLATE_TYPES.includes(type)
        : type === templateFilter;

  return matchesSearch && matchesType;
});

    return (
        <div className="dentists-root">

            <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle dentist list">
                {sidebarOpen ? "✕" : "👨‍⚕️ Dentists"}
            </button>

            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`dentists-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>

                <div className="sidebar-header">
                    <h1 className="sidebar-title">
                        <span>👨‍⚕️</span> Dentists
                    </h1>
                </div>
                <div className="branch-filter-wrap">
  <select
    value={branchFilter}
    onChange={(e) =>
      setBranchFilter(
        e.target.value
      )
    }
    className="branch-filter"
  >
    <option value="All">
      All Branches
    </option>

    <option value="Hagonoy">
      Hagonoy
    </option>

    <option value="Paombong">
      Paombong
    </option>
  </select>
</div>
                <div className="sidebar-search-wrap">
                    <span className="search-icon">⌕</span>
                    <input className="search-input" placeholder="Search dentist or specialty…" value={search} onChange={(e) => setSearch(e.target.value)}/>
                </div>

                <ul className="dentist-list">
                    {filtered.map((d) => (
                        <li key={d.id} className={`dentist-item ${selected === d.id ? "dentist-item-selected" : ""}`} onClick={() => handleSelectDentist(d.id)}>
                            <div className="dentist-avatar">
  {d.avatar_url ? (
    <img
      src={d.avatar_url}
      alt={`${d.first_name} ${d.last_name}`}
      className="dentist-avatar-img"
    />
  ) : (
    <>
      {(d.first_name?.[0] || "")}
      {(d.last_name?.[0] || "")}
    </>
  )}
</div>
                            <div className="dentist-meta">
                                <span className="dentist-name">{d.first_name} {d.last_name}</span>
                                <span className="dentist-spec">Dentist</span>
                            </div>
                            <span className={`status-pill ${STATUS_COLOR[d.status]}-pill`}>
                                {d.status}
                            </span>
                        </li>
                    ))}
                </ul>

            </aside>

            <main className="dentists-detail">
                {!selectedDentist ? (
                    <div className="detail-empty">
                        <div className="empty-icon">👨‍⚕️</div>
                        <p>Select a dentist to view their profile</p>
                    </div>
                ) : (
                    <div className="detail-content">

                        <div className="detail-hero">
                            <div className="dentist-avatar-lg">
  {selectedDentist.avatar_url ? (
    <img
      src={selectedDentist.avatar_url}
      alt={`${selectedDentist.first_name} ${selectedDentist.last_name}`}
      className="dentist-avatar-lg-img"
    />
  ) : (
    <>
      {(selectedDentist.first_name?.[0] || "")}
      {(selectedDentist.last_name?.[0] || "")}
    </>
  )}
</div>
                            <div className="detail-hero-info">
                                <h2 className="detail-name">{`${selectedDentist.first_name} ${selectedDentist.last_name}`}</h2>
                                <p className="detail-spec">Dentist</p>
                                <p className="detail-sub">{selectedDentist.contact_number || "N/A"} · {selectedDentist.email}</p>
                                <p className="detail-sub">📍 {selectedDentist.branch_id} Branch</p>
                                <p className="detail-schedule">⏰ {formatWorkingHours(workingHours)}</p>
                            </div>
                            <div className="detail-hero-right">
                                <span className={`status-pill ${STATUS_COLOR[selectedDentist.status]}-pill`}>
                                    {selectedDentist.status}
                                </span>
                                <div className="commission-box">
    <span className="commission-label">
        Today's Commission
    </span>

    <span className="commission-value">
        ₱{Number(dailyCommission || 0).toLocaleString()}
    </span>

    <span className="commission-rate">
    30% Rate
</span>
</div>
                            </div>
                        </div>

                        <div className="detail-tabs">
                            {[
                                { key: "overview",  label: "📊 Overview" },
                                { key: "patients",  label: `🧑‍🦷 Patients` },
                                { key: "schedule", label: `🏖️ Schedule`},
                                { key: "forms",     label: "📝 Forms" },
                            ].map(({ key, label }) => (
                                <button key={key} className={`tab-btn ${activeTab === key ? "tab-active" : ""}`} onClick={() => setActiveTab(key)}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {activeTab === "overview" && (
  <div className="tab-panel">

    <div className="overview-grid">

      <div className="ov-card ov-card-highlight">
        <span className="ov-icon">₱</span>
        <div>
          <span className="ov-value">
            ₱{Number(dailyCommission || 0).toLocaleString()}
          </span>
          <span className="ov-label">
            Daily Commission
          </span>
        </div>
      </div>

      <div className="ov-card">
        <span className="ov-icon">📈</span>
        <div>
          <span className="ov-value">
            ₱{Number(totalCommission || 0).toLocaleString()}
          </span>
          <span className="ov-label">
            Total Commission
          </span>
        </div>
      </div>

      <div className="ov-card">
        <span className="ov-icon">₱</span>
        <div>
          <span className="ov-value">
            ₱{Number(totalEarnings || 0).toLocaleString()}
          </span>
          <span className="ov-label">
            Total Earnings
          </span>
        </div>
      </div>

      <div className="ov-card">
        <span className="ov-icon">🧑‍🦷</span>
        <div>
          <span className="ov-value">
            {myPatients.length}
          </span>
          <span className="ov-label">
            Patients Handled
          </span>
        </div>
      </div>
    </div>
          <div className="section-card">

    <h3 className="section-title">
        💰 Commission Breakdown
        <table className="commission-table">
<thead>
<tr>
<th className="date-col">Date</th>
<th className="patient-col">Patient</th>
<th className="procedure-col">Treatment</th>
<th className="earnings-col">Amount</th>
<th className="commission-col">Commission</th>
</tr>
</thead>

<tbody>
{earnings.map(row => (

<tr key={`${row.patient_name}-${row.appointment_date}`}>

<td>{row.appointment_date}</td>

<td className="patient-col">{row.patient_name}</td>

<td className="procedure-col">{row.treatments}</td>

<td className="earnings-col">
₱{Number(row.earnings).toLocaleString()}
</td>

<td className="commission-col">
₱{Number(row.commission).toLocaleString()}
</td>

</tr>


))}
</tbody>
</table>
    </h3>
</div>

  </div>
)}


  {activeTab === "patients" && (
  <div className="tab-panel">
    <div className="patient-search-wrap">

    <input
    className="patient-search-input"
    placeholder="Search patient..."
    value={patientSearch}
    onChange={(e)=>
    setPatientSearch(
    e.target.value
    )}
    />

    </div>
    {myPatients.length === 0 ? (
      <p className="no-data-center">
        No patients handled yet.
      </p>
    ) : (
      <ul className="handled-list">
        {myPatients
        .filter((p)=>
        (p.name || "")
        .toLowerCase()
        .includes(
        patientSearch.toLowerCase()
        )
        )
        .map((p)=>(
            console.log("PATIENT OBJECT:", p),
          <li
            key={p.id}
            className="handled-item"
          >
            <div className="handled-avatar">
{
  p.avatar_url ? (
    <img
      src={p.avatar_url}
      alt={p.name}
      className="handled-avatar-img"
    />
  ) : (
    p.name
      ?.split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
  )
}
</div>

            <div className="handled-meta">

  <h4 className="handled-name">
    {p.name}
  </h4>

  <span className="handled-proc-label">
    Last Treatment
  </span>

  <span className="handled-proc">
    {p.reason_for_visit}
  </span>

</div>

            <div className="handled-date">
              <span className="date-label">
                Last Visit
              </span>

              <span className="date-val">
                {p.appointment_date}
              </span>
            </div>

            <button
  className="view-record-btn"
  onClick={() =>
    handleViewRecord(p)
  }
>
  View Record
</button>
          </li>
        ))}
      </ul>
    )}
   {
showRecordModal &&
selectedRecordPatient && (

<div
  className="record-modal-overlay"
  onClick={() => setShowRecordModal(false)}
>

  <div
    className="record-modal"
    onClick={(e) => e.stopPropagation()}
  >

    <button
      className="record-modal-close"
      onClick={() => setShowRecordModal(false)}
    >
      ✕
    </button>

    <h2>Patient Record</h2>

    <div className="record-tabs">

      <button
        className={recordTab === "info" ? "record-tab active" : "record-tab"}
        onClick={() => setRecordTab("info")}
      >
        📋 Information
      </button>

      <button
        className={recordTab === "medical" ? "record-tab active" : "record-tab"}
        onClick={() => setRecordTab("medical")}
      >
        📁 Medical Files
      </button>

      <button
        className={recordTab === "billing" ? "record-tab active" : "record-tab"}
        onClick={() => setRecordTab("billing")}
      >
        🧾 Billing Documents
      </button>

      <button
        className={recordTab === "notes" ? "record-tab active" : "record-tab"}
        onClick={() => setRecordTab("notes")}
      >
        📝 Dental History
      </button>

    </div>

    {recordTab === "info" && (

      <>
        <div className="record-header">

  <div className="record-avatar">

    {selectedRecordPatient.avatar_url ? (

      <img
        src={selectedRecordPatient.avatar_url}
        alt=""
      />

    ) : (

      <span>
        {selectedRecordPatient.name
          ?.split(" ")
          .map(n => n[0])
          .join("")
          .slice(0,2)}
      </span>

    )}

  </div>

  <div className="record-header-info">

    <h2 className="record-patient-name">
      {selectedRecordPatient.name}
    </h2>

    <span className="record-patient-badge">
      Registered Patient
    </span>

    <div className="record-contact">

      <span>
        📞 {selectedRecordPatient.contact_number || "No Contact"}
      </span>

      <span>
        📧 {selectedRecordPatient.email}
      </span>

    </div>

  </div>

</div>

        <div className="record-stats">

<div className="record-stat">

<div className="record-stat-icon">
🦷
</div>

<div>

<h4>Total Visits</h4>

<p>{patientRecords.length}</p>

</div>

</div>

<div className="record-stat">

<div className="record-stat-icon">
📅
</div>

<div>

<h4>Last Visit</h4>

<p>
{patientRecords[0]?.record_date || "--"}
</p>

</div>

</div>

<div className="record-stat">

<div className="record-stat-icon">
💉
</div>

<div>

<h4>Latest Treatment</h4>

<p>
{patientRecords[0]?.treatment_name || "--"}
</p>

</div>

</div>

</div>

      </>

    )}

    {recordTab === "medical" && (

<div className="record-section">

<div className="record-section-header">
  <h3>Medical Files</h3>
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
? "Active Files"
: "Archived Files"
}
</button>

</div>

{

medicalFiles.length===0 ?

(

<div className="empty-record-box">

<h4>
No Medical Files
</h4>

<p>
Uploaded files will appear here.
</p>

</div>

)

:

(

<table className="record-files-table">

<thead>

<tr>

<th>
File
</th>

<th>
Category
</th>

<th>
Date
</th>

<th>
Actions
</th>

</tr>

</thead>

<tbody>

{

(
showArchivedMedical
? archivedMedicalFiles
: medicalFiles
).map(file=>(

<tr
key={file.id}
>

<td>

📄

{" "}

{file.file_name || file.name || file.title}

</td>

<td>

<span
className={`file-badge ${
file.file_type
}`}
>

{
file.file_type === "xray"
? "X-Ray"

: file.file_type === "lab"
? "Lab"

: file.file_type === "clearance"
? "Clearance"

: file.file_type === "consent"
? "Consent"

: "Other"
}

</span>

</td>

<td>

{file.taken_at}

</td>

<td className="file-actions">

<a
href={file.file_url}
target="_blank"
rel="noreferrer"
className="file-btn view"
>

View

</a>

<a
href={file.file_url}
download
className="file-btn download"
>

Download

</a>

{
showArchivedMedical
? (

<button
className="file-btn"
onClick={async ()=>
{
await restorePatientFileApi(
file.id
);

await refreshMedicalFiles();

await loadArchivedMedicalFiles();
}}
>

↩ Unarchive

</button>

)

:

(

<button
className="file-btn archive"
onClick={()=>
handleArchiveMedicalFile(
file.id
)}
>

Archive

</button>

)
}

</td>

</tr>

))

}

</tbody>

</table>

)

}

</div>

)}

    {recordTab === "billing" && (

<div className="record-section">

<div className="record-section-header">

<h3>
Billing Documents
</h3>

<button
className="archive-toggle-btn"
onClick={() =>
setShowArchivedBilling(
!showArchivedBilling
)}
>
{
showArchivedBilling
? "Active Files"
: "Archived Files"
}
</button>

</div>

{

billingDocuments.length===0 ?

(

<div className="empty-record-box">

<h4>
No Billing Documents
</h4>

<p>
Upload receipts or invoices.
</p>

</div>

)

:

(

<table className="record-files-table">

<thead>

<tr>

<th>
File
</th>

<th>
Type
</th>

<th>
Uploaded
</th>

<th>
Actions
</th>

</tr>

</thead>

<tbody>

{

(
showArchivedBilling
? archivedBillingDocuments
: billingDocuments
).map(doc=>(

<tr
key={doc.id}
>

<td>

📄 {doc.title}

</td>

<td>

<span
className={`file-badge ${doc.document_type}`}
>

{

doc.document_type==="receipt"

?

"Receipt"

:

"Invoice"

}

</span>

</td>

<td>

{

new Date(
doc.created_at
).toLocaleDateString()

}

</td>

<td
className="file-actions"
>

<a
href={doc.file_url}
target="_blank"
rel="noreferrer"
className="file-btn view"
>

View

</a>

<a
href={doc.file_url}
download
className="file-btn download"
>

Download

</a>

{
showArchivedBilling
? (

<button
className="file-btn"
onClick={async ()=>
{
await restoreBillingDocumentApi(
doc.id
);

const active =
await getBillingDocumentsApi(
selectedRecordPatient.id
);

const archived =
await getBillingDocumentsApi(
selectedRecordPatient.id,
{
archived:true
}
);

setBillingDocuments(
active.documents || []
);

setArchivedBillingDocuments(
archived.documents || []
);
}}
>

↩ Unarchive

</button>

)

:

(

<button
className="file-btn archive"
onClick={()=>
handleArchiveBillingDocument(
doc.id
)}
>

Archive

</button>

)
}

</td>

</tr>

))

}

</tbody>

</table>

)

}

</div>

)}

    {recordTab === "notes" && (

      <>

        <h3>Dental History</h3>

        {patientRecords.length === 0 ? (

          <p>No records found.</p>

        ) : (

          <div className="record-history">

            {patientRecords.map(record => (

              <div
                key={record.id}
                className="record-card"
              >

                <div className="record-date">
                  📅 {record.record_date}
                </div>

                <h4>
                  🦷 {record.treatment_name}
                </h4>

                <button
                  className="record-action-btn"
                  onClick={() => handleViewTreatment(record)}
                >
                  View Record
                </button>

              </div>

            ))}

          </div>

        )}

      </>

    )}

  </div>

</div>

)}
  </div>
)}


{activeTab === "schedule" && (
    <div className="tab-panel">
      <div className="section-card" style={{ marginBottom: 16 }}>
          <h3 className="section-title">🕐 Working Hours</h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                  {DAYS.map((day) => (
                    <div key={day} className="dact-day-row">
                      <span className="dact-day-label">{day}</span>
  <input
    type="time"
    min="10:00"
    max="17:00"
    value={workingHours[day]?.start}
    className="dact-time-input"
    onChange={(e) => {
  const value =
    e.target.value < "10:00"
      ? "10:00"
      : e.target.value;

  setWorkingHours((prev) => ({
    ...prev,
    [day]: {
      ...prev[day],
      start: value
    }
  }));
}}
  />

<span className="dact-time-sep">
  –
</span>

<input
  type="time"
  min="10:00"
  max="17:00"
  value={workingHours[day]?.end}
  className="dact-time-input"
  onChange={(e) => {
  const value =
    e.target.value > "17:00"
      ? "17:00"
      : e.target.value;

  setWorkingHours((prev) => ({
    ...prev,
    [day]: {
      ...prev[day],
      end: value
    }
  }));
}}
/>

<label className="dact-off-toggle">
  <input
    type="checkbox"
    checked={
      workingHours[day]?.is_off
    }
    onChange={(e) =>
      setWorkingHours(
        (prev) => ({
          ...prev,
          [day]:
          {
            ...prev[day],
            is_off:
              e.target.checked
          }
        })
      )
    }
  />
  Off
</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div
  className="section-card"
  style={{ marginBottom: 16 }}
>
  <h3 className="section-title">
    🍽️ Lunch Break
  </h3>

  <div className="dact-form-grid">

    <div className="dact-form-group">
      <label>
        Lunch Start
      </label>

      <input
        type="time"
        value={lunchBreak.start}
        onChange={(e) =>
          setLunchBreak({
            ...lunchBreak,
            start:
              e.target.value
          })
        }
      />
    </div>

    <div className="dact-form-group">
      <label>
        Lunch End
      </label>

      <input
        type="time"
        value={lunchBreak.end}
        onChange={(e) =>
          setLunchBreak({
            ...lunchBreak,
            end:
              e.target.value
          })
        }
      />
    </div>

    <div className="dact-form-group full">
      <label>
        Applies To
      </label>

      <select
  value={lunchBreak.applies_to}
  onChange={(e) =>
    setLunchBreak({
      ...lunchBreak,
      applies_to: e.target.value
    })
  }
>

  <option value="all_days">
    All Days
  </option>

  <option value="weekdays">
    Weekdays Only
  </option>

  <option value="custom">
    Custom
  </option>

</select>
    </div>

    {
      lunchBreak.applies_to === "custom" && (
        <div className="dact-form-group full">
          <label>
            Custom Lunch Days
          </label>

          <div className="custom-lunch-days">
            {DAYS.map((day) => (
              <label
                key={day}
                className="custom-lunch-day"
              >
                <input
                  type="checkbox"
                  checked={
                    customLunchDays.includes(day)
                  }
                  onChange={() =>
                    toggleCustomLunchDay(day)
                  }
                />

                {day}
              </label>
            ))}
          </div>
        </div>
      )
    }

  </div>
</div>
                                <div className="leave-section-card" style={{ marginBottom: 16 }}>
                                    <div className="leave-section-header">
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <h3 className="section-title" style={{ margin: 0 }}>🏖️ Leave Requests</h3>
                                            {pendingCount > 0 && <span className="leave-pending-badge">{pendingCount} Pending</span>}
                                        </div>
                                    </div>
                                    {leaveRequests.length === 0 ? (
                                        <p className="no-data" style={{ marginTop: 4 }}>No leave requests from this dentist yet.</p>
                                    ) : (
                                        <ul className="leave-list">
                                            {leaveRequests.map((l) => (
                                                <li key={l.id} className={`leave-item leave-item-${l.status.toLowerCase()}`}>
                                                    <div className="leave-type-badge">{LEAVE_ICON[l.leave_type] || "📋"}</div>
                                                    <div className="leave-meta">

  <span className="leave-type-label">
  {l.leave_type}
</span>

{l.leave_type === "Others" &&
 l.leave_others && (
  <span className="leave-reason">
    "{l.leave_others}"
  </span>
)}

  <span className="leave-dates">
    📅 {
      l.leave_from === l.leave_to
        ? l.leave_from
        : `${l.leave_from} → ${l.leave_to}`
    }
  </span>

  {l.reason && (
    <span className="leave-reason">
      "{l.reason}"
    </span>
  )}

  {l.staff_note && (
    <span className="leave-remark-display">
      💬 <em>{l.staff_note}</em>
    </span>
  )}

  {(l.status === "Approved" ||
    l.status === "Declined") && (
    <>
      <span className="leave-reviewed-by">
        👤 Reviewed by {l.reviewed_by}
      </span>

      {l.reviewed_at && (
        <span className="leave-reviewed-date">
          🕒 {
            new Date(
              l.reviewed_at
            ).toLocaleDateString(
              "en-PH",
              {
                year: "numeric",
                month: "short",
                day: "numeric"
              }
            )
          }
        </span>
      )}
    </>
  )}

  <span className="leave-submitted-on">
    Filed {l.submittedOn}
  </span>

</div>
                                                    <div className="leave-actions-col">
                                                        <span
  className={`leave-status-pill leave-status-${l.status?.toLowerCase()}`}
>
{
  l.status?.toLowerCase() === "pending"
    ? "⏳ Pending"

  : l.status?.toLowerCase() === "approved"
    ? "✅ Approved"

  : l.status?.toLowerCase() === "declined"
    ? "❌ Declined"

  : l.status?.toLowerCase() === "cancelled"
    ? "🚫 Cancelled"

  : `❓ ${l.status}`
}
</span>
                                                        {l.status?.toLowerCase() === "pending" && (
  <button
    className="leave-review-btn"
    onClick={() =>
    {
      setShowRemarkModal({
        ...l,
        dentistId:
          selectedDentist.id
      });

      setRemarkInput("");
    }}
  >
    Review →
  </button>
)}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <button
  className="dact-btn dact-primary"
  onClick={handleSaveSchedule}
>
  💾 Save Schedule
</button>
                                </div>
                            </div>
                        )}            

{activeTab === "forms" && (
  <div className="tab-panel">

    <p className="forms-intro">
      Prepare and e-sign clinical forms for your patients.
      Choose a template below.
    </p>

<div className="forms-toolbar">

<input
    className="forms-search"
    placeholder="Search templates..."
    value={templateSearch}
    onChange={(e)=>
        setTemplateSearch(
            e.target.value
        )
    }
/>

<select
className="forms-filter"
value={templateFilter}
onChange={(e)=>
setTemplateFilter(
e.target.value
)}
>
    <option value="all">
All Templates
</option>

<option value="consent">
Consent Form
</option>

<option value="clearance">
Medical Clearance
</option>

<option value="prescription">
Prescription
</option>

<option value="referral">
Referral Letter
</option>

<option value="xray">
X-Ray Request
</option>

<option value="other">
Others
</option>
</select>

</div>


      <div className="forms-list">

{filteredTemplates.map((template)=>(

<div
    key={template.id}
    className="template-row"
>

    <div className="template-left">

        <div className="template-icon">
            📄
        </div>

        <div>

            <h3>
                {template.name}
            </h3>

            <span className="template-type">
                {template.type}
            </span>

        </div>

    </div>

    <div className="template-actions">

        <a
            href={template.url}
            target="_blank"
            rel="noreferrer"
            className="template-btn"
        >
            👁 View
        </a>

        <button
  className="template-btn"
  onClick={() => downloadTemplate(template)}
>
  ⬇ Download
</button>

<button
  className="template-btn"
  onClick={() => printTemplate(template)}
>
  🖨 Print
</button>

    </div>

</div>

))}

</div>

  </div>
)}
                    </div>
                )}
                {showFormModal && (

<div
  className="modal-overlay"
  onClick={() =>
    setShowFormModal(null)
  }
>

<div
  className="form-modal modal-form-doc"
  onClick={(e) =>
    e.stopPropagation()
  }
>

<div className="modal-header">

  <h3>
    {showFormModal.label}
  </h3>

  <button
    className="modal-close"
    onClick={() =>
      setShowFormModal(null)
    }
  >
    ✕
  </button>

</div>

<div className="form-doc-body">

  <div className="doc-preview"
  ref={printRef}>

    <div className="doc-letterhead">

      <span className="doc-clinic">
        🦷 Juana Smile Dental Clinic
      </span>

      <span className="doc-address">
        DentConnect Patient Forms
      </span>

    </div>

    <div className="doc-divider" />

    {showFormModal.id === "reseta" && (
      <div className="doc-content">

        <h4 className="doc-title">
          PRESCRIPTION
        </h4>

        <div className="doc-field">
          <label>Patient Name:</label>
          <div className="doc-input-line" />
        </div>

        <div className="doc-field">
          <label>Date:</label>
          <div className="doc-input-line" />
        </div>

        <div className="doc-rx">
          ℞
        </div>

        <div className="doc-rx-lines">
          <div className="doc-input-line long" />
          <div className="doc-input-line long" />
          <div className="doc-input-line long" />
        </div>

      </div>
    )}

    {showFormModal.id === "medcert" && (
      <div className="doc-content">

        <h4 className="doc-title">
          MEDICAL CERTIFICATE
        </h4>

        <p className="doc-para">
          To Whom It May Concern:
        </p>

        <p className="doc-para">
          This is to certify that
        </p>

        <div className="doc-input-line long" />

        <p className="doc-para">
          was examined and is currently
          under my care for dental treatment.
        </p>

      </div>
    )}

    {showFormModal.id === "referral" && (
      <div className="doc-content">

        <h4 className="doc-title">
          REFERRAL LETTER
        </h4>

        <div className="doc-field">
          <label>Patient:</label>
          <div className="doc-input-line" />
        </div>

        <div className="doc-field">
          <label>Referred To:</label>
          <div className="doc-input-line" />
        </div>

      </div>
    )}

    {showFormModal.id === "xray" && (
      <div className="doc-content">

        <h4 className="doc-title">
          X-RAY REQUEST
        </h4>

        <div className="doc-field">
          <label>Patient:</label>
          <div className="doc-input-line" />
        </div>

      </div>
    )}

    <div className="esign-section">

      {!signed ? (

        <>

          <div className="esign-label">
            {selectedDentist?.first_name}
            {" "}
            {selectedDentist?.last_name}
          </div>

          <div className="esign-title">
            Dentist
          </div>

          {!esignMode ? (

            <button
              className="btn-esign"
              onClick={() =>
                setEsignMode(true)
              }
            >
              ✍️ Add E-Signature
            </button>

          ) : (

            <form
              className="esign-form"
              onSubmit={handleESign}
            >

              <input
                className="esign-input"
                placeholder="Type your full name..."
                value={signatureText}
                onChange={(e) =>
                  setSignatureText(
                    e.target.value
                  )
                }
              />

              <div className="esign-btns">

                <button
                  type="button"
                  className="btn-esign-cancel"
                  onClick={() =>
                    setEsignMode(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-esign-confirm"
                >
                  Sign Document
                </button>

              </div>

            </form>

          )}

        </>

      ) : (

        <div className="signed-stamp">

          <div className="signature-text">
            {signatureText}
          </div>

          <div className="signed-label">
            ✅ E-Signed
          </div>

        </div>

      )}

    </div>

  </div>

  <div className="form-doc-actions">

    <button className="btn-print" onClick={handlePrint}>
      🖨️ Print
    </button>

    <button className="btn-download" onClick={handleDownloadPdf}>
      ⬇️ Download PDF
    </button>

    <button className="btn-send">
      📤 Send to Patient
    </button>

  </div>

</div>

</div>

</div>

)}
{
showRemarkModal && (

<div
  className="record-modal-overlay"
  onClick={() => setShowRemarkModal(null)}
>

  <div
    className="record-modal leave-review-modal"
    onClick={(e) => e.stopPropagation()}
  >

    <h2>
      Review Leave Request
    </h2>

    <div className="leave-review-summary">

      <div className="leave-review-icon">
        {LEAVE_ICON[showRemarkModal.leave_type] || "📅"}
      </div>

      <div className="leave-review-info">

        <div className="leave-review-type">
          {showRemarkModal.leave_type}
        </div>

        <div className="leave-review-dates">
          {showRemarkModal.leave_from}
          {" → "}
          {showRemarkModal.leave_to}
        </div>

        <div className="leave-review-filed">
          Filed:
          {" "}
          {showRemarkModal.submittedOn ||
            showRemarkModal.created_at}
        </div>

      </div>

    </div>

    <div className="leave-review-reason-box">

      <strong>Reason</strong>

      <p>
        {showRemarkModal.reason}
      </p>

    </div>

    <textarea
      className="remark-input"
      placeholder="Add remarks for the dentist..."
      value={remarkInput}
      onChange={(e) =>
        setRemarkInput(e.target.value)
      }
    />

    <div className="leave-review-actions">

      <button
        className="decline-btn"
        onClick={() =>
          handleLeaveAction(
            showRemarkModal.id,
            "declined"
          )
        }
      >
        ❌ Decline
      </button>

      <button
        className="approve-btn"
        onClick={() =>
          handleLeaveAction(
            showRemarkModal.id,
            "approved"
          )
        }
      >
        ✅ Approve
      </button>

    </div>

  </div>

</div>

)}

            </main>
        </div>
    );
}

export default Dentists;
