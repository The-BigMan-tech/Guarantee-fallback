import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ItemBehaviour } from "../item-defintions";
import * as THREE from "three"
import { Camera } from "../../camera/camera.three";
import * as RAPIER from "@dimforge/rapier3d"
import { physicsWorld } from "../../physics-world.three";
import { disposeHierarchy } from "../../disposer/disposer.three";

interface DynamicBodyData {
    modelPath:string,
    mass:number,
    width:number,
    height:number,
    depth:number
}
function createBoxLine(width:number,height:number,depth:number) {
    const charGeometry = new THREE.BoxGeometry(width,height,depth);
    const charEdges = new THREE.EdgesGeometry(charGeometry);
    return new THREE.LineSegments(charEdges, new THREE.LineBasicMaterial({ color: 0x000000 }));
}
class ItemClone {
    public mesh:THREE.Group = new THREE.Group();
    public rigidBody:RAPIER.RigidBody | null

    constructor(clonedModel: THREE.Group,spawnPosition:THREE.Vector3,data:DynamicBodyData) {
        const box = new THREE.Box3().setFromObject(clonedModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        const scaleX = data.width / size.x;
        const scaleY = data.height / size.y;
        const scaleZ = data.depth / size.z;

        clonedModel.scale.set(scaleX, scaleY, scaleZ);

        this.mesh.add(clonedModel)
        this.mesh.position.copy(spawnPosition);

        const hitbox = createBoxLine(data.width,data.height,data.depth);
        this.mesh.add(hitbox)

        const cloneCollider = RAPIER.ColliderDesc.cuboid(data.width/2,data.height/2,data.depth/2);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic();
        cloneBody.mass = data.mass;
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        physicsWorld.createCollider(cloneCollider,this.rigidBody);
        this.rigidBody.setTranslation(spawnPosition,true)
        this.mesh.position.copy(this.rigidBody.translation());
    }
    public updateClone() {
        if (this.rigidBody) {
            this.mesh.position.copy(this.rigidBody.translation());
            this.mesh.quaternion.copy(this.rigidBody.rotation());
        }
    }
    public cleanUp() {
        DynamicBody.dynamicBodyGroup.remove(this.mesh)
        disposeHierarchy(this.mesh)
        if (this.rigidBody) {
            physicsWorld.removeRigidBody(this.rigidBody)
            this.rigidBody = null
        }
    }
}
class ItemUtils {
    constructor() {}
    public static getSpawnPosition(customCamera:Camera):THREE.Vector3 {
        const lookAtDistance = 5;
        const spawnPosition = new THREE.Vector3();// Calculate spawn position: camera position + camera forward vector * distance
        customCamera.cam3D.getWorldPosition(spawnPosition);             
        const forwardVector = new THREE.Vector3(0, 0,-1).applyQuaternion(customCamera.cam3D.getWorldQuaternion(new THREE.Quaternion()));
        forwardVector.multiplyScalar(lookAtDistance)
        spawnPosition.add(forwardVector);
        return spawnPosition;
    }
}
export class DynamicBody implements ItemBehaviour {
    private static modelLoader = new GLTFLoader();
    public  static dynamicBodyGroup:THREE.Group = new THREE.Group()
    //i made the clones static even though it makes sense to store clones per instance.this is so that i can access all the clones in one place for cleaning and updating instead of iterating through every item to do this
    public  static clones:ItemClone[] = []//this is for the player to get the looked at clone and dispose its reources when removing it

    private data:DynamicBodyData;
    private model:THREE.Group | null = null; 

    constructor(data:DynamicBodyData) {
        this.data = data;
        DynamicBody.modelLoader.load(this.data.modelPath,gltf=>{
            this.model = gltf.scene;
        })
    }
    public use(customCamera:Camera) {
        if (this.model) {
            const spawnPosition = ItemUtils.getSpawnPosition(customCamera)
            const clone = new ItemClone(this.model.clone(),spawnPosition,this.data)
            DynamicBody.dynamicBodyGroup.add(clone.mesh);
            DynamicBody.clones.push(clone)
        }
    }
    public static updateClones() {
        for (const clone of DynamicBody.clones) {
            clone.updateClone()
        }
    }
}