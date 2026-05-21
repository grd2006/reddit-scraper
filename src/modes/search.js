import { Actor } from 'apify';

// FUNCTION FOR SEARCHING POSTS
export async function searchPosts(input) {

    const query = input?.query || 'chatgpt';

    const url =
        `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    const data = await response.json();

    const results = data.data.children.map((post) => ({

        title: post.data.title,

        subreddit: post.data.subreddit,

        author: post.data.author,

        upvotes: post.data.ups,

        comments: post.data.num_comments,

        permalink:
            `https://reddit.com${post.data.permalink}`

    }));

    console.log(`Fetched ${results.length} search results`);

    console.log(results);

    await Actor.pushData(results);

}
