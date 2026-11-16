import "../FieldsMessage/styleFieldError.css";

function FieldError({ error, className = "", existError }) {
    return (
        <span className={`${className} input__error text-red-500 transition-all duration-500 text-[12px] block `}>
            {error}
        </span>
    )
}

export default FieldError