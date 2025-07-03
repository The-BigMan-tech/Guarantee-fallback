import { atom } from 'jotai';

interface HealthState {
    currentValue:number,
    maxValue:number
}
//This is for my react component to render.im using an intial value to ensure that it always reflects a valid state
export const playerHealthAtom = atom<HealthState>({
    currentValue: 100,
    maxValue: 100,
});
export const entityHealthAtom = atom<HealthState | null>({
    currentValue: 100,
    maxValue: 100,
});

//These are for registration
let setHealthExternal: ((value:HealthState) => void) | null = null;
let setEntityHealthExternal: ((value:HealthState | null) => void) | null = null;

export const playerHealthSetterAtom = atom(null,
    (_, set, newHealth:HealthState) => {
        set(playerHealthAtom, newHealth);
    }
);
export const entityHealthSetterAtom = atom(null,
    (_, set, newHealth:HealthState | null) => {
        set(entityHealthAtom, newHealth);
    }
);

export function registerHealthSetter(setter: (value:HealthState) => void) {
    setHealthExternal = setter;
}
export function registerEntityHealthSetter(setter: (value:HealthState | null) => void) {
    setEntityHealthExternal = setter;
}

//This is for the rest of my game code decoupled from react
export function setPlayerHealth(value:HealthState) {//i can use setHealthExternal directly though but this extra wrapper is for safety
    if (setHealthExternal) setHealthExternal(value);
}
export function setEntityHealth(value:HealthState | null) {//i can use setHealthExternal directly though but this extra wrapper is for safety
    if (setEntityHealthExternal) setEntityHealthExternal(value);
}