const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const database = require("../modules/database");
const noblox = require("noblox.js");
const config = require("../config.json");

router.post("/verify_rover", async (req, res) => {
	const discordData = await req.getDiscordData();
	const roverRequest = await fetch("https://verify.eryn.io/api/user/" + discordData.id);
	const roverData = await roverRequest.json();
	if (roverData.status === "ok") {
		const id = roverData.robloxId.toString();
		await database.insertOrUpdate(
			"users",
			{ discordId: discordData.id, robloxId: id, verified: true },
			{ discordId: discordData.id }
		);
		res.sendStatus(200);
	} else {
		res.sendStatus(500);
	}
});

router.post("/verify_bloxlink", async (req, res) => {
	const discordData = await req.getDiscordData();
	const bloxlinkRequest = await fetch("https://api.blox.link/v1/user/" + discordData.id);
	const bloxlinkData = await bloxlinkRequest.json();
	if (bloxlinkData.status === "ok") {
		const id = bloxlinkData.primaryAccount.toString();
		await database.insertOrUpdate(
			"users",
			{ discordId: discordData.id, robloxId: id, verified: true },
			{ discordId: discordData.id }
		);
		res.sendStatus(200);
	} else {
		res.sendStatus(500);
	}
});

router.post("/verify_roblox", async (req, res) => {
	const discordData = await req.getDiscordData();
	const { username } = req.body;
	const userid = await noblox.getIdFromUsername(username);
	await database.insertNotExisting(
		"users",
		{
			discordId: discordData.id,
			verified: false,
			robloxId: userid.toString(),
			discordName: `${discordData.username}#${discordData.discriminator}`,
		},
		{ discordId: discordData.id }
	);
	res.sendStatus(200);
});

router.get("/game_verification_status", async (req, res) => {
	const id = req.query.id;
	if (id) {
		const data = await database.findOne("users", { robloxId: id.toString() });
		if (data && data.verified === false) {
			res.json({ needsVerification: true, discordUsername: data.discordName });
		} else {
			res.json({ needsVerification: false });
		}
	} else {
		res.sendStatus(400);
	}
});

router.post("/send_verification", async (req, res) => {
	const { password, userId, isAccount } = req.body;
	if (password && userId && isAccount !== undefined) {
		if (password === config.game_verification_password) {
			if (isAccount) {
				await database.findOneAndUpdate("users", { robloxId: userId.toString() }, { verified: true });
			} else {
				await database.remove("users", { robloxId: userId.toString() });
			}
			res.sendStatus(200);
		} else {
			res.sendStatus(401);
		}
	} else {
		res.sendStatus(400);
	}
});

router.post("/submit_vote", async (req, res) => {
	let { roesc, voting, votes, device } = req.body;
	const discordData = await req.getDiscordData();
	const robloxData = await database.findOne("users", { discordId: discordData.id });
	if (robloxData && robloxData.verified === true) {
		const votedAlready = await database.findOne("televotes", {
			robloxId: robloxData.robloxId,
			roesc: roesc,
			voting: voting,
		});
		if (!votedAlready) {
			let username;
			if (database.getRobloxDown()) {
				username = `ID: ${robloxData.robloxId}`;
			} else {
				username = await noblox.getUsernameFromId(robloxData.robloxId);
			}
			await database.insert("televotes", {
				roesc: roesc,
				voting: voting,
				robloxId: robloxData.robloxId,
				robloxName: username,
				discordId: discordData.id,
				discordName: `${discordData.username}#${discordData.discriminator}`,
				platform: "Web",
				device: device,
				votes: votes,
				date: new Date(),
			});
			res.json({ success: true });
		} else {
			res.json({ success: false, error: "User voted already!" });
		}
	} else {
		res.json({ success: false, error: "User not verified!" });
	}
});

router.post("/submit_jury_vote", async (req, res) => {
	const { roesc, voting, points } = req.body;
	console.log(`JURY VOTE: ${req.body}`);
	const discordData = await req.getDiscordData();
	const robloxData = await database.findOne("users", { discordId: discordData.id });
	if (robloxData && robloxData.verified === true) {
		const votedAlready = await database.findOne("juryvotes", {
			robloxId: robloxData.robloxId,
			roesc: roesc,
			voting: voting,
		});
		if (!votedAlready) {
			let username;
			if (database.getRobloxDown()) {
				username = `ID: ${robloxData.robloxId}`;
			} else {
				username = await noblox.getUsernameFromId(robloxData.robloxId);
			}
			const countrySettings = await database.findOne("settings", { setting: "countryGetLink", roesc: roesc });
			let country = "";
			if (countrySettings && countrySettings.link) {
				const countryresponse = await fetch(
					`${countrySettings.link}?userid=${discordData.id}&guildid=${countrySettings.guild}`
				);
				const countrydata = await countryresponse.json();
				if (countrydata.success) {
					country = countrydata.country;
				}
			}
			await database.insert("juryvotes", {
				roesc: roesc,
				voting: voting,
				points: points,
				robloxId: robloxData.robloxId,
				robloxName: username,
				discordId: discordData.id,
				discordName: `${discordData.username}#${discordData.discriminator}`,
				country: country,
				date: new Date(),
			});
			res.json({ success: true });
		} else {
			res.json({ success: false, error: "User voted already!" });
		}
	} else {
		res.json({ success: false, error: "User not verified!" });
	}
});

module.exports = router;
