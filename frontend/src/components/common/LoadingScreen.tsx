export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm font-medium">
          Cargando...
        </p>
      </div>
    </div>
  );
}
