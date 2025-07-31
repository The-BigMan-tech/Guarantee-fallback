import * as THREE from "three"
import { listener } from "../listener/listener.three";
import { audioLoader } from "../listener/listener.three";

export type sounds = 'walk' | 'land' | 'punch';

export class SoundControls {
    public walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//the inheriting class can only access this sound through exposed methods
    public landSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity
    public punchSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);

    public soundToPlay:sounds | null = null;

    constructor() {};

    public loadSounds() {
        audioLoader.load('walking.mp3',(buffer)=> {
            this.walkSound.setBuffer(buffer);
            this.walkSound.setVolume(0.5);//The volumes here are multiplers of the computer's current volume-DO NOT INCREASE MORE THAN ONE
            this.walkSound.setLoop(false)
        });
        audioLoader.load('landing.mp3',(buffer)=> {
            this.landSound.setBuffer(buffer);
            this.landSound.setVolume(0.5);
            this.landSound.setLoop(false)
        });
        audioLoader.load('punch.mp3',(buffer)=> {
            this.punchSound.setBuffer(buffer);
            this.punchSound.setVolume(0.5);
            this.punchSound.setLoop(false)
        });
    }
    private playWalkSound():void {
        if (!this.walkSound.isPlaying) this.walkSound.play();
    }
    private playPunchSound():void {
        if (!this.punchSound.isPlaying) this.punchSound.play();
    }
    private playLandSound():void {
        if (!this.landSound.isPlaying) this.landSound.play();
    }
    public playSelectedSound():void {
        switch (this.soundToPlay) {
            case 'walk': {
                this.playWalkSound()
                break;
            }
            case 'land': {
                this.playLandSound();
                break;
            }
            case 'punch': {
                this.playPunchSound()
                break;
            }
        }
        this.soundToPlay = null;//we want to reset the state to null or else,it will be stuck playing the last selected sound over and over even if it isnt needed.
    } 
}