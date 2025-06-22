import * as THREE from 'three';

export interface CameraData {
    FOV:number;
    nearPoint:number,
    farPoint:number,
    cameraRotationDelta:number;
    cameraRotationSpeed:number;
    offsetY:number
}
export class Camera {
    private perspectiveCamera:THREE.PerspectiveCamera;
    private camera3D:THREE.Object3D;
    private FOV:number;
    private nearPoint:number;
    private farPoint:number;
    private cameraRotationDelta:number;
    private cameraRotationSpeed:number;
    private targetQuaternion:THREE.Quaternion

    constructor(camData:CameraData) {
        this.FOV = camData.FOV;
        this.nearPoint = camData.nearPoint;
        this.farPoint = camData.farPoint;
        this.cameraRotationDelta = camData.cameraRotationDelta;
        this.cameraRotationSpeed = camData.cameraRotationSpeed;
        this.perspectiveCamera =  new THREE.PerspectiveCamera(this.FOV,undefined,this.nearPoint,this.farPoint);
        this.targetQuaternion = new THREE.Quaternion();
        this.camera3D = new THREE.Object3D();
        this.camera3D.add(this.perspectiveCamera);
        this.camera3D.position.y += camData.offsetY
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
    }
    public translateCamera(translation:THREE.Vector3,speed:number) {
        this.camera3D.position.lerp(translation,speed)
    }
    get cam3D() {
        return this.camera3D
    }
    get cam() {
        return this.perspectiveCamera;
    }
}


