import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL is not defined");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.get('/', (req: Request, res: Response) => {
    res.send('Comment API is running');
});

// Create a comment
app.post('/api/comments', async (req: Request, res: Response) => {
    const { userName, body, postSlug } = req.body;

    if (!body || !postSlug) {
        res.status(400).json({ error: 'Missing required fields: body, postSlug' });
        return;
    }

    try {
        const comment = await prisma.comment.create({
            data: {
                userName,
                body,
                postSlug,
            },
        });
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Error creating comment' });
    }
});

// Get comments for a post
app.get('/api/comments/:postSlug', async (req: Request, res: Response) => {
    const { postSlug } = req.params;
    console.log(postSlug);
    console.log(postSlug as string);

    try {
        const comments = await prisma.comment.findMany({
            where: { postSlug: String(postSlug) },
            orderBy: { createdAt: 'desc' },
        });
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
