import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d"
import { outOfBoundsY, physicsWorld } from "../../../physics-world.three";
import { disposeHierarchy } from "../../../disposer/disposer.three";
import type { CloneArgs, CloneOwner, ItemID } from "./types";
import { getGroundDetectionDistance, VelCalcUtils } from "../../../controller/helper";
import { Health } from "../../../health/health";
import { createBoxLine, rotateOnXBy180 } from "../other-helpers.three";
import { RigidBodyClones } from "./rigidbody-clones.three";
import { type Player, player } from "../../../player/player.three";
import { IntersectionRequest } from "../../../player/intersection-request.three";
import { entities, type Entity, type EntityContract } from "../../../entity-system/entity.three";
import { relationshipManager } from "../../../entity-system/relationships.three";
import type { seconds } from "../../../entity-system/global-types";
import { groupIDs } from "../../../entity-system/entity-registry";
import type { EntityLike } from "../../../entity-system/relationships.three";

function visualizeRay(origin:THREE.Vector3, direction:THREE.Vector3, distance:number):THREE.Line {
    const endPoint = new THREE.Vector3().copy(origin).add(direction.clone().normalize().multiplyScalar(distance));
    const points = [origin, endPoint];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red color
    const rayLine = new THREE.Line(geometry, material);
    return rayLine;
}

//Note:The lifetime of a rigid body clone is tied to its durability,proximity,ownership,and indirectly by the loaded chunk since theyll just fall off the unloaded chunk and despawn or manually removed like those from the chunk loader
//Using my rigod body clones class for in game object comes with the perk of lifetime management so the caller never needs to concern itself with how they are managed for perf
//Note:The Controller and RigidBodyClone class are what ill be using and i recoomend to use to create dynamic physics bodies because they have a simple api while providing management underneath.The controler is for dynamic bodies that are controlled by a living entity while rigid body clone are for game objects 
export class RigidBodyClone {
    public   group:THREE.Group = new THREE.Group();//this where the clone's model is actualy stored.use this to sync with the rigid body and know the mesh's current data liek position or rotation.using the container for this type of task will lead to problems
    private  container:THREE.Group = new THREE.Group();//this is just a container used to add and remove the group to and from a parent to ensure that its world transform is correct by using the attatch method.it is meant to be unique per clone because this clone class should never take the responsibility of parenting itself or other clones by using a static group variable.doing so will break it because the same group will be added to multiple parents and will cause lots of issues
    private  parent:THREE.Group;

    public  rigidBody:RAPIER.RigidBody | null;


    private handle:number;
    private height:number;
    private density:number;

    private spinApplied = false;
    private spinVectorInAir:THREE.Vector3;//this is a unit vector used to determine which component the spin velocity is applied.each component is like a flag to decide whether to apply spin in this axis or not
    private static readonly addHitbox:boolean = false;
    private static readonly addRay:boolean = false;

    public durability:Health;//i reused the health class for durability because its literally the same functionality.so im leveraging code reuse but i renamed it to durability for clarity that it isnt a living entity

    private velCalcUtils:VelCalcUtils = new VelCalcUtils();

    private despawnRadius:number = 500;

    private intersectionRequest = new IntersectionRequest();
    private rayGroup:THREE.Group = new THREE.Group();
    private _itemID:ItemID;
    private _canPickUp:boolean;

    private owner:CloneOwner | null;//the null is used to allow the owner to be garbage collected when the owner is dead

    private addRelationship = relationshipManager.addRelationship;

