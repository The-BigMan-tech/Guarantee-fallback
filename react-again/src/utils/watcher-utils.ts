import {WatchEventKind, WatchEventKindCreate, WatchEventKindModify, WatchEventKindRemove} from "@tauri-apps/plugin-fs"

function isCreate(kind: WatchEventKind): kind is { create: WatchEventKindCreate } {
    return typeof kind === 'object' && 'create' in kind;
}
function isModify(kind: WatchEventKind): kind is { modify: WatchEventKindModify } {
    if (typeof kind !== 'object' || !('modify' in kind)) return false;
    const modifyKind = kind.modify;
    if (modifyKind.kind === 'any') {
        return false;
    }
    return true;
}
function isRemove(kind: WatchEventKind): kind is { remove: WatchEventKindRemove } {
    return typeof kind === 'object' && 'remove' in kind;
}
export function isFileEvent(kind: WatchEventKind) {
    return (isCreate(kind) || isModify(kind) || isRemove(kind))
}