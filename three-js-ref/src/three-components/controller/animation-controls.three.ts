import * as THREE from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export class AnimationControls {
    //these are animation specific variables
    public mixer: THREE.AnimationMixer | null = null;//im only exposing this for cleanup purposes
    private currentAction: THREE.AnimationAction | null = null;
    private idleAction: THREE.AnimationAction | null = null;
    private walkAction: THREE.AnimationAction | null = null;
    private jumpAction:THREE.AnimationAction | null = null;
    private attackAction:THREE.AnimationAction | null = null;
    private deathAction:THREE.AnimationAction | null = null;

    constructor(characterModel: THREE.Group) {
        this.mixer = new THREE.AnimationMixer(characterModel);
    }
    public loadAnimations(gltf:GLTF):void {
        if (!this.mixer) return;
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
        const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
        const attackClip = THREE.AnimationClip.findByName(gltf.animations, 'attack'); 
        const deathClip = THREE.AnimationClip.findByName(gltf.animations, 'death'); 
    
        if (walkClip) this.walkAction = this.mixer.clipAction(walkClip);
        if (jumpClip) this.jumpAction = this.mixer.clipAction(jumpClip);
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
            this.idleAction.play();
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
        public playJumpAnimation():void {
        if (this.mixer && this.jumpAction) this.fadeToAnimation(this.jumpAction);
    }
    public playWalkAnimation():void {
        if (this.mixer && this.walkAction && this.attackAction && !this.attackAction.isRunning()) {
            this.fadeToAnimation(this.walkAction);
        }
    }
    public playIdleAnimation():void {//i made it public for use by classes composed by the entity
        if (this.mixer && this.idleAction && this.attackAction && this.walkAction) {
            if (!this.attackAction.isRunning() && !this.walkAction.isRunning()) {
                this.fadeToAnimation(this.idleAction);
            }
        };
    }
    public playAttackAnimation():void {
        if (this.mixer && this.attackAction && this.deathAction){
            if (!this.deathAction.isRunning()) {
                this.fadeToAnimation(this.attackAction);
            }
        }
    }
    public playDeathAnimation():void {
        if (this.mixer && this.deathAction) {
            this.fadeToAnimation(this.deathAction);
        }
    }
    public updateAnimations(clockDelta:number) {
        this.mixer?.update(clockDelta || 0);
    }
}