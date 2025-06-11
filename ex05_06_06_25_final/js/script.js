/**
 * Toggles the visibility of the loading indicator.
 * @param {boolean} status - true to show the loader, false to hide it.
 */
function toggleLoading(status) {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.style.display = status ? "block" : "none";
  }
}

/**
 * Displays information about the current track, station, and time in the UI
 */
function displayInfo() {
  const track = document.querySelector("#track");
  const station = document.querySelector("#station");
  const time = document.querySelector("#time");

  if (connectionContainer && connectionContainer.stations.length > 0) {
    const departureStation = connectionContainer.stations[0];
    track.textContent = `Track: ${soundTracks[currentTrackIndex].url}`;
    station.textContent = `Station: ${departureStation.name}`;
    setInterval(() => {
      time.textContent = `Time: ${new Date().toLocaleTimeString()}`;
    }, 1000);
  } else {
    track.textContent = "No track information available.";
    station.textContent = "No station information available.";
    time.textContent = "No time information available.";
  }
}

/**
 * Enables fullscreen mode for the p5.js canvas.
 */
document
  .querySelector("#fsBtn")
  .addEventListener("click", enableFullscreen, false);

function enableFullscreen() {
  const p5Container = document.getElementById("p5Container");
  if (p5Container.requestFullscreen) {
    p5Container.requestFullscreen();
  } else if (p5Container.mozRequestFullScreen) {
    p5Container.mozRequestFullScreen(); // Firefox
  } else if (p5Container.webkitRequestFullscreen) {
    p5Container.webkitRequestFullscreen(); // Chrome, Safari and Opera
  } else if (p5Container.msRequestFullscreen) {
    p5Container.msRequestFullscreen(); // IE/Edge
  }
}
