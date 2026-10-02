/* =========================================================
   app.js
   Archigram scene setup and renderer
   =========================================================
   Uses window.ARCHIGRAM from shader.js.
   ========================================================= */


/* Dependencies from shader.js */



/* =========================================================
   SCENE
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(VIEW.backgroundColor);


/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
  VIEW.camera.fieldOfView,
  window.innerWidth / window.innerHeight,
  VIEW.camera.near,
  VIEW.camera.far
);

camera.position.set(...VIEW.camera.position);


/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  alpha: true
});

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearAlpha(0);

document.body.appendChild(renderer.domElement);


/* =========================================================
   CONTROLS
   ========================================================= */

const controls = new THREE.OrbitControls(
  camera,
  renderer.domElement
);

controls.target.set(...VIEW.camera.target);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.update();


/* =========================================================
   MATERIALS
   ========================================================= */

const archigramMaterial = createArchigramMaterial();
const edgeMaterial = createEdgeMaterial();


/* =========================================================
   ARCHIGRAM MODEL
   ========================================================= */

const structure = new THREE.Group();
scene.add(structure);

function addArchitecturalMesh(
  geometry,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
) {
  const container = new THREE.Group();

  container.position.set(...position);
  container.rotation.set(...rotation);
  container.scale.set(...scale);

  const mesh = new THREE.Mesh(
    geometry,
    archigramMaterial
  );

  container.add(mesh);

  if (VIEW.edges.enabled) {
    const edgeGeometry = new THREE.EdgesGeometry(
      geometry,
      VIEW.edges.thresholdAngle
    );

    const edges = new THREE.LineSegments(
      edgeGeometry,
      edgeMaterial
    );

    edges.renderOrder = 2;
    container.add(edges);
  }

  structure.add(container);

  return container;
}


/* Central megastructure */

addArchitecturalMesh(
  new THREE.BoxGeometry(2.2, 6.5, 2.2),
  [0, 0.4, 0]
);


/* Top control room */

addArchitecturalMesh(
  new THREE.BoxGeometry(3.4, 1.0, 3.4),
  [0, 4.1, 0]
);


/* Observation sphere */

addArchitecturalMesh(
  new THREE.SphereGeometry(0.85, 24, 16),
  [0, 5.45, 0]
);


/* Cantilevered plug-in pods */

const podGeometry = new THREE.BoxGeometry(
  2.2,
  0.9,
  1.4
);

addArchitecturalMesh(
  podGeometry,
  [1.8, 2.5, 0.4],
  [0, -0.10, -0.05]
);

addArchitecturalMesh(
  podGeometry,
  [-1.8, 1.1, -0.25],
  [0, 0.12, 0.04]
);

addArchitecturalMesh(
  podGeometry,
  [1.7, -0.5, -0.5],
  [0, 0.18, -0.06]
);

addArchitecturalMesh(
  podGeometry,
  [-1.7, -1.8, 0.35],
  [0, -0.15, 0.05]
);


/* Cylindrical utility tanks */

addArchitecturalMesh(
  new THREE.CylinderGeometry(0.75, 0.75, 1.8, 20),
  [2.1, -2.4, 0.7],
  [0, 0, Math.PI * 0.5]
);

addArchitecturalMesh(
  new THREE.CylinderGeometry(0.55, 0.55, 1.4, 20),
  [-2.0, 3.3, -0.5],
  [Math.PI * 0.5, 0, 0]
);


/* Vertical structural pipes */

const pipeGeometry = new THREE.CylinderGeometry(
  0.13,
  0.13,
  7.8,
  12
);

addArchitecturalMesh(
  pipeGeometry,
  [-1.55, 0.2, -1.55]
);

addArchitecturalMesh(
  pipeGeometry,
  [1.55, 0.2, -1.55]
);

addArchitecturalMesh(
  pipeGeometry,
  [-1.55, 0.2, 1.55]
);

addArchitecturalMesh(
  pipeGeometry,
  [1.55, 0.2, 1.55]
);


/* Antenna */

addArchitecturalMesh(
  new THREE.CylinderGeometry(0.06, 0.09, 2.5, 10),
  [0, 7.15, 0]
);


/* Antenna rings */

addArchitecturalMesh(
  new THREE.TorusGeometry(0.65, 0.07, 10, 32),
  [0, 6.65, 0],
  [Math.PI * 0.5, 0, 0]
);

addArchitecturalMesh(
  new THREE.TorusGeometry(0.4, 0.06, 10, 32),
  [0, 7.3, 0],
  [Math.PI * 0.5, 0, 0]
);


/* Base platform */

addArchitecturalMesh(
  new THREE.BoxGeometry(8, 0.25, 8),
  [0, -3.7, 0]
);


/* =========================================================
   GROUND GRID
   ========================================================= */

let grid = null;

if (VIEW.grid.enabled) {
  grid = new THREE.GridHelper(
    VIEW.grid.size,
    VIEW.grid.divisions,
    new THREE.Color(VIEW.grid.colorCenter),
    new THREE.Color(VIEW.grid.colorGrid)
  );

  grid.position.y = -3.56;

  grid.material.transparent = true;
  grid.material.opacity = VIEW.grid.opacity;

  scene.add(grid);
}


/* =========================================================
   IDLE AUTO-ROTATE
   ========================================================= */

let isAutoRotating = false;
let idleTimer = null;

function startAutoRotate() {
  isAutoRotating = true;
}

function stopAutoRotate() {
  isAutoRotating = false;
}

function resetIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  if (VIEW.animation.autoRotate) {
    idleTimer = setTimeout(() => {
      startAutoRotate();
    }, VIEW.animation.idleDelay || 2000);
  }
}

/* Detect user interaction and stop rotation. */
function handleUserInteraction() {
  stopAutoRotate();
  resetIdleTimer();
}

renderer.domElement.addEventListener("pointerdown", handleUserInteraction);
renderer.domElement.addEventListener("wheel", handleUserInteraction);

/* Start rotation only after initial idle delay. */
if (VIEW.animation.autoRotate) {
  resetIdleTimer();
}


/* =========================================================
   EXPORT PNG BUTTON
   ========================================================= */

const exportButton = document.getElementById("exportButton");

function exportPNG() {
  /* Temporarily hide background and grid. */

  const previousBackground = scene.background;
  scene.background = null;

  if (grid) {
    grid.visible = false;
  }

  /* Stop rotation for a stable frame. */
  const wasAutoRotating = isAutoRotating;
  isAutoRotating = false;

  renderer.render(scene, camera);

  const dataURL = renderer.domElement.toDataURL(
    "image/png"
  );

  const link = document.createElement("a");
  link.download = "archigram-" + Date.now() + ".png";
  link.href = dataURL;
  link.click();

  /* Restore previous state. */
  scene.background = previousBackground;

  if (grid) {
    grid.visible = true;
  }

  isAutoRotating = wasAutoRotating;
}

if (exportButton) {
  exportButton.addEventListener("click", exportPNG);
} else {
  console.warn("Export button not found in DOM.");
}


/* =========================================================
   RESIZE
   ========================================================= */

function onResize() {
  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
}

window.addEventListener("resize", onResize);


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {
  requestAnimationFrame(animate);

  if (isAutoRotating) {
    structure.rotation.y += VIEW.animation.speed;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
