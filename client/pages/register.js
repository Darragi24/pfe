import { useState } from "react";
import { useRouter } from "next/router";
import { register } from "../services/authService";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", phone);
      formData.append("bio", bio);
      if (profilePic) formData.append("profilePic", profilePic);

      await register(formData);
      router.push("/?success=Registration successful! Please log in.");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f0f4f8", padding: "20px" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", maxWidth: 450, width: "100%", textAlign: "center" }}>
        <h1 style={{ color: "#4f46e5", marginBottom: 30 }}>Register at PetStay 🐾</h1>
        {error && <p style={{ color: "red", marginBottom: 15 }}>{error}</p>}

        <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <textarea placeholder="Short Bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />

          <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />

          <button type="submit" style={{ padding: "12px 0", backgroundColor: "#4f46e5", color: "white", fontWeight: 600, borderRadius: 6, border: "none", cursor: "pointer" }}>
            Register
          </button>
        </form>

        <p style={{ marginTop: 20 }}>
          Already have an account? <a href="/" style={{ color: "#4f46e5", textDecoration: "underline" }}>Login here</a>
        </p>
      </div>
    </div>
  );
}