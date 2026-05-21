// import { Actor } from 'apify';
// import fetch from 'node-fetch';
// import { parseRedditInput } from '../utils/UrlParser.js';

// function normalizeRedditUrl(url) {
//     return url.replace(/^https?:\/\//, 'https://');
// }

// function isValidComment(data) {
//     if (!data) return false;
//     const body = String(data.body ?? '').trim();
//     if (!body) return false;
//     if (data.author === '[deleted]' || data.author === '[removed]') return false;
//     return true;
// }

// function buildCommentNode(data, depth) {
//     return {
//         id: data.id,
//         author: data.author || '[deleted]',
//         body: data.body ?? '[deleted]',
//         upvotes: data.ups ?? 0,
//         replyCount: 0,
//         discussionDepth: 0,
//         replies: [],
//     };
// }

// function shouldIncludeComment(data, childrenReplies) {
//     if (!data) return false;
//     if (childrenReplies.length > 0) return true;
//     const body = String(data.body ?? '').trim();
//     return body.length > 0;
// }

// function computeReplyCounts(node) {
//     let totalDescendants = 0;
//     for (const child of node.replies) {
//         totalDescendants += 1 + computeReplyCounts(child);
//     }
//     node.replyCount = totalDescendants;
//     node._activity = totalDescendants;
//     return totalDescendants;
// }

// function computeDiscussionDepth(node) {
//     // Recursively calculate maximum discussion chain depth under this comment.
//     // discussionDepth represents how deep the replies tree goes, not position in thread.
//     // Example: comment with 3 levels of nested replies has discussionDepth = 3.
//     if (node.replies.length === 0) {
//         node.discussionDepth = 0;
//         return 0;
//     }

//     let maxChildDepth = 0;
//     for (const child of node.replies) {
//         const childDepth = computeDiscussionDepth(child);
//         maxChildDepth = Math.max(maxChildDepth, childDepth);
//     }

//     node.discussionDepth = maxChildDepth + 1;
//     return node.discussionDepth;
// }

// function extractChildren(replies) {
//     if (!replies || typeof replies !== 'object') return [];
//     return replies.data?.children || [];
// }

// function collectCommentTree(children, parentKey, replyMap, pendingMore, counters, options) {
//     const parentEntry = replyMap.get(parentKey);
//     if (!parentEntry) return;

//     for (const item of children) {
//         if (counters.commentCount >= options.maxComments) break;

//         const { kind, data } = item;
//         if (kind === 't1') {
//             const commentKey = `t1_${data.id}`;
//             if (replyMap.has(commentKey)) continue;

//             const depth = parentEntry.depth + 1;
//             const node = buildCommentNode(data, depth);
//             const childrenReplies = extractChildren(data.replies);

//                 if (shouldIncludeComment(data, childrenReplies)) {
//                 parentEntry.replies.push(node);
//                 // Store the full node so later parent lookups can access depth and replies easily
//                 replyMap.set(commentKey, node);

//                 if (isValidComment(data)) {
//                     counters.commentCount += 1;
//                 }
//             }

//             if (depth < options.maxDepth && childrenReplies.length) {
//                 collectCommentTree(childrenReplies, commentKey, replyMap, pendingMore, counters, options);
//             }
//         } else if (kind === 'more' && Array.isArray(data.children) && data.children.length) {
//             pendingMore.push({
//                 parentId: data.parent_id,
//                 childrenIds: data.children,
//             });
//         }
//     }
// }

// async function fetchRedditJson(url) {
//     const normalizedUrl = normalizeRedditUrl(url);
//     const response = await fetch(normalizedUrl, {
//         headers: {
//             'User-Agent': 'apify-reddit-scraper/1.0',
//             Accept: 'application/json',
//         },
//     });

//     if (!response.ok) {
//         throw new Error(`Reddit request failed: ${response.status} ${response.statusText}`);
//     }

//     return response.json();
// }

// async function fetchMoreChildren(subreddit, postId, childrenIds) {
//     const url = `https://www.reddit.com/api/morechildren.json?api_type=json&link_id=t3_${postId}&children=${childrenIds.join(',')}&sort=confidence`;
//     const data = await fetchRedditJson(url);
//     return data?.json?.data?.things || [];
// }

