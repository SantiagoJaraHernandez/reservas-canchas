import construccionSvg from "../assets/building.svg"
import reloj from "../assets/arena.svg"
function UnderConstruccion() {
    return (
        <section className="min-h-dvh flex flex-col items-center justify-center gap-5 bg-gray-50">
            <figure className="h-1/3 w-1/3">
                <img src={construccionSvg} alt="En Proceso" className="" />
            </figure>
            <h1 className="title__under text-gray-500 text-6xl">En Proceso De Creacción<span className="puntos__move">
                <span>.</span>
                <span>.</span>
                <span>.</span>
            </span></h1>
        </section>
    )
}
export default UnderConstruccion;