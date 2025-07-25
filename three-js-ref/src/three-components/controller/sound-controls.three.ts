import * as THREE from "three"
import { listener } from "../listener/listener.three";
import { audioLoader } from "../listener/listener.three";

export class SoundControls {
    public walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//the inheriting class can only access this sound through exposed methods
    public landSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity
    public punchSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);

    constructor() {};

    public loadSounds() {
        audioLoader.load('walking.mp3',(buffer)=> {
            this.walkSound.setBuffer(buffer);
            this.walkSound.setVolume(0.5);//The volumes here are multiplers of the computer's current volume-DO NOT INCREASE MORE THAN ONE
        });
        audioLoader.load('landing.mp3',(buffer)=> {
            this.landSound.setBuffer(buffer);
            this.landSound.setVolume(0.5);
        });
        audioLoader.load('punch.mp3',(buffer)=> {
            this.punchSound.setBuffer(buffer);
            this.punchSound.setVolume(0.5);
        });
    }
    public playWalkSound():void {
        if (!this.walkSound.isPlaying) this.walkSound.play();
    }
    public playPunchSound():void {
        if (!this.punchSound.isPlaying) this.punchSound.play();
    }
    public playLandSound():void {
        if (!this.landSound.isPlaying) this.landSound.play();
    }
    public stopWalkSound():void {
        this.walkSound.stop();
    }
    public stopPunchSound():void {
        this.punchSound.stop();
    }
}