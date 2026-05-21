import { scrapeCommentsAdvanced } from './modes/comments-advanced.js';
import { Actor } from 'apify';

// Monkey-patch Actor.pushData to print results to stdout for this test
Actor.pushData = async (data) => {
    console.log('--- SCRAPER OUTPUT START ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('--- SCRAPER OUTPUT END ---');
};

(async () => {
    try {
        await scrapeCommentsAdvanced({
            subreddit: 'AskReddit',
            postId: '1tg6dpl', // change to desired post
            maxDepth: 6,
            maxComments: 200,
            maxMoreRequests: 5,
            moreBatchSize: 20,
        });
    } catch (err) {
        console.error('Error running scraper:', err);
    }
})();