    public static createClone(args:CloneArgs):RigidBodyClone {//i made a separate method for creating an item clone without the constructor because a behaviour may or may not even need the clone instance at all.the item clone class will already add the clone to the scene and update it at every loop.so there is isnt any management the behaviour class has to do with the clone after creating it.they can just use the exposed method to perform actions on the clone like applying knockback
        return new RigidBodyClone(args)
    }
    private constructor(args:CloneArgs) {
        const {model,spawnPosition,spawnQuaternion,properties,spinVectorInAir,parent,itemID,canPickUp,owner} = args;
        this.parent = parent;
        this._itemID = itemID;
        this.owner = owner;

        this._canPickUp = canPickUp;
        this.height = properties.height;
        this.density = properties.density;
        this.spinVectorInAir = spinVectorInAir.normalize();//i normalized it to ensure its a unit vector
        const clonedModel = model.clone(true);
        const box = new THREE.Box3().setFromObject(clonedModel);
        const size = new THREE.Vector3();
        box.getSize(size);

        const scaleX = properties.width / size.x;
        const scaleY = properties.height / size.y;
        const scaleZ = properties.depth / size.z;

        clonedModel.scale.set(scaleX, scaleY, scaleZ);
        clonedModel.position.y -= properties.height / 2;

        this.group.add(this.rayGroup);
        this.group.add(clonedModel);
        this.group.position.copy(spawnPosition);

        const hitbox = createBoxLine(properties.width,properties.height,properties.depth);//this is for debugging
        if (RigidBodyClone.addHitbox) this.group.add(hitbox);

        const cloneCollider = RAPIER.ColliderDesc.cuboid(properties.width/2,properties.height/2,properties.depth/2).setDensity(properties.density);
        const cloneBody = RAPIER.RigidBodyDesc.dynamic()
        this.rigidBody = physicsWorld.createRigidBody(cloneBody);
        this.handle = physicsWorld.createCollider(cloneCollider,this.rigidBody).handle;

        this.rigidBody.setTranslation(spawnPosition,true);
        this.rigidBody.setRotation(spawnQuaternion.clone().multiply(rotateOnXBy180()),true);//i rotated it by 180 so that it faces the player on spawn because directly making the clone rotation the player's quaternion will make it face where the player is facing not at the player.

        this.group.position.copy(this.rigidBody.translation());
        this.group.quaternion.copy(this.rigidBody.rotation());

        this.durability = new Health(properties.durability);

        RigidBodyClones.clones.push(this);//automatically push the clone to the clones array for updating
        RigidBodyClones.cloneIndices.set(this,RigidBodyClones.clones.length-1);//add its index to the map for removal
        this.container.add(this.group);
        this.parent.attach(this.container)//add it to the parent group to be shown in the scene.i used attatch here instead of the add method so that i can include the meshes in the parent for management while still having them use world space cords because my item clone class expects that the parent group is at world cords and if i used the add method here,the cords of the group will shift which will cause sync bugs and i dont have to worry my class about using local or world space for the mesh and rigid bpdy separately
    }


    private applySpin(onGround:boolean) {
        if (onGround) {
            this.spinApplied = false;//its on the ground so we need to reset it so that spin can apply again after next throw
        }
        else if (this.rigidBody && !this.spinApplied) {
            const baseSpinVelocity = 100;
            const spinMagnitude = baseSpinVelocity / this.rigidBody.mass();//we are making this inversely proportional because the point here isnt to make all objects of all masses to spin like a ball but to make objects that can spin to spin while heavier ones shouldnt
            const spinVelocity = new THREE.Vector3(
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude,
              (Math.random() - 0.5) * spinMagnitude
            ).multiply(this.spinVectorInAir);
            this.rigidBody.setAngvel(spinVelocity, true);//i directly set the ang vel here over applying torque because doing so wont produce the desired effects because rapier also does its own calc before applying it
            this.spinApplied = true;//to prevent applying a spin to the body when one is already applied.we reset it here to ensure that its only set to true when its guaranteed that this method applied the torque
            console.log('spin applied');
        }
    }

    //Note:the reason why the ground calc that works for this class is different from that of the controller is most likely because of the volume or shape of the colliders i used.for the controller,i used capsule even though i provided the option for box.and for this class,it uses a box collider
    private isGrounded():boolean {
        if (this.rigidBody?.isSleeping()) return true;//if it sleeps,its grounded.so we can skip the computation here.
        const groundDetectionDistance = getGroundDetectionDistance(this.height)
        const groundPoint = (this.group.position.y - groundDetectionDistance) + ((this.height%2)*0.5);//took into account the parity of the height
        const groundPos = this.group.position.clone().setY(groundPoint);
        console.log('spin. groundPoint:', groundPoint);

        let onGround = false
        physicsWorld.intersectionsWithPoint(groundPos, (colliderObject) => {
            if (this.handle==colliderObject.handle) return true//avoid clone's own collider
            onGround = true;
            return false;
        })
        return onGround
    }


    public knockbackClone(sourcePosition:THREE.Vector3,strength:number) {
        const direction = new THREE.Vector3().subVectors(this.rigidBody!.translation(), sourcePosition).normalize();
        const impulse = direction.multiplyScalar(strength)
        this.rigidBody!.applyImpulse(impulse, true);
    }

    private applyGroundDamage(onGround:boolean) {
        const velocityY = this.rigidBody!.linvel().y;
        const velBeforeHittingGround = this.velCalcUtils.getVelJustAboveGround(velocityY,onGround)
        this.durability.checkGroundDamage(velBeforeHittingGround);
    }

