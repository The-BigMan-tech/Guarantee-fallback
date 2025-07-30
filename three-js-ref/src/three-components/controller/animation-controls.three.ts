import * as THREE from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

type animations = 'idle' | 'sprint' | 'jump' | 'attack' | 'death'

interface AnimationFinishedEvent {
    type:'finished',
    action:THREE.AnimationAction,
    direction:number
}
export class AnimationControls {
    //these are animation specific variables
    public mixer: THREE.AnimationMixer | null = null;//im only exposing this for cleanup purposes
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private sprintAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;
    private attackAction:THREE.AnimationAction | null = null;
    private deathAction:THREE.AnimationAction | null = null;
    private animationsHasLoaded:boolean = false;

    public animationToPlay:animations = 'idle';

    constructor(characterModel: THREE.Group) {
        this.mixer = new THREE.AnimationMixer(characterModel);
        this.mixer.addEventListener('finished',this.onFinish)
    }
    private onFinish = (event:AnimationFinishedEvent)=>{
        if (event.action === this.sprintAction) {
            if (this.animationToPlay === 'sprint') {
                this.sprintAction.reset();
            }
        }
    }
    public loadAnimations(gltf:GLTF):void {
        if (!this.mixer) return;
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const sprintClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
        const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
        const attackClip = THREE.AnimationClip.findByName(gltf.animations, 'attack'); 
        const deathClip = THREE.AnimationClip.findByName(gltf.animations, 'death'); 
    
        if (sprintClip) {
            this.sprintAction = this.mixer.clipAction(sprintClip);
            this.sprintAction.setLoop(THREE.LoopOnce, 1);
            this.sprintAction.clampWhenFinished = true;
        }
        if (jumpClip) {
            this.jumpAction = this.mixer.clipAction(jumpClip);
            this.jumpAction.setLoop(THREE.LoopOnce, 1);
            this.jumpAction.clampWhenFinished = true;
        }
        if (attackClip) {
            this.attackAction = this.mixer.clipAction(attackClip);
            this.attackAction.setLoop(THREE.LoopOnce, 1);
            this.attackAction.clampWhenFinished = true;
        }
        if (deathClip) {
            this.deathAction = this.mixer.clipAction(deathClip);
            this.deathAction.setLoop(THREE.LoopOnce, 1);
            this.deathAction.clampWhenFinished = true;
        }
        if (idleClip) {
            this.idleAction = this.mixer.clipAction(idleClip);
            this.currentAction = this.idleAction;
        }
    }
    private fadeToAnimation(newAction: THREE.AnimationAction):void {
        if (newAction !== this.currentAction) {
            newAction.reset();
            newAction.play();
            if (this.currentAction) this.currentAction.crossFadeTo(newAction, 0.4, false);
            this.currentAction = newAction;
        }
    }
    private playJumpAnimation():void {
        if (!this.attackAction!.isRunning()) {
            this.fadeToAnimation(this.jumpAction!);
        }
    }
    private playSprintAnimation():void {
        if (!this.attackAction?.isRunning()) {
            this.fadeToAnimation(this.sprintAction!);
        }
    }
    private playIdleAnimation():void {//i made it public for use by classes composed by the entity
        if (!(this.attackAction!.isRunning() || this.sprintAction!.isRunning() || this.jumpAction!.isRunning() || this.deathAction!.isRunning())) {
            this.fadeToAnimation(this.idleAction!);
        }
    }
    private playAttackAnimation():void {
        if (! this.deathAction!.isRunning()) {
            this.fadeToAnimation(this.attackAction!);
        } 
    }
    private playDeathAnimation():void {
        this.fadeToAnimation(this.deathAction!);
    }
    private playAnimation():void {
        switch (this.animationToPlay) {
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
            }
            case 'death': {
                this.playDeathAnimation()
                break;
            }
        }
    } 
    public updateAnimations(clockDelta:number) {
        if (!this.animationsHasLoaded) {
            this.animationsHasLoaded = Boolean(this.mixer && this.idleAction && this.attackAction && this.sprintAction  && this.jumpAction && this.deathAction);
        }else {//only update animations if they have loaded
            this.playAnimation();
            this.mixer?.update(clockDelta || 0);
        }
    }
}