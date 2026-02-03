export function UploadProgress({status, progress}) {
    return(
        status === "uploading" ? (
            <div 
                className="radial-progress text-secondary" 
                style={{"--value":progress}} 
                aria-valuenow={progress} 
                role="progressbar"
            >
                {progress}%
            </div>
        ) : (
            <div>
                <span className="loading loading-spinner loading-xl text-secondary"></span>
                Processing...
            </div>
        )
    )
}