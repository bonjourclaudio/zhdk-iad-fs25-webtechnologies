/**
 * Global Connection Variable
 * Holds a connection from a departure station to multiple destination stations.
 */
let connectionContainer;

class Station {
  name;
  lat;
  lon;
}

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
 */
async function fetchConnections(stationName) {
  toggleLoading(true);

  try {
    // Fetch station coordinates (optional → if you don't need distance, you can skip this)
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

      // Process each entry in the stationboard
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

    playNextTrack();
  } catch (error) {
    console.error("Error fetching transport data:", error);
  } finally {
    toggleLoading(false);
    console.log("connection container", connectionContainer);
  }
}

/**
 * Fetches coordinates for a given station name.
 * Returns an object with latitude and longitude.
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

/**
 * Computes the distance between two Stations using the Haversine formula.
 * Return the distance in kilometers.
 */
function computeDistance(station1, station2) {
  if (station1 instanceof Station && station2 instanceof Station) {
    const R = 6371; // Earth's radius in kilometers

    const dLat = radians(station2.lat - station1.lat);
    const dLon = radians(station2.lon - station1.lon);

    const a =
      sin(dLat / 2) * sin(dLat / 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon / 2) * sin(dLon / 2);

    const c = 2 * atan2(sqrt(a), sqrt(1 - a));

    const distance = R * c; // Distance in km
    return distance;
  } else {
    console.error("Invalid station objects provided for distance calculation.");
    return null;
  }
}

/**
 * Toggles the visibility of the loading indicator.
 */
function toggleLoading(status) {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.style.display = status ? "block" : "none";
  }
}
