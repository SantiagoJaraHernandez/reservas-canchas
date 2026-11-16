function LinkNav({ texto, enlace, accion }) {
    return (
        <a href={enlace} onClick={accion} className="link__nav hover:text-primary active:text-primary transition-all duration-150">
            {texto}
        </a>
    )
}
export default LinkNav;