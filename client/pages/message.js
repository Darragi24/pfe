import { useState, useEffect, useContext, useRef } from "react";
import Navbar from "../components/navbar";
import { useRouter } from "next/router";
import { AuthContext } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Messages() {
  const router = useRouter();
  const { userId: selectedUserId } = router.query;
  const { user, loading: authLoading } = useContext(AuthContext);
  const { socket } = useSocket() || {};

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Redirect if not logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Load messages when selected user changes
  useEffect(() => {
    if (selectedUserId && conversations.length > 0) {
      const conversation = conversations.find(
        (conv) =>
          conv.participantId === selectedUserId ||
          conv.participant._id === selectedUserId
      );
      if (conversation) {
        setCurrentConversation(conversation);
        fetchMessages(selectedUserId);
      }
    }
  }, [selectedUserId, conversations]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !user) return;

    // Inside your useEffect for new-message
    socket.on("new-message", (data) => {
      const senderId = data.sender._id || data.sender;
      const currentChatId = currentConversation?.participantId || currentConversation?.participant?._id;
  
      if (
        senderId?.toString() === currentChatId?.toString() || 
        senderId?.toString() === user._id?.toString()
      ) {
        setMessages((prev) => [...prev, data]);
      }
      fetchConversations();
    });

    return () => socket.off("new-message");
  }, [socket, user, currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch conversations");
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load conversations");
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);

      // Mark messages as read
      await fetch(`http://localhost:5000/api/messages/${otherUserId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient: currentConversation.participantId || currentConversation.participant._id,
          text: newMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      const data = await response.json();

      // Add message to UI optimistically
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } catch (err) {
      alert("Error sending message: " + err.message);
      console.error(err);
    }
  };

  const handleSelectConversation = (conversation) => {
    const otherUserId = conversation.participantId || conversation.participant._id;
    router.push(`/messages/${otherUserId}`);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          height: "calc(100vh - 80px)",
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          gap: 0,
          padding: 0,
        }}
      >
        {/* Conversations list */}
        <aside
          style={{
            backgroundColor: "#fff",
            borderRight: "1px solid #e2e8f0",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.25rem" }}>
              Messages
            </h2>
          </div>

          {conversations.length === 0 ? (
            <div
              style={{
                padding: 20,
                color: "#64748b",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              No conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherUser = conversation.participant || {
                fullName: conversation.participantName,
                profilePic: conversation.participantProfilePic,
              };
              const isSelected =
                selectedUserId ===
                (conversation.participantId || conversation.participant._id);

              return (
                <div
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation)}
                  style={{
                    padding: 16,
                    borderBottom: "1px solid #e2e8f0",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                    borderLeft: isSelected ? "4px solid #3b82f6" : "none",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img
                      src={otherUser.profilePic || "/default-avatar.png"}
                      alt={otherUser.fullName}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontWeight: 600,
                          color: "#1e293b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {otherUser.fullName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {conversation.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </aside>

        {/* Chat area */}
        <main
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#f8fafc",
          }}
        >
          {currentConversation ? (
            <>
              {/* Chat header */}
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: 20,
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <img
                  src={
                    (currentConversation.participant?.profilePic ||
                      currentConversation.participantProfilePic) ||
                    "/default-avatar.png"
                  }
                  alt={
                    currentConversation.participant?.fullName ||
                    currentConversation.participantName
                  }
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <h2
                  style={{
                    margin: 0,
                    color: "#1e293b",
                    flex: 1,
                  }}
                >
                  {currentConversation.participant?.fullName ||
                    currentConversation.participantName}
                </h2>
              </div>

              {/* Messages container */}
              <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {loading ? (
                  <div style={{ textAlign: "center", color: "#64748b" }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748b" }}>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                      const isOwn = msg.sender._id?.toString() === user._id?.toString() || msg.sender?.toString() === user._id?.toString();                    
                      return (
                      <div
                        key={msg._id}
                        style={{
                          display: "flex",
                          justifyContent: isOwn ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "70%",
                            backgroundColor: isOwn ? "#3b82f6" : "#e2e8f0",
                            color: isOwn ? "#fff" : "#1e293b",
                            padding: "12px 16px",
                            borderRadius: 12,
                            wordWrap: "break-word",
                          }}
                        >
                          <p style={{ margin: 0, marginBottom: 4 }}>
                            {msg.text}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.75rem",
                              opacity: 0.7,
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  backgroundColor: "#fff",
                  borderTop: "1px solid #e2e8f0",
                  padding: 20,
                  display: "flex",
                  gap: 12,
                }}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: "1rem",
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    disabled: !newMessage.trim() ? 0.5 : 1,
                  }}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontSize: "1.1rem",
              }}
            >
              Select a conversation to start messaging
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
