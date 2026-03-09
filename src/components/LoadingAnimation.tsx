
export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Spinner Animation */}
      <div className="relative h-32 w-32 mb-4 flex items-center justify-center">
        <span className="absolute inline-block h-28 w-28 rounded-full border-8 border-t-blue-500 border-b-blue-300 border-l-transparent border-r-transparent animate-spin"></span>
        <span className="absolute inline-block h-20 w-20 rounded-full border-4 border-blue-100"></span>
        <span className="absolute inline-block h-8 w-8 rounded-full bg-blue-400 opacity-80 animate-pulse"></span>
      </div>
      <h2 className="text-center text-xl font-semibold text-blue-700">Loading...</h2>
      <p className="w-1/3 text-center text-slate-500">
        Please wait.
      </p>
    </div>
  );
}
