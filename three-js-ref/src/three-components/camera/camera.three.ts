import * as THREE from 'three';

export interface CameraData {
    FOV:number;
    nearPoint:number,
    farPoint:number,
    cameraRotationDelta:number;
    cameraRotationSpeed:number;
}
export class Camera {
    private camera3D:THREE.Object3D = new THREE.Object3D();
    private targetQuaternion:THREE.Quaternion = new THREE.Quaternion();
    private targetPosition:THREE.Vector3 = new THREE.Vector3(0,0,0);
    private translationSpeed:number = 0;

    private perspectiveCamera:THREE.PerspectiveCamera;
    private FOV:number;
    private nearPoint:number;
    private farPoint:number;
    private cameraRotationDelta:number;
    private cameraRotationSpeed:number;


    constructor(camData:CameraData) {
        this.FOV = camData.FOV;
        this.nearPoint = camData.nearPoint;
        this.farPoint = camData.farPoint;
        this.cameraRotationDelta = camData.cameraRotationDelta;
        this.cameraRotationSpeed = camData.cameraRotationSpeed;
        this.perspectiveCamera = new THREE.PerspectiveCamera(this.FOV,undefined,this.nearPoint,this.farPoint);
        this.camera3D.add(this.perspectiveCamera);
        this.targetQuaternion.copy(this.camera3D.quaternion)
    }
    private clampPitch(clampAngle:number) {
        const maxPitch = THREE.MathUtils.degToRad(clampAngle);
        const euler = new THREE.Euler().setFromQuaternion(this.targetQuaternion, 'YXZ');   // Convert targetQuaternion to Euler angles to access pitch (x rotation)
        const clampedX = THREE.MathUtils.clamp(euler.x, -maxPitch, maxPitch);// Clamp pitch angle within the chosen range
    
        const smoothFactor = 0.2; // Adjust for smoothness; smaller is smoother
        euler.x += (clampedX - euler.x) * smoothFactor;
        this.targetQuaternion.setFromEuler(euler);
    }
    private rotateCameraY(delta:number,clampAngle:number) {
        const pitchChange = new THREE.Quaternion();
        pitchChange.setFromAxisAngle(new THREE.Vector3(1, 0, 0),delta);
        this.targetQuaternion.multiplyQuaternions(pitchChange,this.targetQuaternion);
        this.clampPitch(clampAngle)
    }
    public rotateCameraUp(clampAngle:number) {
        this.rotateCameraY(this.cameraRotationDelta,clampAngle)
    }
    public rotateCameraDown(clampAngle:number) {
        this.rotateCameraY(-this.cameraRotationDelta,clampAngle)
    }
    public updateCamera() {
        this.camera3D.quaternion.slerp(this.targetQuaternion,this.cameraRotationSpeed);
        this.camera3D.position.lerp(this.targetPosition,this.translationSpeed)
    }
    public translateCamera(translation:THREE.Vector3,speed:number) {
        this.targetPosition = translation;
        this.translationSpeed = speed
    }
    get cam3D() {
        return this.camera3D
    }
    get cam() {
        return this.perspectiveCamera;
    }
}


