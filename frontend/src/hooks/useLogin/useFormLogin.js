import { useState } from "react";



function useFormLogin(onSubmitLogin) {
    
    const [sendDateLogin, setSendData] = useState({
        email: "", password: ""
    });

    const [errorsLogin, setErrors] = useState({});
    const [sendingLogin, setSending] = useState(false);
    const [heyErrosLogin, setHeyErros] = useState(false);

    function validateField() {
        const errorsFound = {};
        const { email, password } = sendDateLogin;
        if (!email) errorsFound.email = "Credential Error";
        if (!password) errorsFound.password = "Credential Error";
        return errorsFound;
    }

    function handleChangeLogin(campo, valor) {
        setSendData((prev) => ({ ...prev, [campo]: valor }));
        setErrors((prev) => ({ ...prev, [campo]: "" }));
    };

    async function handleSubmitLogin(e) {
        e.preventDefault();

        const ErrorField = validateField();
        if (Object.keys(ErrorField).length > 0) {
            setErrors(ErrorField);
            setHeyErros(true);
            return { ok: false };
        }

        setSending(true);
        const result = await onSubmitLogin(sendDateLogin);
        setSending(false);

        if (!result.ok) {
            setErrors((prev) => ({ ...prev, mensaje: result.mensaje }));
            setHeyErros(true);
            return { ok: false }
        };
        return result;
    }
    return { handleChangeLogin, handleSubmitLogin, sendDateLogin, sendingLogin, errorsLogin, heyErrosLogin }
}

export default useFormLogin;