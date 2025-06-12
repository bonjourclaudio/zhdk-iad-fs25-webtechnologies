let connectionContainer; // Global variable to hold the current connection data

/**
 * Station Class
 * Represents a train station with a name and coordinates.
 */
class Station {
  name;
  lat;
  lon;
  distanceToDeparture = 0;
  stationImageUrl;
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

  getFurthestStation() {
    if (this.stations.length === 0) return null;

    return this.stations.reduce((furthest, current) => {
      return current.distanceToDeparture > furthest.distanceToDeparture
        ? current
        : furthest;
    });
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

    retrieveStationImage(
      latLonToTile(departureStation.lat, departureStation.lon, 18)
    ).then((imageUrl) => {
      departureStation.stationImageUrl = imageUrl;
    });

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

            let distance = haversineDistance(
              departureStation.lat,
              departureStation.lon,
              coords.lat,
              coords.lon
            );

            let destinationStation = new Station();
            destinationStation.name = entry.to;
            destinationStation.lat = coords.lat;
            destinationStation.lon = coords.lon;
            destinationStation.distanceToDeparture = distance;

            connectionContainer.addStation(destinationStation);
          });
        }
      });
    }

    document.querySelector(".visuals").style.visibility = "visible";
    // Toggle p5 sound output
    playNextTrack();
  } catch (error) {
    console.error("Error fetching transport data:", error);
  } finally {
    toggleLoading(false);
    displayInfo();
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

/**
 * (CHAT GPT GENERATED)
 * Calculates the Haversine distance between two geographical points.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} - The distance in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in km
}

/**
 * Autocomplete functionality for the station input field
 */

const stationInput = document.getElementById("stationInput");
const autocompleteList = document.getElementById("autocompleteList");

stationInput.addEventListener("input", async function () {
  const query = this.value.trim();

  if (query.length < 2) {
    autocompleteList.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(
      `https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(
        query
      )}&type=station`
    );
    const data = await response.json();

    autocompleteList.innerHTML = "";

    data.stations.forEach((station) => {
      const item = document.createElement("div");
      item.textContent = station.name;

      item.addEventListener("click", () => {
        stationInput.value = station.name;

        initConnection();

        autocompleteList.innerHTML = "";
      });

      autocompleteList.appendChild(item);
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
  }
});

document.addEventListener("click", function (e) {
  if (e.target !== stationInput) {
    autocompleteList.innerHTML = "";
  }
});

/**
 * Convert latitude and longitude to tile coordinates (used for openstreetmap)
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} zoom - Zoom level
 * @returns {Object} - An object containing x and y tile coordinates
 */
function latLonToTile(lat, lon, zoom) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const xTile = ((lon + 180) / 360) * n;
  const yTile =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return {
    x: Math.floor(xTile),
    y: Math.floor(yTile),
    zoom: zoom,
  };
}

async function retrieveStationImage(tileCoordinates) {
  const { x, y, zoom } = tileCoordinates;
  const url = `https://a.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return url;
}
