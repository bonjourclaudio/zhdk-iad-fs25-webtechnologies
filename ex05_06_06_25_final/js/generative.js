let canvas;

// Grid config
let cols, rows, size;
const targetCellSize = 50;

// Sound Output
let soundTracks = [];
let currentTrackIndex = 0;
let currentSound;
let fft;

// Intro Animation - before visuals are shown
let showIntro = false;
let introText = "";
let introStartTime = 0;
const introDuration = 3000;

// Params for the visuals
let noiseScale = 0.1; // noise frequency — lower = bigger smooth areas
let noiseThreshold = 0.4; // controls empty vs. solid blocks
let zOffset = 0; // animation offset

function preload() {
  // Load sound files from assets
  soundFormats("mp3");

  for (let i = 0; i < 9; i++) {
    soundTracks[i] = loadSound(`assets/sound/0${i + 1}.mp3`);
  }

  // Display loading indicator since canvas isn't ready yet
  document.querySelector(".visuals__loader").style.display = "block";
}

/**
 * Gets called when a user enters a station name
 * 1. init intro animation
 * 2. fetch connections for the station
 */
function initConnection() {
  const stationName = document.getElementById("stationInput").value;

  if (stationName) {
    // Display intro animation
    introText = `Loading ${stationName}...`;
    showIntro = true;
    introStartTime = millis();

    // Retrieve connections for the entered station
    fetchConnections(stationName);
  }
}

// Main P5 setup function - set the canvas
function setup() {
  // FFT needed for the sound output
  // 0.9 is smoothing, 1024 is the number of frequency bins
  fft = new p5.FFT(0.9, 1024);

  // Use the parent container to set the canvas size and always fill it
  const parent = document.getElementById("p5Container");
  canvas = createCanvas(parent.offsetWidth, parent.offsetHeight);
  canvas.parent("p5Container");

  // Calculate grid size based on canvas size
  computeGrid();

  // Listed for the user to enter a station name through button or enter key
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

  // Hide loading once the canvas is ready
  document.querySelector(".visuals__loader").style.display = "none";
}

// Main P5 draw function - called every frame
function draw() {
  background(0, 0, 255);

  // If the intro animation is active, draw it
  if (showIntro) {
    drawIntroText();

    // Check if the intro duration has passed
    if (millis() - introStartTime > introDuration) {
      showIntro = false;
      document.querySelector("#visInfo").style.display = "flex";
    }

    return; // Skip drawing the visuals while intro is shown
  }

  // Don't continue if no connection data is available,
  // wait for user to enter a station name
  if (!connectionContainer || connectionContainer.stations.length === 0) {
    return;
  }

  // Init main visuals
  drawGrid();
  drawStations();
}

// Draws the altered grid of blocks with noise and glitches
function drawGrid() {
  noStroke();

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = i * size;
      const y = j * size;

      // Use Perlin noise to decide what to draw
      let n = noise(i * noiseScale, j * noiseScale, zOffset);

      if (n < noiseThreshold) {
        drawNoiseBlock(x, y, size, size);
      } else {
        let brightness = noise(
          (i + 100) * noiseScale,
          (j + 100) * noiseScale,
          zOffset
        );

        // Map the noise value to a brightness value
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

/**
 * Noise blocks are small dots that fill the block area
 * They are drawn based on Perlin noise to create a random pattern
 * @param {number} x - The x-coordinate of the block
 * @param {number} y - The y-coordinate of the block
 * @param {number} w - The width of the block
 * @param {number} h - The height of the block
 *
 */
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

/**
 * Draws glitch rectangles within a block area
 * These rectangles are randomly sized and positioned
 * @param {number} x - The x-coordinate of the block
 * @param {number} y - The y-coordinate of the block
 * @param {number} blockSize - The size of the block
 *
 */
function drawGlitchRects(x, y, blockSize) {
  // Use randomness to determine amount and size of glitches
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

/**
 * Resizes the canvas when the window is resized
 */
function windowResized() {
  const parent = document.getElementById("p5Container");
  resizeCanvas(parent.offsetWidth, parent.offsetHeight);
  computeGrid();
}

/**
 * Calculate cols and rows based on the canvas and target cell size
 * */
function computeGrid() {
  cols = Math.ceil(width / targetCellSize);
  rows = Math.ceil(height / targetCellSize);

  size = Math.max(width / cols, height / rows);
}

/**
 * Since the station coordinates are in latitude and longitude,
 * we need to translate them to the canvas coordinates.
 * This function maps the latitude and longitude to the canvas size.
 * The mapping is based on the approximate coordinates of Switzerland.
 * @param {*} lat - latitude
 * @param {*} lon - longitude
 * @returns {p5.Vector} - a vector representing the translated coordinates
 */
function translateCoordinates(lat, lon) {
  // Switzerland approx: lat 45.8 to 47.8, lon 5.9 to 10.5
  const x = map(lon, 5.9, 10.5, 0, width);
  const y = map(lat, 47.8, 45.8, 0, height);

  return createVector(x, y);
}

/**
 * Draws the stations on the canvas
 * The stations are drawn as circles at their respective coordinates
 */
function drawStations() {
  connectionContainer.stations.forEach((station) => {
    const position = translateCoordinates(station.lat, station.lon);

    // Map the coordinates to the grid size
    const cellX = Math.floor(position.x / size) * size + size / 2;
    const cellY = Math.floor(position.y / size) * size + size / 2;
    circle(cellX, cellY, size);
  });
}

/**
 * Plays the next track in the soundTracks array
 * Gets called every time a new station is loaded
 */
function playNextTrack() {
  if (currentSound) {
    currentSound.stop();
  }

  currentSound = soundTracks[currentTrackIndex];
  currentSound.play();

  fft.setInput(currentSound);

  currentTrackIndex = (currentTrackIndex + 1) % soundTracks.length;
}

/**
 * Intro Animation
 */
function drawIntroText() {
  textAlign(CENTER, CENTER);
  textSize(48);
  fill(255);

  text(introText, width / 2, height / 2);
}
