import * as fs from "fs";
import {createBot, Bot} from "mineflayer";
import minimist = require("minimist");

/**
 * Minecraft account credentials
 */
interface credential {
    email: string;
    passwd: string;
}

/**
 * Minecraft server details
 */
interface server {
    host: string;
    port: number;
    version?: string;
}

/**
 * Loads the credentials from a file.
 * 1 account per line, format "email/username:password"
 * @param {string}          path            File containing the credentials
 * @return {credential[]}   Minecraft credential list
 */
function loadCredentials(path: string): credential[] {
    const lines = fs.readFileSync(path, "utf-8").toString().split("\n");
    let credentials: credential[] = [];
    lines.forEach((line) => {
        credentials.push({
            email: line.split(":")[0],
            passwd: line.split(":")[1]
        });
    });
    return credentials;
}

/**
 * Creates a bot and logs it into the server
 * @param {credential}      credential      Minecraft credentials
 * @param {server}          server          Server details
 */
function connectBot(credential: credential, server: server): Bot | null {
    if (!credential.email || !credential.passwd)
        return null;
    return createBot({
        host: server.host,
        port: server.port,
        version: server.version,
        username: credential.email,
        password: credential.passwd
    });
}

function main(): void {

    const requiredArgs = ["h", "v", "c", "n", "d"];
    const args = minimist(process.argv.slice(2));

    if (args.hasOwnProperty("help")) {
        console.log(
            "Usage: npm start -- <args>\n" +
            "  -h (required) : Server host\n" +
            "  -p (optional) : Server port, default 25565\n" +
            "  -v (required) : Server version (e.g. 1.12.2)\n" +
            "  -c (required) : Path to minecraft account credentials file (format email:password, 1 per line)\n" +
            "  -n (required) : Number of bots to connect" +
            "  -d (required) : Delay (ms) between connections" +
            "\n\n" +
            "Example:\n" +
            "  npm start -- -h localhost -p 10005 -v 1.12.2 -c ./ALTS.txt -n 5"
        );
        return;
    }

    // Checking if all required parameters are given
    for (const requiredArg of requiredArgs) {
        if (!args.hasOwnProperty(requiredArg)) {
            console.error("Parameter \"" + requiredArg + "\" is required. \"npm start -- --help\" for help.");
            return;
        }
    }

    const server: server = {
        host: args.h,
        port: args.p || 25565,
        version: args.v
    }
    const credentials = loadCredentials(args.c);

    if (credentials.length < args.n) {
        console.error("Not enough minecraft accounts to create " + args.n + " bots.");
        return;
    }

    let bots: Bot[] = [];
    for (let i = 0 ; i < args.n ; ++i) {
        setTimeout(() => {

            console.info("Bot " + (i + 1) + "/" + args.n + " is connecting...");

            const j = Math.floor(Math.random() * credentials.length);
            const credential = credentials[j];
            credentials.splice(j, 1);

            const bot = connectBot(credential, server);
            if (bot !== null) {
                bots.push(bot);
                bot.on("kicked", () => {
                    console.log("Bot " + i + " got kicked.");
                });
            }

        }, args.d * i);
    }
}

main();
