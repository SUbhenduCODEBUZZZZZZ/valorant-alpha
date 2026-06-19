import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'valorant_db';

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL);
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// In-memory cache for agents (1 hour)
let agentsCache = { data: null, ts: 0 };
const CACHE_TTL = 1000 * 60 * 60;

async function fetchAgents() {
  const now = Date.now();
  if (agentsCache.data && now - agentsCache.ts < CACHE_TTL) {
    return agentsCache.data;
  }
  const res = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true&language=en-US', {
    headers: { 'User-Agent': 'ValorantEncyclopedia/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch agents from valorant-api');
  const json = await res.json();
  const agents = (json.data || []).map((a) => ({
    uuid: a.uuid,
    displayName: a.displayName,
    description: a.description,
    developerName: a.developerName,
    characterTags: a.characterTags || [],
    displayIcon: a.displayIcon,
    displayIconSmall: a.displayIconSmall,
    bustPortrait: a.bustPortrait,
    fullPortrait: a.fullPortrait,
    fullPortraitV2: a.fullPortraitV2,
    killfeedPortrait: a.killfeedPortrait,
    background: a.background,
    backgroundGradientColors: a.backgroundGradientColors || [],
    assetPath: a.assetPath,
    isFullPortraitRightFacing: a.isFullPortraitRightFacing,
    role: a.role
      ? {
          uuid: a.role.uuid,
          displayName: a.role.displayName,
          description: a.role.description,
          displayIcon: a.role.displayIcon,
        }
      : null,
    abilities: (a.abilities || []).map((ab) => ({
      slot: ab.slot,
      displayName: ab.displayName,
      description: ab.description,
      displayIcon: ab.displayIcon,
    })),
    voiceLine: a.voiceLine?.mediaList?.[0]?.wave || null,
  }));
  agentsCache = { data: agents, ts: now };
  // Persist to mongo for sources tab snapshot
  try {
    const db = await getDb();
    await db.collection('agent_snapshots').updateOne(
      { key: 'latest' },
      { $set: { key: 'latest', ts: new Date(), count: agents.length, source: 'valorant-api.com' } },
      { upsert: true }
    );
  } catch (e) {}
  return agents;
}

export async function GET(request, { params }) {
  const pathArr = params?.path || [];
  const route = pathArr.join('/');

  try {
    if (route === '' || route === 'health') {
      return NextResponse.json({ ok: true, message: 'Valorant Encyclopedia API' }, { headers: CORS });
    }

    if (route === 'agents') {
      const agents = await fetchAgents();
      return NextResponse.json({ data: agents, lastUpdated: new Date(agentsCache.ts).toISOString(), source: 'valorant-api.com' }, { headers: CORS });
    }

    if (route.startsWith('agents/')) {
      const id = route.split('/')[1];
      const agents = await fetchAgents();
      const agent = agents.find((a) => a.uuid === id || a.displayName.toLowerCase() === decodeURIComponent(id).toLowerCase());
      if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404, headers: CORS });
      return NextResponse.json({ data: agent }, { headers: CORS });
    }

    if (route === 'meta') {
      const db = await getDb();
      const snap = await db.collection('agent_snapshots').findOne({ key: 'latest' });
      return NextResponse.json({
        sources: [
          { name: 'Valorant-API', url: 'https://valorant-api.com', description: 'Community-driven Valorant data API powered by official assets.' },
          { name: 'Official Valorant', url: 'https://playvalorant.com/en-us/agents/', description: 'Official Riot Games agent pages.' },
          { name: 'Valorant Wiki (Fandom)', url: 'https://valorant.fandom.com', description: 'Community wiki with lore and detailed info.' },
          { name: 'Liquipedia Valorant', url: 'https://liquipedia.net/valorant', description: 'Esports & meta information.' },
        ],
        snapshot: snap || null,
        builtBy: 'Alpha Man',
      }, { headers: CORS });
    }

    return NextResponse.json({ error: 'Not found', route }, { status: 404, headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}

export async function POST(request, { params }) {
  const pathArr = params?.path || [];
  const route = pathArr.join('/');
  try {
    if (route === 'refresh') {
      agentsCache = { data: null, ts: 0 };
      const agents = await fetchAgents();
      return NextResponse.json({ ok: true, count: agents.length }, { headers: CORS });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: CORS });
  }
}
