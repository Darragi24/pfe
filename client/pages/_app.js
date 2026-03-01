import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import { PetProvider } from "../context/PetContext";
import { SocketProvider } from "../context/SocketContext";

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <PetProvider>
          <Component {...pageProps} />
        </PetProvider>
      </SocketProvider>
    </AuthProvider>
  );
}