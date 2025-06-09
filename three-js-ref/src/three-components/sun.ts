import { Sky } from 'three/examples/jsm/objects/Sky.js';
import * as THREE from 'three'
import { directionalLight } from './lights';

export const sky = new Sky();
sky.scale.setScalar(450000);

const elevation = 8; // example starting elevation in degrees
const azimuth = 180;  // example starting azimuth in degrees
const sun = new THREE.Vector3();

export function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    directionalLight.position.copy(sun);
}
sky.material.uniforms['mieCoefficient'].value = 0.001;  // Lower for less glow
sky.material.uniforms['mieDirectionalG'].value = 0.95; // Sharper forward scattering
sky.material.uniforms['rayleigh'].value = 1.5;         // Adjust for contrast
sky.material.uniforms['turbidity'].value = 10;         // Lower turbidity for clearer sky.value = 0.8

