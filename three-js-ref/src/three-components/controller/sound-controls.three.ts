import * as THREE from "three"
import { listener } from "../listener/listener.three";
import { audioLoader } from "../listener/listener.three";

function trimAudioBuffer(originalBuffer:AudioBuffer, maxDurationSec:number, audioContext:AudioContext) {
    const sampleRate = originalBuffer.sampleRate;
    const channels = originalBuffer.numberOfChannels;
    const length = Math.min(originalBuffer.length, sampleRate * maxDurationSec);

    // Create a new buffer with the desired length and same format
    const trimmedBuffer = audioContext.createBuffer(
        channels,
        length,
        sampleRate
    );

    // Copy channel data up to maxDurationSec
    for (let channel = 0; channel < channels; channel++) {
        const sourceData = originalBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            trimmedData[i] = sourceData[i];
        }
    }
    return trimmedBuffer;
}
export type Sound = 'walk' | 'land' | 'punch';
export class SoundControls {
    public walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//the inheriting class can only access this sound through exposed methods
    public landSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity
    public punchSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);

    public soundToPlay:Sound | null = null;//The use of the null state for sound is similar to the one for animations where its used to remove the last sound state but unlike for teh animations where its used to signify no new animation transitions and its explicitly set by the caller,null only set here implicitly and its not used to prevent any new sound transitions but rather,to prevent any sound state from lingering more than its time.if we dont reset the sound state to null every frame,the old sound state will be playing constantly even when its not needed unless the caller explicitly states when no more sounds are needed
    constructor() {};

    public loadSounds() {
        audioLoader.load('walking.mp3',(buffer)=> {
            const trimmedBuffer = trimAudioBuffer(buffer, 1.0, listener.context);
            this.walkSound.setBuffer(trimmedBuffer);
            this.walkSound.setVolume(0.5);//The volumes here are multiplers of the computer's current volume-DO NOT INCREASE MORE THAN ONE
            this.walkSound.setLoop(false);
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
        console.log('walk duration: ',this.walkSound.buffer?.duration);
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
        this.soundToPlay = null;
    } 
}