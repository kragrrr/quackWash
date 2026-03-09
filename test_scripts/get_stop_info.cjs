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
Promise.all(['250010', '2500122', '250019', '2500354'].map(fetchStop)).then(res => {
    res.forEach((r, i) => {
        const reqId = ['250010', '2500122', '250019', '2500354'][i];
        if (r.stopEvents && r.stopEvents.length > 0) {
            console.log(`Req ${reqId} returns first event location:`, r.stopEvents[0].location.id, r.stopEvents[0].location.name);
        } else {
            console.log(`Req ${reqId} returned no events`);
        }
    });
});
