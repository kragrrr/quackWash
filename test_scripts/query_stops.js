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

Promise.all([fetchStop('2500354'), fetchStop('2500122')]).then(results => {
    console.log("Stop 2500354 Name:", results[0].locations?.[0]?.name);
    console.log("Stop 2500122 Name:", results[1].locations?.[0]?.name);
});
