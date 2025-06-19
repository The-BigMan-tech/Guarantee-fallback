import * as THREE from 'three';

const audioLoader = new THREE.AudioLoader();
export const listener = new THREE.AudioListener();
export const walkSound = new THREE.PositionalAudio(listener);

audioLoader.load('walking.mp3', function(buffer) {
    walkSound.setBuffer(buffer);
    walkSound.setLoop(true);
    walkSound.setVolume(30);
});
