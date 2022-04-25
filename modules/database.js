const monk = require("monk")
const config = require("../config.json")
const db = monk(config.mongo_db_url)
let robloxDown = false

const database = {
    insert: async function (collection, data) {
        const collectiona = await db.get(collection)
        return await collectiona.insert(data)
    },

    find: async function (collection, requirement) {
        const collectiona = await db.get(collection)
        const documents = await collectiona.find(requirement || {})
        return documents
    },

    findOne: async function (collection, requirement) {
        const collectiona = await db.get(collection)
        const documents = await collectiona.findOne(requirement || {})
        return documents
    },

    insertNotExisting: async function (collection, data, search_query) {
        const collectiona = await db.get(collection)
        const document = await collectiona.findOne(search_query)
        if (!document) {
            return await collectiona.insert(data)
        } else {
            return false
        }
    },

    remove: async function (collection, search_query) {
        const collectiona = await db.get(collection)
        return await collectiona.remove(search_query)
    },

    findOneAndUpdate: async function (collection, search_query, data) {
        const collectiona = await db.get(collection)
        return await collectiona.findOneAndUpdate(search_query, { $set: data })
    },

    insertOrUpdate: async function (collection, data, search_query) {
        const collectiona = await db.get(collection)
        const found = await collectiona.findOne(search_query)
        if (found) {
            return await collectiona.findOneAndUpdate(search_query, { $set: data })
        } else {
            return await collectiona.insert(data)
        }
    },

    setRobloxDown: async function (bool) {
        const collectiona = await db.get("settings")
        const found = await collectiona.findOne({ setting: "robloxDown" })
        const data = { setting: "robloxDown", down: bool }
        robloxDown = bool
        if (found) {
            return await collectiona.findOneAndUpdate({ setting: "robloxDown" }, { $set: data })
        } else {
            return await collectiona.insert(data)
        }
    },

    getRobloxDown: function () {
        return robloxDown
    }
}

db.then(async () => {
    console.log("connected to database")
    const collectiona = await db.get("settings")
    const found = await collectiona.findOne({ setting: "robloxDown" })
    if (found && found.down == true) {
        robloxDown = true
    }
})

module.exports = database