export function LoadingSpinner({message}) {
    return(
        <div className="flex flex-col justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            {message && (
            <p className="mt-4 text-blue-500 font-medium animate-pulse">
                {message}
            </p>
            )}
        </div>
    )
}