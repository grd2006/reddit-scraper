import { Actor } from 'apify';
import { parseRedditInput } from '../utils/UrlParser.js';

// FUNCTION FOR COMMENT SCRAPING
export async function scrapeCommentsBasic(input) {
    const { subreddit, postId } = parseRedditInput(input);

    const url = `https://api.reddit.com/r/${subreddit}/comments/${postId}.json`;

    const response = await fetch(url);

    const data = await response.json();

    const comments = data[1].data.children

        // Keep only actual comments
        .filter(comment => comment.kind === 't1')

        // Keep only comments with replies
        .filter(comment =>
            comment.data.replies?.data?.children?.length > 0
        )

        // Transform data
        .map((comment) => ({

            author: comment.data.author,

            body: comment.data.body,

            upvotes: comment.data.ups,

            // Count direct replies only
            replyCount:
                comment.data.replies?.data?.children?.length,

            permalink:
                `https://reddit.com${comment.data.permalink}`

        }));

    // Sort by highest reply count
    comments.sort((a, b) => b.replyCount - a.replyCount);

    console.log(`Fetched ${comments.length} comments`);

    console.log(comments);

    await Actor.pushData(comments);

}
