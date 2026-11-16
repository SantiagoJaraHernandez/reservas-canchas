import Icon from "../../ui/Icon";
function BtnAggReserva({type, texto, accion, icono, className = "", styleText, img, alt }) {
    return (
        <button className={`${className} bg-primary rounded-card h-15 w-15 text-sm font-mediun cursor-pointer flex items-center gap-2 justify-center capitalize sm:px-1 transition-all duration-300 border-2 border-primaryDeg
        `} onClick={accion} type={type}>
            <Icon
            name={icono}/>
            <p className={`${styleText} sm:flex`}>{texto}</p>
        </button>
    )
}
export default BtnAggReserva;