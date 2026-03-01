import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

// Helper to get token
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found, please login");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// ---------------- Register ----------------
export const register = async (userData) => {
  const res = await axios.post(`${API_URL}/register`, userData);
  return res.data;
};

// ---------------- Login ----------------
export const login = async (userData) => {
  const res = await axios.post(`${API_URL}/login`, userData);
  return res.data;
};

// ---------------- Get Current User ----------------
export const getMe = async () => {
  const res = await axios.get(`${API_URL}/me`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

// ---------------- Apply For Host ----------------
export const applyForHost = async (applicationData) => {
  const res = await axios.post(
    `${API_URL}/apply-host`,
    applicationData,
    {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "application/json",
      },
    }
  );

  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

// ---------------- Approve Host (Admin) ----------------
export const approveHost = async (userId) => {
  const res = await axios.put(
    `${API_URL}/approve-host/${userId}`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return res.data;
};

// ---------------- Reject Host (Admin) ----------------
export const rejectHost = async (userId) => {
  const res = await axios.put(
    `${API_URL}/reject-host/${userId}`,
    {},
    {
      headers: getAuthHeader(),
    }
  );
  return res.data;
};

// ---------------- Update Name ----------------
export const updateName = async (name) => {
  const res = await axios.put(
    `${API_URL}/update-name`,
    { name },
    { headers: getAuthHeader() }
  );

  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

// ---------------- Update Phone ----------------
export const updatePhone = async (phone) => {
  const res = await axios.put(
    `${API_URL}/update-phone`,
    { phone },
    { headers: getAuthHeader() }
  );

  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

// ---------------- Update Bio ----------------
export const updateBio = async (bio) => {
  const res = await axios.put(
    `${API_URL}/update-bio`,
    { bio },
    { headers: getAuthHeader() }
  );

  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

// ---------------- Update Profile Pic ----------------
export const updateProfilePic = async (formData) => {
  const res = await axios.put(
    `${API_URL}/update-profile-pic`,
    formData,
    {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  localStorage.setItem("user", JSON.stringify(res.data.user));
  return res.data;
};

// ---------------- Admin helpers ----------------
export const getAllUsers = async () => {
  const res = await axios.get(`${API_URL}/users`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const getAllHosts = async () => {
  const res = await axios.get(`${API_URL}/hosts`, {
    headers: getAuthHeader(),
  });
  return res.data;
};

export const deactivateHost = async (userId) => {
  const res = await axios.put(
    `${API_URL}/deactivate-host/${userId}`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
};

export const deactivateUser = async (userId) => {
  const res = await axios.put(
    `${API_URL}/deactivate-user/${userId}`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
};

export const activateUser = async (userId) => {
  const res = await axios.put(
    `${API_URL}/activate-user/${userId}`,
    {},
    { headers: getAuthHeader() }
  );
  return res.data;
};

// ---------------- Notifications ----------------
export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get("http://localhost:5000/api/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const markNotificationRead = async (id) => {
  const token = localStorage.getItem("token");
  const res = await axios.put(`http://localhost:5000/api/notifications/mark-read/${id}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};