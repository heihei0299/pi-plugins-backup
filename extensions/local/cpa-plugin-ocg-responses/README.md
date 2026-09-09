# cpa-plugin-ocg-responses

A minimal native CLIProxyAPI v7 plugin for OpenCode Go models that require the OpenAI Responses API.

Target tested API/ABI: **CLIProxyAPI v7.2.155**.

## What it does

- Registers provider `ocg-responses`.
- Advertises `openai-response` as both executor input/output format.
- Exposes `muse-spark-1.3-contributor`.
- Sends requests directly to `https://opencode.ai/zen/go/v1/responses`.
- Supports non-streaming JSON and streaming SSE.
- Keeps Pi/CPA on the normal CPA entry point; CPA performs any needed client-protocol translation before invoking this executor.

## Build

Requires Go 1.24+ and a C toolchain.

```bash
go mod tidy
make build GOOS=linux GOARCH=amd64
```

Output:

```text
build/linux/amd64/ocg-responses.so
```

## Install into your Docker layout

Your compose already maps `./cpa-data/plugins-dir:/CLIProxyAPI/plugins`.

```bash
mkdir -p ./cpa-data/plugins-dir/linux/amd64
cp build/linux/amd64/ocg-responses.so ./cpa-data/plugins-dir/linux/amd64/
```

Merge `config-snippet.yaml` into CPA `config.yaml`.

Create a provider auth file in your mapped auth directory (`./cpa-data/auth-dir`):

```bash
cp ocg-responses.json.example ./cpa-data/auth-dir/ocg-responses.json
chmod 600 ./cpa-data/auth-dir/ocg-responses.json
```

Edit the API key first.

Important: remove `muse-spark-1.3-contributor` from the old `openai-compatibility: ocg` model list so routing is not ambiguous.

Restart:

```bash
docker restart cli-proxy-api
```

Check:

```bash
docker logs cli-proxy-api 2>&1 | grep -Ei 'ocg-responses|plugin loaded|plugin registered'
```

Model listing:

```bash
curl -s http://127.0.0.1:8317/v1/models \
  -H 'Authorization: Bearer YOUR_CPA_KEY' | jq '.data[] | select(.id=="muse-spark-1.3-contributor")'
```

Test Responses:

```bash
curl -N http://127.0.0.1:8317/v1/responses \
  -H 'Authorization: Bearer YOUR_CPA_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model":"muse-spark-1.3-contributor",
    "input":"Say hello",
    "stream":true
  }'
```

## Recommended CPA config change

Keep your old OpenAI-compatible OCG block for Chat Completions models such as MiMo, but remove Muse 1.3 from it:

```yaml
openai-compatibility:
  - name: ocg
    base-url: https://opencode.ai/zen/go/v1/
    api-key-entries:
      - api-key: YOUR_OCG_KEY
    models:
      - name: mimo-v2.5
        thinking:
          levels: [low, medium, high, xhigh, max]
```

The new `ocg-responses` provider owns `muse-spark-1.3-contributor` instead.

## Notes

The plugin's auth parser only claims JSON auth files whose `type` is exactly `ocg-responses`, so it should not consume unrelated CPA auth files.
