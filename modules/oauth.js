const fetch = require("node-fetch")
const config = require("../config.json")

const oauth = {

    handleOauth: async function (req, res, next) {
        req.handleOauth = async function () {
            if (req.cookies.access_token) {
                return true
            } else if (req.cookies.refresh_token) {
                const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
                    method: 'POST',
                    body: new URLSearchParams({
                        client_id: config[config.mode + "_discord"].client_id,
                        client_secret: config[config.mode + "_discord"].client_secret,
                        refresh_token: req.cookies.refresh_token,
                        grant_type: 'refresh_token'
                    }),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
                const oauthData = await oauthResult.json();
                await res.cookie("access_token", oauthData.access_token, { maxAge: 1000 * 60 * 60 * 24 * 7 })
                await res.cookie("refresh_token", oauthData.refresh_token, { maxAge: 1000 * 60 * 60 * 24 * 30 * 2 })
                res.redirect(req.url)
                return false
            } else {
                res.cookie("redirect_to", req.url, { maxAge: 1000 * 60 * 15 })
                res.send(`<script>window.location.replace("${config[config.mode + "_discord"].oauth_link}")</script>`);
                return false;
            }
        }
        next()
    },

    getDiscordData: async function (req, res, next) {
        req.getDiscordData = async function () {
            if (req.cookies.discordCachedData) {
                console.log("using cached")
                console.log(req.cookies.discordCachedData)
                const data = JSON.parse(req.cookies.discordCachedData)
                if (data?.message === "401: Unauthorized") {
                    res.clearCookie("access_token");
                    res.clearCookie("refresh_token");
                    res.clearCookie("discordCachedData")
                    res.redirect(req.url)
                } else {
                    return data
                }
            } else {
                console.log("using live")
                const userResult = await fetch('https://discord.com/api/users/@me', {
                    headers: {
                        authorization: `Bearer ${req.cookies.access_token}`,
                    },
                });
                const data = await userResult.json();
                if (data?.message === "401: Unauthorized") {
                    res.clearCookie("access_token");
                    res.clearCookie("refresh_token");
                    res.clearCookie("discordCachedData")
                    res.redirect(req.url)
                } else {
                    res.cookie("discordCachedData", JSON.stringify(data), { maxAge: 1000 * 60 * 15 })
                }
                console.log(data)
                return data
            }
        }
        next()
    }


}

module.exports = oauth