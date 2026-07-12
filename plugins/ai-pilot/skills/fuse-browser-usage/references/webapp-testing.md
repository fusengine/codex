# Web application testing profile

Use this profile after automated tests to prove that a running development application behaves correctly. It complements unit, integration, and E2E suites; it never replaces them.

## One-session loop

1. `browser_open` once and keep the `sessionId`.
2. Navigate to the local development URL.
3. Inspect console and network output; unexpected errors or 4xx/5xx responses fail the check.
4. Capture the rendered state when visual evidence matters.
5. Perform the required interaction.
6. Repeat console, network, and visual checks after state-changing interactions.
7. Call `browser_close` on success, failure, or interruption.

Reuse the same session throughout. Add cookie inspection for authentication/session checks when relevant. Test local development state, not production.

## Concrete loop

```text
browser_open { }
browser_navigate { sessionId, url: "http://localhost:5173/login" }
browser_console { sessionId }
browser_network { sessionId }
browser_screenshot { sessionId }
browser_snapshot { sessionId }
browser_act { sessionId, kind: "fill", target: "email field", value: "test@example.com" }
browser_act { sessionId, kind: "click", target: "submit button" }
browser_close { sessionId }
```

Zero unexpected console errors is the pass bar. Recheck console, network, and rendered state after every interaction that changes state. Close the session on success, assertion failure, or interruption.
