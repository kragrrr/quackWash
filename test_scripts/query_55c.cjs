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
Promise.all(['250019', '2500354'].map(fetchStop)).then(res => {
    let allFromUOW = [];
    res.forEach((r, i) => {
        const stopId = ['250019', '2500354'][i];
        if (r.stopEvents) {
            allFromUOW = allFromUOW.concat(r.stopEvents);
        }
    });

    const route55C = allFromUOW.filter(e => e.transportation.number === '55C');
    console.log(`Found ${route55C.length} 55C buses leaving From UOW (Stops 250019 & 2500354)`);
    if(route55C.length > 0) {
        console.log("Next 3 buses:");
        route55C.slice(0, 3).forEach(b => {
             const departureTime = new Date(b.departureTimeEstimated || b.departureTimePlanned);
             const now = new Date();
             const diffMs = departureTime.getTime() - now.getTime();
             const m = Math.max(0, Math.floor(diffMs / 60000));
             console.log(`- 55C ${b.transportation.destination.name} - ${m} mins away - (Stop: ${b.location.id})`);
        });
    }
});
