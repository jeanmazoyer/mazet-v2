// A scripted stand-in for Google's HTTP endpoints, for tests only. Each rule answers the first
// request whose URL and method match; every request is recorded so a test can check what was sent.
export interface RecordedCall {
  method: string;
  url: string;
  auth: string | null;
  body: unknown;
  form: URLSearchParams | null;
}

export interface Rule {
  match: (url: string, method: string) => boolean;
  status?: number;
  json?: unknown;
  text?: string;
}

export function scriptedFetch(rules: Rule[]): { fetchFn: typeof fetch; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchFn = ((input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const raw = typeof init?.body === "string" ? init.body : null;
    const isForm = headers.get("Content-Type") === "application/x-www-form-urlencoded";
    calls.push({
      method,
      url,
      auth: headers.get("Authorization"),
      body: raw !== null && !isForm ? (JSON.parse(raw) as unknown) : null,
      form: raw !== null && isForm ? new URLSearchParams(raw) : null,
    });
    const rule = rules.find((r) => r.match(url, method));
    if (rule === undefined) return Promise.resolve(new Response("no rule", { status: 500 }));
    const payload = rule.text ?? JSON.stringify(rule.json ?? {});
    return Promise.resolve(
      new Response(payload, {
        status: rule.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof fetch;
  return { fetchFn, calls };
}
