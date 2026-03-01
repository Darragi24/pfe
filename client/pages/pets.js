import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../components/navbar";
import { AuthContext } from "../context/AuthContext";
import { PetContext } from "../context/PetContext";
import PetCard from "../components/petcard";
import PetModel from "../components/petmodel"; // modal with internal state

export default function PetsPage() {
  const { user, loading, token } = useContext(AuthContext);
  const { pets, fetchPets, addPet, updatePet, removePet } = useContext(PetContext);
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  // Redirect if not logged in & fetch pets
  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (user) fetchPets();
  }, [user, loading]);

  // Open modal for add/edit
  const openModal = (pet = null) => {
    setEditingPet(pet);
    setShowModal(true);
  };

  // Save pet callback
  const handleSave = async (formData) => {
    if (!formData.name || !formData.type || !formData.age)
      return alert("Fill required fields");

    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("petType", formData.type);
      body.append("age", formData.age); // in months
      body.append("description", formData.description || "");
      if (formData.photo) body.append("image", formData.photo);

      const url = editingPet
        ? `http://localhost:5000/api/pets/${editingPet._id}`
        : "http://localhost:5000/api/pets";
      const method = editingPet ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        editingPet ? updatePet(data) : addPet(data);
      } else alert(data.message || "Something went wrong");
    } catch (err) {
      console.error(err);
      alert("Error saving pet");
    }
  };

  // Delete pet
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this pet?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/pets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) removePet(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8fc" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "50px auto", padding: "0 25px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 35,
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 700 }}>My Pets 🐾</h1>
          <button
            onClick={() => openModal()}
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              boxShadow: "0 8px 20px rgba(79,70,229,0.3)",
            }}
          >
            Add Pet
          </button>
        </div>

        {/* Pets Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 30,
          }}
        >
          {pets.length ? (
            pets.map((pet) => (
              <PetCard
                key={pet._id}
                pet={{
                  ...pet,
                  age: formatAge(pet.age),
                  preview: pet.image ? `http://localhost:5000/uploads/pets/${pet.image}` : "",
                }}
                onEdit={() => openModal(pet)}
                onDelete={() => handleDelete(pet._id)}
              />
            ))
          ) : (
            <p
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                color: "#777",
              }}
            >
              No pets yet.
            </p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <PetModel
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          initialData={
            editingPet
              ? {
                  name: editingPet.name,
                  type: editingPet.petType,
                  age: editingPet.age,
                  description: editingPet.description || "", 
                  photo: null,
                  preview: editingPet.image ? `/uploads/pets/${editingPet.image}` : "",
                }
              : null
          }
        />
      )}
    </div>
  );
}

// ===== Utils =====
function formatAge(months) {
  months = Number(months);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${yrs} yr ${rem} mo` : `${yrs} yr`;
}