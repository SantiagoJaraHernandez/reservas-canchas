
function StatusBadges({ status }) {
    const statusStyles = {
        Pagado: "bg-green-100 text-green-700",
        Pendiente: "bg-orange-100 text-orange-700",
        Cancelado: "bg-red-100 text-red-700"

    }
    return (
        <span className={`${statusStyles[status]} rounded-xl p-1`}>
            {status}
        </span>
    )
}
export default StatusBadges;