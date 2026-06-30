import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "../../styles/myAccount.css";
import { supabase } from "../../lib/supabase";
import {
  getProfileApi,
  updateProfileApi
}
from "../../api/profile";

function MyAccount() {

  const [form, setForm] = useState({
    email: "",
    password: "",

    firstName: "",
    middleName: "",
    lastName: "",

    fullName: "",

    createdAt: "",

    contact: "",

    role: "",

    address: "",

    sex: "",

    avatarUrl: ""
  });

  const [settings, setSettings] = useState({
    notification: true,
    darkMode: false
  });

  const [loading, setLoading] = useState(true);

  // FETCH USER DATA
  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {

    try {

      const user =
  JSON.parse(
    localStorage.getItem("user")
  );

console.log(
  "LOCAL USER:",
  user
);

if (!user)
{
  console.log(
    "No user found"
  );

  setLoading(false);

  return;
}

      // FETCH USER INFO
      const result =
  await getProfileApi(
    user.id
  );

const data =
  result.user;

      console.log("USER ID:", user.id);
      console.log("PROFILE DATA:", data);

      // SET FORM
      setForm({
        email: user.email || "",

        password: "",

        firstName: data.first_name || "",

        middleName: data.middle_name || "",

        lastName: data.last_name || "",

        fullName: data.full_name || "",

        createdAt: data.created_at
          ? new Date(data.created_at)
              .toLocaleDateString()
          : "",

        contact: data.contact_number || "",

        role: data.role || "",

        address: data.address || "",

        sex: data.sex || "",

        avatarUrl: data.avatar_url || ""
      });

    } catch (err) {

      console.log("FETCH ERROR:", err);

    } finally {

      setLoading(false);
    }
  }

  // HANDLE INPUT CHANGES
  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  async function handleAvatarUpload(e) {

  try {

    const file = e.target.files[0];

    if (!file) return;

    const { data: sessionData } =
  await supabase.auth.getSession();

const user =
  sessionData?.session?.user;

if (!user)
{
  alert(
    "Session expired. Please login again."
  );

  return;
}
    
    const fileExt =
      file.name.split(".").pop();
      
    const filePath =
      `${user.id}-${Date.now()}.${fileExt}`;

    // UPLOAD
    const { error: uploadError }
      = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true
        });

    if (uploadError) {

      console.log(uploadError);

      alert("Upload failed");

      return;
    }

    // GET PUBLIC URL
    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl =
      data.publicUrl;

    console.log("PUBLIC URL:", publicUrl);

    // SAVE TO DATABASE
    const { error: dbError }
      = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl
        })
        .eq("id", user.id);

    if (dbError) {

      console.log(dbError);

      alert("Database update failed");

      return;
    }

    // UPDATE UI
    setForm((prev) => ({
      ...prev,
      avatarUrl: publicUrl
    }));

    const currentUser =
  JSON.parse(
    localStorage.getItem("user")
  );

localStorage.setItem(
  "user",
  JSON.stringify({
    ...currentUser,
    avatar_url: publicUrl
  })
);

