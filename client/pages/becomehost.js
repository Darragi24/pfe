import { useState, useContext, useEffect } from "react";
import Navbar from "../components/navbar";
import HostApplicationForm from "../components/HostApplicationForm";
import { AuthContext } from "../context/AuthContext";
import { applyForHost } from "../services/authService";

export default function BecomeHostPage() {
  const { user, submitHostApplication, updateUser } = useContext(AuthContext);
  const [experience, setExperience] = useState("");
  const [preferredPets, setPreferredPets] = useState([]);
  const [pricePerNight, setPricePerNight] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // petOptions are handled by the form component if not provided

  useEffect(() => {
    if (user?.hostApplication) {
      setExperience(user.hostApplication.experience || "");
      setPreferredPets(user.hostApplication.preferredPets || []);
      setPricePerNight(user.hostApplication.pricePerNight || "");
    }
  }, [user]);

  const handleCheckboxChange = (pet) => {
    setPreferredPets((prev) =>
      prev.includes(pet) ? prev.filter((p) => p !== pet) : [...prev, pet]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { experience, preferredPets, pricePerNight };
      const res = await applyForHost(data);
      submitHostApplication(data);
      updateUser(res.user);
      setMessage("Your host application has been submitted!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error submitting application");
    } finally {
      setLoading(false);
    }
  };

  const status = user?.hostApplication?.status || "none";

  return (
    <>
      <Navbar />
      <div className="become-host-page" style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Become a Host</h1>
          <p style={styles.subtitle}>
            Join our community of pet lovers and earn by hosting furry friends.
          </p>

          {status !== "none" && (
            <div style={{ ...styles.statusBadge, ...styles[`status${status}`] }}>
              {status === "pending" && "⏳ Your application is under review."}
              {status === "approved" && "✅ You are now a host! 🎉 Use the form below to request profile changes."}
              {status === "rejected" && "❌ Your application was rejected."}
            </div>
          )}

          <HostApplicationForm
            status={status}
            experience={experience}
            setExperience={setExperience}
            preferredPets={preferredPets}
            handleCheckboxChange={handleCheckboxChange}
            pricePerNight={pricePerNight}
            setPricePerNight={setPricePerNight}
            loading={loading}
            onSubmit={handleSubmit}
            message={message}
          />
        </div>
      </div>

    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f8fc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
  },
  card: {
    width: "100%",
    maxWidth: "56rem",
    background: "#fff",
    borderRadius: "2rem",
    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
    padding: "2.5rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#1e293b",
    textAlign: "center",
    marginBottom: "0.5rem",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "1.125rem",
    marginBottom: "2rem",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.75rem",
    fontSize: "1rem",
    fontWeight: 500,
    marginBottom: "2rem",
  },
  statuspending: {
    background: "#fef3c7",
    color: "#b45309",
  },
  statusapproved: {
    background: "#d1fae5",
    color: "#065f46",
  },
  statusrejected: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};

// Responsive adjustments via inline styles aren't possible, so we add a small style tag for mobile.
// But the grid will naturally stack on small screens due to CSS grid's auto behavior? Actually we set gridTemplateColumns to "1fr 1fr", so on small screens we need to override. We'll use the style tag for media query.
// Add to the <style> block:
// @media (max-width: 640px) { .become-host-page .form { grid-template-columns: 1fr; } .become-host-page .fullWidth { grid-column: span 1; } }