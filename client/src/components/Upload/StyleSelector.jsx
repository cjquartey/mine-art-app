export function StyleSelector({selectedStyle, onStyleSelect}) {
    const styles = [
        { value: 'anime', label: 'Anime Style', description: 'Bold, clean lines' },
        { value: 'contour', label: 'Contour Style', description: 'Hand-drawn look' }
    ];

    return(
        <div>
            {styles.map((style, index) => {
                return (
                    <label key={index}>
                        <input 
                            type="radio"
                            name="style"
                            value={style.value}
                            checked={selectedStyle === style.value}
                            onChange={() => onStyleSelect(style.value)}
                            className="radio radio-secondary"
                        />
                        {style.label}
                        <p>{style.description}</p>
                    </label>
                )
            })}
        </div>
    );
}