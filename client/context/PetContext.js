import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

export const PetContext = createContext();

export const PetProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's pets
  const fetchPets = async () => {
    if (!user || !token) return;
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPets(data);
    } catch (err) {
      console.error("Failed to fetch pets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [user, token]);

  const addPet = (pet) => setPets((prev) => [pet, ...prev]);

  const updatePet = (updatedPet) =>
    setPets((prev) => prev.map((p) => (p._id === updatedPet._id ? updatedPet : p)));

  const removePet = (id) => setPets((prev) => prev.filter((p) => p._id !== id));

  return (
    <PetContext.Provider
      value={{ pets, loading, fetchPets, addPet, updatePet, removePet }}
    >
      {children}
    </PetContext.Provider>
  );
};