// function sortCommentTreeByActivity(nodes) {
//     nodes.sort((a, b) => {
//         const diff = (b._activity || 0) - (a._activity || 0);
//         return diff || (b.replyCount - a.replyCount);
//     });

//     for (const node of nodes) {
//         sortCommentTreeByActivity(node.replies);
//         delete node._activity;
//     }
// }


// async function resolveMoreComments(subreddit, postId, replyMap, pendingMore, counters, options) {
//     const queue = [...pendingMore];
//     const childIdQueue = [];
//     const requestedIds = new Set();

//     while (queue.length && counters.moreRequestCount < options.maxMoreRequests && counters.commentCount < options.maxComments) {
//         while (queue.length && childIdQueue.length < options.moreBatchSize) {
//             const placeholder = queue.shift();
//             const remaining = placeholder.childrenIds.filter((id) => !requestedIds.has(id));
//             if (!remaining.length) continue;

//             const batchSlice = remaining.splice(0, options.moreBatchSize - childIdQueue.length);
//             childIdQueue.push(...batchSlice);
//             batchSlice.forEach((id) => requestedIds.add(id));

//             if (remaining.length) {
//                 queue.unshift({ parentId: placeholder.parentId, childrenIds: remaining });
//             }
//         }

//         if (!childIdQueue.length) break;

//         const moreItems = await fetchMoreChildren(subreddit, postId, childIdQueue);
//         counters.moreRequestCount += 1;
//         childIdQueue.length = 0;

//         if (!moreItems.length) continue;

//         for (const item of moreItems) {
//             if (counters.commentCount >= options.maxComments) break;
//             if (item.kind === 't1') {
//                 const commentKey = `t1_${item.data.id}`;
//                 if (replyMap.has(commentKey)) continue;

//                 const parentEntry = replyMap.get(item.data.parent_id);
//                 if (!parentEntry) continue;

//                 const depth = parentEntry.depth + 1;
//                 const node = buildCommentNode(item.data, depth);
//                 const childrenReplies = extractChildren(item.data.replies);

//                 parentEntry.replies.push(node);
//                 // Store the full node for consistent parent lookup
//                 replyMap.set(commentKey, node);

//                 if (isValidComment(item.data)) {
//                     counters.commentCount += 1;
//                 }

//                 if (depth < options.maxDepth && childrenReplies.length) {
//                     collectCommentTree(childrenReplies, commentKey, replyMap, queue, counters, options);
//                 }
//             } else if (item.kind === 'more' && Array.isArray(item.data.children) && item.data.children.length) {
//                 queue.push({ parentId: item.data.parent_id, childrenIds: item.data.children });
//             }
//         }
//     }
// }

// export async function scrapeCommentsAdvanced(input) {
//     const { subreddit, postId } =
//         parseRedditInput(input);
//     const options = {
//         maxDepth: input?.maxDepth ?? 6,
//         maxComments: input?.maxComments ?? 500,
//         maxMoreRequests: input?.maxMoreRequests ?? 10,
//         moreBatchSize: input?.moreBatchSize ?? 20,
//     };

//     const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
//     const data = await fetchRedditJson(url);
//     const listing = Array.isArray(data) ? data[1]?.data?.children || [] : [];

//     const rootReplies = [];
//     // Use a root sentinel node so parent lookups always return a node object
//     const rootNode = { id: `t3_${postId}`, replies: rootReplies, depth: -1 };
//     const replyMap = new Map();
//     replyMap.set(rootNode.id, rootNode);

//     const pendingMore = [];
//     const counters = { commentCount: 0, moreRequestCount: 0 };

//     collectCommentTree(listing, `t3_${postId}`, replyMap, pendingMore, counters, options);
//     await resolveMoreComments(subreddit, postId, replyMap, pendingMore, counters, options);

//     // Compute recursive discussion depth (how deep replies go under each comment)
//     for (const node of rootReplies) {
//         computeReplyCounts(node);
//         computeDiscussionDepth(node);
//     }

//     sortCommentTreeByActivity(rootReplies);

//     console.log(`Fetched ${counters.commentCount} comments via advanced mode`);
//     console.log(`Issued ${counters.moreRequestCount} morechildren requests`);
//     console.log(rootReplies);

//     await Actor.pushData(rootReplies);
// }
