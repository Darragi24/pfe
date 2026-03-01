import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/navbar";
import NotificationItem from "../components/NotificationItem";
import { useRouter } from "next/router";
import {
  getNotifications,
  markNotificationRead,
  approveHost,
  rejectHost,
} from "../services/authService";
import { useSocket } from "../context/SocketContext";

export default function NotificationsPage() {
  const { user, token, loading } = useContext(AuthContext);
  const { socket } = useSocket() || {};
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("unread"); // 'unread' | 'all'

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  const load = async () => {
    try {
      const data = await getNotifications();
      setNotes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  // Refresh list in real-time when a new notification arrives
  useEffect(() => {
    if (!socket) return;

    const handleNew = () => {
      load();
    };

    const handleHostStatus = () => {
      load();
    };

    socket.on("new-notification", handleNew);
    socket.on("host-status-updated", handleHostStatus);

    return () => {
      socket.off("new-notification", handleNew);
      socket.off("host-status-updated", handleHostStatus);
    };
  }, [socket]);

  const handleApprove = async (note) => {
    setBusyId(note._id);
    try {
      await approveHost(note.data.applicantId);
      await markNotificationRead(note._id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (note) => {
    setBusyId(note._id);
    try {
      await rejectHost(note.data.applicantId);
      await markNotificationRead(note._id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleNotificationClick = async (note) => {
    try {
      await markNotificationRead(note._id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notes.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n._id)));
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notes.filter((n) => !n.read).length;
  const visibleNotes =
    filter === "unread" ? notes.filter((n) => !n.read) : notes;

  const handleBookingAccept = async (note) => {
    if (!note.data?.bookingId) return;
    setBusyId(note._id);
    try {
      await fetch(
        `http://localhost:5000/api/bookings/${note.data.bookingId}/accept`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await markNotificationRead(note._id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleBookingReject = async (note) => {
    if (!note.data?.bookingId) return;
    setBusyId(note._id);
    try {
      await fetch(
        `http://localhost:5000/api/bookings/${note.data.bookingId}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await markNotificationRead(note._id);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !user) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Notifications</h2>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
              You have{" "}
              <strong>
                {unreadCount} unread
              </strong>{" "}
              notification{unreadCount === 1 ? "" : "s"}.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                backgroundColor: filter === "unread" ? "#0f172a" : "#fff",
                color: filter === "unread" ? "#fff" : "#0f172a",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Unread
            </button>
            <button
              type="button"
              onClick={() => setFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid #e2e8f0",
                backgroundColor: filter === "all" ? "#0f172a" : "#fff",
                color: filter === "all" ? "#fff" : "#0f172a",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                border: "none",
                backgroundColor: unreadCount === 0 ? "#e5e7eb" : "#4f46e5",
                color: "#fff",
                fontSize: "0.85rem",
                cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              }}
            >
              Mark all as read
            </button>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
            border: "1px solid #e2e8f0",
            padding: "8px 0",
          }}
        >
          {visibleNotes.length === 0 ? (
            <div
              style={{
                padding: "24px 20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "0.95rem",
              }}
            >
              No {filter === "unread" ? "unread " : ""}notifications.
            </div>
          ) : (
            visibleNotes.map((n) => (
              <NotificationItem
                key={n._id}
                note={n}
                isAdmin={user.roles.includes("admin")}
                busyId={busyId}
                onApprove={handleApprove}
                onReject={handleReject}
                onClick={handleNotificationClick}
                onBookingAccept={handleBookingAccept}
                onBookingReject={handleBookingReject}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
