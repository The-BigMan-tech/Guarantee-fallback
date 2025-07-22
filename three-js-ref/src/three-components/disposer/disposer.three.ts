import * as THREE from "three";


function disposeMaterial(material: THREE.Material) {
    const disposeTexture = (tex: THREE.Texture | null) => {
        if (tex != null) { // checks for both null and undefined
            tex.dispose();
            console.log('disposed textures');
        }
    };
    // Check material type and dispose known texture maps accordingly
    if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
        disposeTexture(material.map);
        disposeTexture(material.alphaMap);
        disposeTexture(material.aoMap);
        disposeTexture(material.bumpMap);
        disposeTexture(material.displacementMap);
        disposeTexture(material.emissiveMap);
        disposeTexture(material.envMap);
        disposeTexture(material.lightMap);
        disposeTexture(material.metalnessMap);
        disposeTexture(material.normalMap);
        disposeTexture(material.roughnessMap);
    }else if (material instanceof THREE.MeshPhongMaterial || material instanceof THREE.MeshToonMaterial) {
        disposeTexture(material.map);
        disposeTexture(material.alphaMap);
        disposeTexture(material.aoMap);
        disposeTexture(material.bumpMap);
        disposeTexture(material.displacementMap);
        disposeTexture(material.emissiveMap);
        disposeTexture(material.lightMap);
        disposeTexture(material.normalMap);
        if (material instanceof THREE.MeshPhongMaterial) {
            disposeTexture(material.specularMap);  // specularMap exists here
        }
        if (material instanceof THREE.MeshToonMaterial) {
            disposeTexture(material.gradientMap);
        }
    }else if (material instanceof THREE.MeshBasicMaterial) {
        disposeTexture(material.map);
        disposeTexture(material.lightMap);
        disposeTexture(material.alphaMap);
    }
    // Add more material types as needed
    material.dispose();
}
export function disposeMixer(mixer:THREE.AnimationMixer | null):null {
    if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
    }
    return null
}
export function disposeHierarchy(object: THREE.Object3D) {
    object.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
            (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
                material.forEach((m) => disposeMaterial(m));
            } else {
                disposeMaterial(material);
            }
        }
    });
}

