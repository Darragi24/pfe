import { useState, useEffect, useContext } from "react";
import Navbar from "../components/navbar";
import HostCard from "../components/HostCard";
import HostFilter from "../components/HostFilter";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function FindHost() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket() || {};

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    petType: "",
    maxPrice: "",
    experience: "",
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Redirect if not logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch hosts
  useEffect(() => {
    fetchHosts();
  }, [filters]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.petType) params.append("petType", filters.petType);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.experience) params.append("experience", filters.experience);

      const token = localStorage.getItem("token");
      console.log("fetchHosts token", token);
      const response = await fetch(
        `http://localhost:5000/api/bookings/hosts?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("fetchHosts status", response.status);

      if (!response.ok) throw new Error("Failed to fetch hosts");
      const data = await response.json();
      setHosts(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleBook = async (bookingData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) throw new Error("Failed to create booking");

      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 3000);
      setTimeout(() => {
        router.push("/bookings");
      }, 1500);
    } catch (err) {
      alert("Error creating booking: " + err.message);
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: 40 }}>
        {/* Success notification */}
        {bookingSuccess && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              marginX: 20,
            }}
          >
            ✅ Booking request sent! Redirecting to your bookings...
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              marginX: 20,
            }}
          >
            ❌ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32, padding: "0 20px" }}>
          {/* Sidebar with filters */}
          <aside>
            <HostFilter onFilterChange={handleFilterChange} loading={loading} />
          </aside>

          {/* Main content - host cards */}
          <main>
            <div>
              <h2 style={{ color: "#1e293b", marginBottom: 24 }}>
                Available Hosts ({hosts.length})
              </h2>

              {loading && !hosts.length ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ color: "#64748b" }}>Loading hosts...</p>
                </div>
              ) : hosts.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                    gap: 24,
                  }}
                >
                  {hosts.map((host) => (
                    <HostCard
                      key={host._id}
                      host={host}
                      onBook={handleBook}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    color: "#64748b",
                  }}
                >
                  <p style={{ fontSize: "1.1rem" }}>
                    No hosts found. Try adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
