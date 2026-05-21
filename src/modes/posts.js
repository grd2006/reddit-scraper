import { Actor } from 'apify';
import { parseRedditInput } from '../utils/UrlParser.js';

// FUNCTION FOR POST SCRAPING
export async function scrapePosts(input) {
    const { subreddit } = parseRedditInput(input);

    const url = `https://www.reddit.com/r/${subreddit}.json`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
        },
    });

    const data = await response.json();

    const posts = data.data.children.map((post) => ({
        title: post.data.title,
        author: post.data.author,
        upvotes: post.data.ups,
        comments: post.data.num_comments,
    }));

    posts.sort((a, b) => b.comments - a.comments);

    console.log(posts);
    console.log(`Fetched ${posts.length} posts`);

    await Actor.pushData(posts);

}
