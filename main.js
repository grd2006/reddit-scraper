import { Actor } from 'apify';
import fetch from 'node-fetch';
import { scrapePosts } from './modes/posts.js';
import { searchPosts } from './modes/search.js';
import { scrapeCommentsBasic } from './modes/comments-basic.js';
// import { scrapeCommentsAdvanced } from './modes/comments-advanced.js';

await Actor.init();

const input = await Actor.getInput();

const mode = input?.mode || 'posts';

// MAIN ROUTER
switch(mode) {

    case 'posts':
        await scrapePosts(input);
        break;

    case 'comments-basic':
        await scrapeCommentsBasic(input);
        break;

    // case 'comments-advanced':
    //     await scrapeCommentsAdvanced(input);
    //     break;

    case 'search':
        await searchPosts(input);
        break;

    default:
        console.log('Invalid mode');
}

await Actor.exit();