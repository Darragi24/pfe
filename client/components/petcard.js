import { FiEdit2, FiTrash2 } from "react-icons/fi";

export default function PetCard({ pet, onEdit, onDelete }) {
  // Make sure preview points to backend
  const imageUrl =
    pet.preview ||
    (pet.image
      ? `http://localhost:5000/uploads/pets/${pet.image}`
      : "https://images.unsplash.com/photo-1517849845537-4d257902454a");

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        transition: "0.3s",
      }}
    >
      <div style={{ height: 200, overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={pet.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      <div style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 6 }}>{pet.name}</h3>
        <p style={{ color: "#666", marginBottom: 4 }}>{pet.type || pet.petType}</p>
        <p style={{ color: "#999", fontSize: 14, marginBottom: 6 }}>{pet.age}</p>
        {pet.description && (
          <p style={{ color: "#555", fontSize: 14 }}>{pet.description}</p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => onEdit(pet)} style={iconBtn}>
            <FiEdit2 />
          </button>

          <button onClick={() => onDelete(pet._id)} style={deleteBtn}>
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtn = {
  background: "#2dca21",
  border: "none",
  padding: 8,
  borderRadius: 10,
  cursor: "pointer",
  color: "#fff",
};

const deleteBtn = {
  background: "#dc2626",
  border: "none",
  padding: 8,
  borderRadius: 10,
  cursor: "pointer",
  color: "#fff",
};