const https = require('https');

https.get('https://cdn.amcharts.com/lib/5/geodata/region/usa/usaCountiesLow.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const jsonStr = data.replace('window.am5geodata_region_usa_usaCountiesLow = (function () {\nconst map = ', '').replace(/;\n            return map;\n        }\)\(\);/g, '');
        try {
            const parsed = JSON.parse(jsonStr);
            console.log(parsed.features.slice(0, 10).map(f => f.id));
        } catch (e) {
            console.error("Parse failed");
            // print some part of it to debug
            console.log(data.substring(data.length - 200));
        }
    });
});
