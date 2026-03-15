import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FiBell, FiUser, FiMessageSquare } from "react-icons/fi"; // Added Message Icon
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { approveHost, rejectHost } from "../services/authService";
import NotificationItem from "./NotificationItem";

export default function Navbar({ notificationsCount: propCount = 0, onNotificationsClick }) {
  const { user, logoutUser } = useContext(AuthContext);
  const { socket, isConnected } = useSocket() || {};
  const router = useRouter();

  // Notification States
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingNotif, setProcessingNotif] = useState({});
  const dropdownRef = useRef(null);

  // Message States
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // --- DATA FETCHING ---

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("non-ok response");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadMessageCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Ensure this endpoint exists on your backend
      const res = await fetch("http://localhost:5000/api/messages/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUnreadMessagesCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread message count", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadMessageCount();
    } else {
      setNotifications([]);
      setUnreadMessagesCount(0);
    }
  }, [user]);

  // --- SOCKET LISTENERS ---

  useEffect(() => {
    if (!socket) return;

    // Listener for general notifications
    socket.on("new-notification", () => fetchNotifications());
    socket.on("host-status-updated", () => fetchNotifications());

    // Listener for real-time messages
    socket.on("new-message", (data) => {
      // Logic: Only increment count if user is NOT currently looking at that specific chat
      const isCurrentlyInThisChat = 
        router.pathname.includes("/messages") && 
        router.query.userId === (data.sender._id || data.sender);

      if (!isCurrentlyInThisChat) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("new-notification");
      socket.off("host-status-updated");
      socket.off("new-message");
    };
  }, [socket, router.pathname, router.query.userId]);

  // --- HANDLERS ---

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (onNotificationsClick) onNotificationsClick();
  };

  const handleNotificationClick = async (notification) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`http://localhost:5000/api/notifications/mark-read/${notification._id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.warn("Failed to mark notification read", e);
    }

    setNotifications((n) => n.filter((x) => x._id !== notification._id));
    setShowDropdown(false);

    // Navigation logic
    if (notification.type === "host_application_approved") router.push("/dashboard");
    else if (notification.type === "host_application_rejected") router.push("/becomehost");
    else if (notification.type === "new_booking_request") router.push("/requests");
    else if (notification.type === "host_application") router.push("/admin/hosts");
    else router.push("/notifications");
  };

  const approveNotification = async (notif) => {
    setProcessingNotif((p) => ({ ...p, [notif._id]: "approving" }));
    try {
      await approveHost(notif.data.applicantId);
      await fetch(`http://localhost:5000/api/notifications/mark-read/${notif._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications((n) => n.filter((x) => x._id !== notif._id));
    } catch (err) { console.error(err); }
    finally { setProcessingNotif((p) => { const np = { ...p }; delete np[notif._id]; return np; }); }
  };

  const rejectNotification = async (notif) => {
    setProcessingNotif((p) => ({ ...p, [notif._id]: "rejecting" }));
    try {
      await rejectHost(notif.data.applicantId);
      await fetch(`http://localhost:5000/api/notifications/mark-read/${notif._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications((n) => n.filter((x) => x._id !== notif._id));
    } catch (err) { console.error(err); }
    finally { setProcessingNotif((p) => { const np = { ...p }; delete np[notif._id]; return np; }); }
  };

  // UI Helpers
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = notifications.filter((n) => !n.read);
  const isHost = user?.roles?.includes("host");
  const isOwner = user?.roles?.includes("owner");
  const isAdmin = user?.roles?.includes("admin");

  const becomeLabel = isHost ? "Update Host Profile" : "Become a Host";
  let navLinks = [{ label: "Profile", href: "/dashboard", icon: <FiUser size={18} /> }];

  if (isOwner) navLinks.push({ label: "My Pets", href: "/pets" }, { label: "Find a Host", href: "/find-host" }, { label: "My Bookings", href: "/bookings" }, { label: becomeLabel, href: "/becomehost" });
  if (isHost) navLinks.push({ label: "Planned Hosting", href: "/planned-hosting" });
  navLinks.push({ label: "History", href: "/history" }, { label: "Messages", href: "/messages" });
  if (isAdmin) navLinks.push({ label: "User Management", href: "/admin/users" }, { label: "Host Management", href: "/admin/hosts" });

  return (
    <nav style={{ width: "100%", padding: "12px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 100 }}>
      {/* Brand */}
      <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 20, cursor: "pointer" }} onClick={() => router.push("/")}>
        PetStay 🐾
      </div>

      {/* Navigation Links */}
      <div style={{ display: "flex", gap: 12 }}>
        {navLinks.map((link) => (
          <div
            key={link.href}
            onClick={() => router.push(link.href)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: link.icon ? 6 : 0,
              padding: "8px 22px",
              borderRadius: 30,
              backgroundColor: router.pathname === link.href ? "#4f46e5" : "#f4f6f9",
              color: router.pathname === link.href ? "#fff" : "#4f46e5",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {link.icon} {link.label}
          </div>
        ))}
      </div>

      {/* Right Section: Messages + Notifications + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative" }} ref={dropdownRef}>
        
        {/* MESSAGE ICON */}
        <div 
          style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}
          onClick={() => router.push("/messages")}
          title="Messages"
        >
          <FiMessageSquare size={24} color="#4f46e5" />
          {unreadMessagesCount > 0 && (
            <span style={badgeStyle}>{unreadMessagesCount}</span>
          )}
        </div>

        {/* NOTIFICATION BELL */}
        <div
          style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}
          onClick={handleBellClick}
          title="View Notifications"
        >
          <FiBell size={24} color="#4f46e5" />
          {unreadCount > 0 && (
            <span style={badgeStyle}>{unreadCount}</span>
          )}
        </div>

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div style={{ position: "absolute", top: "45px", right: "80px", width: "320px", maxHeight: "400px", overflowY: "auto", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", zIndex: 200 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>Notifications</div>
            <div>
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Loading...</div>
              ) : visibleNotifications.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No new notifications</div>
              ) : (
                visibleNotifications.map((notif) => (
                  <NotificationItem key={notif._id} note={notif} isAdmin={isAdmin} busyId={processingNotif[notif._id] ? notif._id : null} onClick={handleNotificationClick} onApprove={approveNotification} onReject={rejectNotification} />
                ))
              )}
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #e2e8f0", textAlign: "center", fontSize: "0.9rem", color: "#4f46e5", cursor: "pointer" }} onClick={() => { setShowDropdown(false); router.push("/notifications"); }}>View All</div>
          </div>
        )}

        <button type="button" onClick={handleLogout} style={{ padding: "6px 18px", backgroundColor: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// Reusable Badge Style
const badgeStyle = {
  position: "absolute",
  top: -6,
  right: -6,
  backgroundColor: "#dc2626",
  color: "#fff",
  borderRadius: "50%",
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 700,
  border: "2px solid #fff",
  minWidth: "18px",
  textAlign: "center"
};