import { useState, useEffect } from "react";
import "../styles/newpatient.css";
import { createUserApi } from "../api/users";
import { useNavigate } from "react-router-dom";
import
{
  createUserApi,
  checkEmailExistsApi
}
from "../api/users";


const PERSONAL_REQUIRED = [
  { name: "lastname",     label: "Last Name" },
  { name: "firstname",   label: "First Name" },
  { name: "birthdate",   label: "Birthdate" },
  { name: "sex",         label: "Sex" },
  { name: "mobile",      label: "Mobile No." },
  { name: "homeAddress", label: "Home Address" },
  { name: "nationality", label: "Nationality" },
  { name: "religion",    label: "Religion" },
  { name: "civilStatus", label: "Civil Status" },
  { name: "occupation",  label: "Occupation" },
  { name: "email",       label: "Email" },
];

const GUARDIAN_REQUIRED = [
  { name: "fatherName",   label: "Father's Name" },
  { name: "motherName",   label: "Mother's Name" },
  { name: "physicianName", label: "Physician's Name" },
];

const MEDICAL_REQUIRED = [
  { name: "lastDentalVisit",  label: "Last Dental Visit" },
  { name: "goodHealth",       label: "Question 1 (Good Health)" },
  { name: "bleedingTime",     label: "Bleeding Time" },
];

