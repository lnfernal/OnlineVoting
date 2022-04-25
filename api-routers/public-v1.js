const express = require("express");
const router = express.Router();
const database = require("../modules/database");
const { getUsernameFromId } = require("noblox.js");

router.get("/votes", async (req, res) => {
	const votingData = await database.findOne("votings", { apiKey: req.query.key });
	if (votingData) {
		const televotesFromDatabase = await database.find("televotes", {
			roesc: votingData.roesc,
			voting: votingData.link,
		});
		const televotes = televotesFromDatabase.map((r) => {
			return {
				robloxId: r.robloxId,
				robloxName: r.robloxName,
				discordId: r.discordId,
				discordName: r.discordName,
				platform: r.platform,
				device: r.device,
				votes: r.votes,
				date: r.date,
			};
		});
		const juryvotesFromDatabase = await database.find("juryvotes", {
			roesc: votingData.roesc,
			voting: votingData.link,
		});
		const juryvotes = juryvotesFromDatabase.map((r) => {
			return {
				robloxId: r.robloxId,
				robloxName: r.robloxName,
				discordId: r.discordId,
				discordName: r.discordName,
				votes: r.points,
				country: r.country,
			};
		});
		res.json({ televotes: televotes, juryvotes: juryvotes });
	}
});

router.post("/submit_vote", async (req, res) => {
	let votingData = await database.findOne("votings", { apiKey: req.query.key });
	if (votingData) {
		const { robloxId, votes, device, platform } = req.body;
		let robloxUsername;
		if (database.getRobloxDown()) {
			robloxUsername = `ID: ${robloxId}`;
		} else {
			robloxUsername = await getUsernameFromId(robloxId);
		}
		await database.insertNotExisting(
			"televotes",
			{
				roesc: votingData.roesc,
				voting: votingData.link,
				robloxId: robloxId,
				robloxName: robloxUsername,
				discordId: undefined,
				discordName: undefined,
				platform: platform,
				device: device,
				votes: votes,
				date: new Date(),
			},
			{ robloxId: robloxId, roesc: votingData.roesc, voting: votingData.link }
		);
	}
	res.sendStatus(200);
});

module.exports = router;
