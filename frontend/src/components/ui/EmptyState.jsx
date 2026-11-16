function EmptyState({ text = "No hay datos disponibles" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="material-symbols-outlined text-5xl text-slate-300">
        event_busy
      </span>

      <p className="mt-4 text-slate-500">{text}</p>
    </div>
  );
}

export default EmptyState;