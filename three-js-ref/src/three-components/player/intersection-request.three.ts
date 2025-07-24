import * as THREE from "three"

export class IntersectionRequest {//to request if a looked at object is any one of the given objects
    constructor() {};
    private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
        let current = child;
        while (current) {
            if (current === parent) return true;
            current = current.parent!;
        }
        return false;
    }
    public requestObject<T>(args:{raycaster:THREE.Raycaster,testObjects:THREE.Object3D[],maxDistance:number,selection:T[],self:THREE.Object3D}):T | null {
        const {raycaster,testObjects,maxDistance,selection} = args
        const intersects = raycaster.intersectObjects(testObjects, true);

        if (intersects.length > 0 && (intersects[0].distance <= maxDistance)) {
            const intersectedObject = intersects[0].object;// Find which entity corresponds to the intersected object
            for (const [index,object] of testObjects.entries()) {
                if (args.self === object) {//skip intersection test with the object performing the query to prevent false positives
                    continue;
                }else if (this.isDescendantOf(intersectedObject,object)) {
                    return selection[index]
                }
            }
        }
        return null;
    }
}