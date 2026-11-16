function Loader({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-10 h-10 border-4 border-slate-300 border-t-primary rounded-full animate-spin" />
      <p className="mt-4 text-slate-500 text-sm">{text}</p>
    </div>
  );
}

export default Loader;