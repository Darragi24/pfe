import React from "react";

export default function HostRow({
  user,
  busyId,
  onApprove,
  onReject,
  onDeactivate,
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <tr
      style={{
        borderBottom: "1px solid #ddd",
        transition: "background 0.2s",
        backgroundColor: hover ? "#fafafa" : "#fff",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <td style={{ padding: "10px" }}>{user.name}</td>
      <td style={{ padding: "10px" }}>{user.email}</td>
      <td style={{ padding: "10px" }}>{user.hostApplication?.experience || "–"}</td>
      <td style={{ padding: "10px" }}>
        {(user.hostApplication?.preferredPets || []).join(", ") || "–"}
      </td>
      <td style={{ padding: "10px" }}>${user.hostApplication?.pricePerNight || 0}</td>
      <td style={{ padding: "10px" }}>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 12,
            color: "#fff",
            fontSize: "0.8rem",
            backgroundColor:
              user.hostApplication?.status === "approved"
                ? "#16a34a"
                : user.hostApplication?.status === "rejected"
                ? "#dc2626"
                : user.hostApplication?.status === "pending"
                ? "#f59e0b"
                : "#6b7280",
          }}
        >
          {user.hostApplication?.status || "none"}
        </span>
      </td>
      <td style={{ display: "flex", gap: 6, padding: "10px" }}>
        {user.hostApplication?.status === "pending" && (
          <>
            <button
              disabled={busyId === user._id}
              onClick={() => onApprove(user._id)}
            >
              {busyId === user._id ? "..." : "Approve"}
            </button>
            <button
              disabled={busyId === user._id}
              onClick={() => onReject(user._id)}
            >
              {busyId === user._id ? "..." : "Reject"}
            </button>
          </>
        )}
        <button
          disabled={busyId === user._id}
          onClick={() => onDeactivate(user._id)}
        >
          {busyId === user._id ? "..." : "Deactivate"}
        </button>
      </td>
    </tr>
  );
}
