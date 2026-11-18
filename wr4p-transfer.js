/* WR4P shared document handoff: same-origin IndexedDB; files remain on device. */
const WR4PTransfer={
 db(){return new Promise((resolve,reject)=>{const req=indexedDB.open('wr4p-documentos',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('transfer'))req.result.createObjectStore('transfer')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})},
 async put(payload){const db=await this.db();return new Promise((resolve,reject)=>{const tx=db.transaction('transfer','readwrite');tx.objectStore('transfer').put(payload,'current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})},
 async get(){const db=await this.db();return new Promise((resolve,reject)=>{const tx=db.transaction('transfer','readonly');const q=tx.objectStore('transfer').get('current');q.onsuccess=()=>{db.close();resolve(q.result||null)};q.onerror=()=>{db.close();reject(q.error)}})},
 async clear(){const db=await this.db();return new Promise((resolve,reject)=>{const tx=db.transaction('transfer','readwrite');tx.objectStore('transfer').delete('current');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
};