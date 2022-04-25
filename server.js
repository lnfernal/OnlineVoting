const express = require("express");
const app = express();
const config = require("./config.json");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const database = require("./modules/database");
const noblox = require("noblox.js");

// Express Middleware
const oauth_modules = require("./modules/oauth");
app.use(oauth_modules.handleOauth)
app.use(oauth_modules.getDiscordData)

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

app.set("view engine", "ejs")
app.use(express.static("public"))

// Routers
const oauth_router = require("./api-routers/oauth");
const admin_router = require("./api-routers/admin");
const contest_admin_router = require("./api-routers/contest-admin");
const voting_router = require("./api-routers/voting");
const voting_manage_router = require("./api-routers/voting-manage");
const public_api_router = require("./api-routers/public-v1");
app.use("/api/oauth", oauth_router)
app.use("/api/admin", admin_router)
app.use("/api/contest-admin", contest_admin_router)
app.use("/api/voting", voting_router)
app.use("/api/voting-manage", voting_manage_router)
app.use("/api/v1", public_api_router)

// Public pages
app.get("/logout", (req, res) => {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("discordCachedData")
    res.redirect("/")
})
app.get("/change_roblox", async (req, res) => {
    if (await req.handleOauth()) {
        const data = await req.getDiscordData();
        await database.remove("users", { discordId: data.id })
    }
    res.redirect("/")
})

// Admin page
app.get("/admin", async (req, res) => {
    if (await req.handleOauth()) {
        const data = await req.getDiscordData();
        if (config.admins.find(r => r === data.id)) {
            const roescData = await database.find("roescs")
            const redirects = await database.find("redirectTokens")
            res.render(__dirname + "/views/admin.ejs", { discordData: data, roescData: roescData, redirects: redirects })
        } else {
            res.sendStatus(401)
        }
    }
})

// Contest admin page
app.get("/contest/:contestname", async (req, res) => {
    if (await req.handleOauth()) {
        const data = await req.getDiscordData();
        const { contestname } = req.params;
        const roescData = await database.findOne("roescs", { link: contestname })
        if (roescData.password === null) {
            res.render(__dirname + "/views/add-password.ejs", { discordData: data, name: contestname, displayname: `${roescData.name} control panel`, api: "contest-admin" })
        } else if (roescData.signedInUsers.find(r => r === data.id)) {
            const votings = await database.find("votings", { roesc: contestname })
            let countryGetLink = await database.findOne("settings", { roesc: contestname, setting: "countryGetLink" })
            if (!countryGetLink) {
                countryGetLink = { link: "", guild: "" }
            }
            let juryListLink = await database.findOne("settings", { roesc: contestname, setting: "juryListLink" })
            if (!juryListLink) {
                juryListLink = { link: "" }
            }
            res.render(__dirname + "/views/contest-admin.ejs", { discordData: data, roescData: roescData, votings: votings, countryGetLink: countryGetLink, juryListLink: juryListLink })
        } else {
            res.render(__dirname + "/views/insert-password.ejs", { discordData: data, name: contestname, displayname: `${roescData.name} control panel`, api: "contest-admin" })
        }
    }
})

// Voting manage page
app.get("/manage/:contest/:voting", async (req, res) => {
    if (await req.handleOauth()) {
        const discordData = await req.getDiscordData();
        const { contest, voting } = req.params;
        const data = await database.findOne("votings", { roesc: contest, link: voting })
        if (data) {
            if (data.password === null) {
                res.render(__dirname + "/views/add-password.ejs", { discordData: discordData, name: `${contest}/${voting}`, displayname: `${data.name} control panel`, api: "voting-manage" })
            } else if (data.signedInUsers.find(r => r === discordData.id)) {
                const televotes = await database.find("televotes", { roesc: contest, voting: voting })
                const juryvotes = await database.find("juryvotes", { roesc: contest, voting: voting })
                res.render(__dirname + "/views/voting-manage.ejs", { discordData: discordData, votingData: data, protocol: req.protocol, domain: config.subdomain, televotes: televotes, juryvotes: juryvotes })
            } else {
                res.render(__dirname + "/views/insert-password.ejs", { discordData: discordData, name: `${contest}/${voting}`, displayname: `${data.name} control panel`, api: "voting-manage" })
            }
        } else {
            res.render(__dirname + "/views/404.ejs", { message: "Voting not found" })
        }
    }
})

// Voting manage hub
app.get("/manage", async (req, res) => {
    if (await req.handleOauth()) {
        const discordData = await req.getDiscordData();
        const data = await database.find("votings", {})
        const toSend = data.filter(r => r.signedInUsers.find(a => a === discordData.id))
        res.render(__dirname + "/views/manage-hub.ejs", { discordData: discordData, votings: toSend })
    }
})

app.get("/get_token", async (req, res) => {
    if (req.handleOauth()) {
        await res.cookie("subdomain_access_token", req.cookies.access_token, { maxAge: 1000 * 60 * 60 * 24, domain: `.${config.domain}` })
        res.send(`<script>window.location.replace("https://${req.query.domain}.${config.domain}/${req.query.goto}")</script>`)
    }
})