window.dispatchEvent(
  new Event("userUpdated")
);

    alert("Avatar updated!");

  } catch (err) {

    console.log(err);
  }
}
  // SAVE CHANGES
  async function handleSave() {

    try {

const user =
  JSON.parse(
    localStorage.getItem("user")
  );

console.log(
  "LOCAL USER:",
  user
);

if (!user)
{
  alert(
    "User not found."
  );

  return;
}

await updateProfileApi(
  user.id,
  {
    first_name: form.firstName,
    middle_name: form.middleName,
    last_name: form.lastName,
    contact_number: form.contact,
    address: form.address,
    sex: form.sex
  }
);

localStorage.setItem(
  "user",
  JSON.stringify({
    ...user,

    first_name:
      form.firstName,

    middle_name:
      form.middleName,

    last_name:
      form.lastName,

    full_name:
      `${form.firstName} ${form.middleName} ${form.lastName}`
        .replace(/\s+/g, " ")
        .trim(),

    contact_number:
      form.contact,

    address:
      form.address,

    sex:
      form.sex,

    avatar_url:
      form.avatarUrl
  })
);

window.dispatchEvent(
  new Event("userUpdated")
);
      // UPDATE PASSWORD
      if (form.password.trim() !== "") {

        const { error: passwordError }
          = await supabase.auth.updateUser({
            password: form.password
          });

        if (passwordError) {

          alert(passwordError.message);

          return;
        }
      }

      // REFRESH DATA
      await fetchUserData();

      alert("Profile updated successfully!");

    } catch (err) {

      console.log(err);

      alert("Something went wrong");
    }
  }

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="admin-container">

      <Sidebar />

      <div className="admin-main">

        <Topbar />

        <div className="dashboard-content">

          <div className="account-container">

            <div className="account-card">

              <div className="account-card-header">

                <span className="account-card-icon">
                  👤
                </span>

                <h2>My Account</h2>

              </div>

              <div className="account-card-body">

                <div className="account-grid">

                  {/* AVATAR */}
                  <div className="avatar-col">
                    <div className="avatar-circle">
                      {form.avatarUrl ? (
                        <img
                        src={form.avatarUrl}
                        alt="avatar"
                       className="avatar-image"
                        />
                      ) : (
                        form.fullName
                        ? form.fullName
                        .substring(0, 2)
                        .toUpperCase()
                        : "JD"
                        )}
                      </div>
                        {/* HIDDEN FILE INPUT */}
                        <input
                        type="file"
                       accept="image/*"
                       capture="environment"
                        id="avatar-upload"
                        hidden
                        onChange={handleAvatarUpload}
                        />
                        {/* BUTTON */}
                        <label
                        htmlFor="avatar-upload"
                        className="btn-photo"
                        >
                          📷 Change
                          </label>
                          </div>

                  {/* FORM */}
                  <div className="profile-form">

                    <p className="section-title">
                      Personal Info
                    </p>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>First Name</label>

                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-group">

                        <label>Middle Name</label>

                        <input
                          name="middleName"
                          value={form.middleName}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-group">

                        <label>Last Name</label>

                        <input
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-group">

                        <label>Email</label>

                        <input
                          name="email"
                          type="email"
                          value={form.email}
                          readOnly
                        />

                      </div>

                      <div className="form-group">

                        <label>Contact</label>

                        <input
                          name="contact"
                          value={form.contact}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-group">

                        <label>Sex</label>

                        <select
                          name="sex"
                          value={form.sex}
                          onChange={handleChange}
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="Male">
                            Male
                          </option>

                          <option value="Female">
                            Female
                          </option>

                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>

                        </select>

                      </div>

                      <div className="form-group full-width">

                        <label>Address</label>

                        <input
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                        />

                      </div>

                    </div>

                    <hr className="section-divider" />

                    <p className="section-title">
                      Account
                    </p>

                    <div className="form-grid">

                      <div className="form-group">

                        <label>Password</label>

                        <input
                          name="password"
                          type="password"
                          placeholder="New password"
                          value={form.password}
                          onChange={handleChange}
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Full Name
                          <span className="readonly-badge">
                            Auto-generated
                          </span>
                        </label>

                        <input
                          value={form.fullName}
                          readOnly
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Role
                          <span className="readonly-badge">
                            Read-only
                          </span>
                        </label>

                        <input
                          value={form.role}
                          readOnly
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Member Since
                          <span className="readonly-badge">
                            Read-only
                          </span>
                        </label>

                        <input
                          value={form.createdAt}
                          readOnly
                        />

                      </div>

                    </div>

                    <button
                      className="btn-save"
                      onClick={handleSave}
                    >
                      💾 Save Changes
                    </button>

                  </div>

                </div>

                {/* PREFERENCES */}
                <hr className="section-divider" />

                <p className="section-title">
                  Preferences
                </p>

                <div className="settings-row">

                  <div className="toggle-card">

                    <div className="toggle-label">

                      <span className="toggle-icon notif-icon">
                        🔔
                      </span>

                      Notifications

                    </div>

                    <label className="switch">

                      <input
                        type="checkbox"
                        checked={settings.notification}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            notification:
                              !settings.notification
                          })
                        }
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                  <div className="toggle-card">

                    <div className="toggle-label">

                      <span className="toggle-icon dark-icon">
                        🌙
                      </span>

                      Dark Mode

                    </div>

                    <label className="switch">

                      <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={() =>
                          setSettings({
                            ...settings,
                            darkMode:
                              !settings.darkMode
                          })
                        }
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default MyAccount;