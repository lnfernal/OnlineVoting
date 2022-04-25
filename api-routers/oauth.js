const express = require("express");
const router = express.Router();
const config = require("../config.json")
const fetch = require("node-fetch")

router.get("/test", (req, res) => {
    res.send("henlo")
})

router.get("/callback", async (req, res) => {
    const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: config[config.mode + "_discord"].client_id,
            client_secret: config[config.mode + "_discord"].client_secret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: config[config.mode + "_discord"].redirect_uri,
            scope: 'identify',
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    const oauthData = await oauthResult.json();
    console.log(oauthData)
    if (oauthData.access_token) {
        res.cookie("access_token", oauthData.access_token, { maxAge: 1000 * 60 * 60 * 24 * 7 })
        res.cookie("refresh_token", oauthData.refresh_token, { maxAge: 1000 * 60 * 60 * 24 * 30 * 2 })
    }
    if (req.cookies.redirect_to) {
        const redirectTo = req.cookies.redirect_to
        res.clearCookie("redirect_to")
        res.redirect(redirectTo)
    } else {
        res.redirect("/")
    }
})

module.exports = router