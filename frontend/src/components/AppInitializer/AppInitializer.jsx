import { useEffect, useState } from "react";
import useAuthStore from "@/app/store/authStore";

function AppInitializer({ children }) {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, []);

  if (!ready) return null;

  return children;
}

export default AppInitializer;