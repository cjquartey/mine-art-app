const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function ZoomSlider({zoom, onZoomChange}) {
    // Convert zoom (0.1-5) to slider value (0-100)
    const sliderValue = ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100;

    const handleChange = (e) => {
        // Convert slider value (0-100) to zoom (0.1-5)
        const value = parseFloat(e.target.value);
        const newZoom = MIN_ZOOM + (value / 100) * (MAX_ZOOM - MIN_ZOOM);
        onZoomChange(newZoom);
    };

    return (
        <div className="flex items-center gap-2 ml-auto mr-4">
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <input
                type="range"
                min={0}
                max={100}
                value={sliderValue}
                onChange={handleChange}
                className="range range-neutral range-xs w-32"
            />
        </div>
    )
}