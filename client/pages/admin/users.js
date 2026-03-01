import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/navbar";
import { AuthContext } from "../../context/AuthContext";
import {
  getAllUsers,
  deactivateUser,
  activateUser,
} from "../../services/authService";

export default function AdminUsers() {
  const router = useRouter();
  const { user, token, loading } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const roleNames = { owner: "Owner", host: "Host", admin: "Administrator" };

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (user && !user.roles.includes("admin")) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.roles.includes("admin")) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load users");
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    setBusyId(id);
    try {
      await deactivateUser(id);
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, isActive: false } : x)));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (id) => {
    if (!confirm("Are you sure you want to activate this user?")) return;
    setBusyId(id);
    try {
      await activateUser(id);
      setUsers((u) => u.map((x) => (x._id === id ? { ...x, isActive: true } : x)));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !user) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
      <Navbar />

      <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
        <h2>User Management</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Roles</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u._id}
                style={{
                  borderBottom: "1px solid #ddd",
                  transition: "background 0.2s",
                  opacity: u.isActive ? 1 : 0.6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fafafa")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
              >
                <td style={{ padding: "10px" }}>{u.name}</td>
                <td style={{ padding: "10px" }}>{u.email}</td>
                <td style={{ padding: "10px" }}>{(u.roles || []).map(r=>roleNames[r]||r).join(", ")}</td>
                <td style={{ padding: "10px" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: "0.8rem",
                      backgroundColor: u.isActive ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  <button
                    disabled={busyId === u._id}
                    onClick={() => u.isActive ? handleDeactivate(u._id) : handleActivate(u._id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: u.isActive ? "#dc2626" : "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: busyId === u._id ? "not-allowed" : "pointer",
                      opacity: busyId === u._id ? 0.6 : 1,
                    }}
                  >
                    {busyId === u._id ? "..." : u.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
