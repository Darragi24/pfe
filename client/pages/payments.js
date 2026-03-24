import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/router";
import { FiCreditCard, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Navbar from "../components/navbar";
import { useSocket } from "../context/SocketContext";

export default function PaymentsPage() {
  const { user } = useContext(AuthContext);
  // FIX: Destructure socket for real-time payment status updates
  const { socket } = useSocket() || {};
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- 1. MOVE THIS HERE (Outside of useEffect) ---
  const fetchToPay = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/bookings/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Filter for bookings that are accepted or completed
      setBookings(data.filter((b) => b.status === "accepted" || b.status === "completed"));
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initial data load
  useEffect(() => {
    if (user) fetchToPay();
  }, [user]);

  // FIX: Listen for real-time payment confirmation via Socket.IO.
  // Previously the page only used a 3-second polling timer, which was fragile.
  // Now when the webhook fires and emits 'new-notification' (type: payment_success),
  // we refresh immediately — no timer dependency.
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      if (
        notification.type === "payment_success" ||
        notification.type === "payment_received"
      ) {
        fetchToPay();
      }
    };

    const handleBookingUpdated = (data) => {
      if (data?.status === "completed") {
        fetchToPay();
      }
    };

    socket.on("new-notification", handleNotification);
    socket.on("booking-updated", handleBookingUpdated);

    // FIX: Properly clean up both event listeners on unmount to prevent memory leaks.
    return () => {
      socket.off("new-notification", handleNotification);
      socket.off("booking-updated", handleBookingUpdated);
    };
  }, [socket]);

useEffect(() => {
    if (router.query.payment === "success") {
      // 1. Refresh immediately to catch any fast updates
      fetchToPay();

      // 2. IMPORTANT: Refresh again after 3 seconds
      // This ensures that even if the Webhook was slow, the UI will update
      const timer = setTimeout(() => {
        console.log("Webhook sync: Refreshing payment status...");
        fetchToPay();
      }, 3000);

      // 3. Clean the URL so the success message doesn't stay forever
      const urlTimer = setTimeout(() => {
        router.replace("/payments", undefined, { shallow: true });
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearTimeout(urlTimer);
      };
    }
  }, [router.query.payment]);

  const handleCheckout = async (bookingId) => {
    try {
      const res = await fetch("http://localhost:5000/api/payments/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      // FIX: Check for HTTP error responses before reading JSON.
      // Previously a 4xx/5xx error was silently ignored — no feedback to the user.
      const data = await res.json();
      if (!res.ok) {
        alert(`Payment error: ${data.error || "Could not initialize payment. Please try again."}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Payment failed to initialize. Please check your connection and try again.");
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Loading Payments...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "20px" }}>
      <Navbar />
      <h1 style={{ display: "flex", alignItems: "center", gap: "10px", color: "#111827", marginTop: "20px" }}>
        <FiCreditCard color="#4f46e5" /> Billing & Payments
      </h1>
      <p style={{ color: "#6b7280", marginBottom: "30px" }}>Manage your pet stay invoices and transaction history.</p>

      {/* --- SUCCESS BANNER --- */}
      {router.query.payment === "success" && (
        <div style={{
          padding: "15px",
          backgroundColor: "#d1fae5",
          color: "#065f46",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "1px solid #34d399"
        }}>
          <FiCheckCircle size={20} />
          <strong>Transaction Successful!</strong> Your payment has been confirmed and the status is updated.
        </div>
      )}

      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f3f4f6", borderRadius: "12px" }}>
          <FiCheckCircle size={40} color="#9ca3af" />
          <p style={{ marginTop: "10px", color: "#4b5563" }}>All caught up! No pending payments.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {bookings.map((booking) => (
            <div
              key={booking._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px" }}>Stay for {booking.pet?.name || "Pet"}</h3>
                <p style={{ margin: "4px 0", color: "#6b7280", fontSize: "14px" }}>
                  Host: {booking.host?.name || "Professional Sitter"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  {booking.status === "completed" ? (
                    <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiCheckCircle /> Paid
                    </span>
                  ) : (
                    <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiClock /> Awaiting Payment
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", marginBottom: "8px" }}>
                  ${booking.totalPrice}
                </div>
                {booking.status !== "completed" && (
                  <button
                    onClick={() => handleCheckout(booking._id)}
                    style={{
                      backgroundColor: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}