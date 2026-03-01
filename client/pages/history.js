import { useState, useEffect, useContext } from "react";
import Navbar from "../components/navbar";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket() || {};

  const [sentBookings, setSentBookings] = useState([]);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
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

  // Refresh when socket says a booking changed
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchMyBookings();
      fetchHostBookings();
    };

    socket.on("booking-updated", handleUpdate);
    return () => socket.off("booking-updated", handleUpdate);
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

  const now = new Date();
  const isPastBooking = (b) => {
    const end = new Date(b.endDate);
    return (
      end < now ||
      ["completed", "cancelled", "rejected"].includes(b.status)
    );
  };

  const pastSent = sentBookings.filter(isPastBooking);
  const pastReceived = receivedBookings.filter(isPastBooking);

  const BookingRow = ({ booking, isSent }) => (
    <tr>
      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
        {isSent ? booking.host?.name : booking.requester?.name}
      </td>
      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
        {new Date(booking.startDate).toLocaleDateString()} –{" "}
        {new Date(booking.endDate).toLocaleDateString()}
      </td>
      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
        {booking.pet.name}
      </td>
      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb" }}>
        ${booking.totalPrice}
      </td>
      <td style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", textTransform: "capitalize" }}>
        {booking.status}
      </td>
    </tr>
  );

  if (authLoading || !user) {
    return <p style={{ padding: 40 }}>Loading...</p>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ color: "#1e293b", marginBottom: 24 }}>Booking History</h1>

        {/* As owner */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>As owner (my pets)</h2>
          {pastSent.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No past bookings as an owner yet.</p>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead style={{ backgroundColor: "#f9fafb" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Host</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Dates</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Pet</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Total</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSent.map((b) => (
                    <BookingRow key={b._id} booking={b} isSent={true} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* As host */}
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>As host (stays at my place)</h2>
          {pastReceived.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No past stays as a host yet.</p>
          ) : (
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead style={{ backgroundColor: "#f9fafb" }}>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Owner</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Dates</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Pet</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Total</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastReceived.map((b) => (
                    <BookingRow key={b._id} booking={b} isSent={false} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

