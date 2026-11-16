function SubTitulo ({subTitle, className = ""}) {
    return(
        <h3 className={`${className}`}>
            {subTitle}
        </h3>
    )
}
export default SubTitulo;