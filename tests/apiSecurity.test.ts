import { AddressInfo, Server } from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../server/src/index.js';

describe('Local API boundary', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('allows the local app origin and omits the Express fingerprint header', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(response.headers.get('x-powered-by')).toBeNull();
  });

  it('rejects requests from an unrelated browser origin', async () => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://attacker.example' },
    });
    expect(response.status).toBe(403);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('validates clarification input before passing it into the task manager', async () => {
    const response = await fetch(
      `${baseUrl}/api/tasks/00000000-0000-4000-8000-000000000000/clarify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { 'travel date': 123 } }),
      },
    );
    expect(response.status).toBe(400);
  });
});
