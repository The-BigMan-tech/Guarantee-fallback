import * as THREE from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Guard } from "../phase-manager";

export type Animation = 'idle' | 'sprint' | 'jump' | 'attack' | 'death' | 'throw'

interface AnimationFinishedEvent {
    type:'finished',
    action:THREE.AnimationAction,
    direction:number
}
export class AnimationControls {
    //these are animation specific variables
    public  mixer: THREE.AnimationMixer | null = null;//im only exposing this for cleanup purposes
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private sprintAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;
    private attackAction:THREE.AnimationAction | null = null;
    private deathAction:THREE.AnimationAction | null = null;
    private throwAction:THREE.AnimationAction | null = null;


    private idleClip: THREE.AnimationClip | null = null;
    private sprintClip: THREE.AnimationClip | null = null;
    private attackClip: THREE.AnimationClip | null = null
    private deathClip: THREE.AnimationClip | null = null;
    private jumpClip: THREE.AnimationClip | null = null;
    private throwClip: THREE.AnimationClip | null = null;

    public animationToPlay:Guard<Animation | null,null>;//a null animation state is used to cancel out any previous animation state and thus have no new animation play again.its used to ensure whaterver animation is played on the model currently doesnt get changed by a new animation state and thus remains.like having the death animation to remain when an entity is dead

    constructor(characterModel: THREE.Group) {
        this.mixer = new THREE.AnimationMixer(characterModel);
        this.mixer.addEventListener('finished',this.onFinish);
        this.animationToPlay = new Guard(null);
    }
    public setAnimation(nextAnimation:Animation) {
        this.animationToPlay.guard(['write','update'],(ref)=>{
            console.log('trying animation:', nextAnimation);
            ref.value = nextAnimation;
        })
    }
    private onFinish = (event:AnimationFinishedEvent)=>{
        if (event.action === this.sprintAction) {
            if (this.animationToPlay.copy() === 'sprint') {
                this.sprintAction.reset();
            }
        }
    }
    public loadAnimations(gltf:GLTF):void {
        if (!this.mixer) return;
        this.idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        this.sprintClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
        this.jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
        this.attackClip = THREE.AnimationClip.findByName(gltf.animations, 'attack'); 
        this.deathClip = THREE.AnimationClip.findByName(gltf.animations, 'death'); 
        this.throwClip = THREE.AnimationClip.findByName(gltf.animations, 'throw'); 

        if (this.sprintClip) {
            this.sprintAction = this.mixer.clipAction(this.sprintClip);
            this.sprintAction.setLoop(THREE.LoopOnce, 1);
            this.sprintAction.clampWhenFinished = true;
        }
        if (this.jumpClip) {
            this.jumpAction = this.mixer.clipAction(this.jumpClip);
        }
        if (this.attackClip) {
            this.attackAction = this.mixer.clipAction(this.attackClip);
            this.attackAction.setLoop(THREE.LoopOnce, 1);
            this.attackAction.clampWhenFinished = true;
        }
        if (this.throwClip) {
            this.throwAction = this.mixer.clipAction(this.throwClip);
            this.throwAction.setLoop(THREE.LoopOnce, 1);
            this.throwAction.clampWhenFinished = true;
        }
        if (this.deathClip) {
            this.deathAction = this.mixer.clipAction(this.deathClip);
            this.deathAction.setLoop(THREE.LoopOnce, 1);
            this.deathAction.clampWhenFinished = true;
        }
        if (this.idleClip) {
            this.idleAction = this.mixer.clipAction(this.idleClip);
            this.currentAction = this.idleAction;
        }
    }

    private fadeToAnimation(newAction: THREE.AnimationAction | null):void {
        if (newAction && ((newAction !== this.currentAction))) {
            newAction.reset();
            newAction.play();
            if (this.currentAction) this.currentAction.crossFadeTo(newAction, 0.4, false);
            this.currentAction = newAction;
        }
    }
    private playJumpAnimation():void {
        this.fadeToAnimation(this.jumpAction);
    }
    private playSprintAnimation():void {
        this.fadeToAnimation(this.sprintAction);
    }
    private playIdleAnimation():void {//i made it public for use by classes composed by the entity
        this.fadeToAnimation(this.idleAction);
    }
    private playAttackAnimation():void {
        this.fadeToAnimation(this.attackAction);//i used null assertion here but optional chaining in the if condition to make the ! sign i used for negation clear.
    }
    private playDeathAnimation():void {
        this.fadeToAnimation(this.deathAction);
    }
    private playThrowAnimation():void {
        this.fadeToAnimation(this.throwAction);
    }
    get attackDuration():number {
        return this.attackClip?.duration || 0;
    }
    get deathDuration():number {
        return this.deathClip?.duration || 0;
    }
    get throwDuration():number {
        return this.throwClip?.duration || 0;
    }
    private playAnimation():void {
        switch (this.animationToPlay.copy()) {
            case 'idle': {
                this.playIdleAnimation()
                break;
            }
            case 'jump': {
                this.playJumpAnimation();
                break;
            }
            case 'sprint': {
                this.playSprintAnimation()
                break;
            }
            case 'attack': {
                this.playAttackAnimation();
                break;
            };
            case 'throw': {
                this.playThrowAnimation();
                break;
            }
            case 'death': {
                this.playDeathAnimation();
                break;
            }
        }  
    } 
    public updateAnimations(clockDelta:number) {
        if (this.mixer) {//only update animations if the mixer is still available.the reason why im checking the mixer state every frame is because the mixer can be removed at any point in the controller when its no longer needed like upon death
            console.log('playing animation: ',this.animationToPlay.copy());
            this.playAnimation();
            this.mixer.update(clockDelta || 0);
        }
    }
}