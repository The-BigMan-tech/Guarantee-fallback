interface CamMode {
    isThirdPerson:boolean
}
export const cameraMode:CamMode = {
    isThirdPerson: false,
};
export function toggleCameraMode() {
    cameraMode.isThirdPerson = !cameraMode.isThirdPerson;
}
export const keysPressed:Record<string,boolean> = {};
export const rotationDelta = 0.05;
export const rotationSpeed = 0.5;
