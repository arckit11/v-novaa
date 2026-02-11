import { Router } from 'express';
import { classifyVoiceCommand } from '../services/gemini.js';

export const voiceRouter = Router();

// POST /api/voice-command — classify voice transcript via Gemini
voiceRouter.post('/', async (req, res) => {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
        res.status(400).json({ error: 'Missing transcript' });
        return;
    }

    console.log(`🎤 Voice: "${transcript}"`);

    try {
        const result = await classifyVoiceCommand(transcript);
        console.log(`   → ${result.action}: ${result.label}`);
        res.json(result);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('   ✗ Gemini error:', message);
        res.status(500).json({ action: 'none', label: '', error: message });
    }
});
