
function UserAvatar({usuario, accion}) {

    return(
        <div className="bg-primaryDeg h-10 w-10 rounded-full border-2 border-primary cursor-pointer flex items-center justify-center">
            <p className="uppercase font-bold text-primary flex items-center justify-center" onClick={accion}>{usuario}</p>
        </div>
    )
}
export default UserAvatar;