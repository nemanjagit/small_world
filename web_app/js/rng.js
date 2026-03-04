// ——— Random.org JSON-RPC API ———
async function fetchRandomOrg(n) {
  const res = await fetch('https://api.random.org/json-rpc/4/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'generateIntegers',
      params: { apiKey: RANDOM_ORG_API_KEY, n, min: 0, max: 999999, replacement: true },
      id: 1
    })
  });
  if (!res.ok) throw new Error('network error');
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result.random.data;
}
