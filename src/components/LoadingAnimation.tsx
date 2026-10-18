
export default function LoadingAnimation() {
  return (
    <div role="status" aria-label="Loading page" aria-busy="true" className="fixed inset-0 z-50 flex min-h-dvh flex-col items-center justify-center bg-white">
      {/* Spinner Animation */}
      <div className="relative h-32 w-32 mb-4 flex items-center justify-center">
        <span className="absolute inline-block h-28 w-28 rounded-full border-8 border-t-blue-500 border-b-blue-300 border-l-transparent border-r-transparent animate-spin motion-reduce:animate-none"></span>
        <span className="absolute inline-block h-20 w-20 rounded-full border-4 border-blue-100"></span>
        <span className="absolute inline-block h-8 w-8 rounded-full bg-blue-400 opacity-80 animate-pulse motion-reduce:animate-none"></span>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