    private checkIfOutOfBounds() {
        if (this.rigidBody!.translation().y <= outOfBoundsY) {
            this.durability.takeDamage(this.durability.value);//this will make it to be cleaned up because its durability is 0.i didnt use a direct cleanup here because another method in the update loop already calls cleanup directly and calling cleanup in that if block of the update loop will cause other methods that rely on the rigid body to fail.so direct cleanup inside the if block of the update loop that executes it should be called last.so why cant i just do this also in check for ownership?well,its just a taste
        }
    }

    private despawnSelfIfFar() {
        const distance = player.position.distanceTo(this.group.position);
        if (distance > this.despawnRadius) {
            this.cleanUp()
        }
    }


    private requestIntersectedClone(maxDistance:number):RigidBodyClone | null {
        return this.intersectionRequest.requestObject({
            raycaster: this.raycaster,
            testObjects:RigidBodyClones.clones.map(clone=>clone.group),
            maxDistance,
            selection:RigidBodyClones.clones,
            self:this.group
        });
    }
    private requestIntersectedEntity(maxDistance:number):Entity | null {
        const entityWrapper:EntityContract | null = this.intersectionRequest.requestObject({
            raycaster: this.raycaster,
            testObjects:entities.map(e => e._entity.char),
            maxDistance,
            selection:entities,
            self:this.group
        });
        return entityWrapper?._entity || null
    }
    private requestIntersectedPlayer(maxDistance:number):Player | null {
        return this.intersectionRequest.requestObject({
            raycaster: this.raycaster,
            testObjects:[player.char],
            maxDistance,
            selection:[player],
            self:this.group
        });
    }
    private updateRayVisualizer(origin:THREE.Vector3,velDirection:THREE.Vector3) {
        disposeHierarchy(this.rayGroup);
        this.rayGroup.clear();
        if (RigidBodyClone.addRay) {
            const rayLine = visualizeRay(origin, velDirection,10);
            this.rayGroup.attach(rayLine);
        }
    }
    private isEntityLike(owner:CloneOwner | null):owner is EntityLike {
        return Boolean(owner && (owner !== "Game"));
    }
    private raycaster:THREE.Raycaster = new THREE.Raycaster();
    private static readonly knockbackScalar = 150;

    private knockbackObjectsAlongPath(onGround:boolean) {
        const velDirection = this.velCalcUtils.getVelocityDirection(this.rigidBody!,onGround);
        console.log('impact. direction: ',velDirection);
        
        if (!velDirection.equals(new THREE.Vector3(0,0,0))) {
            const origin = new THREE.Vector3().copy(this.rigidBody!.translation()); // Get the position of the rigid body
            const maxDistance = 10;
            this.raycaster.set(origin.clone(),velDirection);
            
            const knockbackImpulse = this.density * RigidBodyClone.knockbackScalar;
            const knockbackSrcPos = origin.clone().multiply(new THREE.Vector3(1,-2,1));//i used -2 to shoot the target upwards even more.
            
            const clone = this.requestIntersectedClone(maxDistance);
            clone?.knockbackClone(knockbackSrcPos,knockbackImpulse);
            clone?.durability.takeDamage(this.density);

            const playerObject = this.requestIntersectedPlayer(maxDistance);
            playerObject?.knockbackCharacter(knockbackSrcPos,knockbackImpulse);
            playerObject?.health.takeDamage(this.density);
            
            const entity = this.requestIntersectedEntity(maxDistance);
            entity?.knockbackCharacter(knockbackSrcPos,knockbackImpulse);
            entity?.health.takeDamage(this.density);

            if (this.isEntityLike(this.owner) && entity) {
                this.addRelationship(entity,relationshipManager.enemyOf[this.owner._groupID!]);
                this.addRelationship(this.owner,relationshipManager.attackerOf[entity._groupID!]);
            }
            this.updateRayVisualizer(origin,velDirection);
        }
    }
    private removeTemporaryCloneCooldown:seconds = 5;
    private removeTemporaryCloneTimer:seconds = 0;

    private checkForOwnership() {
        const doesPlayerOwnIt = this.isEntityLike(this.owner) && (this.owner._groupID === groupIDs.player);
        const isOwnerDead = this.isEntityLike(this.owner) && this.owner.health.isDead;
        if (isOwnerDead) {
            console.log('owner is dead');
            this.owner = null//remove any reference to the entity when its dead to allow for garbage collection but we dont want to cleanup the body just because the entity is dead
        }
        if (this.owner !== 'Game' && !doesPlayerOwnIt) {//im considering a clone spawned by any entity besides the player as temporary because entity spawned items can get a lot like when an entity throws a boulder at the player and the items arent really useful after that.The player's own is persistent until it gets cleaned up naturally because player spanwed bodies are a first priority cuz they can build something but they dont expect it to just get vanished.Any rigid body spawned by the game gets the same treatment as the player
            if (this.removeTemporaryCloneTimer > this.removeTemporaryCloneCooldown) {
                this.cleanUp();
                this.removeTemporaryCloneTimer = 0;
            } 
        }
    }

