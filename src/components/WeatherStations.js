"use client";
import axios from 'axios';
import { useEffect,useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

// Google Map container style
const containerStyle = {
    width: '100%',
    height: '100vh',
};
// Initial center of the map (Australia)
const center = {
    lat: -30.0,
    lng: 135.0,
};

export default function WeatherStations() {

    const [stations, setStations] = useState([]);
    const [variables, setVariables] = useState([]);
    const [dataMap, setDataMap] = useState({});

    // Currently selected station and state
    const [selectedStation, setSelectedStation] = useState(null);
    const [selectedState, setSelectedState] = useState(null);

    // Use Promise.all to fetch multiple JSON files
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stationsRes, variablesRes, allDataRes] = await Promise.all([
                    axios.get('/api/weather_stations.json'),
                    axios.get('/api/variables.json'),
                    axios.get('/api/all_data.json'),
                ]);

                setStations(stationsRes.data);
                setVariables(variablesRes.data);
                setDataMap(allDataRes.data); // object: { 1: [...], 2: [...], ..., }

            } catch (err) {
                //todo
            }
        };

        fetchData();
    }, []);

    // Extract and sort unique states for filtering
    const allStates = useMemo(() => {
        const stateSet = new Set(stations.map(s => s.state));
        return Array.from(stateSet).sort();
    }, [stations]);

    // Filter stations by selected state (or show all if none selected)
    const filteredStations = useMemo(() => {
        const result = selectedState
            ? stations.filter(s => s.state === selectedState)
            : stations;
        return result;
    }, [selectedState, stations]);

    const handleMarkerClick = (station) => {
        setSelectedStation(station);
    };
    // Get the latest measurements for a given station
    const getLatestMeasurements = (stationId) => {
        const data = dataMap[stationId];
        if (!data) return [];

        const latest = {};
        // Loop through data to find latest record for each var
        for (const item of data) {
            const { var_id, timestamp, value } = item;
            if (!latest[var_id] || new Date(timestamp) > new Date(latest[var_id].timestamp)) {
                latest[var_id] = { timestamp, value };
            }
        }
        // Format data into displayable rows
        return Object.entries(latest).map(([var_id, { timestamp, value }]) => {

            // link stationId with variables
            const variableArray = variables.filter(v => v.id === stationId);
            const latest_m_data = data[data.length-1];// Get last data entry

            let rows = [];
            // format display text
            variableArray.forEach(v => {
                rows.push(
                    <span key={v.id}>
                        <strong>{v.long_name}:</strong> {latest_m_data[v.name]} ({v.unit})
                    </span>
                );
            })

            const result = {
                var_id,
                timestamp,
                rows: rows
            };
            return result;
        });
    };

    return (
        <div className="container" >
            {/* sidebar section */}
            <div className="sidebar">
                <h3>Filter by State</h3>
                <ul>
                    <li
                        onClick={() => setSelectedState(null)}
                        style={{ cursor: 'pointer', marginBottom: '16px', fontWeight: selectedState === null ? 'bold' : 'normal' }}
                    >
                        All States
                    </li>
                    {allStates.map(state => (
                        <li
                            key={state}
                            onClick={() => setSelectedState(state)}
                            style={{
                                cursor: 'pointer',
                                marginBottom: '8px',
                                fontWeight: selectedState === state ? 'bold' : 'normal',
                            }}
                        >
                            {state}
                        </li>
                    ))}
                </ul>
            </div>

            {/* map section */}
            <div className="map-container" >
                <LoadScript googleMapsApiKey="AIzaSyBDuyDxfkI_aGmikAjb01wEm3eNfYIghcs">
                    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={5}>
                        {filteredStations.map(station => (
                            <Marker
                                key={station.id}
                                position={{
                                    lat: Number(station.latitude),
                                    lng: Number(station.longitude),
                                }}
                                onClick={() => handleMarkerClick(station)}
                            />
                        ))}
                        {/* === InfoWindow shows when a station marker is selected === */}
                        {selectedStation && (
                            <InfoWindow
                                position={{
                                    lat: Number(selectedStation.latitude),
                                    lng: Number(selectedStation.longitude),
                                }}
                                onCloseClick={() => setSelectedStation(null)}
                            >
                                <div className="info-window" >
                                    <h2>{selectedStation.ws_name}</h2>
                                    <p>
                                        <strong>ID:</strong> {selectedStation.id}<br />
                                        <strong>Site:</strong> {selectedStation.site}<br />
                                        <strong>Portfolio:</strong> {selectedStation.portfolio}<br />
                                        <strong>State:</strong> {selectedStation.state}<br />
                                    </p>
                                    <h2>Latest Measurements:</h2>
                                    <ul  >
                                        {getLatestMeasurements(selectedStation.id).map((m,index) => (
                                            <li  key={index}>
                                                {m.timestamp}<br />
                                                {m.rows.map((row, idx) => (
                                                    <p key={idx}>{row}</p>
                                                ))}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                </LoadScript>
            </div>
        </div>
    );
}
