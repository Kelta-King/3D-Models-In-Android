import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright white light
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Set up OrbitControls to allow user interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable smooth damping (inertia)
controls.dampingFactor = 0.05; // Damping factor
controls.minDistance = 2; // Minimum zoom distance
controls.maxDistance = 1000; // Maximum zoom distance

// Raycaster and mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// const tempMouse = new THREE.Vector2();

// Store references to text boxes and their 3D positions
const labels = [];

// Load the GLTF model
let model;
const loader = new GLTFLoader();
loader.load('Models/busterDrone.gltf', function (gltf) {
    model = gltf.scene;
    scene.add(model);

    // Optional: Adjust the model's position and scale
    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
}, undefined, function (error) {
    console.error('An error happened while loading the GLTF model:', error);
});

let longPressTimeout;

// Detect long press on the model
renderer.domElement.addEventListener('mousedown', (event) => {
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const intersectedPoint = intersect.point;

        // Start the long press timer
        longPressTimeout = setTimeout(() => {
            createTextBox(intersectedPoint);
        }, 2000); // 2-second delay for long press
    }
});

renderer.domElement.addEventListener('mousemove', (event) => {
    clearTimeout(longPressTimeout);
});

renderer.domElement.addEventListener('mouseup', (event) => {
    clearTimeout(longPressTimeout);
});

renderer.domElement.addEventListener('mouseleave', () => {
    clearTimeout(longPressTimeout);
});

function createTextBox(position) {
    const div = document.createElement('div');
    div.contentEditable = true;
    div.style.position = 'absolute';
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    div.style.border = '1px solid #000';
    div.style.padding = '5px';
    div.style.borderRadius = '5px';
    div.style.zIndex = 1;

    div.innerText = 'Your text here';
    document.body.appendChild(div);

    // Store the label and its 3D position for updating later
    labels.push({ element: div, position: position });
}

function updateLabels() {
    labels.forEach(label => {
        const vector = new THREE.Vector3(label.position.x, label.position.y, label.position.z);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = -(vector.y * 0.5 - 0.5) * window.innerHeight;

        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;
    });
}

function animate() {
    controls.update(); // Update controls on every frame

    // Update label positions
    updateLabels();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update camera aspect ratio and renderer size
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Start the render loop
animate();
