import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
const W = 'w'
const A = 'a'
const S = 's'
const D = 'd'
const SHIFT = 'shift'
const DIRECTIONS = [W, A, S, D]


export class CharacterControls {
    model;
    mixer;
    animationsMap;
    orbitControl;
    camera;

    toggleRun=false;
    currentAction;

    // temporary data
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuarternion= new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();


    //constants
    fadeDuration = 0.2;
    runVelocity = 5;
    walkVelocity = 2;
    
    constructor(model, mixer, animationsMap, orbitControl, camera,currentAction) {
        this.model = model;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.currentAction = currentAction;
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction) {
                value.play();
            }
        })
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.updateCameraTarget(20, 20);
    }

    switchRunToggle() {
        this.toggleRun = !this.toggleRun
    }

    update(delta, keysPressed) {
        // Check if any of the movement direction keys are pressed
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);
    
        let play = '';
        if (directionPressed && this.toggleRun) {
            play = 'Run';
        } else if (directionPressed) {
            play = 'Walk';
        } else {
            play = 'Idle';
        }
    
        // Switch animations if the current action changes
        if (this.currentAction !== play) {
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);
    
            current.fadeOut(this.fadeDuration);
            toPlay.reset().fadeIn(this.fadeDuration).play();
    
            this.currentAction = play;
        }
    
        // Update the animation mixer
        this.mixer.update(delta);
    
        // If the current action is running or walking, adjust movement and rotation
        if (this.currentAction === 'Run' || this.currentAction === 'Walk') {
            // Calculate angle towards the camera's direction
            const angleYCameraDirection = Math.atan2(
                this.camera.position.x - this.model.position.x, 
                this.camera.position.z - this.model.position.z
            );
    
            // Diagonal movement angle offset
            const directionOffset = this.directionOffset(keysPressed);
    
            // Rotate the model
            this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuarternion, 0.2);
    
            // Calculate the movement direction
            this.camera.getWorldDirection(this.walkDirection);
            this.walkDirection.y = 0;
            this.walkDirection.normalize();
            this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);
    
            // Determine run or walk velocity
            const velocity = this.currentAction === 'Run' ? this.runVelocity : this.walkVelocity;
    
            // Move the model and the camera
            const moveX = this.walkDirection.x * velocity * delta;
            const moveZ = this.walkDirection.z * velocity * delta;
            this.model.position.x += moveX;
            this.model.position.z += moveZ;
            
            // Update the camera target position
            this.updateCameraTarget(moveX, moveZ);
        }
    }
    

    updateCameraTarget(moveX, moveZ) {
        // Move camera
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;
    
        // Update camera target
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 1;
        this.cameraTarget.z = this.model.position.z;
    
        // Update the orbit control target
        this.orbitControl.target = this.cameraTarget;
    }

    directionOffset(keysPressed) {
        let directionOffset = 0;  // Default to 'w' key (forward)
    
        // Check key combinations for diagonal or backward movement
        if (keysPressed[W]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4;  // 'w' + 'a' (diagonal forward-left)
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4;  // 'w' + 'd' (diagonal forward-right)
            }
        } else if (keysPressed[S]) {
            if (keysPressed[A]) {
                directionOffset = Math.PI / 4 + Math.PI / 2;  // 's' + 'a' (diagonal backward-left)
            } else if (keysPressed[D]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2;  // 's' + 'd' (diagonal backward-right)
            } else {
                directionOffset = Math.PI;  // 's' (backward)
            }
        } else if (keysPressed[A]) {
            directionOffset = Math.PI / 2;  // 'a' (left)
        } else if (keysPressed[D]) {
            directionOffset = -Math.PI / 2;  // 'd' (right)
        }
    
        return directionOffset;
    }
    
    

}