export function StyleSelector({selectedStyle, onStyleSelect}) {
    const styles = [
        { value: 'manga', label: 'Manga Style', description: 'Bold, clean lines' },
        { value: 'sketch', label: 'Sketch Style', description: 'Hand-drawn look' }
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