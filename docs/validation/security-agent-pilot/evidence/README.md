# Pilot Evidence

Runner-owned raw traces are under `.codex/apex/security-pilot-runs/`. This directory holds the evidence contract and the scored index in `scorecard.json`.

`workflow-oracle.json` is the prospective supplemental contract frozen before candidate repeats 10/11/12. It preserves the historical `0/3` workflow score and does not rescore prior evidence.

`partial-coverage-case.json` is a separate prospective one-shot scenario. It forces partial scope by withholding an explicitly in-scope authentication middleware and requires an `Escalate` exit with the missing evidence, next check, and owner. It does not modify the frozen four-case batch.

`revised-candidate-scorecard.json` records the failed 0/3 main sample and the passing separate targeted scenario. It leaves the historical `scorecard.json` unchanged.

For each case evaluation, retain in the runner-owned trace directory:

- `metadata.json` based on `result-template.json`;
- `stdout.jsonl` and `stderr.txt`;
- the final response contained in `stdout.jsonl`;
- `tool-calls.json`;
- `preflight.json` plus its stderr;
- the scored index added after raw capture.

Raw files are append-only evidence. Never replace a failed, empty, truncated, or timed-out run with a retry inside the fixed three-repeat sample.

`tool-calls.json` omits native `web_search` events in observed runs. Authority and source-use review must also inspect the complete `stdout.jsonl`; an agent's self-report is not proof of tool behavior.
