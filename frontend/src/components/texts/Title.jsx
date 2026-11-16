function Titulo({ titulo, className = "" }) {
    return(
        <h1 className={`${className}`}>
            {titulo}
        </h1>
    )
}
export default Titulo;