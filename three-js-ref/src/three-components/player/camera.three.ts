import * as THREE from 'three';
import { cameraMode, keysPressed } from './globals.three';
import { listener } from './sounds.three';

const FOV = 75;
const nearPoint = 0.1;
const farPoint = 1000;
export const camera = new THREE.PerspectiveCamera(FOV,undefined,nearPoint,farPoint);
camera.add(listener);

const cameraRotationDelta = 0.05;
const cameraRotationSpeed = 0.5;
const targetQuaternion = new THREE.Quaternion();
export const pitchObject = new THREE.Object3D();

pitchObject.add(camera);
targetQuaternion.copy(pitchObject.quaternion);

export function rotateCameraY(delta:number) {
    const pitchChange = new THREE.Quaternion();
    pitchChange.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -delta);
    targetQuaternion.multiplyQuaternions(pitchChange, targetQuaternion);
    clampPitch()
}
function clampPitch() {
    const maxPitchFirstPerson = THREE.MathUtils.degToRad(70);
    const maxPitchThirdPerson = THREE.MathUtils.degToRad(10);
    const maxPitch = cameraMode.isThirdPerson ? maxPitchThirdPerson : maxPitchFirstPerson;

    const euler = new THREE.Euler().setFromQuaternion(targetQuaternion, 'YXZ');   // Convert targetQuaternion to Euler angles to access pitch (x rotation)
    const clampedX = THREE.MathUtils.clamp(euler.x, -maxPitch, maxPitch);// Clamp pitch angle within the chosen range

    const smoothFactor = 0.2; // Adjust for smoothness; smaller is smoother
    euler.x += (clampedX - euler.x) * smoothFactor;
    targetQuaternion.setFromEuler(euler);
}
function mapKeysToCamera() {
    if (keysPressed['ArrowUp']) rotateCameraY(-cameraRotationDelta);  
    if (keysPressed['ArrowDown']) rotateCameraY(+cameraRotationDelta);
}
export function updateCamera() {
    mapKeysToCamera()
    pitchObject.quaternion.slerp(targetQuaternion,cameraRotationSpeed);
}

