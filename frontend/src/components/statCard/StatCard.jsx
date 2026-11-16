import Icon from "../../ui/Icon";
function StatCard({ icono, title, valor }) {
    return (
        <div className="flex shadow-card bg-white gap-2 rounded-card p-5 items-center px-4 ">
            <div className="bg-primary/15  h-15 w-15 rounded-[100%] flex items-center justify-center">
                <Icon name={icono}
                    className="text-primary text-[40px]" />
            </div>
            <div className="">
                <p className="text-sm text-slate-500">{title}</p>
                <p className="text-3xl font-bold">{valor}</p>
            </div>
        </div>
    )
}
export default StatCard;