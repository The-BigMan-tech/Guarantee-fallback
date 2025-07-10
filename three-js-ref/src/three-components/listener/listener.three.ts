import * as THREE from "three"

export const listener: THREE.AudioListener = new THREE.AudioListener();;
export const walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//the inheriting class can only access this sound through exposed methods
export const landSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity
export const punchSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener)

const audioLoader = new THREE.AudioLoader();
audioLoader.load('walking.mp3',(buffer)=> {
    walkSound.setBuffer(buffer);
    walkSound.setVolume(20);
});
audioLoader.load('landing.mp3',(buffer)=> {
    landSound.setBuffer(buffer);
    landSound.setVolume(20);
});
audioLoader.load('punch.mp3',(buffer)=> {
    punchSound.setBuffer(buffer);
    punchSound.setVolume(20);
})