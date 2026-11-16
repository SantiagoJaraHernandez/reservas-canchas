import Icon from "../../ui/Icon";
function InputForm({ type, placeholder, texto, className = "", icono, valor, readOnly = false, onChange, id, styleInput = "", styleContentInput = "", styleLabel="" }) {
    return (
        <div className={`${className} flex flex-col transition-all duration-300 gap-1`}>
            <label htmlFor={id} className={`${styleLabel} text-slate-700`}>{texto}</label>
            <div className={`${styleContentInput} flex items-center w-full gap-2 px-1 bg-slate-100 rounded-card focus-within:outline-2 focus-within:outline-primary `} >
                <Icon name={icono} />
                <input type={type} placeholder={placeholder} className={`${styleInput} p-2.5 w-full outline-0`} value={valor} readOnly={readOnly} onChange={onChange} />
            </div>
        </div>
    )
}
export default InputForm;