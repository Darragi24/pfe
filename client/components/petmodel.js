import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
const petTypes = ["dog", "cat", "bird", "fish", "other"];
export default function PetModel({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    age: "",
    description: "", // <-- added description
    photo: null,
    preview: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        type: "",
        age: "",
        description: "",
        photo: null,
        preview: "",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.name || !formData.type) return;
    onSave(formData);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3>{initialData ? "Edit Pet" : "Add Pet"}</h3>
          <FiX style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <input
          placeholder="Pet Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={inputStyle}
        />

        <select
  value={formData.type}
  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
  style={inputStyle}
>
    <option value="" disabled>
    Select Pet family
    </option>
    {petTypes.map((type) => (
        <option key={type} value={type}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
        </option>
    ))}
    </select>

        <input
          placeholder="Age (months)"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          style={inputStyle}
        />

        {/* NEW DESCRIPTION FIELD */}
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          style={{ ...inputStyle, height: 80 }}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setFormData({
                ...formData,
                photo: file,
                preview: URL.createObjectURL(file),
              });
            }
          }}
          style={{ marginTop: 10 }}
        />

        <button onClick={handleSave} style={primaryBtn}>
          Save
        </button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle = {
  background: "#fff",
  padding: 25,
  borderRadius: 16,
  width: 350,
};

const inputStyle = {
  marginTop: 12,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ddd",
  width: "100%",
};

const primaryBtn = {
  marginTop: 20,
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  padding: "10px",
  borderRadius: 10,
  cursor: "pointer",
  width: "100%",
};