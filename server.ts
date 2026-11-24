import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateSitemapXml } from './src/utils/seoRouting.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import {
  createUserExchangeProposal,
  deleteExchangeProposal,
  deleteSavedInsight,
  getOrCreateUser,
  GroundedSourceRecord,
  listSavedInsights,
  listUserExchangeProposals,
  saveMarketInsight,
  updateExchangeProposalStatus,
  updateUserProfile,
} from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'skillconnect-official-website',
      timestamp: new Date().toISOString(),
    });
  });

  // Google Search Grounded India Skill Economy Insights (Gemini 4 Hydrogen)
  app.post('/api/skill-insights', async (req: Request, res: Response) => {
    const rawQuery =
      typeof req.body?.query === 'string'
        ? req.body.query.trim()
        : typeof req.body?.category === 'string'
          ? req.body.category.trim()
          : '';
    const topic = rawQuery.slice(0, 180);

    if (!topic || topic.length < 2) {
      res.status(400).json({ error: 'Please enter a valid skill category or search topic.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Live Google Search intelligence is currently unavailable because the server Gemini key is not configured.',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Using current Google Search data for India's skill-based services, hiring, and freelance economy, provide a concise, factual 3-sentence market brief for "${topic}". Highlight current Indian city or remote demand trends, typical client expectations, and practical proof or verification signals service providers should highlight. Plain text only, no markdown headings or bullet symbols.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text?.trim() || '';
      if (!text) {
        res.status(502).json({ error: 'No grounded insight was returned for this topic.' });
        return;
      }

      const candidate = response.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;
      const rawChunks = groundingMetadata?.groundingChunks || [];
      const seenUris = new Set<string>();
      const sources: GroundedSourceRecord[] = [];

      for (const chunk of rawChunks) {
        const uri = chunk.web?.uri;
        if (uri && /^https?:\/\//i.test(uri) && !seenUris.has(uri)) {
          seenUris.add(uri);
          sources.push({
            title: chunk.web?.title || uri,
            uri,
          });
        }
      }

      res.json({
        category: topic,
        insight: text,
        sources: sources.slice(0, 6),
        searchQueries: groundingMetadata?.webSearchQueries || [],
        source: 'google_search_grounded',
      });
    } catch (error) {
      console.error('Gemini Google Search grounding error:', error);
      res.status(502).json({
        error: 'Unable to complete live Google Search insight lookup right now. Please try again.',
      });
    }
  });

  // Authenticated PostgreSQL Workspace API Routes (Protected by Firebase ID Token Verification)
  app.post('/api/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@skillconnect.user`;
      const displayName =
        typeof req.user!.name === 'string'
          ? req.user!.name
          : typeof req.body?.displayName === 'string'
            ? req.body.displayName
            : '';
      const photoUrl =
        typeof req.user!.picture === 'string'
          ? req.user!.picture
          : typeof req.body?.photoUrl === 'string'
            ? req.body.photoUrl
            : null;

      const userRecord = await getOrCreateUser(uid, email, displayName, photoUrl);
      const [proposals, savedInsights] = await Promise.all([
        listUserExchangeProposals(uid),
        listSavedInsights(uid),
      ]);

      res.json({
        user: userRecord,
        proposals,
        savedInsights,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to load workspace.';
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/me', requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : '';
    const city = typeof req.body?.city === 'string' ? req.body.city.trim() : '';
    const primarySkill =
      typeof req.body?.primarySkill === 'string' ? req.body.primarySkill.trim() : '';
    const rawRole = typeof req.body?.role === 'string' ? req.body.role.trim() : 'member';
    const allowedRoles = ['member', 'customer', 'provider', 'mentor'];
    const role = allowedRoles.includes(rawRole) ? rawRole : 'member';

    if (displayName.length < 2) {
      res.status(400).json({ error: 'Display name must be at least 2 characters.' });
      return;
    }

    try {
      const email = req.user!.email || `${uid}@skillconnect.user`;
      await getOrCreateUser(uid, email, displayName);
      const updated = await updateUserProfile(uid, {
        displayName,
        city,
        primarySkill,
        role,
      });
      res.json({ user: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update profile.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/workspace/proposals', requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@skillconnect.user`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : '';

    const offeredSkill =
      typeof req.body?.offeredSkill === 'string' ? req.body.offeredSkill.trim() : '';
    const requestedSkill =
      typeof req.body?.requestedSkill === 'string' ? req.body.requestedSkill.trim() : '';
    const city = typeof req.body?.city === 'string' ? req.body.city.trim() : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (offeredSkill.length < 2 || requestedSkill.length < 2) {
      res.status(400).json({ error: 'Both offered skill and requested skill are required.' });
      return;
    }

    try {
      const proposal = await createUserExchangeProposal(uid, email, displayName, {
        offeredSkill,
        requestedSkill,
        city,
        notes,
      });
      res.status(201).json({ proposal });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create proposal.';
      res.status(500).json({ error: msg });
    }
  });

  app.patch('/api/workspace/proposals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const proposalId = Number(req.params.id);
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      res.status(400).json({ error: 'Invalid proposal identifier.' });
      return;
    }
    if (!['open', 'matched', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Invalid proposal status.' });
      return;
    }

    try {
      const updated = await updateExchangeProposalStatus(req.user!.uid, proposalId, status);
      if (!updated) {
        res.status(404).json({ error: 'Proposal not found.' });
        return;
      }
      res.json({ proposal: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update proposal.';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/workspace/proposals/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const proposalId = Number(req.params.id);
    if (!Number.isInteger(proposalId) || proposalId <= 0) {
      res.status(400).json({ error: 'Invalid proposal identifier.' });
      return;
    }

    try {
      const removed = await deleteExchangeProposal(req.user!.uid, proposalId);
      if (!removed) {
        res.status(404).json({ error: 'Proposal not found.' });
        return;
      }
      res.json({ deleted: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete proposal.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/workspace/insights', requireAuth, async (req: AuthRequest, res: Response) => {
    const uid = req.user!.uid;
    const email = req.user!.email || `${uid}@skillconnect.user`;
    const displayName = typeof req.user!.name === 'string' ? req.user!.name : '';

    const queryTopic =
      typeof req.body?.queryTopic === 'string' ? req.body.queryTopic.trim() : '';
    const summaryText =
      typeof req.body?.summaryText === 'string' ? req.body.summaryText.trim() : '';
    const sources = Array.isArray(req.body?.sources) ? req.body.sources : [];

    if (queryTopic.length < 2 || summaryText.length < 10) {
      res.status(400).json({ error: 'Valid insight topic and summary are required.' });
      return;
    }

    try {
      const saved = await saveMarketInsight(uid, email, displayName, {
        queryTopic,
        summaryText,
        sources,
      });
      res.status(201).json({ insight: saved });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save insight.';
      res.status(500).json({ error: msg });
    }
  });

  app.delete('/api/workspace/insights/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    const insightId = Number(req.params.id);
    if (!Number.isInteger(insightId) || insightId <= 0) {
      res.status(400).json({ error: 'Invalid insight identifier.' });
      return;
    }

    try {
      const removed = await deleteSavedInsight(req.user!.uid, insightId);
      if (!removed) {
        res.status(404).json({ error: 'Saved insight not found.' });
        return;
      }
      res.json({ deleted: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to delete insight.';
      res.status(500).json({ error: msg });
    }
  });

  // SEO & Verification Endpoints
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain').sendFile(robotsPath);
      return;
    }
    res
      .type('text/plain')
      .send('User-agent: *\nAllow: /\nDisallow: /founder-cms\nDisallow: /workspace\nDisallow: /api/\n\nSitemap: https://skillconnectofficial.cloud.run/sitemap.xml\n');
  });

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    res.type('application/xml').send(generateSitemapXml());
  });

  app.get('/ads.txt', (_req: Request, res: Response) => {
    const adsPath = path.resolve(__dirname, 'public', 'ads.txt');
    if (fs.existsSync(adsPath)) {
      res.type('text/plain').sendFile(adsPath);
      return;
    }
    res.type('text/plain').send('google.com, pub-8492911917617426, DIRECT, f08c47fec0942fa0\n');
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillConnect Official server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SkillConnect server:', err);
  process.exit(1);
});
