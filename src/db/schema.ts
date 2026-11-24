import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default(''),
  photoUrl: text('photo_url'),
  city: text('city').notNull().default(''),
  primarySkill: text('primary_skill').notNull().default(''),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const skillExchangeProposals = pgTable('skill_exchange_proposals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  offeredSkill: text('offered_skill').notNull(),
  requestedSkill: text('requested_skill').notNull(),
  city: text('city').notNull().default('Pan-India / Remote'),
  notes: text('notes').notNull().default(''),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedMarketInsights = pgTable('saved_market_insights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  queryTopic: text('query_topic').notNull(),
  summaryText: text('summary_text').notNull(),
  sourcesJson: text('sources_json').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(skillExchangeProposals),
  savedInsights: many(savedMarketInsights),
}));

export const skillExchangeProposalsRelations = relations(skillExchangeProposals, ({ one }) => ({
  author: one(users, {
    fields: [skillExchangeProposals.userId],
    references: [users.id],
  }),
}));

export const savedMarketInsightsRelations = relations(savedMarketInsights, ({ one }) => ({
  author: one(users, {
    fields: [savedMarketInsights.userId],
    references: [users.id],
  }),
}));