app.get("/redirect_token", async (req, res) => {
    if (req.handleOauth()) {
        const data = await database.findOne("redirectTokens", { token: req.query.token })
        if (data) {
            const discordData = await req.getDiscordData()
            if (data.requireRoblox) {
                const robloxData = await database.findOne("users", { discordId: discordData.id })
                if (!robloxData) {
                    console.log("sending verification")
                    res.render(__dirname + "/views/roblox-verification.ejs", { discordData: discordData, designOptions: config.default_voting_settings, verificationGameLink: config.verification_game_link })
                } else {
                    res.redirect(`${data.redirect}?discord=${req.cookies.access_token}&roblox=${robloxData.robloxId}`)
                }
            } else {
                res.redirect(`${data.redirect}?discord=${req.cookies.access_token}`)
            }
        } else {
            res.sendStatus(400)
        }
    }
})

// Voting page
app.get("/:contest/:voting", async (req, res) => {
    const { contest, voting } = req.params;
    handleVotingPage(req, res, contest, voting)
})

app.get("/", async (req, res) => {
    const data = await database.findOne("settings", { setting: "homePageVoting" })
    if (data) {
        handleVotingPage(req, res, data.roesc, data.voting)
    } else {
        res.status(404).render(__dirname + "/views/404.ejs", { message: "Voting not found" })
    }
})

app.get("/:contest", async (req, res) => {
    const { contest } = req.params;
    const data = await database.findOne("settings", { setting: "contestPageVoting", roesc: contest })
    if (data) {
        handleVotingPage(req, res, contest, data.voting)
    } else {
        res.status(404).render(__dirname + "/views/404.ejs", { message: "Voting not found" })
    }
})

async function handleVotingPage(req, res, contest, voting) {
    if (await req.handleOauth()) {
        const data = await req.getDiscordData();
        const votingData = await database.findOne("votings", { roesc: contest, link: voting })
        if (votingData) {
            const userData = await database.findOne("users", { discordId: data.id, verified: true })
            let robloxData = {}
            if (userData) {
                console.log(database.getRobloxDown())
                if (database.getRobloxDown()) {
                    robloxData = { id: userData.robloxId, username: `ID: ${userData.robloxId}` }
                } else {
                    const robloxUsername = await noblox.getUsernameFromId(userData.robloxId)
                    robloxData = { id: userData.robloxId, username: robloxUsername }
                }
            }
            res.render(__dirname + "/views/voting.ejs", { discordData: data, designOptions: votingData.designOptions, televotingSettings: votingData.televotingSettings, votingOptions: votingData.votingOptions, robloxData: robloxData, verifyUsingGame: config.verify_using_game, roesc: contest, votingLink: voting, votingName: votingData.name, domain: config.subdomain, protocol: req.protocol })
        } else {
            res.status(404).render(__dirname + "/views/404.ejs", { message: "Voting not found" })
        }
    }
}

// Jury voting page
app.get("/:contest/:voting/jury", async (req, res) => {
    const { contest, voting } = req.params;
    if (await req.handleOauth()) {
        const data = await req.getDiscordData();
        const votingData = await database.findOne("votings", { roesc: contest, link: voting });
        if (votingData) {
            if (votingData.juries.find(r => r.id === data.id || r.username === `${data.username}#${data.discriminator}`) && votingData.juryVotingSettings.open) {
                const userData = await database.findOne("users", { discordId: data.id, verified: true })
                if (userData) {
                    if (database.getRobloxDown()) {
                        robloxData = { id: userData.robloxId, username: `ID: ${userData.robloxId}` }
                    } else {
                        const robloxUsername = await noblox.getUsernameFromId(userData.robloxId)
                        robloxData = { id: userData.robloxId, username: robloxUsername }
                    }
                    res.render(__dirname + "/views/jury-voting.ejs", { discordData: data, votingData: votingData, robloxData: robloxData, protocol: req.protocol, domain: config.subdomain })
                } else {
                    res.render(__dirname + "/views/roblox-verification.ejs", { discordData: data, designOptions: votingData.designOptions, verificationGameLink: config.verification_game_link })
                }
                const juryData = votingData.juries.find(r => r.id === data.id || r.username === `${data.username}#${data.discriminator}`)
                const juryDataIndex = votingData.juries.findIndex(r => r.id === data.id || r.username === `${data.username}#${data.discriminator}`)
                let newJuries = votingData.juries
                if (!juryData.id) {
                    newJuries[juryDataIndex] = { id: data.id, username: juryData.username }
                    database.findOneAndUpdate("votings", { roesc: contest, link: voting }, { juries: newJuries })
                } else if (!juryData.username) {
                    newJuries[juryDataIndex] = { id: juryData.id, username: `${data.username}#${data.discriminator}` }
                    database.findOneAndUpdate("votings", { roesc: contest, link: voting }, { juries: newJuries })
                }
            } else if (!votingData.juryVotingSettings.open) {
                res.render(__dirname + "/views/error.ejs", { message: "Voting is closed" })
            } else {
                res.render(__dirname + "/views/error.ejs", { message: "Unauthorized to vote" })
            }
        } else {
            res.status(404).render(__dirname + "/views/404.ejs", { message: "Voting not found" })
        }
    }
})

app.listen(config.port, () => { console.log(`Listening on :${config.port}`) })
