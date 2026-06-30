import { useState, useEffect } from "react";
import "../styles/systemdata.css";
import { supabase } from "../lib/supabase";

const CATEGORIES = [
  {
    key: "services",
    label: "Services",
    icon: "📄",
    color: "blue",
    pageTitle: "Services / Bill Items",
    pageSubtitle: "Manage account services or bill items list.",
    addLabel: "+ New Service / Bill Item",
    columns: ["Name", "Details", "Default Amount", "Duration"],
  },
  {
    key: "medicines",
    label: "Medicines",
    icon: "💊",
    color: "purple",
    pageTitle: "Medicines",
    pageSubtitle: "Manage clinic medicine inventory list.",
    addLabel: "+ New Medicine",
    columns: ["Name", "Generic Name", "Dosage", "Unit", "Stock"],
  },
  {
    key: "templates",
    label: "Templates",
    icon: "🗂️",
    color: "amber",
    pageTitle: "Templates",
    pageSubtitle: "Manage document and prescription templates.",
    addLabel: "+ New Template",
    columns: ["Name", "Type", "Last Updated"],
  },
  {
    key: "dental-habits",
    label: "Dental Habits",
    icon: "🦷",
    color: "coral",
    pageTitle: "Dental Habits",
    pageSubtitle: "Manage dental habit entries for patient records.",
    addLabel: "+ New Dental Habit",
    columns: ["Habit Name", "Description", "Risk Level"],
  },
  {
    key: "medical-conditions",
    label: "Medical Conditions",
    icon: "❤️",
    color: "red",
    pageTitle: "Medical Conditions",
    pageSubtitle: "Manage medical condition entries used in patient charts.",
    addLabel: "+ New Condition",
    columns: ["Condition Name", "ICD Code", "Notes"],
  },
  {
    key: "tooth-items",
    label: "Tooth Items",
    icon: "🦷",
    color: "green",
    pageTitle: "Tooth Items",
    pageSubtitle: "Manage tooth chart item definitions.",
    addLabel: "+ New Tooth Item",
    columns: ["Name", "Abbreviation", "Color Tag", "Category"],
  },
];

function MasterfileTable({ category, onBack }) {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);

  const [coverageDetails, setCoverageDetails] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [status, setStatus] = useState("Active");

  const [details, setDetails] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [autoAdd, setAutoAdd] = useState(false);

  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("");
  const [stock, setStock] = useState("");

  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState("Low");

  const [icdCode, setIcdCode] = useState("");
  const [notes, setNotes] = useState("");

  const [abbreviation, setAbbreviation] = useState("");
  const [colorTag, setColorTag] = useState("#ff0000");
  const [toothCategory, setToothCategory] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [durationMinutes, setDurationMinutes] = useState("");

  const [templateType, setTemplateType] = useState("");

  const [templateFile, setTemplateFile] = useState(null);

  const [editingRow, setEditingRow] =
  useState(null);


  useEffect(() => {
    fetchRows();
  }, [category]);

  async function handleArchive(id)
{

  if(category.key === "services")
{
  const { error } =
    await supabase
      .from("services")
      .update({
        active: false
      })
      .eq(
        "id",
        id
      );

  if(error)
  {
    console.log(error);
    alert("Archive failed");
    return;
  }

  fetchRows();
  return;
}

  const tableMap = {
    medicines: "medicines",
    services: "services",
    hmo: "hmo",
    "dental-habits": "dental_habits",
    "medical-conditions":
      "medical_conditions",
    "tooth-items":
      "tooth_items",
    templates: "templates",
  };

  const tableName =
    tableMap[category.key];

  const { error } =
    await supabase
      .from(tableName)
      .update({
        is_archived: true
      })
      .eq("id", id);

  if(error)
  {
    console.log(error);
    alert("Archive failed");
    return;
  }

  fetchRows();
}

  async function fetchRows() {
    const tableMap = {
      medicines: "medicines",
      services: "services",
      hmo: "hmo",
      "dental-habits": "dental_habits",
      "medical-conditions": "medical_conditions",
      "tooth-items": "tooth_items",
      templates: "templates",
    };

    const tableName = tableMap[category.key];

    if (!tableName) return;

    let query =
  supabase
    .from(tableName)
    .select("*");

if(category.key === "services")
{
  query =
    query.eq(
      "active",
      true
    );
}
else
{
  query =
    query.eq(
      "is_archived",
      false
    );
}

const {
  data,
  error
} = await query;

    if (error) {
      console.log(error);
    } else {
      setRows(data);
    }
  }

  function handleEdit(row)
{
  setEditingRow(row);

  setName(row.name || "");
  setCoverageDetails(row.coverage_details || "");
  setDiscountPercent(row.discount_percent || "");
  setStatus(row.status || "Active");

  setDetails(row.description || "");
  setDefaultAmount(row.price || "");
  setAutoAdd(row.auto_add || false);

  setGenericName(row.generic_name || "");
  setDosage(row.dosage || "");
  setUnit(row.unit || "");
  setStock(row.stock || "");

  setDescription(row.description || "");
  setRiskLevel(row.risk_level || "Low");

  setIcdCode(row.icd_code || "");
  setNotes(row.notes || "");

  setAbbreviation(row.abbreviation || "");
  setColorTag(row.color_tag || "#ff0000");
  setToothCategory(row.category || "");

  setTemplateType(row.type || "");

  setDurationMinutes(row.duration_minutes || "");

  setShowModal(true);
}

