import { describe, it, expect, beforeEach } from 'vitest';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import client from './client';

type RequestInterceptorManager = {
  handlers: Array<{
    fulfilled?: (cfg: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    rejected?: (err: unknown) => Promise<unknown>;
  }>;
};

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds Authorization header when token exists', () => {
    localStorage.setItem('token', 'abc');
    // Axios types don't expose interceptor internals; access via `unknown`.
    const manager = client.interceptors.request as unknown as RequestInterceptorManager;
    const handler = manager.handlers[0]?.fulfilled;
    expect(handler).toBeTypeOf('function');

    const cfg = {
      headers: new AxiosHeaders(),
    } as unknown as InternalAxiosRequestConfig;

    const out = handler!(cfg);
    // AxiosHeaders stores normalized headers; easiest is to read back via get
    expect(out.headers.get('Authorization')).toBe('Token abc');
  });

  it('does not add Authorization header when token missing', () => {
    const manager = client.interceptors.request as unknown as RequestInterceptorManager;
    const handler = manager.handlers[0]?.fulfilled;
    const cfg = { headers: new AxiosHeaders() } as unknown as InternalAxiosRequestConfig;
    const out = handler!(cfg);
    expect(out.headers.get('Authorization')).toBeFalsy();
  });

  it('rejected interceptor returns a rejected promise', async () => {
    const manager = client.interceptors.request as unknown as RequestInterceptorManager;
    const rejected = manager.handlers[0]?.rejected;
    expect(rejected).toBeTypeOf('function');
    await expect(rejected!(new Error('x'))).rejects.toThrow('x');
  });
});

