"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const process = __importStar(require("process"));
const api_1 = require("@atproto/api");
dotenv.config();
// Create a Bluesky Agent 
const agent = new api_1.BskyAgent({
    service: 'https://bsky.social',
});
async function main() {
    const fTweets = fs_1.default.readFileSync(process.env.ARCHIVE_FOLDER + "/data/tweets.json");
    const tweets = JSON.parse(fTweets.toString());
    if (tweets != null && tweets.length > 0) {
        const sortedTweets = tweets.sort((a, b) => {
            let ad = new Date(a.tweet.created_at).getTime();
            let bd = new Date(b.tweet.created_at).getTime();
            return ad - bd;
        });
        await agent.login({ identifier: process.env.BLUESKY_USERNAME, password: process.env.BLUESKY_PASSWORD });
        for (let index = 0; index < sortedTweets.length; index++) {
            const tweet = sortedTweets[index].tweet;
            const tweet_createdAt = new Date(tweet.created_at).toISOString();
            // if (tweet.id != "1586630236405469189") 
            //     continue;
            console.log(`Parse tweet id '${tweet.id}'`);
            console.log(` Created at ${tweet_createdAt}`);
            console.log(` Full text '${tweet.full_text}'`);
            if (tweet.in_reply_to_screen_name) {
                console.log("Discarded (reply)");
                continue;
            }
            if (tweet.full_text.startsWith("@")) {
                console.log("Discarded (start with @)");
                continue;
            }
            if (tweet.full_text.startsWith("RT ")) {
                console.log("Discarded (start with RT)");
                continue;
            }
            const rt = new api_1.RichText({
                text: tweet.full_text
            });
            await rt.detectFacets(agent);
            const postRecord = {
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: tweet_createdAt,
            };
            const recordData = await agent.post(postRecord);
            const i = recordData.uri.lastIndexOf("/");
            if (i > 0) {
                const rkey = recordData.uri.substring(i + 1);
                const postUri = `https://bsky.app/profile/${process.env.BLUESKY_USERNAME}/post/${rkey}`;
                console.log("Blusky post create, URI: " + postUri);
            }
            else {
                console.log(recordData);
            }
            if (index > 5)
                break;
        }
    }
}
main();
