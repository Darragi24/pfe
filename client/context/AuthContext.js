import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // track if restoring user

  // Load from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  // Login helper
  const loginUser = async (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);

    // refresh from server to ensure we have hostApplication and any other fields
    try {
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (res.ok) {
        const full = await res.json();
        setUser(full);
        localStorage.setItem("user", JSON.stringify(full));
      }
    } catch (e) {
      console.warn("Failed to refresh user after login", e);
    }
  };

  // Logout helper
  const logoutUser = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Update user helper (sync state + localStorage)
  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem("user", JSON.stringify(newUserData));
  };

  // Submit host application helper (updates user locally)
  const submitHostApplication = (applicationData) => {
    if (!user) return;
    setUser((prev) => ({
      ...prev,
      hostApplication: {
        status: "pending",
        experience: applicationData.experience || "",
        preferredPets: applicationData.preferredPets || [],
        pricePerNight: Number(applicationData.pricePerNight) || 0,
        submittedAt: new Date(),
      },
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginUser,
        logoutUser,
        updateUser,
        submitHostApplication, // new helper
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};