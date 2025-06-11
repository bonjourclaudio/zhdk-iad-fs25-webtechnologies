let canvas;

let cols, rows, size;
const targetCellSize = 50;

let soundTracks = [];
let currentTrackIndex = 0;
let currentSound;

let fft;

let showIntro = false;
let introText = "";
let introStartTime = 0;
const introDuration = 3000;

function preload() {
  soundFormats("mp3"); // depends on your files

  for (let i = 0; i < 9; i++) {
    soundTracks[i] = loadSound(`./assets/sound/0${i + 1}.mp3`);
  }

  document.querySelector(".visuals__loader").style.display = "block";
}

function initConnection() {
  const stationName = document.getElementById("stationInput").value;
  if (stationName) {
    introText = `Loading ${stationName}...`;
    showIntro = true;
    introStartTime = millis(); // Start the intro timer

    fetchConnections(stationName);
  }
}

function setup() {
  fft = new p5.FFT(0.9, 1024);
  polySynth = new p5.PolySynth();

  const parent = document.getElementById("p5Container");
  canvas = createCanvas(parent.offsetWidth, parent.offsetHeight);
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

  document.querySelector(".visuals__loader").style.display = "none";
}

function draw() {
  background(0);

  if (showIntro) {
    drawIntroText();

    // Check if intro time is over
    if (millis() - introStartTime > introDuration) {
      showIntro = false;
    }

    return; // Skip drawing the visuals while intro is shown
  }

  // Stop if no destination is available
  if (!connectionContainer || connectionContainer.stations.length === 0) {
    return;
  }

  drawGrid();
  initMap();
}

let noiseScale = 0.1; // noise frequency — lower = bigger smooth areas
let noiseThreshold = 0.4; // controls empty vs. solid blocks
let zOffset = 0; // animation offset

function drawGrid() {
  noStroke();

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * size;
      const y = j * size;

      // Use Perlin noise to decide
      let n = noise(i * noiseScale, j * noiseScale, zOffset);

      if (n < noiseThreshold) {
        drawNoiseBlock(x, y, size, size);
      } else {
        let brightness = noise(
          (i + 100) * noiseScale,
          (j + 100) * noiseScale,
          zOffset
        );

        brightness = brightness < 0.5 ? 0 : 255;

        fill(brightness);
        rect(x, y, size, size);

        // Use noise to decide if glitches appear
        let glitchChance = noise(
          (i + 200) * noiseScale,
          (j + 200) * noiseScale,
          zOffset
        );
        if (glitchChance < 0.2) {
          drawGlitchRects(x, y, size);
        }
      }
    }
  }

  // Slowly animate the noise field
  zOffset += 0.01;
}

function drawNoiseBlock(x, y, w, h) {
  const density = 200; // how many dots per block

  for (let n = 0; n < density; n++) {
    const px = x + random(w);
    const py = y + random(h);
    // Use noise to drive dot brightness
    let nVal = noise(px * 0.02, py * 0.02, zOffset * 2);
    let bright = nVal < 0.5 ? 0 : 255;

    stroke(bright);
    point(px, py);
  }
}

function drawGlitchRects(x, y, blockSize) {
  const glitchCount = int(random(1, 4));
  for (let i = 0; i < glitchCount; i++) {
    const gw = random(blockSize * 0.1, blockSize * 0.4);
    const gh = random(blockSize * 0.1, blockSize * 0.4);
    const gx = x + random(blockSize - gw);
    const gy = y + random(blockSize - gh);

    // Use noise to decide glitch color
    let nVal = noise(gx * 0.05, gy * 0.05, zOffset * 3);
    let bright = nVal < 0.5 ? 0 : 255;

    fill(bright);
    noStroke();
    rect(gx, gy, gw, gh);
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
  connectionContainer.stations.forEach((station) => {
    const position = translateCoordinates(station.lat, station.lon);

    const cellX = Math.floor(position.x / size) * size + size / 2;
    const cellY = Math.floor(position.y / size) * size + size / 2;
    circle(cellX, cellY, size);
  });
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

function drawIntroText() {
  textAlign(CENTER, CENTER);
  textSize(48);
  fill(255);

  text(introText, width / 2, height / 2);
}
