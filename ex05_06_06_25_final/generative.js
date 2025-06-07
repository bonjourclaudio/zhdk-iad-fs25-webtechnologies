let canvas;

let cols, rows, size;
const targetCellSize = 30;

let soundTracks = [];
let currentTrackIndex = 0;
let currentSound;

let fft;

function initConnection() {
  const stationName = document.getElementById("stationInput").value;
  if (stationName) {
    fetchConnections(stationName);
  }
}

function preload() {
  soundFormats("mp3"); // depends on your files

  for (let i = 0; i < 9; i++) {
    soundTracks[i] = loadSound(`./assets/sound/0${i + 1}.mp3`);
  }
}

function setup() {
  fft = new p5.FFT();

  const parent = document.getElementById("p5Container");
  canvas = createCanvas(parent.offsetWidth, parent.offsetHeight, WEBGL);
  canvas.parent("p5Container");

  computeGrid();

  document
    .getElementById("loadButton")
    .addEventListener("click", initConnection, false);

  document.getElementById("stationInput").addEventListener(
    "keydown",
    function (event) {
      if (event.key === "Enter") {
        initConnection();
      }
    },
    false
  );
}

function playNextTrack() {
  if (currentSound) {
    currentSound.stop();
  }

  currentSound = soundTracks[currentTrackIndex];
  currentSound.play();

  currentTrackIndex = (currentTrackIndex + 1) % soundTracks.length;
}

function draw() {
  background(0);

  translate(-width / 2, -height / 2);

  ambientLight(80);
  pointLight(255, 255, 255, width / 2, height / 2, 500);

  // Stop if no destination is available
  if (
    !connectionContainer ||
    connectionContainer.destinationStations.length === 0
  ) {
    return;
  }

  drawGrid();
  initMap();

  /*
  let x = 400 * cos(frameCount * 0.01);
  camera(x, -400, 800);
  */
}

function drawGrid() {
  rectMode(CORNER);

  let t = millis() * 0.0005; // time factor for animation
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * size;
      const y = j * size;

      // Offset each cell with Perlin noise for smooth movement
      let noiseVal = noise(i * 0.2, j * 0.2, t);
      let offset = map(noiseVal, 0, 1, -size * 0.1, size * 0.1);

      push();
      translate(x + size, y + size, 0);
      rotateX(t * 0.1 + i * 0.1 * offset);
      rotateY(t * 0.1 + j * 0.1 * offset);
      stroke(255, 50);
      noFill();
      rect(0, 0, size, size);
      pop();
    }
  }
}

function windowResized() {
  const parent = document.getElementById("p5Container");
  resizeCanvas(parent.offsetWidth, parent.offsetHeight);
  computeGrid();
}

function computeGrid() {
  cols = Math.ceil(width / targetCellSize);
  rows = Math.ceil(height / targetCellSize);

  size = Math.max(width / cols, height / rows);
}

function translateCoordinates(lat, lon) {
  // Switzerland approx: lat 45.8 to 47.8, lon 5.9 to 10.5
  const x = map(lon, 5.9, 10.5, 0, width);
  const y = map(lat, 47.8, 45.8, 0, height);

  return createVector(x, y);
}

function initMap() {
  /**
   * Draw Departure Station
   */
  let departureVector = translateCoordinates(
    connectionContainer.departureStation.lat,
    connectionContainer.departureStation.lon
  );

  // Fill the cell of the grid where the departure station is located
  const departureCellX = Math.floor(departureVector.x / size);
  const departureCellY = Math.floor(departureVector.y / size);
  fill(0, 0, 255, 100);
  noStroke();
  // Simple rectangle for testing
  // rect(departureCellX * size, departureCellY * size, size, size);

  push();
  translate(departureCellX * size, departureCellY * size, 0);
  fill(0, 0, 255, 150);
  rect(0, 0, size, size);
  pop();

  // Offset each cell with Perlin noise for smooth movement
  /*  let noiseVal = noise(i * 0.2, j * 0.2, t);
  let offset = map(noiseVal, 0, 1, -size * 0.1, size * 0.1);

  push();
  translate(departureCellX + size, departureCellY + size, 0);
  rotateX(t * 0.1 + i * 0.1 * offset);
  rotateY(t * 0.1 + j * 0.1 * offset);
  fill(255, 50);
  box(size);
  pop();*/
}
