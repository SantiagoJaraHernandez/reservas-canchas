import Icon from "../../ui/Icon";
import BtnAccion from "../Botones/ButtonAccion";
import BtnAggReserva from "../Botones/ButtonReservation";


function ModalConfirmacion({ icono, title, subTitle, accion, textoBtn, accionTwo, textoBtnTwo, iconoBtn, containerIcono, styleIcono, open, styleBtn, styleBg }) {

    return (
        <div className={`bg-black/30 fixed w-full  h-full inset-0 flex items-center justify-center transition-all duration-500 
        ${open ? "opacity-100 z-50": "opacity-0 pointer-events-none"}`}>
            <div className="bg-bg-app flex flex-col items-center gap-6 px-10 py-10 justify-center  rounded-2xl max-h-125 max-w-100 relative overflow-hidden">
                <div className={`${containerIcono} flex items-center justify-center rounded-full h-25 w-25 `}>
                    <Icon name={icono} className={`${styleIcono} h-20 w-20 flex items-center justify-center rounded-full text-[40px] `} />
                </div>
                <div className="text-center flex flex-col gap-2">
                    <h2 className="font-bold text-2xl">{title}</h2>
                    <p className="text-slate-400 text-base">{subTitle}</p>
                </div>

                <BtnAggReserva texto={textoBtn} accion={accion} icono={iconoBtn} className={`${styleBtn} w-[80%] text-white font-bold rounded-2xl`} styleText={"text-[17px]"}/>
                <BtnAccion accion={accionTwo} texto={textoBtnTwo} className="hover:bg-gray-200 w-[80%] rounded-2xl py-2 text-center"  />
                <span className={`${styleBg} absolute h-2 w-full bottom-0 `}></span>
            </div>
        </div>
    )
}
export default ModalConfirmacion;