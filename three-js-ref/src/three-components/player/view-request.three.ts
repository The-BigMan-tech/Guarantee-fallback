import * as THREE from "three"

export class ViewRequest {
    private raycaster = new THREE.Raycaster();
    private mouseCords:THREE.Vector2;

    constructor(mouseCords:THREE.Vector2) {
        this.mouseCords = mouseCords
    }
    private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
        let current = child;
        while (current) {
            if (current === parent) return true;
            current = current.parent!;
        }
        return false;
    }
    public requestObject<T>(args:{nativeCamera:THREE.Camera,testObjects:THREE.Group[],maxDistance:number,selection:T[]}):T | null {
        const {nativeCamera,testObjects,maxDistance,selection} = args
        this.raycaster.setFromCamera(this.mouseCords,nativeCamera);
        const intersects = this.raycaster.intersectObjects(testObjects, true);

        if (intersects.length > 0 && (intersects[0].distance <= maxDistance)) {
            const intersectedObject = intersects[0].object;// Find which entity corresponds to the intersected object
            for (const [index,object] of testObjects.entries()) {
                if (this.isDescendantOf(intersectedObject,object)) {
                    return selection[index]
                }
            }
        }
        return null;
    }
}