export interface ShuttleDeparture {
    id: string;
    route: string;
    destination: string;
    countdownMinutes: number;
    departureTime: Date;
}

export const fetchShuttleTimes = async (stopIdOrIds: string | string[] = "2500122"): Promise<ShuttleDeparture[]> => {
    const apiKey = import.meta.env.VITE_TFNSW_API_KEY;

    if (!apiKey) {
        console.warn("No VITE_TFNSW_API_KEY found, using mock shuttle data.");
        return getMockShuttleData();
    }

    if (Array.isArray(stopIdOrIds)) {
        try {
            const allDeparturesPromises = stopIdOrIds.map(id => fetchSingleStop(id, apiKey));
            const allDeparturesNested = await Promise.all(allDeparturesPromises);
            
            // Flatten, sort by countdown, and return top 5
            return allDeparturesNested
                .flat()
                // Deduplicate by ID just in case (though different stops should have different UIDs, sometimes transport API returns duplicates across stops)
                .reduce((acc: ShuttleDeparture[], current) => {
                    const x = acc.find(item => item.id === current.id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, [])
                .sort((a, b) => a.countdownMinutes - b.countdownMinutes)
                .slice(0, 5);
        } catch (error) {
            console.error("Failed to fetch multiple shuttle data:", error);
            return [];
        }
    } else {
        return fetchSingleStop(stopIdOrIds, apiKey);
    }
};

const fetchSingleStop = async (stopId: string, apiKey: string): Promise<ShuttleDeparture[]> => {
    try {
        // Stop assignments:
        //   To UOW (North Wollongong):
        //     2500122 = NW Station, Porter St — serves 9, 9N; 55C passes through on weekends
        //   From UOW:
        //     250019  = UOW Northfields Ave, Stand A — serves 9, 9N
        //     2500354 = UOW Northfields Ave, Stand D — serves 55A (loop via Gwynneville)
        //     2500355 = UOW Northfields Ave, Stand C — serves 55C (loop via Fairy Meadow)
        const apiUrl = `/api/tfnsw/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&mode=direct&type_dm=stop&name_dm=${stopId}&departureMonitorMacro=true&TfNSWTR=true&version=10.2.1.42`;

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `apikey ${apiKey}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`Transport API returned ${response.status}: ${response.statusText}. Assuming no shuttles.`);
            return [];
        }

        const data = await response.json();
        const stopEvents = data.stopEvents || [];

        const now = new Date();
        const todayDateStr = now.toDateString();
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;

        // 55A and 55C (Gong Shuttle) only run on weekends for our purposes
        const validRoutes = isWeekend ? ["9", "9N", "55A", "55C"] : ["9", "9N"];

        // 55A passes through NW Station heading AWAY from UOW — exclude it from "To UOW"
        const toUowStops = ["2500122"];

        const departures: ShuttleDeparture[] = stopEvents
            .filter((event: any) => {
                const routeNumber = event.transportation.number;
                if (!validRoutes.includes(routeNumber)) return false;

                // 55A at NW Station is heading away from UOW (anticlockwise loop), not useful for "To UOW"
                if (isWeekend && toUowStops.includes(stopId) && routeNumber === "55A") return false;

                // Skip departures that are on a different calendar day (next-day timetable entries)
                const departureTime = new Date(event.departureTimeEstimated || event.departureTimePlanned);
                if (departureTime.toDateString() !== todayDateStr) return false;

                return true;
            })
            .map((event: any) => {
                const departureTime = new Date(event.departureTimeEstimated || event.departureTimePlanned);
                const diffMs = departureTime.getTime() - now.getTime();
                const countdownMinutes = Math.max(0, Math.floor(diffMs / 60000));

                const tripId = event.properties?.RealtimeTripId || event.properties?.AVMSTripID || `${event.transportation.number}_${event.departureTimePlanned}`;

                return {
                    id: tripId,
                    route: event.transportation.number,
                    destination: event.transportation.destination.name,
                    countdownMinutes,
                    departureTime,
                };
            })
            .filter((dep: ShuttleDeparture) => dep.countdownMinutes >= 0)
            .sort((a: ShuttleDeparture, b: ShuttleDeparture) => a.countdownMinutes - b.countdownMinutes)
            .slice(0, 5);

        return departures;

    } catch (error) {
        console.error("Failed to fetch shuttle data:", error);

        if (apiKey) {
            return [];
        }

        return getMockShuttleData();
    }
};

const getMockShuttleData = (): ShuttleDeparture[] => {
    // Mock data mimicking the requested screenshot layout: 3, 20, 30 min
    const now = new Date();
    return [
        { id: "mock_1", route: "9", destination: "UOW", countdownMinutes: 3, departureTime: new Date(now.getTime() + 3 * 60000) },
        { id: "mock_2", route: "9", destination: "UOW", countdownMinutes: 20, departureTime: new Date(now.getTime() + 20 * 60000) },
        { id: "mock_3", route: "9N", destination: "UOW", countdownMinutes: 30, departureTime: new Date(now.getTime() + 30 * 60000) },
    ];
};
