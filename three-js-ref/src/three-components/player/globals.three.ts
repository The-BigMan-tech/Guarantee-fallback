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
export const gravityY = 40
export const groundLevelY = -1;//if it stands on -1,then all the objects will stand on 0 given that the ground height is 1.this makes it easier to know the cord we are standing on by just checking the height of the object
export const startingLevelY = 0;