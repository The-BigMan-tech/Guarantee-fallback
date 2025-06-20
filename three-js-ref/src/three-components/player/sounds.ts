import * as THREE from 'three';

const audioLoader = new THREE.AudioLoader();
export const listener = new THREE.AudioListener();
export const walkSound = new THREE.PositionalAudio(listener);
export const landSound = new THREE.PositionalAudio(listener);

audioLoader.load('walking.mp3',(buffer)=> {
    walkSound.setBuffer(buffer);
    walkSound.setLoop(false);
    walkSound.setVolume(50);
});
audioLoader.load('landing.mp3',(buffer)=> {
    landSound.setBuffer(buffer);
    landSound.setVolume(30);
});
