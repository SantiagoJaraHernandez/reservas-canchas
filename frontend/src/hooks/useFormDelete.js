import { useState } from "react";

export function useFormDelete(reserva, onSubmitReserva) {
    const [enviando, setEnviado] = useState(false);
    const [errorApi, setErrorApi] = useState("");

    async function handleDelete(e) {
        e.preventDefault();
        setErrorApi("");

        if (!reserva?.id) {
            setErrorApi("No se encontró la reserva a eliminar");
            return {ok: false};
        }

        setEnviado(true);
        const resultado = await onSubmitReserva(reserva.id)
        setEnviado(false);

        if (resultado.ok) {
            setErrorApi(resultado.mensaje)
        } 
        return resultado
    }
    return { enviando, errorApi, handleDelete }
}