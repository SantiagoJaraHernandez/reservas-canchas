function ErrorState({ message = "Ocurrió un error" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="material-symbols-outlined text-5xl text-red-400">
        error
      </span>

      <p className="mt-4 text-red-500 font-medium">{message}</p>
    </div>
  );
}

export default ErrorState;