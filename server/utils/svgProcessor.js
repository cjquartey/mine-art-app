const cheerio = require('cheerio');

function addPathIds(svgString) {
    const $ = cheerio.load(svgString, null, false);
    $('path').each((index, element) => {
        if (!$(element).attr('id')) {
            const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
            $(element).attr('id', `path_${uniqueSuffix}`);
        }
    });
    return $.html()
};

module.exports = addPathIds;