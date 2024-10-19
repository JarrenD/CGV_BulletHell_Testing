import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterControls } from './characterControls';


class BasicWorldDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(20, 20, 20);
    //let cameraTarget = new THREE.Vector3();
    

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
      controls.enableDamping = true
      controls.minDistance = 5
      controls.maxDistance = 15
      controls.enablePan = false
      controls.maxPolarAngle = Math.PI / 2 - 0.05
      controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0xD3D3D3,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);
    
    const cylinderGeometry = new THREE.CylinderGeometry(
      1,1,2,32,1,false,0,Math.PI * 2
    );
    
    const cylinderMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000, // Red color
    });
    
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    
    cylinder.position.set(0, 1, 0); // Set the position
    cylinder.castShadow = true; // Enable shadow casting
    cylinder.receiveShadow = true; // Enable shadow receiving
    cylinder.scale.set(2, 2, 2); 
    this._scene.add(cylinder); // Add to the scene
    

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({
          color: 0x0000FF,
      }));
    box.position.set(20, 1, 20);
    box.scale.set(2, 2, 2); 
    box.castShadow = true;
    box.receiveShadow = true;
    this._scene.add(box);


    new GLTFLoader().load('models/Soldier.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse(function (object) {
          if (object.isMesh) {
            object.material.skinning = true;
            object.castShadow = true;
            object.receiveShadow = true;
          }
      });
  
      this._scene.add(model); 
  
      const gltfAnimations = gltf.animations;
      const mixer = new THREE.AnimationMixer(model);
      const animationsMap = new Map();
      gltfAnimations.filter(a => a.name != 'TPose').forEach(a => {
          animationsMap.set(a.name, mixer.clipAction(a));
      });
      model.position.set(20, 1, 20);
      model.scale.set(3,3,3);
      CharacterControls = new CharacterControls(model, mixer, animationsMap, controls, this._camera,  'Idle');
  });
  

    this._RAF();
    
    function calculateDistance(x1, z1, x2, z2) {
      // Calculate the difference in x-coordinates and y-coordinates
      const xDifference = x2 - x1;
      const zDifference = z2 - z1;
    
      // Square the differences
      const squaredXDifference = xDifference * xDifference;
      const squaredZDifference = zDifference * zDifference;
    
      // Calculate the sum of squared differences
      const sumOfSquaredDifferences = squaredXDifference + squaredZDifference;
    
      // Calculate the square root of the sum of squared differences
      const distance = Math.sqrt(sumOfSquaredDifferences);
    
      // Return the distance
      return distance;
    }

    function calculateCircleCircumferencePoint(radius, theta) {
      // Convert theta to radians
      const thetaRadians = theta * (Math.PI / 180);
    
      // Calculate x and z coordinates
      const x = radius * Math.cos(thetaRadians);
      const z = radius * Math.sin(thetaRadians);
    
      // Return the coordinates as an object
      return { x: x, z: z };
    }

    function calculateDirectionVectorTowardsOrigin(x, z) {
      return { x: -x, z: -z };
    }
    
    function calculateDirectionVectorAwayFromOrigin(x, z) {
      return { x: x, z: z };
    }
    
    function normalizeDirectionVector(directionVector) {
      const magnitude = Math.sqrt(directionVector.x * directionVector.x + directionVector.z * directionVector.z);
      return {
        x: directionVector.x / magnitude,
        z: directionVector.z / magnitude
      };
    }
    
    function moveTowardsOrigin(box, distance) {
      const directionVector = calculateDirectionVectorTowardsOrigin(box.position.x, box.position.z);
      const normalizedDirectionVector = normalizeDirectionVector(directionVector);
      box.position.x += normalizedDirectionVector.x * distance;
      box.position.z += normalizedDirectionVector.z * distance;
    }
    
    function moveAwayFromOrigin(box, distance) {
      const directionVector = calculateDirectionVectorAwayFromOrigin(box.position.x, box.position.z);
      const normalizedDirectionVector = normalizeDirectionVector(directionVector);
      box.position.x += normalizedDirectionVector.x * distance;
      box.position.z += normalizedDirectionVector.z * distance;
    }
    
    let theta = 0;

    document.addEventListener('keydown', (event) => {
      if (event.key === 'w') {
        moveTowardsOrigin(box, 1);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'a') {
        theta+=3;
        const updatePos = calculateCircleCircumferencePoint(calculateDistance(box.position.x,box.position.z,0,0),theta);
        box.position.x = updatePos.x;
        box.position.z = updatePos.z;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 's') {
        moveAwayFromOrigin(box, 1);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'd') {
        theta-=3;
        const updatePos = calculateCircleCircumferencePoint(calculateDistance(box.position.x,box.position.z,0,0),theta);
        box.position.x = updatePos.x;
        box.position.z = updatePos.z;
      }
    });

    const keysPressed = {};

document.addEventListener('keydown', (event) => {
    if (event.shiftKey && CharacterControls) {
        CharacterControls.switchRunToggle();
    } else {
        keysPressed[event.key.toLowerCase()] = true; // Store the key press
    }
}, false);

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false; // Remove the key press
}, false);

const clock = new THREE.Clock();

    function animate() {
      let mixerUpdateDelta = clock.getDelta();
  
      if (CharacterControls) {
          CharacterControls.update(mixerUpdateDelta, keysPressed);
          console.log('Current Action:', CharacterControls.currentAction); 
      }
  
      orbitControls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
  }
  document.body.appendChild(renderer.domElement);
  animate();
  
}

  
 
  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      this._threejs.render(this._scene, this._camera);
      this._RAF();
    });
  }

  
 }



let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});