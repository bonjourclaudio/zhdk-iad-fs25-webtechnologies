let connectionContainer; // Global variable to hold the current connection data

/**
 * Station Class
 * Represents a train station with a name and coordinates.
 */
class Station {
  name;
  lat;
  lon;
}

/**
 * Connection Class
 * Represents a connection between multiple stations.
 * The first station in the array is the departure station
 */
class Connection {
  stations = [];

  constructor() {}

  addStation(station) {
    if (station instanceof Station) {
      this.stations.push(station);
    } else {
      console.error("Invalid station object");
    }
  }
}

/**
 * Fetches connections for a given station name.
 * @param {string} stationName - The name of the station to fetch connections for.
 */
async function fetchConnections(stationName) {
  toggleLoading(true);

  try {
    // Fetch coordinates for the given station name
    const stationCoords = await fetchStationCoordinates(stationName);
    if (!stationCoords) {
      console.error("Station coordinates not found.");
      toggleLoading(false);
      return;
    }

    const departureStation = new Station();
    departureStation.name = stationName;
    departureStation.lat = stationCoords.lat;
    departureStation.lon = stationCoords.lon;

    /**
     * Fetch stationboard for the given station
     */
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(
      stationName
    )}&limit=20`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || !data.stationboard) {
      console.error("No stationboard data found.");
      toggleLoading(false);
      return;
    } else {
      connectionContainer = new Connection();
      connectionContainer.addStation(departureStation);

      // -> Retrieve coordinates for each destination station
      data.stationboard.forEach((entry) => {
        if (entry) {
          let coords = fetchStationCoordinates(entry.to);

          coords = coords.then((coords) => {
            if (!coords) {
              console.error("Coordinates for station not found:", entry.to);
              toggleLoading(false);
              return null;
            }

            let destinationStation = new Station();
            destinationStation.name = entry.to;
            destinationStation.lat = coords.lat;
            destinationStation.lon = coords.lon;

            connectionContainer.addStation(destinationStation);
          });
        }
      });
    }

    // Toggle p5 sound output
    playNextTrack();
  } catch (error) {
    console.error("Error fetching transport data:", error);
  } finally {
    toggleLoading(false);
    displayInfo();
    console.log("connection container", connectionContainer);
  }
}

/**
 * Fetches coordinates for a given station name.
 * Returns an object with latitude and longitude.
 * @param {string} stationName - The name of the station to fetch coordinates for.
 * @returns {Promise<{lat: number, lon: number}>} - An object containing latitude and longitude.
 */
async function fetchStationCoordinates(stationName) {
  const url = `https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(
    stationName
  )}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (
      data.stations &&
      data.stations.length > 0 &&
      data.stations[0].coordinate
    ) {
      return {
        lat: data.stations[0].coordinate.x,
        lon: data.stations[0].coordinate.y,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching station coordinates:", error);
    return null;
  }
}
