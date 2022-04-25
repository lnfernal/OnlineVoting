const express = require("express");
const router = express.Router();
const database = require("../modules/database");
const hash = require("../modules/password");
const config = require("../config.json");

router.post("/set_password", async (req, res) => {
    const { name, password } = req.body;
    const data = await database.findOne("roescs", { link: name })
    if (data.password === null) {
        const newpassword = hash.nosalt(password);
        database.findOneAndUpdate("roescs", { link: name }, { password: newpassword })
        res.redirect("/contest/" + name)
    }
})

router.post("/login", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { contestname, password } = req.body;
    const data = await database.findOne("roescs", { link: contestname })
    const hashedPassword = hash.nosalt(password)
    if (data.password === hashedPassword) {
        const users = data.signedInUsers;
        users.push(discordData.id)
        await database.findOneAndUpdate("roescs", { link: contestname }, { signedInUsers: users })
        res.redirect("/contest/" + contestname)
    } else {
        res.redirect("/contest/" + contestname)
    }
})

router.post("/new_voting", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { name, link, contestname } = req.body;
    const roescData = await database.findOne("roescs", { link: contestname })
    if (roescData.signedInUsers.find(r => r === discordData.id)) {
        await database.insertNotExisting("votings", { name: name, link: link.toLowerCase(), roesc: contestname, password: null, signedInUsers: [], designOptions: config.default_voting_settings, votingOptions: [], televotingSettings: { open: false, minVote: 5, maxVote: 5, requireRoblox: false }, juryVotingSettings: { open: false, points: [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] }, juries: [] }, { link: link.toLowerCase(), roesc: contestname })
    }
    res.redirect("/contest/" + contestname)
})

router.post("/delete_voting", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { name, roesc } = req.body;
    const roescData = await database.findOne("roescs", { link: roesc })
    if (roescData.signedInUsers.find(r => r === discordData.id)) {
        await database.remove("votings", { link: name, roesc: roesc })
    }
    res.sendStatus(200);
})

router.post("/change_contest_page_voting", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting } = req.body;
    const roescData = await database.findOne("roescs", { link: roesc })
    if (roescData.signedInUsers.find(r => r === discordData.id)) {
        await database.insertOrUpdate("settings", { setting: "contestPageVoting", roesc: roesc, voting: voting }, { setting: "contestPageVoting", roesc: roesc })
    }
    res.redirect("/contest/" + roesc)
})

router.post("/change_country_detection_url", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, link, guild } = req.body;
    const roescData = await database.findOne("roescs", { link: roesc })
    if (roescData.signedInUsers.find(r => r === discordData.id)) {
        await database.insertOrUpdate("settings", { setting: "countryGetLink", roesc: roesc, link: link, guild: guild }, { setting: "countryGetLink", roesc: roesc })
    }
    res.redirect("/contest/" + roesc + "/#/settings")
})

router.post("/change_jury_list_url", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, link, guild } = req.body;
    const roescData = await database.findOne("roescs", { link: roesc })
    if (roescData.signedInUsers.find(r => r === discordData.id)) {
        await database.insertOrUpdate("settings", { setting: "juryListLink", roesc: roesc, link: link, guild: guild }, { setting: "juryListLink", roesc: roesc })
    }
    res.redirect("/contest/" + roesc + "/#/settings")
})

module.exports = router