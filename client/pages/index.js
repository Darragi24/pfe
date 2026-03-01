import { useState, useContext } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login({ email, password });
      loginUser(data.user, data.token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f4f8",
        padding: "20px",
      }}
    >
      {/* Welcome Message */}
      <h1 style={{ color: "#4f46e5", marginBottom: 30, textAlign: "center" }}>
        Welcome to PetStay 🐾
      </h1>

      <div className="auth-box">
        <h2 className="auth-title">Login</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p style={{ marginTop: 15 }}>
          Don't have an account?{" "}
          <a href="/register" style={{ color: "#4f46e5", textDecoration: "underline" }}>
            Click here to register
          </a>
        </p>
      </div>
    </div>
  );
}