async function handleUpdate()
{
  const tableMap = {
    medicines: "medicines",
    services: "services",
    hmo: "hmo",
    "dental-habits": "dental_habits",
    "medical-conditions": "medical_conditions",
    "tooth-items": "tooth_items",
    templates: "templates",
  };

  const tableName =
    tableMap[category.key];

  let payload = {};

  if(category.key === "medicines")
  {
    payload = {
      name,
      generic_name: genericName,
      dosage,
      unit,
      stock
    };
  }

  if(category.key === "services")
  {
    payload = {
    name,
    description: details,
    price: defaultAmount,
    duration_minutes: durationMinutes,
    duration: `${durationMinutes} mins`
};
  }

  if(category.key === "hmo")
  {
    payload = {
      name,
      coverage_details: coverageDetails,
      discount_percent: discountPercent,
      status
    };
  }

  if(category.key === "dental-habits")
  {
    payload = {
      name,
      description,
      risk_level: riskLevel
    };
  }

  if(category.key === "medical-conditions")
  {
    payload = {
      name,
      icd_code: icdCode,
      notes
    };
  }

  if(category.key === "tooth-items")
  {
    payload = {
      name,
      abbreviation,
      color_tag: colorTag,
      category: toothCategory
    };
  }

  if(category.key === "templates")
{
  payload = {
    name,
    type: templateType
  };
}

  const { error } =
    await supabase
      .from(tableName)
      .update(payload)
      .eq("id", editingRow.id);

  if(error)
  {
    console.log(error);
    alert("Update failed");
    return;
  }

  setEditingRow(null);
  setShowModal(false);
  fetchRows();
}

  async function handleAddMedicine() {

    const { error } = await supabase
      .from("medicines")
      .insert([
        {
          name: name,
          generic_name: genericName,
          dosage: dosage,
          unit: unit,
          stock: stock,
        },
      ]);

    if (error) {
      console.log(error);
      alert("Failed to add medicine");
    } else {

      alert("Medicine added successfully");

      setName("");
      setGenericName("");
      setDosage("");
      setUnit("");
      setStock("");

      setShowModal(false);

      fetchRows();
    }
  }

  async function handleAddService()
{
  const { error } =
    await supabase
      .from("services")
      .insert([
        {
          name: name,
          description: details,
          price: defaultAmount,
          duration_minutes: durationMinutes,
          duration: `${durationMinutes} mins`,
          icon: "🦷",
          active: true
        }
      ]);

  if(error)
  {
    console.log(error);
    alert("Failed to add service");
    return;
  }

  alert("Service added successfully");

  setName("");
  setDetails("");
  setDefaultAmount("");
  setDurationMinutes("");

  setShowModal(false);

  fetchRows();
}

async function handleAddHMO() {

  const { error } = await supabase
    .from("hmo")
    .insert([
      {
        name: name,
        coverage_details: coverageDetails,
        discount_percent: discountPercent,
        status: status,
      },
    ]);

  if (error) {
    console.log(error);
    alert("Failed to add HMO");
  } else {

    alert("HMO added successfully");

    setName("");
    setCoverageDetails("");
    setDiscountPercent("");
    setStatus("Active");

    setShowModal(false);

    fetchRows();
  }
}

