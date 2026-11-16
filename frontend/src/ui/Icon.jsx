function Icon({name, className = "", accion}){
    return(
        <span className={` ${className} font-icon select-none text-[25px]`} onClick={accion}>
            {name}
        </span>
    )
}
export default Icon;