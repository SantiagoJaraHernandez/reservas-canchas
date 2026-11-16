import { useEffect } from "react";
import useAuthStore from "@/app/store/authStore";

function AuthGuard({ children }) {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return children;
}

export default AuthGuard;