const dbName = 'myDatabase';
const storeName = 'myStore';
let db:IDBDatabase;

export async function setupDatabase() {
    return new Promise<IDBDatabase>((resolve,reject)=>{
        const request:IDBOpenDBRequest = indexedDB.open(dbName,1);
        request.onupgradeneeded = (event)=> {
            const target = event.target as IDBRequest
            db = target.result;
            db?.createObjectStore(storeName);
        }
        request.onsuccess = (event)=>{
            const target = event.target as IDBRequest
            db = target.result;
            resolve(db)
        }
        request.onerror = (event)=>{
            const target = event.target as IDBRequest
            reject(`Database error: ${target.error?.message}`)
        }
    })
}
export async function setItem<T>(key:string,value:T) {
    if (!db) await setupDatabase();
    const transaction = db.transaction(storeName,'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(value,key);

    return new Promise<void>((resolve,reject)=>{
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event)=> {
            const target = event.target as IDBRequest
            reject(`Transaction error: ${target.error}`);
        }
    })
}
export async function getItem<T>(key:string) {
    if (!db) await setupDatabase();
    const transaction = db.transaction(storeName,'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise<T | undefined>((resolve,reject)=> {
        request.onsuccess = (event)=> {
            const target = event.target as IDBRequest
            resolve(target.result)
        }
        request.onerror = (event)=> {
            const target = event.target as IDBRequest
            reject(`Get error: ${target.error}`)
        }
    })
}
export async function deleteItem(key:string) {
    if (!db) await setupDatabase();
    const transaction = db.transaction(storeName,'readwrite');
    const store = transaction.objectStore(storeName)
    store.delete(key);

    return new Promise<void>((resolve,reject)=>{
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event)=> {
            const target = event.target as IDBRequest
            reject(`Transaction error: ${target.error}`);
        }
    })
}
export async function deleteDB() {
    if (!db) return;
    return new Promise((resolve,reject)=>{
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = ()=>resolve('Database deleted successfully');
        request.onerror = (event)=> {
            const target = event.target as IDBRequest
            reject(`Database deletion error: ${target.error}`);
        }
    })
}