async function handleAddDentalHabit() {

  const { error } = await supabase
    .from("dental_habits")
    .insert([
      {
        name: name,
        description: description,
        risk_level: riskLevel,
      },
    ]);

  if (error) {
    console.log(error);
    alert("Failed to add dental habit");
  } else {

    alert("Dental habit added successfully");

    setName("");
    setDescription("");
    setRiskLevel("Low");

    setShowModal(false);

    fetchRows();
  }
}

async function handleAddMedicalCondition() {

  const { error } = await supabase
    .from("medical_conditions")
    .insert([
      {
        name: name,
        icd_code: icdCode,
        notes: notes,
      },
    ]);

  if (error) {
    console.log(error);
    alert("Failed to add medical condition");
  } else {

    alert("Medical condition added successfully");

    setName("");
    setIcdCode("");
    setNotes("");

    setShowModal(false);

    fetchRows();
  }
}

async function handleAddToothItem() {

  const { error } = await supabase
    .from("tooth_items")
    .insert([
      {
        name: name,
        abbreviation: abbreviation,
        color_tag: colorTag,
        category: toothCategory,
      },
    ]);

  if (error) {
    console.log(error);
    alert("Failed to add tooth item");
  } else {

    alert("Tooth item added successfully");

    setName("");
    setAbbreviation("");
    setColorTag("");
    setToothCategory("");

    setShowModal(false);

    fetchRows();
  }
}

