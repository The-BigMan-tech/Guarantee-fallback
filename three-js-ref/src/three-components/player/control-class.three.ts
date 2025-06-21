import * as THREE from "three"
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { AnimationMixer } from 'three';
import * as RAPIER from '@dimforge/rapier3d'
import { physicsWorld} from "../physics-world.three";

interface FixedControllerData {
    modelPath:string,
    spawnPoint: RAPIER.Vector3,
    characterHeight:number,
    characterWidth:number,
    mass:number,
    groundDetectionDistance:number,
    stepCheckDistance:number,
    camera:THREE.Object3D<THREE.Object3DEventMap> | null
}
interface DynamicControllerData {
    maxStepUpHeight:number,
    jumpVelocity:number,
    jumpResistance:number,
    horizontalVelocity:number,
    rotationDelta:number,
    rotationSpeed:number,
}
class Controller {
    public  dynamicData:DynamicControllerData;
    private fixedData:FixedControllerData;
    private preUpdate:()=>void;

    private velocity:THREE.Vector3;
    private targetRotation:THREE.Euler;
    private targetQuaternion:THREE.Quaternion;
    private character: THREE.Group<THREE.Object3DEventMap>
    private characterPosition:RAPIER.Vector3
    private characterCollider: RAPIER.ColliderDesc
    private characterBody: RAPIER.RigidBodyDesc;
    private characterRigidBody:RAPIER.RigidBody;
    private clock:THREE.Clock;
    private mixer: THREE.AnimationMixer;
    private currentAction: THREE.AnimationAction | null;
    private idleAction: THREE.AnimationAction | null;
    private walkAction: THREE.AnimationAction | null;
    private jumpAction:THREE.AnimationAction | null;
    private listener: THREE.AudioListener;
    private walkSound: THREE.PositionalAudio
    private landSound: THREE.PositionalAudio;
    private shouldPlayJumpAnimation: boolean;
    private obstacleHeight: number
    private shouldStepUp: boolean
    private playLandSound: boolean

    constructor(fixedData:FixedControllerData,dynamicData:DynamicControllerData,preUpdate:()=>void) {
        this.fixedData = fixedData
        this.dynamicData = dynamicData
        this.preUpdate = preUpdate
        this.velocity = new THREE.Vector3(0,0,0);
        this.targetRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.targetQuaternion = new THREE.Quaternion();
        this.character = new THREE.Group();
        this.characterPosition = this.fixedData.spawnPoint
        this.characterCollider = RAPIER.ColliderDesc.capsule(this.fixedData.characterHeight/2,this.fixedData.characterWidth)
        this.characterBody = RAPIER.RigidBodyDesc.dynamic()
        this.characterBody.mass = this.fixedData.mass;
        this.characterRigidBody = physicsWorld.createRigidBody(this.characterBody);
        physicsWorld.createCollider(this.characterCollider,this.characterRigidBody);
        this.characterRigidBody.setTranslation(this.characterPosition,true);
        this.clock = new THREE.Clock();
        this.currentAction = null
        this.idleAction = null
        this.walkAction = null
        this.jumpAction = null
        this.listener = new THREE.AudioListener();
        this.walkSound = new THREE.PositionalAudio(this.listener);
        this.landSound = new THREE.PositionalAudio(this.listener);
        this.shouldPlayJumpAnimation = false;
        this.obstacleHeight = 0;
        this.shouldStepUp = false
        this.playLandSound = true
        this.loadCharacterModel()
    }
    private loadCharacterModel() {
        const loader:GLTFLoader = new GLTFLoader();
        loader.load(this.fixedData.modelPath,
            gltf=>{
                const characterModel = gltf.scene
                characterModel.position.z = 0.3
                this.character.add(characterModel);
                if (this.fixedData.camera) this.character.add(this.fixedData.camera)
                this.character.add(this.listener)
                this.mixer = new AnimationMixer(characterModel);
                this.loadCharacterAnimations(gltf);
                loadCharacterSounds();
            },undefined, 
            error =>console.error( error ),
        );
    }
    private loadCharacterAnimations(gltf:GLTF) {
        const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'idle');
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'sprinting'); 
        const jumpClip = THREE.AnimationClip.findByName(gltf.animations, 'jumping'); 
    
        if (walkClip) this.walkAction = this.mixer.clipAction(walkClip);
        if (jumpClip) this.jumpAction = this.mixer.clipAction(jumpClip);
        if (idleClip) {
            this.idleAction = this.mixer.clipAction(idleClip);
            this.idleAction.play();
            this.currentAction = this.idleAction;
        }
    }
}