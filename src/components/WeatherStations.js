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

const MeasurementRow = ({ label, value }) => (
    <span className="measurement-row">
        <strong className="measurement-label">{label}:</strong>
        <span className="measurement-value">{value}</span>
    </span>
);

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
                    axios.get('/api/weather_stations'),
                    axios.get('/api/variables'),
                    axios.get('/api/all_data'),
                ]);

                setStations(stationsRes.data);
                setVariables(variablesRes.data);
                setDataMap(allDataRes.data);

            } catch (err) {
                //todo
            }
        };

        fetchData();
    }, []);

    //Extract and sort unique states for filtering
    // const allStates = useMemo(() => {
    //     const stateSet = new Set(stations.map(s => s.state));
    //     return Array.from(stateSet).sort();
    // }, [stations]);
    const allStates = [...new Set(stations.map(s=>s.state).sort())];

    // Filter stations by selected state (or show all if none selected)
    // const filteredStations = useMemo(() => {
    //     const result = selectedState
    //         ? stations.filter(s => s.state === selectedState)
    //         : stations;
    //     return result;
    // }, [selectedState, stations]);

    const filteredStations = selectedState? stations.filter(s => s.state === selectedState) : stations;

    const handleMarkerClick = (station) => {
        setSelectedStation(station);
    };
    // Get the latest measurements for a given station
    const getLatestMeasurements = (stationId) => {
        const data = dataMap[stationId];
        if (!data || data.length === 0) return [];

        const latestData = data[data.length - 1];
        const variableArray = variables.filter(v => v.id === stationId);

        const rows = variableArray.map(v => (
            <MeasurementRow 
                key={v.id}
                label={v.long_name}
                value={`${latestData[v.name]} ${v.unit}`}
            />
        ));

        return [{
            timestamp: latestData.timestamp,
            rows: rows
        }];
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
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={6}>
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
                         {/*=== InfoWindow shows when a station marker is selected === */}
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
                                    <div className="station-info">
                                        <MeasurementRow label="ID" value={selectedStation.id} />
                                        <MeasurementRow label="Site" value={selectedStation.site} />
                                        <MeasurementRow label="Portfolio" value={selectedStation.portfolio} />
                                        <MeasurementRow label="State" value={selectedStation.state} />
                                    </div>
                                    <h2>Latest Measurements</h2>
                                    <ul>
                                        {getLatestMeasurements(selectedStation.id).map((m,index) => (
                                            <li key={index}>
                                                <span>{m.timestamp}</span>
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