    private isRemoved = false;//to ensure resources are cleaned only once 
    public updateClone(deltaTime:number) {
        //This MUST NOT be called inside the below if block because if it is far,it will be cleaned up.but that will be dangerous if done inside the below if block because the below block continues to run its code with the expectation that the rigid body isnt null and cleaning it directly inside this block will cause errors in parts of the block that uses the rigid body
        this.despawnSelfIfFar();//the reason why i made each clone responsible for despawning itself unlike the entity system where the manager despawns far entities is because i dont want to import the player directly into the class that updates the clones because the player also imports that.so its to remove circular imports
        if (this.rigidBody && !this.isRemoved) {
            this.removeTemporaryCloneTimer += deltaTime;
            const rigidBodyQuaternion = new THREE.Quaternion().copy(this.rigidBody.rotation());
            const isMeshOutOfSync =  !this.group.position.equals(this.rigidBody.translation()) || !this.group.quaternion.equals(rigidBodyQuaternion);
            
            if (!this.durability.isDead || isMeshOutOfSync) {
                const onGround = this.isGrounded();
                this.group.position.copy(this.rigidBody.translation());
                this.group.quaternion.copy(this.rigidBody.rotation());
                this.checkIfOutOfBounds();
                this.applySpin(onGround)
                this.knockbackObjectsAlongPath(onGround);
                this.applyGroundDamage(onGround);  
                console.log('spin. is Body sleeping: ',this.rigidBody.isSleeping());
                console.log('spin. is Body grounded: ',onGround);
                this.checkForOwnership();//must be called last because it can call cleanup which will make other methods that rely on the rigid body to fail.so doing this last ensures that the next time the update loop runs,it stops execution without causing errors
            }else{//i dont have a cleanup cooldown unlike my entities to simulate other things before cleanup because the cooldown may not be big enough to allow a physics simulation to happen on the body like a knockback before cleanup or it may be too big which will cause it to linger in memory longer after its supposed to be cleaned up.The reason why this was acceptable for my entity is because my entity has an animation that will complete before the cooldown runs out and cleans the entity.but for this class,since i dont have any death animation cuz they are just non living objects,i have to allow teh physics at that moment to simulate before cleanup which a timer cant do predictably.so by including is meh out of sync,i ensure i only clean a body only after all physics at that moment has simulated on the body by checking if the mesh is perfectly in sync with the body.this allows things like knockbackt to simulate before cleanup even though its durability has been damaged to zero.
                this.cleanUp();
            }
        }
    }


    private removeFromClones() {//used swap and pop delete for O(1) deletion
        const index = RigidBodyClones.cloneIndices.get(this)!;
        const lastIndex = RigidBodyClones.clones.length - 1;
        if (index < lastIndex) {
            const lastClone = RigidBodyClones.clones[lastIndex];
            RigidBodyClones.clones[index] = lastClone;
            RigidBodyClones.cloneIndices.set(lastClone,index)
        }
        RigidBodyClones.clones.pop();
        RigidBodyClones.cloneIndices.delete(this);
        console.log('rigid. clones: ',RigidBodyClones.clones.length);
        console.log('rigid. clones indices: ',RigidBodyClones.cloneIndices.size);
    }


    public cleanUp() {
        this.parent.remove(this.container);
        disposeHierarchy(this.container);
        this.removeFromClones();
        this.owner = null;//dont reference the owner again upon cleanup to allow the owner to be garbage collected when its time comes
        if (this.rigidBody) {
            physicsWorld.removeRigidBody(this.rigidBody)
            this.rigidBody = null
        }
        this.isRemoved = true;
        console.log('rigid. cleaned up block');
    }

    public get itemID():ItemID {
        return this._itemID
    }
    public get canPickUp():boolean {
        return this._canPickUp;
    }
    public interact?:()=>void//a hook i will integrate with the clone for custom interactions after spawning the clone per behaviour.for example,an explosive behaviour doesnt make an item an explosive.it only spawns a rigid body clone.so what it can do is to modify the hook of this clone to cause an explosion making this clone an explosive without the clone being inherited or derived from the explosive behaviour itself.it will remain as a clone
}
