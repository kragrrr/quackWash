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

const validRoutes = ["9", "9N", "55A", "55C"];

Promise.all([fetchStop('2500354'), fetchStop('2500122'), fetchStop('250010'), fetchStop('250019')]).then(results => {
    results.forEach((r, i) => {
        const stopId = ['2500354', '2500122', '250010', '250019'][i];
        const stops = (r.stopEvents || []).filter(e => validRoutes.includes(e.transportation.number));
        console.log(`Stop ${stopId}:`, stops.map(s => s.transportation.number + ' ' + s.transportation.destination.name));
    });
    
});
