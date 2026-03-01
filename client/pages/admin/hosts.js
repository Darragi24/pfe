import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "../../components/navbar";
import { AuthContext } from "../../context/AuthContext";
import {
  getAllHosts,
  deactivateHost,
  approveHost,
  rejectHost,
} from "../../services/authService";
import HostRow from "../../components/HostRow";

export default function AdminHosts() {
  const router = useRouter();
  const { user, token, loading } = useContext(AuthContext);
  const [hosts, setHosts] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const roleNames = { owner: "Owner", host: "Host", admin: "Administrator" };

  useEffect(() => {
    if (!loading && !user) router.replace("/");
    if (user && !user.roles.includes("admin")) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.roles.includes("admin")) {
      fetchHosts();
    }
  }, [user]);

  const fetchHosts = async () => {
    try {
      const data = await getAllHosts();
      setHosts(data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load hosts");
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Are you sure you want to deactivate this host?")) return;
    setBusyId(id);
    try {
      await deactivateHost(id);
      setHosts((h) => h.filter((x) => x._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveHost(id);
      setHosts((h) =>
        h.map((x) =>
          x._id === id
            ? { ...x, hostApplication: { ...x.hostApplication, status: "approved" } }
            : x
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    setBusyId(id);
    try {
      await rejectHost(id);
      setHosts((h) =>
        h.map((x) =>
          x._id === id
            ? { ...x, hostApplication: { ...x.hostApplication, status: "rejected" } }
            : x
        )
      );
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
        <h2>Host Management</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Experience</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Preferred Pets</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Price/night</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Application Status</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hosts.map((u) => (
              <HostRow
                key={u._id}
                user={u}
                busyId={busyId}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeactivate={handleDeactivate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
