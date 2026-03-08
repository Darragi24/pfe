import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { FiBell, FiUser } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { approveHost, rejectHost } from "../services/authService";
import NotificationItem from "./NotificationItem";

export default function Navbar({ notificationsCount: propCount = 0, onNotificationsClick }) {
  const { user, logoutUser } = useContext(AuthContext);
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingNotif, setProcessingNotif] = useState({}); // map id -> action in progress
  const dropdownRef = useRef(null);

  // Dummy notifications for UI testing (remove when backend is ready)
  const dummyNotifications = [
    { _id: "1", message: "Your host application has been approved!", createdAt: new Date().toISOString(), read: false, type: "host_application_approved" },
    { _id: "2", message: "New booking request from John", createdAt: new Date().toISOString(), read: false, type: "new_booking_request" },
    { _id: "3", message: "Alice has applied to become a host", createdAt: new Date().toISOString(), read: false, type: "host_application" },
  ];

  // Fetch notifications from server
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setNotifications(dummyNotifications);
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("non-ok response");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setNotifications(dummyNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when user logs in
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for real-time socket notifications
  useEffect(() => {
    if (!socket) return;

    socket.on("new-notification", (notification) => {
      console.log("New real-time notification:", notification);
      // Refetch to ensure we have the real DB ID and all data
      fetchNotifications();
    });

    socket.on("host-status-updated", (data) => {
      console.log("Host status updated:", data);
      // refetch notifications to keep in sync
      fetchNotifications();
    });

    return () => {
      socket.off("new-notification");
      socket.off("host-status-updated");
    };
  }, [socket]);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    // Optionally mark as read when opening – we'll skip for now
    if (onNotificationsClick) onNotificationsClick();
  };

  const handleNotificationClick = async (notification) => {
    // mark read via API
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

    // remove from local list
    setNotifications((n) => n.filter((x) => x._id !== notification._id));
    setShowDropdown(false);

    // Navigate based on type
    if (notification.type === "host_application_approved") {
      router.push("/dashboard");
    } else if (notification.type === "host_application_rejected") {
      router.push("/becomehost");
    } else if (notification.type === "new_booking_request") {
      router.push("/requests");
    } else if (notification.type === "host_application") {
      // go to admin hosts page where pending apps appear
      router.push("/admin/hosts");
    } else {
      router.push("/notifications");
    }
  };

  const approveNotification = async (notif) => {
    setProcessingNotif((p) => ({ ...p, [notif._id]: "approving" }));
    try {
      await approveHost(notif.data.applicantId);
      await fetch(`http://localhost:5000/api/notifications/mark-read/${notif._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // remove from list
      setNotifications((n) => n.filter((x) => x._id !== notif._id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingNotif((p) => {
        const np = { ...p };
        delete np[notif._id];
        return np;
      });
    }
  };

  const rejectNotification = async (notif) => {
    setProcessingNotif((p) => ({ ...p, [notif._id]: "rejecting" }));
    try {
      await rejectHost(notif.data.applicantId);
      await fetch(`http://localhost:5000/api/notifications/mark-read/${notif._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      // remove from list
      setNotifications((n) => n.filter((x) => x._id !== notif._id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingNotif((p) => {
        const np = { ...p };
        delete np[notif._id];
        return np;
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications = notifications.filter((n) => !n.read);

  // Navigation links (same as before)
  const handleLogout = () => {
    logoutUser();
    router.push("/");
  };

  const isHost = user?.roles?.includes("host");
  const isOwner = user?.roles?.includes("owner");
  const isAdmin = user?.roles?.includes("admin");

  let navLinks = [
    { label: "Profile", href: "/dashboard", icon: <FiUser size={18} /> },
  ];

  // if user is already a host, offer update instead of initial application
  const becomeLabel = isHost ? "Update Host Profile" : "Become a Host";

  const ownerLinks = [
    { label: "My Pets", href: "/pets" },
    { label: "Find a Host", href: "/find-host" },
    { label: "My Bookings", href: "/bookings" },
    { label: becomeLabel, href: "/becomehost" },
    { label: "Payment", href: "/payments" },
  ];

  const hostLinks = [{ label: "Planned Hosting", href: "/planned-hosting" }];
  const sharedLinks = [
    { label: "History", href: "/history" },
    { label: "Messages", href: "/messages" },
  ];

  if (isOwner && isHost) {
    navLinks = [...navLinks, ...hostLinks, ...ownerLinks, ...sharedLinks];
  } else if (isHost) {
    navLinks = [...navLinks, ...hostLinks, ...sharedLinks];
  } else if (isOwner) {
    navLinks = [...navLinks, ...ownerLinks, ...sharedLinks];
  }

  // make sure hosts always have link to their host profile page (update or become)
  const hostProfileLink = { label: becomeLabel, href: "/becomehost" };
  if (isHost && !navLinks.find((l) => l.href === "/becomehost")) {
    navLinks.push(hostProfileLink);
  }

  // admin-specific links always visible to admins (in addition to other links)
  if (isAdmin) {
    navLinks = [
      ...navLinks,
      { label: "User Management", href: "/admin/users" },
      { label: "Host Management", href: "/admin/hosts" },
    ];
  }

  return (
    <nav
      style={{
        width: "100%",
        padding: "12px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div
        style={{
          fontWeight: 700,
          color: "#4f46e5",
          fontSize: 20,
          cursor: "pointer",
        }}
        onClick={() => router.push("/")}
      >
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
              backgroundColor: "#f4f6f9",
              color: "#4f46e5",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.2s",
              boxShadow:
                router.pathname === link.href
                  ? "0 0 8px rgba(79,70,229,0.5)"
                  : "0 2px 6px rgba(0,0,0,0.05)",
              border: router.pathname === link.href ? "2px solid #4f46e5" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#4f46e5";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f4f6f9";
              e.currentTarget.style.color = "#4f46e5";
            }}
          >
            {link.icon} {link.label}
          </div>
        ))}
      </div>

      {/* Right: Notifications + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: 15, position: "relative" }} ref={dropdownRef}>
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={handleBellClick}
          title="View Notifications"
        >
          <FiBell size={24} color="#4f46e5" />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                backgroundColor: "#dc2626",
                color: "#fff",
                borderRadius: "50%",
                padding: "2px 6px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {/* Notifications Dropdown */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "40px",
              right: "0",
              width: "320px",
              maxHeight: "400px",
              overflowY: "auto",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              border: "1px solid #e2e8f0",
              zIndex: 200,
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontWeight: 600 }}>
              Notifications
            </div>
            <div>
              {loading ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  Loading...
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No new notifications
                </div>
              ) : (
                visibleNotifications.map((notif) => (
                  <NotificationItem
                    key={notif._id}
                    note={notif}
                    isAdmin={isAdmin}
                    busyId={processingNotif[notif._id] ? notif._id : null}
                    onClick={handleNotificationClick}
                    onApprove={approveNotification}
                    onReject={rejectNotification}
                  />
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid #e2e8f0",
                  textAlign: "center",
                  fontSize: "0.9rem",
                  color: "#4f46e5",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/notifications");
                }}
              >
                View All
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "6px 18px",
            backgroundColor: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
            transition: "0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.85)}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}