import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { savedMarketInsights, skillExchangeProposals, users } from './schema.ts';

export interface GroundedSourceRecord {
  title: string;
  uri: string;
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName = '',
  photoUrl: string | null = null
) {
  try {
    const safeEmail = email.trim().slice(0, 160);
    const safeName = displayName.trim().slice(0, 120);
    const safePhoto = photoUrl ? photoUrl.trim().slice(0, 500) : null;

    const result = await db
      .insert(users)
      .values({
        uid,
        email: safeEmail,
        displayName: safeName,
        photoUrl: safePhoto,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: safeEmail,
          displayName: safeName,
          photoUrl: safePhoto,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Unable to synchronize account profile.', { cause: error });
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName: string;
    city: string;
    primarySkill: string;
    role: string;
  }
) {
  try {
    const result = await db
      .update(users)
      .set({
        displayName: updates.displayName.trim().slice(0, 120),
        city: updates.city.trim().slice(0, 80),
        primarySkill: updates.primarySkill.trim().slice(0, 120),
        role: updates.role.trim().slice(0, 40),
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database error in updateUserProfile:', error);
    throw new Error('Unable to update workspace profile.', { cause: error });
  }
}

export async function listUserExchangeProposals(uid: string) {
  try {
    const rows = await db
      .select({
        id: skillExchangeProposals.id,
        userId: skillExchangeProposals.userId,
        offeredSkill: skillExchangeProposals.offeredSkill,
        requestedSkill: skillExchangeProposals.requestedSkill,
        city: skillExchangeProposals.city,
        notes: skillExchangeProposals.notes,
        status: skillExchangeProposals.status,
        createdAt: skillExchangeProposals.createdAt,
      })
      .from(skillExchangeProposals)
      .innerJoin(users, eq(skillExchangeProposals.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(skillExchangeProposals.createdAt));

    return rows;
  } catch (error) {
    console.error('Database error in listUserExchangeProposals:', error);
    throw new Error('Unable to load skill exchange proposals.', { cause: error });
  }
}

export async function createUserExchangeProposal(
  uid: string,
  email: string,
  displayName: string,
  input: {
    offeredSkill: string;
    requestedSkill: string;
    city: string;
    notes: string;
  }
) {
  try {
    const userRecord = await getOrCreateUser(uid, email, displayName);
    const result = await db
      .insert(skillExchangeProposals)
      .values({
        userId: userRecord.id,
        offeredSkill: input.offeredSkill.trim().slice(0, 140),
        requestedSkill: input.requestedSkill.trim().slice(0, 140),
        city: input.city.trim().slice(0, 80) || 'Pan-India / Remote',
        notes: input.notes.trim().slice(0, 800),
        status: 'open',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in createUserExchangeProposal:', error);
    throw new Error('Unable to save skill exchange proposal.', { cause: error });
  }
}

export async function updateExchangeProposalStatus(uid: string, proposalId: number, status: string) {
  try {
    const userRows = await db.select({ id: users.id }).from(users).where(eq(users.uid, uid));
    if (!userRows[0]) return null;

    const result = await db
      .update(skillExchangeProposals)
      .set({ status })
      .where(
        and(
          eq(skillExchangeProposals.id, proposalId),
          eq(skillExchangeProposals.userId, userRows[0].id)
        )
      )
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database error in updateExchangeProposalStatus:', error);
    throw new Error('Unable to update skill exchange status.', { cause: error });
  }
}

export async function deleteExchangeProposal(uid: string, proposalId: number) {
  try {
    const userRows = await db.select({ id: users.id }).from(users).where(eq(users.uid, uid));
    if (!userRows[0]) return false;

    const deleted = await db
      .delete(skillExchangeProposals)
      .where(
        and(
          eq(skillExchangeProposals.id, proposalId),
          eq(skillExchangeProposals.userId, userRows[0].id)
        )
      )
      .returning({ id: skillExchangeProposals.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('Database error in deleteExchangeProposal:', error);
    throw new Error('Unable to remove skill exchange proposal.', { cause: error });
  }
}

export async function listSavedInsights(uid: string) {
  try {
    const rows = await db
      .select({
        id: savedMarketInsights.id,
        queryTopic: savedMarketInsights.queryTopic,
        summaryText: savedMarketInsights.summaryText,
        sourcesJson: savedMarketInsights.sourcesJson,
        createdAt: savedMarketInsights.createdAt,
      })
      .from(savedMarketInsights)
      .innerJoin(users, eq(savedMarketInsights.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(savedMarketInsights.createdAt));

    return rows.map((row) => {
      let sources: GroundedSourceRecord[] = [];
      try {
        const parsed = JSON.parse(row.sourcesJson);
        if (Array.isArray(parsed)) {
          sources = parsed.filter(
            (s): s is GroundedSourceRecord =>
              Boolean(s && typeof s.uri === 'string' && typeof s.title === 'string')
          );
        }
      } catch {
        sources = [];
      }
      return {
        id: row.id,
        queryTopic: row.queryTopic,
        summaryText: row.summaryText,
        sources,
        createdAt: row.createdAt,
      };
    });
  } catch (error) {
    console.error('Database error in listSavedInsights:', error);
    throw new Error('Unable to load saved market insights.', { cause: error });
  }
}

export async function saveMarketInsight(
  uid: string,
  email: string,
  displayName: string,
  input: {
    queryTopic: string;
    summaryText: string;
    sources: GroundedSourceRecord[];
  }
) {
  try {
    const userRecord = await getOrCreateUser(uid, email, displayName);
    const sanitizedSources = input.sources
      .filter((s) => s.uri && /^https?:\/\//i.test(s.uri))
      .slice(0, 8)
      .map((s) => ({
        title: (s.title || 'Source').slice(0, 160),
        uri: s.uri.slice(0, 500),
      }));

    const result = await db
      .insert(savedMarketInsights)
      .values({
        userId: userRecord.id,
        queryTopic: input.queryTopic.trim().slice(0, 140),
        summaryText: input.summaryText.trim().slice(0, 4000),
        sourcesJson: JSON.stringify(sanitizedSources),
      })
      .returning();

    return {
      id: result[0].id,
      queryTopic: result[0].queryTopic,
      summaryText: result[0].summaryText,
      sources: sanitizedSources,
      createdAt: result[0].createdAt,
    };
  } catch (error) {
    console.error('Database error in saveMarketInsight:', error);
    throw new Error('Unable to save grounded market insight.', { cause: error });
  }
}

export async function deleteSavedInsight(uid: string, insightId: number) {
  try {
    const userRows = await db.select({ id: users.id }).from(users).where(eq(users.uid, uid));
    if (!userRows[0]) return false;

    const deleted = await db
      .delete(savedMarketInsights)
      .where(
        and(
          eq(savedMarketInsights.id, insightId),
          eq(savedMarketInsights.userId, userRows[0].id)
        )
      )
      .returning({ id: savedMarketInsights.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('Database error in deleteSavedInsight:', error);
    throw new Error('Unable to delete saved market insight.', { cause: error });
  }
}
