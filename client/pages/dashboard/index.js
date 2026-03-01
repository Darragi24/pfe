import { useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/navbar";
import { FiEdit2, FiCamera, FiCheck, FiX } from "react-icons/fi";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const { user, updateUser, token, loading } = useContext(AuthContext);

  const fileInputRef = useRef(null);

  const [editingField, setEditingField] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [previewPic, setPreviewPic] = useState("");
  const [saving, setSaving] = useState(false);

  // host update form state (not used now, read-only display)

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (user) {
      setPreviewPic(user.profilePic);
    }
  }, [user, loading, router]);

  if (loading || !user) return <p style={{ padding: 40 }}>Loading...</p>;

  const roles = user.roles || [];
  const roleNames = { owner: "Owner", host: "Host", admin: "Administrator" };
  const roleColors = { owner: "#4f46e5", host: "#16a34a", admin: "#dc2626" };

  const handleSaveField = async (field) => {
    if (!fieldValue && field !== "bio") {
      alert("Field cannot be empty");
      return;
    }

    setSaving(true);
    try {
      let endpoint = "";
      const body = { [field]: fieldValue };

      switch (field) {
        case "name":
          endpoint = "/update-name";
          break;
        case "phone":
          endpoint = "/update-phone";
          break;
        case "bio":
          endpoint = "/update-bio";
          break;
        default:
          return;
      }

      const { data } = await axios.put(
        `http://localhost:5000/api/auth${endpoint}`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUser(data.user);
      setEditingField("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicUpload = async (file) => {
    if (!file) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("profilePic", file);

      const { data } = await axios.put(
        "http://localhost:5000/api/auth/update-profile-pic",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(data.user);
      setPreviewPic(data.user.profilePic);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { label: "Name", value: user.name, key: "name" },
    { label: "Email", value: user.email, key: "email", editable: false },
    { label: "Phone", value: user.phone, key: "phone" },
    { label: "Bio", value: user.bio, key: "bio" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
      <Navbar />

      <div
        style={{
          maxWidth: 1000,
          margin: "20px auto",
          padding: "20px 30px",
          borderRadius: 12,
          background: "linear-gradient(90deg, #4f46e5, #6366f1)",
          color: "white",
          fontWeight: 600,
          fontSize: 20,
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        Welcome back, {user.name}! 👋
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: "40px auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 50,
          padding: "0 20px",
        }}
      >
        {/* Profile Picture */}
        <div style={{ position: "relative", minWidth: 180 }}>
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid #4f46e5",
              position: "relative",
            }}
          >
            <img
              src={
                previewPic
                  ? `http://localhost:5000/uploads/${previewPic}`
                  : "/default-avatar.png"
              }
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: 24,
                opacity: 0,
                transition: "opacity 0.2s",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current.click()}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              title="Edit Profile Picture"
            >
              <FiCamera />
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setPreviewPic(URL.createObjectURL(file));
                  handleProfilePicUpload(file);
                }
              }}
            />
          </div>
        </div>

        {/* User Details */}
        <div style={{ flex: 1, minWidth: 250 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 20 }}>
            {user.name}
          </h1>
          {/* show host application details if present */}
          {user.hostApplication && user.hostApplication.status && user.hostApplication.status !== "none" && (
            <div style={{ marginBottom: 30 }}>
              <h3 style={{ fontSize: 20, marginBottom: 10 }}>Host profile</h3>
              <p><strong>Experience:</strong> {user.hostApplication.experience || '–'}</p>
              <p><strong>Preferred pets:</strong> {(user.hostApplication.preferredPets||[]).join(', ') || '–'}</p>
              <p><strong>Price per night:</strong> ${user.hostApplication.pricePerNight || 0}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {roles.map((r) => (
              <span
                key={r}
                style={{
                  backgroundColor: roleColors[r] || "#999",
                  color: "#fff",
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                {roleNames[r] || r}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {fields.map((field, idx) => (
              <div key={field.key}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    gap: 12,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {field.label}
                    {field.editable !== false && (
                      <FiEdit2
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setEditingField(field.key);
                          setFieldValue(field.value || "");
                        }}
                      />
                    )}
                  </span>

                  {editingField === field.key ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      {field.key === "bio" ? (
                        <textarea
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          rows={4}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "1px solid #ccc",
                            flex: 1,
                            width: "100%",
                            resize: "vertical",
                            fontSize: 14,
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={fieldValue}
                          onChange={(e) => setFieldValue(e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            flex: 1,
                            minWidth: 150,
                          }}
                        />
                      )}
                      <FiCheck
                        style={{ cursor: "pointer", color: "green" }}
                        onClick={() => handleSaveField(field.key)}
                      />
                      <FiX
                        style={{ cursor: "pointer", color: "red" }}
                        onClick={() => setEditingField("")}
                      />
                    </div>
                  ) : (
                    <span style={{ color: "#333" }}>{field.value || ""}</span>
                  )}
                </div>
                {idx < fields.length - 1 && <hr style={{ borderColor: "#eee" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}