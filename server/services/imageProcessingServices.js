async function processImage(imagePath, style) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockSVG = generateMockSVG(style);
    return mockSVG;
};

function generateMockSVG(style) {
    function getRandomNumber() {
        return Math.floor(Math.random() * 400);
    }

    let pathCount = 0;
    let strokeWidth = 0;

    if (style === 'manga'){
        pathCount = 5;
        strokeWidth = 5;
    }
    else if (style === 'sketch'){
        pathCount = 10;
        strokeWidth = 3;
    }
    else {
        pathCount = 3;
        strokeWidth = 1;
    }

    let paths = '';



    for (let i = 0; i < pathCount; i++) {
        paths += `<path 
            d="M${getRandomNumber()}, ${getRandomNumber()} Q${getRandomNumber()}, ${getRandomNumber()} ${getRandomNumber()}, ${getRandomNumber()}" 
            stroke-width="${strokeWidth}" 
            stroke="black"
            fill="none"/>\n`
    }

    return `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`
}

module.exports = processImage;