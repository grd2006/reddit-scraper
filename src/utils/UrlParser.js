export function parseRedditInput(input) {

    // If redditUrl exists
    if (input?.redditUrl) {

        const match = input.redditUrl.match(
            /reddit\.com\/r\/([^/]+)\/comments\/([^/]+)\//
        );

        if (!match) {
            throw new Error('Invalid Reddit URL');
        }

        return {
            subreddit: match[1],
            postId: match[2],
        };
    }

    // Fallback manual input
    return {
        subreddit: input?.subreddit || 'AskReddit',
        postId: input?.postId || '1tg6dpl',
    };
}