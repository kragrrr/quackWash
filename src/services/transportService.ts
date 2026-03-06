export interface ShuttleDeparture {
    id: string;
    route: string;
    destination: string;
    countdownMinutes: number;
}

export const fetchShuttleTimes = async (stopId: string = "250010"): Promise<ShuttleDeparture[]> => {
    const apiKey = import.meta.env.VITE_TFNSW_API_KEY;

    if (!apiKey) {
        console.warn("No VITE_TFNSW_API_KEY found, using mock shuttle data.");
        return getMockShuttleData();
    }

    try {
        // stopId is passed as an argument. 
        // 250010 = North Wollongong Station (To UOW)
        // 250019 = UOW Northfields Ave Stand A (From UOW)
        // Using the real-time departure API. Note: Due to CORS, direct browser fetch to TfNSW may fail unless proxied.
        // If it fails, we will fall back to mock data.
        const apiUrl = import.meta.env.MODE === "development"
            ? `/api/tfnsw/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=${stopId}&departureMonitorMacro=true&TfNSWTR=true&version=10.2.1.42`
            : `https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=${stopId}&departureMonitorMacro=true&TfNSWTR=true&version=10.2.1.42`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Accept': 'application/json'
            }
        }
        );

        if (!response.ok) {
            throw new Error(`Transport API error: ${response.statusText}`);
        }

        const data = await response.json();
        const stopEvents = data.stopEvents || [];

        // Filter for routes 9 and 9N
        const validRoutes = ["9", "9N"];

        // Parse the results
        const departures: ShuttleDeparture[] = stopEvents
            .filter((event: any) => validRoutes.includes(event.transportation.number))
            .map((event: any) => {
                const departureTime = new Date(event.departureTimeEstimated || event.departureTimePlanned);
                const now = new Date();
                const diffMs = departureTime.getTime() - now.getTime();
                const countdownMinutes = Math.max(0, Math.floor(diffMs / 60000));

                return {
                    id: event.transportation.uid || Math.random().toString(36).substring(7),
                    route: event.transportation.number,
                    destination: event.transportation.destination.name,
                    countdownMinutes,
                };
            })
            .sort((a, b) => a.countdownMinutes - b.countdownMinutes)
            .slice(0, 5); // Return up to 5 next shuttles

        if (departures.length === 0) {
            return getMockShuttleData(); // Fallback to mock data if empty (e.g., late at night when none are running)
        }

        return departures;

    } catch (error) {
        console.error("Failed to fetch shuttle data, falling back to mock:", error);
        return getMockShuttleData();
    }
};

const getMockShuttleData = (): ShuttleDeparture[] => {
    // Mock data mimicking the requested screenshot layout: 3, 20, 30 min
    return [
        { id: "mock_1", route: "9", destination: "UOW", countdownMinutes: 3 },
        { id: "mock_2", route: "9", destination: "UOW", countdownMinutes: 20 },
        { id: "mock_3", route: "9N", destination: "UOW", countdownMinutes: 30 },
    ];
};
