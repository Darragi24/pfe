// components/WelcomeBanner.js
export default function WelcomeBanner({ name }) {
  return (
    <div
      style={{
        backgroundColor: "#4f46e5",
        color: "white",
        padding: "20px 40px",
        borderRadius: "12px",
        margin: "20px auto",
        maxWidth: 1000,
        textAlign: "center",
        fontSize: 22,
        fontWeight: 600,
        boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
      }}
    >
      Welcome back, {name}! 👋
    </div>
  );
}