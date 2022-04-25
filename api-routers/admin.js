const express = require("express");
const router = express.Router();
const config = require("../config.json")
const database = require("../modules/database")
const { v4 } = require("uuid")

function isAdmin(id) {
    return config.admins.find(r => r === id)
}

router.post("/new_roesc", async (req, res) => {
    const data = await req.getDiscordData()
    if (isAdmin(data.id)) {
        const { name, link } = req.body;
        const saved = await database.insertNotExisting("roescs", { name: name, link: link.toLowerCase(), password: null, signedInUsers: [data.id] }, { link: link.toLowerCase() })
        res.redirect("/admin")
    }
})

router.post("/delete_roesc", async (req, res) => {
    const data = await req.getDiscordData();
    if (isAdmin(data.id)) {
        const { name } = req.body;
        await database.remove("roescs", { link: name })
        res.sendStatus(200)
    } else {
        res.sendStatus(401)
    }
})

router.post("/set_roblox_down", async (req, res) => {
    const data = await req.getDiscordData();
    if (isAdmin(data.id)) {
        const { down } = req.body;
        if (down) {
            database.setRobloxDown(true)
        } else {
            database.setRobloxDown(false)
        }
        res.redirect("/admin")
    } else {
        res.sendStatus(401)
    }
})

router.post("/rename", async (req, res) => {
    const data = await req.getDiscordData();
    if (isAdmin(data.id)) {
        const { oldname, name } = req.body;
        await database.findOneAndUpdate("roescs", { link: oldname }, { name: name })
        res.redirect("/admin")
    }
})

router.post("/change_homepage_voting", async (req, res) => {
    const data = await req.getDiscordData();
    if (isAdmin(data.id)) {
        const { roesc, voting } = req.body;
        await database.insertOrUpdate("settings", { setting: "homePageVoting", roesc: roesc, voting: voting }, { setting: "homePageVoting" })
        res.redirect("/admin")
    }
})

router.post("/new_redirect_token", async (req, res) => {
    const data = await req.getDiscordData();
    if (isAdmin(data.id)) {
        const token = v4().replace(/-/g, "")
        const { redirect_url, require_roblox } = req.body;
        database.insertOrUpdate("redirectTokens", { token: token, redirect: redirect_url, requireRoblox: require_roblox ? true : false }, { redirect: redirect_url })
        res.redirect("/admin")
    }
})

module.exports = router