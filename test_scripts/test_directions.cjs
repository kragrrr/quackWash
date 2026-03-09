const https = require('https');
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJyalVEQ2hIZUR3SmZXWnhtNjVURVpKamxGeEVTRkkwbkNheV9GNllCVmFVIiwiaWF0IjoxNzcyNzU4Mjg3fQ.00A5GWScJIUeulWW_J60OUwfE4zYRCzoK4t2raZcT2Q';

function fetchStop(stopId) {
    return new Promise((resolve, reject) => {
        const url = `https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=${stopId}&departureMonitorMacro=true&TfNSWTR=true&version=10.2.1.42`;
        https.get(url, { headers: { 'Authorization': `apikey ${API_KEY}` } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}
Promise.all(['2500354'].map(fetchStop)).then(res => {
    let allEvents = res[0].stopEvents || [];
    
    console.log("Found departures from 2500354 (UOW Northfields Ave):");
    let count = 0;
    allEvents.forEach(e => {
        if (["9", "9N", "55A", "55C"].includes(e.transportation.number)) {
            const departureTime = new Date(e.departureTimeEstimated || e.departureTimePlanned);
            const now = new Date();
            const diffMs = departureTime.getTime() - now.getTime();
            const m = Math.max(0, Math.floor(diffMs / 60000));
            console.log(`- ${e.transportation.number} to ${e.transportation.destination.name} - ${m} mins away`);
            count++;
        }
    });
    if (count === 0) console.log("No valid buses found.");
});
