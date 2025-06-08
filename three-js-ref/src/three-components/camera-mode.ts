interface CamMode {
    isThirdPerson:boolean
}
export const cameraMode:CamMode = {
    isThirdPerson: false,
};
export function toggleCameraMode() {
    cameraMode.isThirdPerson = !cameraMode.isThirdPerson;
}
