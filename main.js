import './style.css'
import * as THREE from 'three'

// --- SCENE SETUP ---
const canvas = document.querySelector('#webgl')
const scene = new THREE.Scene()

// Orthographic camera for 2D shader plane
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// --- SHADER MATERIAL ---
// We'll load shaders in a moment, for now let's put a placeholder
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'

const geometry = new THREE.PlaneGeometry(2, 2)

const material = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
})

const plane = new THREE.Mesh(geometry, material)
scene.add(plane)

// --- EVENTS ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
})

window.addEventListener('mousemove', (e) => {
    material.uniforms.uMouse.value.set(e.clientX, window.innerHeight - e.clientY)
})

// --- AUDIO & UI ---
import { RadioAudio } from './audio.js'

const radioAudio = new RadioAudio()
const playBtn = document.getElementById('play-btn')
const staticIndicator = document.getElementById('static-indicator')
const modeIntroBtn = document.getElementById('mode-intro')
const modeRedRoomBtn = document.getElementById('mode-redroom')

playBtn.addEventListener('click', async () => {
    const isPlaying = radioAudio.toggle()
    playBtn.textContent = isPlaying ? "TUNE OUT" : "TUNE IN"
    staticIndicator.style.opacity = isPlaying ? "1" : "0.5"
    staticIndicator.textContent = isPlaying ? "ON AIR" : "OFF AIR"

    // Glitch effect on toggle
    material.uniforms.uTime.value += 100.0;
})

modeIntroBtn.addEventListener('click', () => {
    radioAudio.setMode('intro')
    modeIntroBtn.classList.add('active')
    modeRedRoomBtn.classList.remove('active')
    // Glitch
    material.uniforms.uTime.value += 50.0;
})

modeRedRoomBtn.addEventListener('click', () => {
    radioAudio.setMode('redRoom')
    modeRedRoomBtn.classList.add('active')
    modeIntroBtn.classList.remove('active')
    // Glitch
    material.uniforms.uTime.value += 50.0;
})

// --- INTERACTIVE OBJECTS ---
const textureLoader = new THREE.TextureLoader()
const objects = []

function createFloatingObject(path, x, y, scale) {
    const map = textureLoader.load(path)
    const material = new THREE.SpriteMaterial({ map: map })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(x, y, 0.5) // z=0.5 to be in front of background
    sprite.scale.set(scale, scale, 1)
    scene.add(sprite)

    // Add custom data for animation
    sprite.userData = {
        initialY: y,
        speed: Math.random() * 0.5 + 0.5,
        offset: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02
    }

    objects.push(sprite)
    return sprite
}

// Add Coffee, Owl, Pie
createFloatingObject('/assets/coffee.png', -0.6, 0.4, 0.4)
createFloatingObject('/assets/owl.png', 0.6, 0.4, 0.4)
createFloatingObject('/assets/pie.png', 0, -0.5, 0.4)

// Raycaster for interaction
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('click', (event) => {
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(objects)

    if (intersects.length > 0) {
        const object = intersects[0].object
        // Interaction effect: Spin fast and glitch
        object.userData.rotationSpeed += 0.5
        material.uniforms.uTime.value += 10.0
    }
})


// --- ANIMATION ---
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    material.uniforms.uTime.value = elapsedTime

    // Animate objects
    objects.forEach(obj => {
        // Floating motion
        obj.position.y = obj.userData.initialY + Math.sin(elapsedTime * obj.userData.speed + obj.userData.offset) * 0.05

        // Rotation (Sprites don't rotate like meshes, but we can rotate the material or just wobble position)
        // Actually Sprites always face camera. To rotate 2D texture, we rotate material.rotation
        obj.material.rotation += obj.userData.rotationSpeed

        // Dampen rotation speed back to normal
        obj.userData.rotationSpeed *= 0.95
        if (Math.abs(obj.userData.rotationSpeed) < 0.001) obj.userData.rotationSpeed = 0
    })

    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
