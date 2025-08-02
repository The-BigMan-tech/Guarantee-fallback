import * as THREE from "three"
import { listener } from "../listener/listener.three";
import { audioLoader } from "../listener/listener.three";
import type { seconds } from "../entity-system/global-types";

export type Sound = 'walk' | 'land' | 'punch';

export class SoundControls {
    public walkSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//the inheriting class can only access this sound through exposed methods
    public landSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);;//this is the only sound managed internally by the controller because it relies on grounded checks to set properly which i dont want to expose to the inheriting class for simplicity
    public punchSound: THREE.PositionalAudio = new THREE.PositionalAudio(listener);

    public soundToPlay:Sound | null = null;//The use of the null state for sound is similar to the one for animations where its used to remove the last sound state but unlike for teh animations where its used to signify no new animation transitions and its explicitly set by the caller,null only set here implicitly and its not used to prevent any new sound transitions but rather,to prevent any sound state from lingering more than its time.if we dont reset the sound state to null every frame,the old sound state will be playing constantly even when its not needed unless the caller explicitly states when no more sounds are needed.so what i did was to always set it to null to clear a sound as soon as its played.but it doesnt mean that no new sound trasitions can be made.and also,the code also stops all playing sounds when the state is null to ensure that sounds are only played exactly in the frame they are needed to prevent a sound of 10 seconds from playing for 10 seconds after it was called.but for a sound like rroaraing that could be 5 seconds,what the caller needs to ensure for that sound to play fully is to set the state to roar sound for five seconds which will prevent the roar sound from being stopped prematurely because now,a non-null sound state prevents the sound from stopping and the code also ensures it doesnt start from the begining of the sound each transition because it respects if the sound is currently playing.this design choice ensures predictability 
    private audios:THREE.PositionalAudio[] = [
        this.walkSound,
        this.punchSound,
        this.landSound
    ];
    constructor() {};

    public loadSounds() {
        audioLoader.load('walking.mp3',(buffer)=> {
            this.walkSound.setBuffer(buffer);
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
    private stopSounds() {
        const minDuration:seconds = 1;//we want to only stop sounds that cant be played and stopped at the time it was called to prevent them from lingering.check my comment next to the sound state variable to know why.
        for (const audio of this.audios) {
            if ((Number(audio.buffer?.duration) > minDuration) && audio.isPlaying) {
                audio.stop();
            }
        }
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
            case null: {
                this.stopSounds();
                break;
            }
        }
        this.soundToPlay = null;
    } 
}