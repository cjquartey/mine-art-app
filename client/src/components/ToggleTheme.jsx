import {useState, useEffect} from 'react';
import {SunIcon} from '../icons/SunIcon';
import {MoonIcon} from '../icons/MoonIcon';

// A toggle switch for the application's theme that persists the user's preference in localStorage
export function ToggleTheme() {
    // Initialse state from localStorage with light theme as the default
    const [isDark, setIsDark] = useState(() => {
        const savedTheme = JSON.parse(localStorage.getItem('isDark'));
        return savedTheme ? savedTheme : false;
    });

    // Sync theme preference to localStorage and update the document's data-theme attribute
    useEffect(() => {
        localStorage.setItem('isDark', JSON.stringify(isDark));
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'lemonade');
    }, [isDark]);

    return (
        <label className="toggle text-base-content">
            {/*Checkbox that controls the theme state*/}
            <input type="checkbox" checked={isDark} onChange={() => setIsDark(!isDark)} className="theme-controller" />

            {/*Sun icon - displayed then the light theme is active*/}
            <SunIcon />

            {/*Moon icon - displayed then the dark theme is active*/}
            <MoonIcon />
        </label>
    );
}