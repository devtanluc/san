// db/relations.ts
// Relational Queries v2 — dùng defineRelations() (drizzle-orm@rc).
// Đây là nơi DUY NHẤT khai báo quan hệ giữa các bảng; schema.ts chỉ chứa
// định nghĩa table. `from`/`to` thay cho `fields`/`references` cũ.
//
// Docs: https://orm.drizzle.team/docs/relations

import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session({
			from: r.user.id,
			to: r.session.userId,
		}),
		accounts: r.many.account({
			from: r.user.id,
			to: r.account.userId,
		}),
		topics: r.many.topic({
			from: r.user.id,
			to: r.topic.userId,
		}),
		posts: r.many.post({
			from: r.user.id,
			to: r.post.userId,
		}),
		reactions: r.many.postReaction({
			from: r.user.id,
			to: r.postReaction.userId,
		}),
		reflectionNotes: r.many.postReflectionNote({
			from: r.user.id,
			to: r.postReflectionNote.userId,
		}),
		sentReplies: r.many.postReply({
			from: r.user.id,
			to: r.postReply.fromUserId,
		}),
		receivedReplies: r.many.postReply({
			from: r.user.id,
			to: r.postReply.toUserId,
		}),
		// bạn đang follow người khác
		following: r.many.follow({
			from: r.user.id,
			to: r.follow.followerId,
		}),
		// người khác đang follow bạn
		followedBy: r.many.follow({
			from: r.user.id,
			to: r.follow.followingId,
		}),
		subscriptionsAsAuthor: r.many.subscription({
			from: r.user.id,
			to: r.subscription.authorId,
		}),
		subscriptionsAsSubscriber: r.many.subscription({
			from: r.user.id,
			to: r.subscription.subscriberUserId,
		}),
		milestones: r.many.milestone({
			from: r.user.id,
			to: r.milestone.userId,
		}),
		rereadNotes: r.many.rereadNote({
			from: r.user.id,
			to: r.rereadNote.userId,
		}),
		periodReviews: r.many.periodReview({
			from: r.user.id,
			to: r.periodReview.userId,
		}),
		customPromptSets: r.many.promptSet({
			from: r.user.id,
			to: r.promptSet.userId,
		}),
		savedPrompts: r.many.savedPrompt({
			from: r.user.id,
			to: r.savedPrompt.userId,
		}),
	},

	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
			optional: false,
		}),
	},

	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
			optional: false,
		}),
	},

	topic: {
		owner: r.one.user({
			from: r.topic.userId,
			to: r.user.id,
			optional: false,
		}),
		posts: r.many.post({
			from: r.topic.id,
			to: r.post.topicId,
		}),
	},

	post: {
		author: r.one.user({
			from: r.post.userId,
			to: r.user.id,
			optional: false,
		}),
		topic: r.one.topic({
			from: r.post.topicId,
			to: r.topic.id,
		}),
		reactions: r.many.postReaction({
			from: r.post.id,
			to: r.postReaction.postId,
		}),
		replies: r.many.postReply({
			from: r.post.id,
			to: r.postReply.postId,
		}),
		reflectionNotes: r.many.postReflectionNote({
			from: r.post.id,
			to: r.postReflectionNote.postId,
		}),
		milestones: r.many.milestone({
			from: r.post.id,
			to: r.milestone.postId,
		}),
		rereadNotes: r.many.rereadNote({
			from: r.post.id,
			to: r.rereadNote.postId,
		}),
	},

	postReflectionNote: {
		post: r.one.post({
			from: r.postReflectionNote.postId,
			to: r.post.id,
			optional: false,
		}),
		user: r.one.user({
			from: r.postReflectionNote.userId,
			to: r.user.id,
			optional: false,
		}),
	},

	postReaction: {
		post: r.one.post({
			from: r.postReaction.postId,
			to: r.post.id,
			optional: false,
		}),
		user: r.one.user({
			from: r.postReaction.userId,
			to: r.user.id,
			optional: false,
		}),
	},

	postReply: {
		post: r.one.post({
			from: r.postReply.postId,
			to: r.post.id,
			optional: false,
		}),
		fromUser: r.one.user({
			from: r.postReply.fromUserId,
			to: r.user.id,
			optional: false,
		}),
		toUser: r.one.user({
			from: r.postReply.toUserId,
			to: r.user.id,
			optional: false,
		}),
	},

	follow: {
		follower: r.one.user({
			from: r.follow.followerId,
			to: r.user.id,
			optional: false,
		}),
		following: r.one.user({
			from: r.follow.followingId,
			to: r.user.id,
			optional: false,
		}),
	},

	subscription: {
		author: r.one.user({
			from: r.subscription.authorId,
			to: r.user.id,
			optional: false,
		}),
		subscriber: r.one.user({
			from: r.subscription.subscriberUserId,
			to: r.user.id,
		}),
	},

	milestone: {
		user: r.one.user({
			from: r.milestone.userId,
			to: r.user.id,
			optional: false,
		}),
		post: r.one.post({
			from: r.milestone.postId,
			to: r.post.id,
		}),
	},

	rereadNote: {
		user: r.one.user({
			from: r.rereadNote.userId,
			to: r.user.id,
			optional: false,
		}),
		post: r.one.post({
			from: r.rereadNote.postId,
			to: r.post.id,
			optional: false,
		}),
	},

	periodReview: {
		user: r.one.user({
			from: r.periodReview.userId,
			to: r.user.id,
			optional: false,
		}),
	},

	promptSet: {
		// null = bộ prompt hệ thống, không thuộc user nào
		owner: r.one.user({
			from: r.promptSet.userId,
			to: r.user.id,
		}),
		prompts: r.many.prompt({
			from: r.promptSet.id,
			to: r.prompt.setId,
		}),
	},

	prompt: {
		set: r.one.promptSet({
			from: r.prompt.setId,
			to: r.promptSet.id,
			optional: false,
		}),
		savedBy: r.many.savedPrompt({
			from: r.prompt.id,
			to: r.savedPrompt.promptId,
		}),
	},

	savedPrompt: {
		user: r.one.user({
			from: r.savedPrompt.userId,
			to: r.user.id,
			optional: false,
		}),
		prompt: r.one.prompt({
			from: r.savedPrompt.promptId,
			to: r.prompt.id,
			optional: false,
		}),
	},
}));