function NewPatient() 
{
  const navigate = useNavigate();
  const [step, setStep]               = useState(0);
  const [isMinor, setIsMinor]         = useState(false);
  const [validationError, setValidationError] = useState("");
  const [photo, setPhoto]             = useState(null);
  const [showCamera, setShowCamera]   = useState(false);

  const stepLabels = isMinor
    ? ["Personal", "Guardian", "Medical"]
    : ["Personal", "Medical"];

  const activeDisplayIndex = isMinor ? step : (step === 0 ? 0 : 1);

  const [personal, setPersonal] = useState({
    lastname: "", firstname: "", middlename: "", suffix: "", nickname: "",
    birthdate: "", age: "", sex: "", religion: "", nationality: "",
    mobile: "", email: "", officeNo: "", faxNo: "", homeNo: "",
    homeAddress: "", school: "", hmo: "", referredBy: "", referralReason: "",
    bloodType: "", bloodPressure: "", weight: "", height: "",
    civilStatus: "", occupation: "", company: "",
    guardianNameMinor: "", guardianOccupationMinor: "",
  });

  const [guardian, setGuardian] = useState({
    fatherName: "", fatherOccupation: "", fatherEmployer: "", fatherContact: "",
    motherName: "", motherOccupation: "", motherEmployer: "", motherContact: "",
    guardianName: "", guardianOccupation: "", guardianContact: "",
    physicianName: "", physicianSpecialty: "",
    physicianOfficeAddress: "", physicianOfficeNumber: "",
  });

  const [medical, setMedical] = useState({
    lastDentalVisit: "",
    previousHospitalizations: "", prescribedMedications: "",
    allergies: "", familyMedicalProblems: "",
    otherMedicalConcerns: "", medicalAlert: "",
    goodHealth: "", underMedicalTreatment: "", medicalTreatmentCondition: "",
    seriousIllness: "", seriousIllnessDetails: "",
    hospitalized: "", hospitalizedDetails: "",
    takingMedication: "", medicationDetails: "",
    useTobacco: "", useAlcoholDrugs: "",
    allergyLocalAnesthetic: false, allergyLatex: false,
    allergyAspirin: false, allergyPenicillinAntibiotics: false,
    allergySulfaDrugs: false, allergyOthers: "",
    bleedingTime: "",
    isPregnant: "", isNursing: "", takingBirthControl: "",
    conditions: [], habits: [], patientDiet: "",
  });

  const medicalConditions = [
    "High Blood Pressure", "Low Blood Pressure", "Epilepsy / Convulsions",
    "AIDS / HIV Infection", "Sexually Transmitted Diseases",
    "Stomach Troubles / Ulcers", "Fainting Seizure", "Rapid Weight Loss",
    "Radiation Therapy", "Joint Replacement / Implant", "Sinus Surgery",
    "Heart Attack", "Thyroid Problem", "Heart Disease", "Heart Murmur",
    "Hepatitis / Liver Disease", "Rheumatic Fever", "Hay Fever / Allergies",
    "Respiratory Problems", "Tuberculosis", "Kidney Disease", "Diabetes",
    "Chest Pain", "Stroke", "Cancer / Tumors", "Anemia", "Angina",
    "Emphysema", "Bleeding Problems", "Head Disease", "Head Injuries",
    "Learning Disability", "Bleeding Disorder", "Brain Injury",
    "Neurological Disorder", "Ear Infection", "Skin Disorder",
    "Glandular Problems", "Mental Disorder", "Asthma", "Liver Problems",
    "Hyperactivity", "Seizures",
  ];

  const dentalHabits = [
    "Night Time Bottle Feeding", "Thumb Sucking", "Tongue Thrusting",
    "Teeth Grinding", "Nail Biting", "Mouth Breathing",
  ];

 const handleChange = (e) =>
{
  const {
    name,
    value
  } = e.target;

  const updated =
  {
    ...personal,
    [name]: value
  };

  if(name === "birthdate" && value)
  {
    const birth =
      new Date(value);

    const today =
      new Date();

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

    updated.age = age;

    setIsMinor(age < 18);
  }

  setPersonal(updated);
};

  const handleGuardianChange = (e) =>
    setGuardian({ ...guardian, [e.target.name]: e.target.value });

  const handleMedicalChange = (e) => 
  {
    const { name, value, type, checked } = e.target;
    setMedical({ ...medical, [name]: type === "checkbox" ? checked : value });
  };

  const toggleCondition = (condition) =>
    setMedical((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));

  const toggleHabit = (habit) =>
    setMedical((prev) => ({
      ...prev,
      habits: prev.habits?.includes(habit)
        ? prev.habits.filter((h) => h !== habit)
        : [...(prev.habits || []), habit],
    }));

  const validateFields = (fields, state) => 
  {
    for (const field of fields) 
    {
      const val = state[field.name];
      if (!val || (typeof val === "string" && val.trim() === "")) 
      {
        return `${field.label} is required.`;
      }
    }
    return "";
  };

  const validatePersonal = () => 
  {
    const err = validateFields(PERSONAL_REQUIRED, personal);
    if (err) return err;
    if(
    !/^09\d{9}$/.test(personal.mobile)
  )
  {
    return "Please enter a valid 11-digit mobile number.";
  }
  if(
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    personal.email
  )
)
{
  return "Please enter a valid email address.";
}
    return "";
  };

  const validateGuardian = () => validateFields(GUARDIAN_REQUIRED, guardian);
  const validateMedical = () =>
{
  let requiredFields = [...MEDICAL_REQUIRED];

  // Remove Bleeding Time requirement for male patients
  if(
    personal.sex &&
    personal.sex.toLowerCase() === "male"
  )
  {
    requiredFields =
      requiredFields.filter(
        field => field.name !== "bleedingTime"
      );
  }

  return validateFields(
    requiredFields,
    medical
  );
};

  const goNext = () => 
  {
    setValidationError("");
    if (step === 0) {
      const err = validatePersonal();
      if (err) { setValidationError(err); return; }
      setStep(isMinor ? 1 : 2);
    } else if (step === 1) {
      const err = validateGuardian();
      if (err) { setValidationError(err); return; }
      setStep(2);
    }
  };

  const goPrev = () => 
  {
    setValidationError("");
    if (step === 2) setStep(isMinor ? 1 : 0);
    else if (step === 1) setStep(0);
  };

  const handleSubmit = async () => 
{
  const err = validateMedical();

  if (err) 
  {
    setValidationError(err);
    alert(err);
    return;
  }

  try 
  {
    console.log("SUBMITTING PATIENT...");

    const payload =
{
  user:
  {
    first_name: personal.firstname,
    middle_name: personal.middlename,
    last_name: personal.lastname,
    suffix: personal.suffix,
    nickname: personal.nickname,

    birthdate:
      personal.birthdate || null,

    sex: personal.sex,

    contact_number:
      personal.mobile,

    email: personal.email,

    address:
      personal.homeAddress,

    school:
      personal.school,

    bloodtype:
      personal.bloodType,

    weight:
      personal.weight,

    height:
      personal.height,

    civilstatus:
      personal.civilStatus,

    occupation:
      personal.occupation,

    company:
      personal.company,

    role:"patient",

    password:"default123",

    is_archived:false
  },

  guardian:
  {
    father_name:
      guardian.fatherName,

    father_occupation:
      guardian.fatherOccupation,

    father_employer:
      guardian.fatherEmployer,

    father_contact:
      guardian.fatherContact,

    mother_name:
      guardian.motherName,

    mother_occupation:
      guardian.motherOccupation,

    mother_employer:
      guardian.motherEmployer,

    mother_contact:
      guardian.motherContact,

    guardian_name:
      guardian.guardianName,

    guardian_occupation:
      guardian.guardianOccupation,

    guardian_contact:
      guardian.guardianContact,

    physician_name:
      guardian.physicianName,

    physician_specialty:
      guardian.physicianSpecialty,

    physician_office_address:
      guardian.physicianOfficeAddress,

    physician_office_number:
      guardian.physicianOfficeNumber
  },

  medical:
  {
    last_dental_visit:
      medical.lastDentalVisit,

    good_health:
      medical.goodHealth,

    under_medical_treatment:
      medical.underMedicalTreatment,

    medical_treatment_condition:
      medical.medicalTreatmentCondition,

    serious_illness:
      medical.seriousIllness,

    serious_illness_details:
      medical.seriousIllnessDetails,

    hospitalized:
      medical.hospitalized,

    hospitalized_details:
      medical.hospitalizedDetails,

    taking_medication:
      medical.takingMedication,

    medication_details:
      medical.medicationDetails,

    use_tobacco:
      medical.useTobacco,

    use_alcohol_drugs:
      medical.useAlcoholDrugs,

    allergy_local_anesthetic:
      medical.allergyLocalAnesthetic,

    allergy_latex:
      medical.allergyLatex,

    allergy_aspirin:
      medical.allergyAspirin,

    allergy_penicillin_antibiotics:
      medical.allergyPenicillinAntibiotics,

    allergy_sulfa_drugs:
      medical.allergySulfaDrugs,

    allergy_others:
      medical.allergyOthers,

    bleeding_time:
      medical.bleedingTime,

    is_pregnant:
      medical.isPregnant,

    is_nursing:
      medical.isNursing,

    taking_birth_control:
      medical.takingBirthControl,

    conditions:
      medical.conditions,

    dental_habits:
      medical.habits,

    patient_diet:
      medical.patientDiet,

    previous_hospitalizations:
      medical.previousHospitalizations,

    prescribed_medications:
      medical.prescribedMedications,

    allergies:
      medical.allergies,

    family_medical_problems:
      medical.familyMedicalProblems,

    other_medical_concerns:
      medical.otherMedicalConcerns,

    medical_alert:
      medical.medicalAlert
  }
};

const response =
  await createUserApi(payload);

console.log(
  "CREATE PATIENT RESPONSE:",
  response
);

    console.log("CREATE PATIENT RESPONSE:", response);

    alert(
  "Patient successfully added!"
);

setTimeout(() => {
  navigate("/dashboard");
}, 300);
  } 
  catch (err) 
  {
    console.error("CREATE PATIENT ERROR:", err);
    alert(err.message || "Failed to add patient");
  }
};

  const YesNoField = ({ label, name, value, subField, subName, subValue }) => (
    <div className="yesno-row">
      <span className="yesno-label">{label}</span>
      <div className="yesno-options">
        <label>
          <input type="radio" name={name} value="yes"
            checked={value === "yes"} onChange={handleMedicalChange} /> Yes
        </label>
        <label>
          <input type="radio" name={name} value="no"
            checked={value === "no"} onChange={handleMedicalChange} /> No
        </label>
      </div>
      {subField && value === "yes" && (
        <div className="yesno-subfield-wrap">
          <input className="yesno-subfield" name={subName}
            placeholder={subField} value={subValue || ""}
            onChange={(e) => setMedical({ ...medical, [subName]: e.target.value })} />
        </div>
      )}
    </div>
  );

  useEffect(() => 
  {
    if (showCamera) 
    {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          const video = document.getElementById("video");
          if (video) video.srcObject = stream;
        })
        .catch(() => { alert("Camera access denied"); setShowCamera(false); });
    }
  }, [showCamera]);

  const stopCamera = () => 
  {
    const video = document.getElementById("video");
    if (video?.srcObject) video.srcObject.getTracks().forEach((t) => t.stop());
  };

  const capturePhoto = () => 
  {
    const video = document.getElementById("video");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/png"));
    stopCamera();
    setShowCamera(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="dashboard-content">
          <h2 className="page-title">New Patient Information</h2>

          <div className="new-patient-container">
            <div className="stepper">
              {stepLabels.map((label, index) => (
                <div key={index} className={`step ${activeDisplayIndex === index ? "active" : ""}`}>
                  <div className="circle">{label[0]}</div>
                  <span>{label.toUpperCase()}</span>
                </div>
              ))}
            </div>

            <div className="form-content">
              {step === 0 && (
                <>
                  <p className="form-note">Please fill in all required information.</p>

                  <div className="personal-form">
                    <div className="photo-column">
                      <div className="photo-actions">
                        <button onClick={() => document.getElementById("photoUpload").click()}>
                          Upload
                        </button>
                        <button onClick={() => setShowCamera(true)}>
                          Capture
                        </button>
                      </div>
                      <input id="photoUpload" type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && setPhoto(URL.createObjectURL(e.target.files[0]))}/>
                      <div className="photo-box">
                        {photo
                          ? <img src={photo} alt="Patient" className="photo-preview" />
                          : "No Photo"}
                      </div>
                    </div>

                    <div className="form-fields">
                      <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 0.5fr 0.6fr" }}>
                        <div>
                          <label>Lastname <span className="req">*</span></label>
                          <input
                          name="lastname"
                          value={personal.lastname}
                          placeholder="Lastname"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Firstname <span className="req">*</span></label>
                          <input
                          name="firstname"
                          value={personal.firstname}
                          placeholder="Firstname"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Middlename</label>
                          <input
                          name="middlename"
                          value={personal.middlename}
                          placeholder="Middlename"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Suffix</label>
                          <input
                          name="middlename"
                          value={personal.middlename}
                          placeholder="Middlename"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Nickname</label>
                          <input
                          name="nickname"
                          value={personal.nickname}
                          placeholder="Nickname"
                          onChange={handleChange}
                        />
                        </div>
                      </div>

                      <div className="field-grid" style={{ gridTemplateColumns: "1.2fr 0.5fr 0.7fr 0.8fr 0.8fr" }}>
                        <div>
                          <label>Birthdate <span className="req">*</span></label>
                          <input
                          type="date"
                          name="birthdate"
                          value={personal.birthdate}
                          max={
                            new Date()
                              .toISOString()
                              .split("T")[0]
                          }
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                        <label>Age <span className="req">*</span></label>
                        <input
                          name="age"
                          value={personal.age}
                          readOnly
                          placeholder="Auto-computed"
                        />
                      </div>
                        <div>
                          <label>Sex <span className="req">*</span></label>
                          <select
                            name="sex"
                            value={personal.sex}
                            onChange={handleChange}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label>Religion <span className="req">*</span></label>
                          <input
                          name="religion"
                          value={personal.religion}
                          placeholder="Religion"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Nationality <span className="req">*</span></label>
                          <input
                          name="nationality"
                          value={personal.nationality}
                          placeholder="Nationality"
                          onChange={handleChange}
                        />
                        </div>
                      </div>

                      <div className="field-grid" style={{ gridTemplateColumns: "2fr 0.8fr 0.8fr" }}>
                        <div>
                          <label>Home Address <span className="req">*</span></label>
                          <input
                          name="homeAddress"
                          value={personal.homeAddress}
                          placeholder="Home Address"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Home No. <span className="req">*</span></label>
                          <input
                          name="homeNo"
                          value={personal.homeNo}
                          placeholder="Home No."
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Fax No. <span className="req">*</span></label>
                          <input
                          name="faxNo"
                          value={personal.faxNo}
                          placeholder="Fax No."
                          onChange={handleChange}
                        />
                        </div>
                      </div>

                      <div className="field-grid" style={{ gridTemplateColumns: "1fr 0.7fr 1fr 1fr" }}>
                        <div>
                          <label>Occupation <span className="req">*</span></label>
                          <input
                          name="occupation"
                          value={personal.occupation}
                          placeholder="Occupation"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Mobile No. <span className="req">*</span></label>
                          <input
                          name="mobile"
                          value={personal.mobile}
                          placeholder="09XXXXXXXXX"
                          maxLength={11}
                          onChange={(e) =>
                          {
                            const value =
                              e.target.value.replace(/\D/g, "");

                            handleChange({
                              target:
                              {
                                name: "mobile",
                                value
                              }
                            });
                          }}
                        />
                        </div>
                        <div>
                          <label>Email <span className="req">*</span></label>
                          <input
                          name="email"
                          value={personal.email}
                          placeholder="Email"
                          onChange={(e)=>
                          {
                            handleChange({
                              target:
                              {
                                name:"email",
                                value:e.target.value.toLowerCase()
                              }
                            });
                          }}
                        />
                        </div>
                        <div>
                          <label>Civil Status <span className="req">*</span></label>
                          <select
                          name="civilStatus"
                          value={personal.civilStatus}
                          onChange={handleChange}
                        >
                            <option value="">Select</option>
                            <option>Single</option>
                            <option>Married</option>
                            <option>Widowed</option>
                          </select>
                        </div>
                      </div>

                      <div className="field-grid" style={{ gridTemplateColumns: "0.7fr 0.7fr 0.7fr" }}>
                        <div>
                          <label>Blood Type <span className="req">*</span></label>
                          <input
                          name="bloodType"
                          value={personal.bloodType}
                          placeholder="Blood Type"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Weight <span className="req">*</span></label>
                          <input
                          type="number"
                          min="1"
                          name="weight"
                          value={personal.weight}
                          placeholder="Weight"
                          onChange={handleChange}
                        />
                        </div>
                        <div>
                          <label>Height <span className="req">*</span></label>
                          <input
                          type="number"
                          min="1"
                          name="height"
                          value={personal.height}
                          placeholder="Height"
                          onChange={handleChange}
                        />
                        </div>
                      </div>

                      {isMinor && (
                      <div className="minor-checkbox-row">
                        <strong>
                          Minor Patient
                        </strong>

                        <span>
                          Guardian information will be required.
                        </span>
                      </div>
                    )}
                    </div>
                  </div>

                  {validationError && (
                    <div className="validation-error">⚠ {validationError}</div>
                  )}

                  <div className="form-actions">
                    <button
  className="btn-cancel"
  onClick={() => navigate("/dashboard")}
>
  Cancel
</button>
                    <button className="btn-next" onClick={goNext}>Next →</button>
                  </div>
                </>
              )}

              {step === 1 && isMinor && (
                <>
                  <p className="form-note">Please fill in parent or guardian information.</p>

                  <div className="guardian-form">
                    <div className="section-label">Physician Information</div>
                    <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                      <div>
                        <label>Physician's Name</label>
                        <input
                        name="physicianName"
                        value={guardian.physicianName}
                        placeholder="Physician's Name"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Specialty</label>
                        <input
                        name="physicianSpecialty"
                        value={guardian.physicianSpecialty}
                        placeholder="Specialty"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Office Number</label>
                        <input
                        name="physicianOfficeNumber"
                        value={guardian.physicianOfficeNumber}
                        placeholder="Office Number"
                        onChange={handleGuardianChange}
                      />
                      </div>
                    </div>
                    <div className="field-grid"
                      style={{ gridTemplateColumns: "1fr" }}>
                      <div>
                        <label>Office Address</label>
                        <input
                        name="physicianOfficeAddress"
                        value={guardian.physicianOfficeAddress}
                        placeholder="Office Address"
                        onChange={handleGuardianChange}
                      />
                      </div>
                    </div>

                    <div className="section-label">Father's Information</div>
                    <div className="field-grid"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                      <div>
                        <label>Father's Name <span className="req">*</span></label>
                        <input
                        name="fatherName"
                        value={guardian.fatherName}
                        placeholder="Father's Name"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Occupation</label>
                        <input
                        name="fatherOccupation"
                        value={guardian.fatherOccupation}
                        placeholder="Occupation"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Employer</label>
                        <input
                        name="fatherEmployer"
                        value={guardian.fatherEmployer}
                        placeholder="Employer"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Contact No.</label>
                        <input
                        name="fatherContact"
                        value={guardian.fatherContact}
                        placeholder="Contact Number"
                        onChange={handleGuardianChange}
                      />
                      </div>
                    </div>

                    <div className="section-label">Mother's Information</div>
                    <div className="field-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
                      <div>
                        <label>Mother's Name <span className="req">*</span></label>
                        <input
                        name="motherName"
                        value={guardian.motherName}
                        placeholder="Mother's Name"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Occupation</label>
                        <input
                        name="motherOccupation"
                        value={guardian.motherOccupation}
                        placeholder="Occupation"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Employer</label>
                        <input
                        name="motherEmployer"
                        value={guardian.motherEmployer}
                        placeholder="Employer"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Contact No.</label>
                        <input
                        name="motherContact"
                        value={guardian.motherContact}
                        placeholder="Contact Number"
                        onChange={handleGuardianChange}
                      />
                      </div>
                    </div>

                    <div className="section-label">Guardian's Information</div>
                    <div className="field-grid"
                      style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                      <div>
                        <label>Guardian's Name</label>
                        <input
                        name="guardianName"
                        value={guardian.guardianName}
                        placeholder="Guardian's Name"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Occupation</label>
                        <input
                        name="guardianOccupation"
                        value={guardian.guardianOccupation}
                        placeholder="Occupation"
                        onChange={handleGuardianChange}
                      />
                      </div>
                      <div>
                        <label>Contact No.</label>
                        <input
                        name="guardianContact"
                        value={guardian.guardianContact}
                        placeholder="Contact Number"
                        onChange={handleGuardianChange}
                      />
                      </div>
                    </div>
                  </div>

                  {validationError && (
                    <div className="validation-error">⚠ {validationError}</div>
                  )}

                  <div className="form-actions">
                    <button className="btn-cancel" onClick={goPrev}>← Previous</button>
                    <button className="btn-next" onClick={goNext}>Next →</button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="form-note">Please provide your medical information.</p>

                  <div className="medical-form">
                    <div className="medical-left">
                      <div className="section-label">Dental History</div>
                      <div className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div>
                          <label>Last Dental Visit</label>
                          <input type="date" name="lastDentalVisit" value={medical.lastDentalVisit} onChange={handleMedicalChange} />
                        </div>
                      </div>

                      <div className="section-label">Health Questions</div>
                      <YesNoField label="1. Are you in good health?"
                        name="goodHealth" value={medical.goodHealth} />
                      <YesNoField label="2. Are you under medical treatment now?"
                        name="underMedicalTreatment" value={medical.underMedicalTreatment}
                        subField="What condition is being treated?"
                        subName="medicalTreatmentCondition"
                        subValue={medical.medicalTreatmentCondition} />
                      <YesNoField label="3. Have you ever had a serious illness or surgical operation?"
                        name="seriousIllness" value={medical.seriousIllness}
                        subField="If so, when and why?"
                        subName="seriousIllnessDetails"
                        subValue={medical.seriousIllnessDetails} />
                      <YesNoField label="4. Have you ever been hospitalized?"
                        name="hospitalized" value={medical.hospitalized}
                        subField="If so, when and why?"
                        subName="hospitalizedDetails"
                        subValue={medical.hospitalizedDetails} />
                      <YesNoField label="5. Are you taking any prescription/non-prescription medication?"
                        name="takingMedication" value={medical.takingMedication}
                        subField="If so, please specify"
                        subName="medicationDetails"
                        subValue={medical.medicationDetails} />
                      <YesNoField label="6. Do you use tobacco products?"
                        name="useTobacco" value={medical.useTobacco} />
                      <YesNoField label="7. Do you use alcohol, cocaine or other dangerous drugs?"
                        name="useAlcoholDrugs" value={medical.useAlcoholDrugs} />

                      <div className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div>
                          <label>8. Are you allergic to any of the following?</label>
                        </div>
                      
                        <div className="allergy-checkboxes">
                          {[
                            { name: "allergyLocalAnesthetic",       label: "Local Anesthetic" },
                            { name: "allergyLatex",                 label: "Latex" },
                            { name: "allergyAspirin",               label: "Aspirin" },
                            { name: "allergyPenicillinAntibiotics", label: "Penicillin / Antibiotics" },
                            { name: "allergySulfaDrugs",            label: "Sulfa Drugs" },
                          ].map(({ name, label }) => (
                            <label key={name} className="condition-item">
                              <input type="checkbox" name={name} checked={medical[name]} onChange={handleMedicalChange} />
                              {label}
                            </label>
                          ))}
                          <div className="allergy-others">
                            <label>Others:</label>
                            <input name="allergyOthers" value={medical.allergyOthers} onChange={handleMedicalChange} placeholder="Specify other allergies" />
                          </div>
                        </div>
                      </div>

                      {personal.sex?.toLowerCase() === "female" && (
                      <>
                        <div className="section-label">
                          For Women Only
                        </div>

                        <div className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
                          <div>
                            <label>Bleeding Time</label>

                            <input
                              name="bleedingTime"
                              value={medical.bleedingTime}
                              onChange={handleMedicalChange}
                              placeholder="Bleeding Time"
                            />
                          </div>
                        </div>

                        <YesNoField
                          label="Are you pregnant?"
                          name="isPregnant"
                          value={medical.isPregnant}
                        />

                        <YesNoField
                          label="Are you nursing?"
                          name="isNursing"
                          value={medical.isNursing}
                        />

                        <YesNoField
                          label="Are you taking birth control pills?"
                          name="takingBirthControl"
                          value={medical.takingBirthControl}
                        />
                      </>
                      )}
                    </div>

                    <div className="medical-right">
                      <div className="conditions">
                        <label>13. Do you have or have you had any of the following?</label>
                        <div className="conditions-grid">
                          {medicalConditions.map((condition) => (
                            <label key={condition} className="condition-item">
                              <input type="checkbox"
                                checked={medical.conditions.includes(condition)}
                                onChange={() => toggleCondition(condition)} />
                              {condition}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="conditions">
                        <label>Dental Habits</label>
                        <div className="conditions-grid">
                          {dentalHabits.map((habit) => (
                            <label key={habit} className="condition-item">
                              <input type="checkbox"
                                checked={medical.habits?.includes(habit)}
                                onChange={() => toggleHabit(habit)} />
                              {habit}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
                        <div>
                          <label>Patient's Diet</label>
                          <input name="patientDiet" value={medical.patientDiet || ""}
                            onChange={handleMedicalChange} />
                        </div>
                      </div>

                      <div className="section-label">Other Medical Information</div>
                      <div className="field-grid" style={{ gridTemplateColumns: "1fr" }}>
                        {[
                          { label: "Previous Hospitalizations", name: "previousHospitalizations" },
                          { label: "Prescribed Medications",    name: "prescribedMedications" },
                          { label: "Allergies to Medications",  name: "allergies" },
                          { label: "Family Medical Problems",   name: "familyMedicalProblems" },
                          { label: "Other Medical Concerns",    name: "otherMedicalConcerns" },
                          { label: "Medical Alert",             name: "medicalAlert" },
                        ].map(({ label, name }) => (
                          <div key={name}>
                            <label>{label}</label>
                            <input name={name} value={medical[name]} onChange={handleMedicalChange} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn-cancel" onClick={goPrev}>← Previous</button>
                    <button className="btn-next" onClick={handleSubmit}>Finish</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="camera-modal">
          <div className="camera-container">
            <video id="video" autoPlay />
            <div className="camera-actions">
              <button className="btn-capture" onClick={capturePhoto}>Capture</button>
              <button className="btn-cancel"
                onClick={() => { stopCamera(); setShowCamera(false); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewPatient;