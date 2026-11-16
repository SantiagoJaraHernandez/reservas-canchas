import InputForm from "../inputs/InputForm";
import Icon from "../../ui/Icon";
import Titulo from "../texts/Title";
import SubTitulo from "../texts/SubTitle";
import BtnAggReserva from "../Botones/ButtonReservation";
import FieldError from "../FieldsMessage/FieldError";
import "../FieldsMessage/styleFieldError.css"



function FormAuth({ title, subTtitle, fields, terms, className = "", textButton, actionButton, actionLink, onSubmitAuth, onChange, heyError, errors }) {


    return (
        <form action="" onSubmit={onSubmitAuth} className={`flex flex-col bg-white max-w-100 w-full px-8 py-4 rounded-2xl shadow-sm shadow-primary/80 gap-10 relative overflow-hidden ${className}`}>
            <div className="clip-top bg-primary h-100 w-full absolute inset-0 "></div>
            <div className="text-center flex flex-col z-10">
                <Icon name={"sports_soccer"} className="font-bold text-white" />
                <Titulo titulo={title} className="text-3xl font-bold text-white" />
                <SubTitulo subTitle={subTtitle} className="text-sm text-slate-200" />
            </div>
            <div className="flex flex-col gap-3">
                {fields.map((input) => (
                    <>
                        <InputForm
                            id={input.name}
                            texto={input.label}
                            placeholder={input.placeholder}
                            icono={input.icono}
                            type={input.type}
                            onChange={(e) => onChange(input.name, e.target.value)}
                            styleContentInput={`${heyError ? "outline-2 outline-yellow-500" : "outline-0.5 outline-primary"}`}
                            styleLabel="text-white"
                        />
                        {heyError && (
                            <FieldError className="text-yellow-500 font-bold" error={errors[input.name]} />
                        )}
                    </>
                ))}
                <div className="flex text-[12px] py-2 gap-2">
                    {terms === "register" && (
                        <p className="text-slate-50">Acepto los <span className="text-primary font-bold border-b cursor-pointer"> Términos de Servicio</span>y la <span className="text-primary font-bold border-b cursor-pointer"> Política de Privacidad</span> e SoccerField Manager.</p>
                    )}
                    {terms === "login" && (
                        <p className="text-slate-50">¿No tienes Cuenta? <span className="text-primary font-bold border-b cursor-pointer" onClick={actionLink}>Crea Una Cuenta</span></p>
                    )}
                </div>
            </div>
            <div className="flex flex-col font-bold gap-1 items-center">
                <BtnAggReserva className="flex w-full items-center justify-center"
                    icono={"arrow_forward"}
                    texto={textButton}
                    accion={actionButton}
                />
                <div className="flex-1">
                    {terms === "register" && (
                        <p className="text-slate-50 flex-1 text-[12px] ">¿Ya tengo una cuenta? <span className="text-primary font-bold cursor-pointer border-b" onClick={actionLink}>Inicia sesión</span></p>
                    )}
                </div>
            </div>
        </form>
    )
}
export default FormAuth;
