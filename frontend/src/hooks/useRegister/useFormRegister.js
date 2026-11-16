import { useState } from "react";


function useFormRegister(onSubmitRegister) {

    const [dataSent, setDataSent] = useState({
        nombre: "", email: "", password: ""
    });
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState({});
    const [heyErrors, setHeyErrors] = useState(false);

    function validateFields() {
        const { nombre, email, password } = dataSent;
        const errorsFields = {};
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

        if (!nombre) errorsFields.nombre = "This field is required";
            if (!email) errorsFields.email = "This field is required";
        if (!password) {
            errorsFields.password = "This field is required";
        } else if (password.length < 8 || !regex.test(password)) {
            errorsFields.password = "Password must be least 8 characters, including uppercase, lowercase, number and special character";
        }

        return errorsFields;
    };

    function handleChange(campo, valor) {
        setDataSent((prev) => ({ ...prev, [campo]: valor }));
        setErrors((prev) => ({ ...prev, [campo]: "" }))
    };

    async function handleSubmit(e) {
        e.preventDefault();

        const errorsFound = validateFields();

        if (Object.keys(errorsFound).length > 0) {
            setErrors(errorsFound);
            setHeyErrors(true);
            return { ok: false };
        };

        setSending(true);
        const response = await onSubmitRegister(dataSent);
        setSending(false);

        if (!response.ok) {
            setErrors((prev) => ({ ...prev, mensaje: response.mensaje }));
            setHeyErrors(true);
            return { ok: false };
        };
        return response;
    };

    return { handleChange, handleSubmit, sending, errors, heyErrors };
};

export default useFormRegister;
