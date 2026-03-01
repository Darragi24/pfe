import { useState, useContext } from "react";
import { PetContext } from "../context/PetContext";

export default function HostCard({ host, onBook }) {
  const { pets } = useContext(PetContext);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState("");

  const handleBookClick = async () => {
    if (!startDate || !endDate || !selectedPet) {
      alert("Please select pet, start date, and end date");
      return;
    }

    setLoading(true);
    try {
      await onBook({
        hostId: host._id,
        petId: selectedPet,
        startDate,
        endDate,
        specialRequests,
      });
      setShowModal(false);
      setStartDate("");
      setEndDate("");
      setSpecialRequests("");
      setSelectedPet("");
    } catch (err) {
      console.error(err);
      alert("Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.3s",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Profile pic */}
        {host.profilePic && (
          <div
            style={{
              width: "100%",
              height: 200,
              borderRadius: 8,
              backgroundImage: `url(http://localhost:5000/uploads/${host.profilePic})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: 12,
            }}
          />
        )}

        {/* Name */}
        <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>{host.name}</h3>

        {/* Experience */}
        <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#64748b" }}>
          <strong>Experience:</strong> {host.hostApplication?.experience?.substring(0, 80)}...
        </p>

        {/* Preferred pets */}
        <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#64748b" }}>
          <strong>Pets:</strong>{" "}
          {(host.hostApplication?.preferredPets || []).join(", ") || "n/a"}
        </p>

        {/* Price */}
        <p
          style={{
            margin: "8px 0",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#4f46e5",
          }}
        >
          ${host.hostApplication?.pricePerNight}/night
        </p>

        {/* Book button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            width: "100%",
            padding: 10,
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#4338ca")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#4f46e5")}
        >
          Book Now
        </button>
      </div>

      {/* Booking modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Book with {host.name}</h3>

            {/* Pet selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
                Select Pet
              </label>
              <select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                }}
              >
                <option value="">-- Choose a pet --</option>
                {pets.map((pet) => (
                  <option key={pet._id} value={pet._id}>
                    {pet.name} ({pet.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Start date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                }}
              />
            </div>

            {/* End date */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                }}
              />
            </div>

            {/* Special requests */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 600 }}>
                Special Requests (optional)
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Any special care instructions..."
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  minHeight: 80,
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: "#e2e8f0",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBookClick}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Booking..." : "Book Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
