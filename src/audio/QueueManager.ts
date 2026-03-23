import { ServerQueue } from './ServerQueue';

export class QueueManager {
    private static instance: QueueManager;
    private queues: Map<string, ServerQueue>;

    private constructor() {
        this.queues = new Map();
    }

    public static getInstance(): QueueManager {
        if (!QueueManager.instance) {
            QueueManager.instance = new QueueManager();
        }
        return QueueManager.instance;
    }

    public get(guildId: string): ServerQueue | undefined {
        return this.queues.get(guildId);
    }

    public set(guildId: string, queue: ServerQueue): void {
        this.queues.set(guildId, queue);
    }

    public delete(guildId: string): void {
        const q = this.queues.get(guildId);
        if (q) {
            q.stop();
            this.queues.delete(guildId);
        }
    }
}
