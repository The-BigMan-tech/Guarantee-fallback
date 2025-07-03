import { atom } from 'jotai';

interface HealthState {
    currentValue:number,
    maxValue:number
}
//This is for my react component to render
export const playerHealthAtom = atom<HealthState>();


//These are for registration
let setHealthExternal: ((value:HealthState) => void) | null = null;

export const playerHealthSetterAtom = atom(null,
    (_, set, newHealth:HealthState) => {
        set(playerHealthAtom, newHealth);
    }
);
export function registerHealthSetter(setter: (value:HealthState) => void) {
    setHealthExternal = setter;
}

//This is for the rest of my game code decoupled from react
export function setPlayerHealth(value:HealthState) {//i can use setHealthExternal directly though but this extra wrapper is for safety
    if (setHealthExternal) setHealthExternal(value);
}