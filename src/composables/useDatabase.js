// src/composables/useDatabase.js
import PouchDB from 'pouchdb-browser'

const localDB = new PouchDB('finance_local')
const remoteDB = new PouchDB('http://your-server-address:5984/finance_db', {
  auth: { username: 'admin', password: 'password' }, // adjust if needed
})

// Continuous live sync
localDB
  .sync(remoteDB, {
    live: true,
    retry: true,
  })
  .on('change', (info) => {
    console.log('DB synced:', info)
  })
  .on('error', (err) => {
    console.error('Sync error:', err)
  })

export function useDatabase() {
  async function getAllDocs(type) {
    const result = await localDB.find({ selector: { type } })
    return result.docs
  }

  async function saveDoc(doc) {
    if (!doc._id) doc._id = `${doc.type}_${Date.now()}`
    doc.updatedAt = new Date().toISOString()
    await localDB.put(doc)
  }

  async function deleteDoc(doc) {
    await localDB.remove(doc)
  }

  return {
    getAllDocs,
    saveDoc,
    deleteDoc,
    localDB,
  }
}
