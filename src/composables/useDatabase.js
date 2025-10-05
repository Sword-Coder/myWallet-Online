// src/composables/useDatabase.js
import PouchDB from 'pouchdb-browser'
import PouchFind from 'pouchdb-find'

PouchDB.plugin(PouchFind) // <-- enable the .find() method

const localDB = new PouchDB('finance_local')
const remoteDB = new PouchDB('http://147.182.253.3:5984/mywallet_db', {
  auth: { username: 'root', password: 'Sharpest2Mind' }, // adjust if needed
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

async function ensureIndexes() {
  await localDB.createIndex({
    index: { fields: ['type'] },
  })
}

ensureIndexes()

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
