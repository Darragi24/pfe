import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import Navbar from "../../components/navbar";

export default function Messages() {
  const router = useRouter();
  const { userId: selectedUserId } = router.query;
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket() || {};

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePartner, setActivePartner] = useState(null); // State for the header info
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  // When selectedUserId changes, find or fetch the partner's details
  useEffect(() => {
    if (selectedUserId && user) {
      fetchMessages(selectedUserId);
      
      // Try to find partner in existing conversations
      const partner = conversations.find(c => c.user._id.toString() === selectedUserId.toString())?.user;
      
      if (partner) {
        setActivePartner(partner);
      } else {
        // Fallback: If not in sidebar, fetch user details directly so the name isn't "Loading..."
        fetchPartnerDetails(selectedUserId);
      }
    }
  }, [selectedUserId, user, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on("new-message", (data) => {
      const senderId = (data.sender._id || data.sender).toString();
      const recipientId = (data.recipient._id || data.recipient).toString();
      const currentId = selectedUserId?.toString();

      if (senderId === currentId || recipientId === currentId) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations();
    });

    return () => socket.off("new-message");
  }, [socket, user, selectedUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchPartnerDetails = async (id) => {
    try {
      const token = localStorage.getItem("token");
      // Update this URL to your actual "get user by ID" endpoint
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setActivePartner(data);
    } catch (err) {
      console.error("Error fetching partner details:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // Ensure data is an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Inbox error:", err);
    }
  };

  const fetchMessages = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      
      await fetch(`http://localhost:5000/api/messages/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Chat fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedUserId,
          text: newMessage,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
      fetchConversations(); // Update sidebar to show this new chat
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  if (authLoading || !user) return <p>Loading...</p>;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      <Navbar />
      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", flex: 1, overflow: "hidden" }}>
        
        {/* SIDEBAR */}
        <aside style={{ borderRight: "1px solid #e2e8f0", overflowY: "auto", backgroundColor: "#fff" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>Messages</h2>
          </div>
          
          {conversations.length === 0 ? (
            <p style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.user._id}
                onClick={() => router.push(`/messages/${conv.user._id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "15px 20px",
                  cursor: "pointer",
                  backgroundColor: selectedUserId === conv.user._id ? "#f0f9ff" : "transparent",
                  borderBottom: "1px solid #f1f5f9"
                }}
              >
                <img 
                  src={conv.user.profilePic ? `http://localhost:5000/uploads/${conv.user.profilePic}` : "/default-avatar.png"} 
                  onError={(e) => { e.target.src = "/default-avatar.png"; }}
                  style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong style={{ color: "#1e293b" }}>{conv.user.name}</strong>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </aside>

        {/* CHAT AREA */}
        <main style={{ display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
          {selectedUserId ? (
            <>
              {/* Header: Uses the activePartner state to prevent "Loading..." */}
              <div style={{ padding: "15px 25px", backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "10px" }}>
                <img 
                  src={activePartner?.profilePic ? `http://localhost:5000/uploads/${activePartner.profilePic}` : "/default-avatar.png"} 
                  onError={(e) => { e.target.src = "/default-avatar.png"; }}
                  style={{ width: "35px", height: "35px", borderRadius: "50%" }} 
                />
                <h3 style={{ margin: 0, fontSize: "1rem" }}>{activePartner?.name || "Chat"}</h3>
              </div>

              {/* Messages Container */}
              <div style={{ flex: 1, overflowY: "auto", padding: "25px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.map((msg) => {
                  const isOwn = (msg.sender._id || msg.sender).toString() === user._id.toString();
                  return (
                    <div key={msg._id} style={{ alignSelf: isOwn ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                      <div style={{ 
                        padding: "10px 16px", 
                        borderRadius: "18px", 
                        backgroundColor: isOwn ? "#3b82f6" : "#fff",
                        color: isOwn ? "white" : "#1e293b",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} style={{ padding: "20px", backgroundColor: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px" }}>
                <input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{ flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "25px", outline: "none" }}
                  placeholder="Type a message..."
                />
                <button type="submit" style={{ padding: "0 24px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "25px", cursor: "pointer" }}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "#64748b" }}>
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}