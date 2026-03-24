import { useState, useEffect, useContext } from "react";
import Navbar from "../components/navbar";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Bookings() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket() || {};

  const [activeTab, setActiveTab] = useState("sent"); // 'sent' or 'received'
  const [sentBookings, setSentBookings] = useState([]);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [error, setError] = useState("");

  // Redirect if not logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch bookings on mount
  useEffect(() => {
    if (user) {
      fetchMyBookings();
      fetchHostBookings();
    }
  }, [user]);

  // Listen for real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on("booking-updated", (data) => {
      // Refresh bookings when status changes
      fetchMyBookings();
      fetchHostBookings();
    });

    return () => socket.off("booking-updated");
  }, [socket]);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/bookings/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setSentBookings(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load your bookings");
    }
  };

  const fetchHostBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/bookings/host-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch host bookings");
      const data = await response.json();
      setReceivedBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: { bg: "#fef3c7", text: "#92400e" },
      accepted: { bg: "#dcfce7", text: "#166534" },
      rejected: { bg: "#fee2e2", text: "#991b1b" },
      completed: { bg: "#d1fae5", text: "#065f46" },
      cancelled: { bg: "#f3f4f6", text: "#6b7280" },
    };

    const style = statusStyles[status] || statusStyles.pending;
    return (
      <span
        style={{
          display: "inline-block",
          backgroundColor: style.bg,
          color: style.text,
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: "0.85rem",
          fontWeight: 600,
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    );
  };

  const BookingCard = ({ booking, isSent }) => (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 8px 0", color: "#1e293b" }}>
            {/* FIX: User model uses 'name', not 'fullName' — 'fullName' was always undefined */}
            {isSent ? booking.host?.name : booking.requester?.name}
          </h3>
          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "0.9rem" }}>
            📅 {new Date(booking.startDate).toLocaleDateString()} to{" "}
            {new Date(booking.endDate).toLocaleDateString()}
          </p>
          <p style={{ margin: "4px 0", color: "#64748b", fontSize: "0.9rem" }}>
            🐾 Pet: {booking.pet.name} ({booking.pet.type})
          </p>
          <p style={{ margin: "8px 0 0 0", color: "#1e293b", fontWeight: 600 }}>
            💰 ${booking.totalPrice} total
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          {getStatusBadge(booking.status)}

          {booking.status === "accepted" && (
            <button
              onClick={() => router.push(`/messages/${isSent ? booking.host._id : booking.requester._id}`)}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // helpers to split by time/status
  const now = new Date();
  const isPastBooking = (b) => {
    const end = new Date(b.endDate);
    return (
      end < now ||
      ["completed", "cancelled", "rejected"].includes(b.status)
    );
  };
  const isFutureBooking = (b) => !isPastBooking(b);

  // Only show accepted, future bookings on this page
  const upcomingSent = sentBookings.filter(
    (b) => isFutureBooking(b) && b.status === "accepted"
  );
  const upcomingReceived = receivedBookings.filter(
    (b) => isFutureBooking(b) && b.status === "accepted"
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ color: "#1e293b", marginBottom: 8 }}>My Bookings</h1>
        <p style={{ color: "#6b7280", marginBottom: 24, fontSize: "0.9rem" }}>
          Only upcoming, <strong>accepted</strong> stays appear here. New booking requests are managed from your notifications.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            ❌ {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 24,
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <button
            onClick={() => setActiveTab("sent")}
            style={{
              padding: "12px 24px",
              backgroundColor: activeTab === "sent" ? "#fff" : "transparent",
              borderBottom: activeTab === "sent" ? "3px solid #3b82f6" : "none",
              color: activeTab === "sent" ? "#3b82f6" : "#64748b",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              transition: "all 0.3s",
            }}
          >
            Upcoming Stays as Owner ({upcomingSent.length})
          </button>
          <button
            onClick={() => setActiveTab("received")}
            style={{
              padding: "12px 24px",
              backgroundColor: activeTab === "received" ? "#fff" : "transparent",
              borderBottom: activeTab === "received" ? "3px solid #3b82f6" : "none",
              color: activeTab === "received" ? "#3b82f6" : "#64748b",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              transition: "all 0.3s",
            }}
          >
            Upcoming Stays as Host ({upcomingReceived.length})
          </button>
        </div>

        {/* Content: only show upcoming/future bookings here.
            Past bookings are visible in the History page. */}
        {activeTab === "sent" ? (
          <div>
            {upcomingSent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                No booking requests sent yet. <a href="/find-host">Find a host</a>
              </div>
            ) : (
              upcomingSent.map((booking) => (
                <BookingCard key={booking._id} booking={booking} isSent={true} />
              ))
            )}
          </div>
        ) : (
          <div>
            {upcomingReceived.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                No booking requests received yet.
              </div>
            ) : (
              upcomingReceived.map((booking) => (
                <BookingCard key={booking._id} booking={booking} isSent={false} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
