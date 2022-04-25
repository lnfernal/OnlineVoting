const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();
const database = require("../modules/database");
const hash = require("../modules/password")
const { v4 } = require("uuid")

router.post("/change_design_settings", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, bgcolor, bgimage, fontcolor, mainbgcolor, buttonfontcolor, buttonbgcolor, optionbgcolor } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        const newSettings = {
            background: {
                "color": bgcolor,
                "image": bgimage
            },
            main_window: {
                "font_color": fontcolor,
                "background_color": mainbgcolor,
                "button_font_color": buttonfontcolor,
                "button_background_color": buttonbgcolor
            },
            option: {
                "background_color": optionbgcolor
            }
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { designOptions: newSettings })
    }
    res.redirect(`/manage/${roesc}/${voting}/#/design`)
})

router.post("/change_voting_options", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { options, roesc, voting } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { votingOptions: options })
    }
    res.sendStatus(200);
})

router.post("/change_televoting_options", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, open, minvote, maxvote, verifyroblox } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        const settings = {
            open: open === "on" ? true : false,
            minVote: parseInt(minvote),
            maxVote: parseInt(maxvote),
            requireRoblox: verifyroblox === "on" ? true : false
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { televotingSettings: settings })
    }
    res.redirect(`/manage/${roesc}/${voting}/#/televoting`)
})

router.post("/set_password", async (req, res) => {
    const { name, password } = req.body;
    const splitted = name.split("/")
    const roesc = splitted[0];
    const voting = splitted[1];
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data.password === null) {
        const newpassword = hash.nosalt(password);
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { password: newpassword })
        res.redirect(`/manage/${roesc}/${voting}`)
    }
})

router.post("/login", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { contestname, password } = req.body;
    const splitted = contestname.split("/")
    const roesc = splitted[0];
    const voting = splitted[1];
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    const hashedPassword = hash.nosalt(password);
    if (data.password === hashedPassword) {
        const users = data.signedInUsers;
        users.push(discordData.id);
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { signedInUsers: users });
        res.redirect(`/manage/${roesc}/${voting}`);
    } else {
        res.redirect(`/manage/${roesc}/${voting}`);
    }
})

router.post("/change_jury_voting_options", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, open } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        const settings = {
            open: open === "on" ? true : false,
            points: data.juryVotingSettings.points
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juryVotingSettings: settings })
    }
    res.redirect(`/manage/${roesc}/${voting}/#/jury_voting`)
})

router.post("/change_jury_voting_points", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { points, roesc, voting } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        const settings = {
            open: data.juryVotingSettings.open,
            points: points
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juryVotingSettings: settings })
    }
    res.sendStatus(200);
})

router.get("/get_list_for_jury", async (req, res) => {
    const { roesc } = req.query;
    const setting = await database.findOne("settings", { setting: "juryListLink", roesc: roesc })
    if (setting) {
        console.log(`${roesc} ${setting.guild} ${setting.link}`)
        const usersresponse = await fetch(`${setting.link}?guildid=${setting.guild}`)
        const usersdata = await usersresponse.json()
        res.json({ success: true, users: usersdata })
    } else {
        res.json({ success: false })
    }
})

router.post("/add_jury_by_username", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, username, discriminator } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        let juries = data.juries
        if (!juries.find(r => r.username === `${username}#${discriminator}`)) {
            juries.push({ id: undefined, username: `${username}#${discriminator}` })
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juries: juries })
    }
    res.redirect(`/manage/${roesc}/${voting}/#/jury_voting`)
})

router.post("/add_jury_by_id", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, id } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        let juries = data.juries
        if (!juries.find(r => r.id === id)) {
            juries.push({ id: id, username: undefined })
        }
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juries: juries })
    }
    res.redirect(`/manage/${roesc}/${voting}/#/jury_voting`)
})

router.post("/add_juries_bulk", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, users } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        let juries = data.juries
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juries: [...juries, ...users] })
    }
    res.sendStatus(200)
})

router.post("/delete_jury", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting, id } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        let juries = data.juries
        juries.splice(juries.findIndex(r => r.id === id), 1)
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { juries: juries })
    }
    res.sendStatus(200)
})

router.post("/regenerate_api_key", async (req, res) => {
    const discordData = await req.getDiscordData();
    const { roesc, voting } = req.body;
    const data = await database.findOne("votings", { roesc: roesc, link: voting })
    if (data && data.signedInUsers.find(r => r === discordData.id)) {
        const apiKey = v4().replace(/-/g, "")
        await database.findOneAndUpdate("votings", { roesc: roesc, link: voting }, { apiKey: apiKey })
    }
    res.sendStatus(200)
})

module.exports = router;