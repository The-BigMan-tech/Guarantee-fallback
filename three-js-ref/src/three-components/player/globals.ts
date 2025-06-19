interface CamMode {
    isThirdPerson:boolean
}
export const cameraMode:CamMode = {
    isThirdPerson: false,
};
export function toggleCameraMode() {
    cameraMode.isThirdPerson = !cameraMode.isThirdPerson;
}
let canToggle = true;
export function toggleThirdPerson() {
    if (keysPressed['KeyT']) {
        if (canToggle) {
            cameraMode.isThirdPerson = !cameraMode.isThirdPerson;
            canToggle = false;  // prevent further toggles until key released
        }
    } else {
      canToggle = true;  // reset when key released
    }
}
export const keysPressed:Record<string,boolean> = {};
