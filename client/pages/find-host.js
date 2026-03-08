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

  // 1. Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // 2. Fetch hosts whenever filters change
  useEffect(() => {
    if (user) {
      fetchHosts();
    }
  }, [filters, user]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.petType) params.append("petType", filters.petType);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.experience) params.append("experience", filters.experience);

      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `http://localhost:5000/api/bookings/hosts`,
        {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.status === 401) throw new Error("Session expired. Please login again.");
      if (!response.ok) throw new Error("Could not load host list.");

      const data = await response.json();
      setHosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleBook = async (bookingData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) throw new Error("Booking failed. Try again later.");

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        router.push("/bookings");
      }, 2000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#1e293b" }}>
      <Navbar />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Notifications */}
        {bookingSuccess && (
          <div style={styles.successBanner}>
            ✅ Booking request sent! Redirecting...
          </div>
        )}

        {error && (
          <div style={styles.errorBanner}>
            ❌ {error}
          </div>
        )}

        <div style={styles.layoutGrid}>
          {/* Sidebar */}
          <aside>
            <HostFilter onFilterChange={handleFilterChange} loading={loading} />
          </aside>

          {/* Main List */}
          <main>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
                Available Hosts ({hosts.length})
                </h2>
                {loading && <span style={{ color: '#64748b' }}>Updating...</span>}
            </div>

            {loading && !hosts.length ? (
              <div style={styles.statusMessage}>
                <p>Searching for the perfect hosts...</p>
              </div>
            ) : hosts.length > 0 ? (
              <div style={styles.cardGrid}>
                {hosts.map((host) => (
                  <HostCard 
                    key={host._id} 
                    // We pass the host object, but ensure HostCard knows to look 
                    // inside host.hostApplication for details
                    host={{
                        ...host,
                        // Provide fallbacks in case hostApplication is missing
                        price: host.hostApplication?.pricePerNight || 0,
                        experience: host.hostApplication?.experience || "N/A",
                        pets: host.hostApplication?.preferredPets || []
                    }} 
                    onBook={handleBook} 
                  />
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p>No hosts match your current filters. Try broadening your search!</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const styles = {
  layoutGrid: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    gap: "32px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
  },
  successBanner: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px solid #bbf7d0",
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: "16px",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px solid #fecaca",
  },
  statusMessage: {
    textAlign: "center",
    padding: "60px 0",
    color: "#64748b",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    color: "#64748b",
  }
};