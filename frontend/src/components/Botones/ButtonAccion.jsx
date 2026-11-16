import Icon from "../../ui/Icon";
function BtnAccion({accion, icono, className = "", texto, type}) {
    return(
        <button className={`${className} cursor-pointer `} type={type} onClick={accion}>
            <Icon name={icono}/>
            {texto}
        </button>
    )
}
export default BtnAccion;