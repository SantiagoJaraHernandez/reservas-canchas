import { useState } from "react";
import { authServices } from "@/features/auth/services/authServices";

function useRegister() {
    const [users, setUsers] = useState([]);
    const [errorsApi, setErrorsApi] = useState(null);
    const [loading, setLoading] = useState(false);

    const { register } = authServices;

    async function registerUser(newUser) {
        try {
            setLoading(true);
            const user = await register(newUser);
            setUsers(user);
            console.log(user)
            return { ok: true }
        } catch (error) {
            console.error("error register", error.response);
            setErrorsApi(error);
            return { ok: false, mensaje: error.response?.data || "Error in the registration" };
        } finally {
            setLoading(false);
        }
    }
    return { registerUser, users, errorsApi, loading };
}

export default useRegister;