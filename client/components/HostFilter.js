import { useState } from "react";

export default function HostFilter({ onFilterChange, loading }) {
  const petTypes = ["dog", "cat", "bird", "fish"];
  const [selectedPet, setSelectedPet] = useState("");
  const [price, setPrice] = useState(250); // store maxPrice in state

  const handlePetChange = (pet) => {
    const newSelection = selectedPet === pet ? "" : pet;
    setSelectedPet(newSelection);
    onFilterChange({ petType: newSelection, maxPrice: price });
  };

  const handlePriceChange = (value) => {
    const newPrice = Number(value);
    setPrice(newPrice);
    onFilterChange({ petType: selectedPet, maxPrice: newPrice });
  };

  const handleExperienceChange = (e) => {
    onFilterChange({ experience: e.target.value, petType: selectedPet, maxPrice: price });
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        height: "fit-content",
        position: "sticky",
        top: 100,
        fontFamily: "sans-serif",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 24, color: "#1e293b", fontSize: 22 }}>
        Filters
      </h3>

      {/* Pet type filter */}
      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            display: "block",
            marginBottom: 14,
            fontWeight: 600,
            color: "#334155",
          }}
        >
          🐾 Pet Type
        </label>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {petTypes.map((pet) => {
            const active = selectedPet === pet;
            return (
              <div
                key={pet}
                onClick={() => handlePetChange(pet)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 24,
                  cursor: "pointer",
                  fontWeight: 500,
                  textTransform: "capitalize",
                  transition: "all 0.2s",
                  backgroundColor: active ? "#4f46e5" : "#f8fafc",
                  color: active ? "#fff" : "#1e293b",
                  border: active ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                }}
              >
                {pet}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price filter */}
      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            display: "block",
            marginBottom: 14,
            fontWeight: 600,
            color: "#334155",
          }}
        >
          💰 Max Price/Night
        </label>
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={price} // linked to state
          onChange={(e) => handlePriceChange(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="number"
          min="0"
          max="500"
          value={price} // linked to state
          onChange={(e) => handlePriceChange(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
          }}
        />
      </div>

      {/* Experience filter */}
      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            display: "block",
            marginBottom: 14,
            fontWeight: 600,
            color: "#334155",
          }}
        >
          📚 Experience (keywords)
        </label>
        <input
          type="text"
          placeholder="e.g., 'experienced', 'professional'"
          onChange={handleExperienceChange}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          setSelectedPet("");
          setPrice(250); // reset price to default
          onFilterChange({ petType: "", maxPrice: "", experience: "" });
        }}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          backgroundColor: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: 10,
          cursor: "pointer",
          fontWeight: 600,
          color: "#334155",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
      >
        Clear Filters
      </button>
    </div>
  );
}