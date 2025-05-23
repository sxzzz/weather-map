import path from 'path';
import { promises as fs } from 'fs';

export default async function handler(req, res) {
    const filePath = path.join(process.cwd(), 'data', 'weather_stations.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    res.status(200).json(JSON.parse(fileContents));
}