async function handleAddTemplate()
{
  let filePath = null;

  if(templateFile)
  {
    const fileName =
      `${Date.now()}-${templateFile.name}`;

    const {
      error: uploadError
    } =
      await supabase.storage
        .from("template-files")
        .upload(
          fileName,
          templateFile
        );

    if(uploadError)
    {
      console.log(uploadError);
      alert("File upload failed");
      return;
    }

    filePath = fileName;
  }

  const { error } =
    await supabase
      .from("templates")
      .insert([
        {
  name,
  type: templateType,
  file_url: filePath,
  is_archived: false,
  updated_at: new Date().toISOString()
}
      ]);

  if(error)
  {
    console.log(error);
    alert("Failed to add template");
    return;
  }

  alert(
    "Template added successfully"
  );

  setName("");
  setTemplateType("");
  setTemplateFile(null);

  setShowModal(false);

  fetchRows();
}

  const fieldMap = {
    "Name": "name",
    "Generic Name": "generic_name",
    "Dosage": "dosage",
    "Unit": "unit",
    "Stock": "stock",

    "Details": "description",
    "Default Amount": "price",
    "Duration": "duration",

    "Coverage Details": "coverage_details",
    "Discount %": "discount_percent",
    "Status": "status",

    "Habit Name": "name",
    "Description": "description",
    "Risk Level": "risk_level",

    "Condition Name": "name",
    "ICD Code": "icd_code",
    "Notes": "notes",

    "Abbreviation": "abbreviation",
    "Color Tag": "color_tag",
    "Category": "category",

    "Type": "type",
    "Last Updated": "updated_at",
  };

  return (
    <div className="mf-table-view">

      {/* MODAL */}
      {/* MODAL */}
{showModal && (

  <div className="mf-modal-overlay">

    <div className="mf-modal">

      {category.key === "templates" && (
<>
  <h2>
    {
      editingRow
      ? "Edit Template"
      : "Add Template"
    }
  </h2>

  <div className="mf-modal-form">

    <input
      type="text"
      placeholder="Template Name"
      value={name}
      onChange={(e) =>
        setName(
          e.target.value
        )
      }
    />

    <select
  value={templateType}
  onChange={(e)=>
    setTemplateType(e.target.value)
  }
>

<option value="">
Select Template
</option>

<option value="xray">
X-Ray Request
</option>

<option value="lab">
Laboratory Result
</option>

<option value="clearance">
Medical Clearance
</option>

<option value="consent">
Consent Form
</option>

<option value="prescription">
Prescription
</option>

<option value="referral">
Referral Letter
</option>

<option value="other">
Other
</option>

</select>

    <input
      type="file"
      onChange={(e) =>
        setTemplateFile(
          e.target.files[0]
        )
      }
    />

  </div>

  <div className="mf-modal-actions">

    <button
      className="mf-save-btn"
      onClick={
        editingRow
        ? handleUpdate
        : handleAddTemplate
      }
    >
      Save
    </button>

    <button
      className="mf-cancel-btn"
      onClick={() =>
      {
        setEditingRow(null);
        setShowModal(false);
      }}
    >
      Cancel
    </button>

  </div>
</>
)}

      {/* MEDICINES MODAL */}
      {category.key === "medicines" && (
        <>
          <h2>
  {editingRow ? "Edit Medicine" : "Add Medicine"}
</h2>

          <div className="mf-modal-form">

            <input
              type="text"
              placeholder="Medicine Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Generic Name"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />

            <input
              type="text"
              placeholder="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />

            <input
              type="number"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />

          </div>

          <div className="mf-modal-actions">

            <button
              className="mf-save-btn"
              onClick={
  editingRow
    ? handleUpdate
    : handleAddMedicine
}
            >
              Save
            </button>

            <button
              className="mf-cancel-btn"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

          </div>
        </>
      )}

      {/* SERVICES MODAL */}
      {category.key === "services" && (
        <>
          <h2>
  {editingRow ? "Edit Service" : "Add Service"}
</h2>

          <div className="mf-modal-form">

            <input
              type="text"
              placeholder="Service Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <textarea
              placeholder="Details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <input
              type="number"
              placeholder="Default Amount"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
            />

          <input
            type="number"
            placeholder="Duration Minutes"
            value={durationMinutes}
            onChange={(e) =>
            setDurationMinutes(
            e.target.value
    )
  }
/>

            <label className="mf-checkbox">

              <input
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
              />

              Auto Add Service

            </label>

          </div>

          <div className="mf-modal-actions">

            <button
              className="mf-save-btn"
              onClick={
  editingRow
    ? handleUpdate
    : handleAddService
}            >
              Save
            </button>

            <button
              className="mf-cancel-btn"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>

          </div>
        </>
      )}

      {category.key === "hmo" && (
  <>
    <h2>
  {editingRow ? "Edit HMO" : "Add HMO"}
</h2>

    <div className="mf-modal-form">

      <input
        type="text"
        placeholder="HMO Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Coverage Details"
        value={coverageDetails}
        onChange={(e) => setCoverageDetails(e.target.value)}
      />

      <input
        type="number"
        placeholder="Discount Percent"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>

    </div>

    <div className="mf-modal-actions">

      <button
        className="mf-save-btn"
        onClick={
  editingRow
    ? handleUpdate
    : handleAddHMO
}
      >
        Save
      </button>

      <button
        className="mf-cancel-btn"
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>

    </div>
  </>
)}

{category.key === "dental-habits" && (
  <>
    <h2>
  {editingRow ? "Edit Dental Habits" : "Add Dental Habits"}
</h2>

    <div className="mf-modal-form">
      <input
        type="text"
        placeholder="Habit Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <select
        value={riskLevel}
        onChange={(e) => setRiskLevel(e.target.value)}
      >
        <option value="Low">Low</option>
        <option value="Moderate">Moderate</option>
        <option value="High">High</option>
      </select>
    </div>

    <div className="mf-modal-actions">
      <button className="mf-save-btn" 
      
      onClick={
  editingRow
    ? handleUpdate
    : handleAddDentalHabit
}
>
        Save
      </button>

      <button className="mf-cancel-btn" onClick={() => setShowModal(false)}>
        Cancel
      </button>
    </div>
  </>
)}

{category.key === "medical-conditions" && (
  <>
    <h2>
  {editingRow ? "Edit Condition" : "Add Condition"}
</h2>

    <div className="mf-modal-form">

      <input
        type="text"
        placeholder="Condition Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="ICD Code"
        value={icdCode}
        onChange={(e) => setIcdCode(e.target.value)}
      />

      <textarea
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

    </div>

    <div className="mf-modal-actions">

      <button
        className="mf-save-btn"

        onClick={
  editingRow
    ? handleUpdate
    : handleAddMedicalCondition
}
      >
        Save
      </button>

      <button
        className="mf-cancel-btn"
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>

    </div>
  </>
)}

{category.key === "tooth-items" && (
  <>
    <h2>
  {editingRow ? "Edit Tooth Items" : "Add Tooth Items"}
</h2>

    <div className="mf-modal-form">

      <input
        type="text"
        placeholder="Item Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Abbreviation"
        value={abbreviation}
        onChange={(e) => setAbbreviation(e.target.value)}
      />

      <div className="mf-color-picker">

        <label>Color Tag</label>

        <input
          type="color"
          value={colorTag}
          onChange={(e) => setColorTag(e.target.value)}
        />

      </div>

      <select
        value={toothCategory}
        ovalue={toothCategory}
        onChange={(e) => setToothCategory(e.target.value)}
      >
        <option value="">Select Category</option>
        <option value="Condition">Condition</option>
        <option value="Restoration">Restoration</option>
        <option value="Treatment">Treatment</option>
        <option value="Prosthesis">Prosthesis</option>
        <option value="Surgery">Surgery</option>
      </select>

    </div>

    <div className="mf-modal-actions">

      <button
        className="mf-save-btn"

        onClick={
  editingRow
    ? handleUpdate
    : handleAddToothItem
}
      >
        Save
      </button>

      <button
        className="mf-cancel-btn"
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>

    </div>
  </>
)}

    </div>

  </div>
)}


      {/* TOP */}
      <div className="mf-table-top">

        <button className="mf-back-btn" onClick={onBack}>
          ← Back
        </button>

        <div>
          <h2 className="mf-table-title">{category.pageTitle}</h2>
          <p className="mf-table-subtitle">{category.pageSubtitle}</p>
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="mf-toolbar">

        <div className="mf-search-wrap">

          <span className="mf-search-icon">🔍</span>

          <input
            className="mf-search"
            type="text"
            placeholder="Search here"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

        <button
          className={`mf-add-btn mf-add-btn--${category.color}`}
          onClick={() => setShowModal(true)}
        >
          {category.addLabel}
        </button>

      </div>

      {/* TABLE */}
      <div className="mf-table-wrap">

        <table className="mf-table">

          <thead>
            <tr>

              <th className="mf-th-actions">Actions</th>

              {category.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}

            </tr>
          </thead>

          <tbody>

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={category.columns.length + 1}
                  className="mf-empty"
                >
                  No records found. Click{" "}
                  <strong>{category.addLabel}</strong> to get started.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>

                  <td className="mf-actions-cell">

                    <button
  className="mf-action-edit"
  title="Edit"
  onClick={() =>
    handleEdit(row)
  }
>
  ✏️
</button>

                    <button
  className="mf-action-del"
  title="Archive"
  onClick={() =>
    handleArchive(row.id)
  }
>
  📦
</button>

{row.file_url && (
  <a
    className="mf-action-edit"
    title="View File"
    href={
      supabase.storage
        .from("template-files")
        .getPublicUrl(row.file_url)
        .data.publicUrl
    }
    target="_blank"
    rel="noopener noreferrer"
  >
  view
  </a>
)}

                  </td>

                  {category.columns.map((col, index) => {

  const value = row[fieldMap[col]];

  if (col === "Color Tag") {
    return (
      <td key={index}>
        <div
          className="mf-color-box"
          style={{
            backgroundColor: value || "#ccc"
          }}
        />
      </td>
    );
  }

  return (
    <td key={index}>
      {value ?? "—"}
    </td>
  );
})}

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

function SystemData() {
  const [active, setActive] = useState(null);

  if (active) {
    const category = CATEGORIES.find((c) => c.key === active);

    return (
      <div className="admin-container">
        <div className="admin-main">
          <div className="dashboard-content">
            <div className="systemdata-container">
              <MasterfileTable
                category={category}
                onBack={() => setActive(null)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="dashboard-content">
          <div className="systemdata-container">

            <h2 className="systemdata-title">
              Masterfiles
            </h2>

            <div className="masterfiles-grid">

              {CATEGORIES.map((item) => (
                <div
                  key={item.key}
                  className={`masterfile-card masterfile-card--${item.color}`}
                  onClick={() => setActive(item.key)}
                >

                  <div className="masterfile-icon">
                    {item.icon}
                  </div>

                  <div className="masterfile-label">
                    {item.label}
                  </div>

                </div>
              ))}

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemData;