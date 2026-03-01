import { useEffect } from "react";
import { useRouter } from "next/router";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes("admin"))) {
      router.replace("/");
    } else if (user && user.roles.includes("admin")) {
      router.replace("/admin/users");
    }
  }, [user, loading, router]);

  return <p style={{ padding: 40 }}>Redirecting…</p>;
}
