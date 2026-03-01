import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { login } from "../services/authService";
import { useRouter } from "next/router";

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

      await loginUser(data.user, data.token);

      // ---- Role-based redirect ----
      if (data.user.roles.includes("admin")) {
        router.push("/admin-dashboard"); // admin panel
      } else if (data.user.roles.includes("host")) {
        router.push("/host-dashboard"); // host dashboard
      } else {
        router.push("/dashboard"); // owner dashboard
      }

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page-body">
      <div className="auth-box">
        <h1 className="auth-title">Login to PetStay</h1>
        {error && <p style={{ color: "red", marginBottom: 15 }}>{error}</p>}
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
        <p style={{ marginTop: 20 }}>
          Don’t have an account?{" "}
          <a href="/register" style={{ color: "#4f46e5", textDecoration: "underline" }}>
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}