let canvas;

let cols, rows, size;
const targetCellSize = 50;

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
  fft = new p5.FFT(0.9, 1024);

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

  fft.setInput(currentSound);

  currentTrackIndex = (currentTrackIndex + 1) % soundTracks.length;
}

function draw() {
  background(0);

  translate(-width / 2, -height / 2);

  ambientLight(80);
  pointLight(255, 255, 255, width / 2, height / 2, 500);

  // Stop if no destination is available
  if (!connectionContainer || connectionContainer.stations.length === 0) {
    return;
  }

  drawGrid();
  initMap();

  let x = (width / 2) * cos(frameCount * 0.01);
  let y = (height / 2) * sin(frameCount * 0.01);
  let z = (height / 2) * sin(frameCount * 0.01);
  translate(x, y, z);
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);

  let cameraX = (width / 2) * cos(frameCount * 0.01);
  let cameraY = (height / 2) * sin(frameCount * 0.01);
  let cameraZ = (height / 2) * sin(frameCount * 0.01);
  camera(cameraX, cameraY, cameraZ, width / 2, height / 2, 0, 0, 1, 0);
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
      circle(0, 0, size);
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
  fft.analyze();

  let bass = fft.getEnergy("bass");
  let lowMid = fft.getEnergy("lowMid");
  let mid = fft.getEnergy("mid");
  let highMid = fft.getEnergy("highMid");
  let treble = fft.getEnergy("treble");

  // Normalize the energy values to a range suitable for visualization
  bass = map(bass, 0, 255, 0, size * 0.5);
  lowMid = map(lowMid, 0, 255, 0, size * 0.5);
  mid = map(mid, 0, 255, 0, size * 0.5);
  highMid = map(highMid, 0, 255, 0, size * 0.5);
  treble = map(treble, 0, 255, 0, size * 0.5);

  let t = millis() * 0.0005;

  connectionContainer.stations.forEach((station) => {
    const vector = translateCoordinates(station.lat, station.lon);

    // Fill the cell of the grid where the station is located
    const cellX = Math.floor(vector.x / size);
    const cellY = Math.floor(vector.y / size);
    fill(255);
    noStroke();

    let noiseVal = noise(cellX * 0.2, cellY * 0.2, t);
    let offset = map(noiseVal, 0, 1, -size * 0.1, size * 0.1);

    push();
    translate(cellX * size, cellY * size, 0);
    rotate(t * 0.1 + cellX * 0.1 * offset);
    scale(bass * offset * 0.2);
    stroke(255 * noiseVal);
    sphere(size);
    pop();

    //drawConnection(connectionContainer.stations[0], station);
  });
}
