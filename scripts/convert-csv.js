const fs = require('fs');
const path = require('path');
const csv = require('csvtojson');

// CSV input
const csvFiles = [
    'weather_stations.csv',
    'variables.csv',
    'data_1.csv',
    'data_2.csv',
    'data_3.csv',
    'data_4.csv',
    'data_5.csv',
    'data_6.csv',
    'data_7.csv',
    'data_8.csv',
    'data_9.csv',
    'data_10.csv',
];

//  JSON output
const outputDir = path.join(__dirname, '../public/api');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// convert
async function convertAll() {
    for (const file of csvFiles) {
        const inputPath = path.join(__dirname, file);
        const outputPath = path.join(outputDir, file.replace('.csv', '.json'));

        try {
            const jsonArray = await csv().fromFile(inputPath);
            fs.writeFileSync(outputPath, JSON.stringify(jsonArray, null, 2));
            console.log(`✅ Converted: ${file} -> ${outputPath}`);
        } catch (err) {
            console.error(`❌ Failed to convert ${file}:`, err);
        }
    }
}

convertAll();