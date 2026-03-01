import React from "react";

// a presentation component for the host application/edit form
// props correspond to state and handlers lifted from parent
export default function HostApplicationForm({
  status,
  experience,
  setExperience,
  preferredPets,
  handleCheckboxChange,
  pricePerNight,
  setPricePerNight,
  petOptions = ["dog", "cat", "bird", "fish"],
  loading,
  onSubmit,
  message,
}) {
  const styles = {
    fullWidth: { width: "100%", marginBottom: 20 },
    form: { display: "flex", flexDirection: "column", gap: 20 },
    label: { fontWeight: 500, marginBottom: 6, display: "block" },
    labelIcon: { marginRight: 6 },
    textarea: {
      width: "100%",
      padding: 8,
      borderRadius: 4,
      border: "1px solid #cbd5e1",
      resize: "vertical",
    },
    formGroup: { display: "flex", flexDirection: "column", gap: 6 },
    checkboxGroup: { display: "flex", gap: 10, flexWrap: "wrap" },
    checkboxLabel: { cursor: "pointer" },
    checkboxCustom: {
      padding: "6px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: 6,
      userSelect: "none",
    },
    checkboxChecked: {
      backgroundColor: "#e0f2fe",
      borderColor: "#38bdf8",
    },
    priceInput: { display: "flex", alignItems: "center" },
    currency: { marginRight: 4, fontWeight: 600 },
    input: {
      width: "100%",
      padding: 8,
      borderRadius: 4,
      border: "1px solid #cbd5e1",
    },
    submitContainer: { textAlign: "center" },
    submitButton: {
      padding: "10px 20px",
      backgroundColor: "#4f46e5",
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
    },
    submitDisabled: { opacity: 0.6, cursor: "not-allowed" },
    messageError: { marginTop: 12, color: "#dc2626", textAlign: "center" },
  };

  return (
    <form onSubmit={onSubmit} style={styles.form}>
      {/* experience */}
      <div style={styles.fullWidth}>
        <label style={styles.label}>
          <span style={styles.labelIcon}>📝</span> Experience
        </label>
        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="Tell us about your experience with pets..."
          rows={5}
          style={styles.textarea}
          required
        />
      </div>

      {/* preferred pets */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          <span style={styles.labelIcon}>🐾</span> Preferred Pets
        </label>
        <div style={styles.checkboxGroup}>
          {petOptions.map((pet) => (
            <label key={pet} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={preferredPets.includes(pet)}
                onChange={() => handleCheckboxChange(pet)}
                style={{ display: "none" }}
              />
              <span
                style={{
                  ...styles.checkboxCustom,
                  ...(preferredPets.includes(pet) && styles.checkboxChecked),
                }}
              >
                {pet.charAt(0).toUpperCase() + pet.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* price per night */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          <span style={styles.labelIcon}>💰</span> Price per Night ($)
        </label>
        <div style={styles.priceInput}>
          <span style={styles.currency}>$</span>
          <input
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            min={0}
            placeholder="0"
            style={styles.input}
            required
          />
        </div>
      </div>

      <div style={{ ...styles.fullWidth, ...styles.submitContainer }}>
        <button
          type="submit"
          disabled={loading || status === "pending"}
          style={{
            ...styles.submitButton,
            ...(loading || status === "pending" ? styles.submitDisabled : {}),
          }}
        >
          {loading
            ? "Submitting..."
            : status === "approved"
            ? "Request Changes"
            : "Submit Application"}
        </button>
      </div>

      {message && <div style={styles.messageError}>{message}</div>}
    </form>
  );
}
