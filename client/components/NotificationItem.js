import { useState } from "react";

export default function NotificationItem({
  note,
  isAdmin,
  busyId,
  onApprove,
  onReject,
  onClick,
  onBookingAccept,
  onBookingReject,
}) {
  const [hover, setHover] = useState(false);

  const handleApprove = (e) => {
    e.stopPropagation();
    onApprove && onApprove(note);
  };

  const handleReject = (e) => {
    e.stopPropagation();
    onReject && onReject(note);
  };

  const handleBookingAccept = (e) => {
    e.stopPropagation();
    onBookingAccept && onBookingAccept(note);
  };

  const handleBookingReject = (e) => {
    e.stopPropagation();
    onBookingReject && onBookingReject(note);
  };

  const containerStyle = {
    padding: "12px 18px",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: note.read ? "#fff" : "#eff6ff",
    transition: "background 0.15s, transform 0.1s",
    cursor: onClick ? "pointer" : "default",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };
  if (hover) containerStyle.backgroundColor = "#f8fafc";

  const typeLabelMap = {
    host_application: "Host application",
    host_application_approved: "Host approved",
    host_application_rejected: "Host rejected",
    booking_request: "Booking request",
    booking_accepted: "Booking accepted",
    booking_rejected: "Booking rejected",
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onClick && onClick(note)}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontSize: "0.95rem", color: "#0f172a" }}>{note.message}</div>
        <div
          style={{
            fontSize: "0.7rem",
            padding: "2px 8px",
            borderRadius: 999,
            backgroundColor: "#e0f2fe",
            color: "#0369a1",
            whiteSpace: "nowrap",
          }}
        >
          {typeLabelMap[note.type] || "Notification"}
        </div>
      </div>
      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
        {new Date(note.createdAt).toLocaleString()}
      </div>

      {note.data && Object.keys(note.data).length > 0 && (
        <div style={{ marginTop: 10, fontSize: "0.85rem", color: "#475569" }}>
          {/* Host application details */}
          {note.type === "host_application" && (
            <>
              {note.data.applicantName && (
                <div>
                  <strong>Applicant:</strong> {note.data.applicantName}
                  {note.data.applicantEmail && ` (${note.data.applicantEmail})`}
                </div>
              )}
              {note.data.currentStatus && (
                <div>
                  <strong>Status:</strong> {note.data.currentStatus}
                </div>
              )}
              {note.data.experience !== undefined && (
                <div>
                  <strong>Experience:</strong> {note.data.experience || "–"}
                </div>
              )}
              {note.data.preferredPets !== undefined && (
                <div>
                  <strong>Preferred pets:</strong>{" "}
                  {(note.data.preferredPets || []).join(", ") || "–"}
                </div>
              )}
              {note.data.pricePerNight !== undefined && (
                <div>
                  <strong>Price/night:</strong> ${note.data.pricePerNight || 0}
                </div>
              )}
            </>
          )}

          {/* Booking-related details */}
          {(note.type === "booking_request" ||
            note.type === "booking_accepted" ||
            note.type === "booking_rejected") && (
            <>
              {note.data.requesterName && (
                <div>
                  <strong>Requester:</strong> {note.data.requesterName}
                </div>
              )}
              {(note.data.startDate || note.data.endDate) && (
                <div>
                  <strong>Dates:</strong>{" "}
                  {note.data.startDate &&
                    new Date(note.data.startDate).toLocaleDateString()}{" "}
                  {note.data.endDate && " - "}
                  {note.data.endDate &&
                    new Date(note.data.endDate).toLocaleDateString()}
                </div>
              )}
              {note.data.totalPrice !== undefined && (
                <div>
                  <strong>Total price:</strong> ${note.data.totalPrice}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isAdmin && note.type === "host_application" && (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            disabled={busyId === note._id}
            onClick={handleApprove}
            style={{
              padding: "4px 10px",
              backgroundColor: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: busyId === note._id ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              opacity: busyId === note._id ? 0.6 : 1,
            }}
          >
            {busyId === note._id ? "…" : "Approve"}
          </button>
          <button
            disabled={busyId === note._id}
            onClick={handleReject}
            style={{
              padding: "4px 10px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: busyId === note._id ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              opacity: busyId === note._id ? 0.6 : 1,
            }}
          >
            {busyId === note._id ? "…" : "Reject"}
          </button>
        </div>
      )}

      {/* Host booking actions for booking requests (hosts accept/reject here) */}
      {note.type === "booking_request" && onBookingAccept && onBookingReject && (
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button
            disabled={busyId === note._id}
            onClick={handleBookingAccept}
            style={{
              padding: "4px 10px",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: busyId === note._id ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              opacity: busyId === note._id ? 0.6 : 1,
            }}
          >
            {busyId === note._id ? "…" : "Accept booking"}
          </button>
          <button
            disabled={busyId === note._id}
            onClick={handleBookingReject}
            style={{
              padding: "4px 10px",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: busyId === note._id ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              opacity: busyId === note._id ? 0.6 : 1,
            }}
          >
            {busyId === note._id ? "…" : "Reject booking"}
          </button>
        </div>
      )}
    </div>
  );
}
