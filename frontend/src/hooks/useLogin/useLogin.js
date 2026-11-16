import { useState } from "react";
import { authServices } from "@/features/auth/services/authServices";

function useLogin() {
  const { login } = authServices;
  const [loading, setLoading] = useState(false);
  const [errorsApi, setErrorsApi] = useState(null);

  async function useLoginUser(usuario) {
    try {
      setLoading(true);
      setErrorsApi(null);

      const data = await login(usuario);
      console.log(data)

      return { ok: true, data };
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        "Error al iniciar sesión";

      setErrorsApi(mensaje);
      return { ok: false, mensaje };
    } finally {
      setLoading(false);
    }
  }

  return { useLoginUser, loading, errorsApi };
}

export default useLogin;