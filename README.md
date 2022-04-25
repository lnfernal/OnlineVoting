# Online voting

## Installation
- Download the source code
- Run `npm install`
- Rename `config_example.json` to `config.json` and edit it
- Run `node server.js`

## config.json explained
- `port`: the port that the application will run at
- `mode`: which discord oauth settings the code should use (`local` or `server`)
- `local_discord`/`server_discord`:
    - `oauth_link`: the link generated on the discord developer page
    - `client_id`: discord client id from the developer page
    - `client_secret`: discord client secret from the developer page
    - `redirect_uri`: redirect uri used in the oauth link (the callback url is `/api/oauth/callback`)
- `admins`: an array of discord user ids that will be able to access `/admin`
- `owner`: the name that will be displayed in places like `Ask <owner> for help`
- `verification_game_link`: a link to the roblox account verification page, leave blank to disable game verification
- `game_verificatoin_password`: the password that is used to verify that a user is verifying using the game and not by calling the apis
- `mongo_db_url`: a connection url to a mongodb database
- `default_voting_settings`:
    - `background`:
        - `color`: The color that will be visible in the background if no image is loaded
        - `image`: Image that will be visible in the background of the voting page
    - `main_window`:
        - `font_color`: Font color used for all text on the voting page
        - `background_color`: Background color of the main window (the one in the middle)
        - `button_font_color`: Font color used for buttons
        - `button_background_color`: Background color used for buttons
    - `option`:
        - `background_color`: Background color used for a voting option before it's selected

## Verification game > ServerScriptService > Settings explained
- `VotingUrl`: a base url for the voting page
- `Password`: the same as `config.json > game_verification_password`

## TODO
- Admins / contest owners should automatically get access to newly created votings
- Improve the roblox game
- idk
- Televotes should be added live to the manage page
- Don't save access token if the user rejected discord oauth
- Save setting automatically to make it less confusing
