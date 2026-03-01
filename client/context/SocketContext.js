import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { AuthContext } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn("useSocket must be used within SocketProvider");
    return null;
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if auth is fully loaded AND user exists
    if (!user?.id) return;

    // connect to the WebSocket server
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);

      // join appropriate rooms based on user roles
      if (user.roles?.includes("admin")) {
        newSocket.emit("join-admin", user.id);
      }
      // all users join their personal room
      newSocket.emit("join-user", user.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  // Handle room changes when user roles change
  useEffect(() => {
    if (!socket || !user?.id) return;

    // Update rooms if roles changed
    if (user.roles?.includes("admin")) {
      socket.emit("join-admin", user.id);
    }
  }, [socket, user?.id, user?.roles?.join(",")]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, user }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
