---
name: viewports
description: "Canonical iOS device viewports in points, for mocking up screens at exact device dimensions."
---

# Device Viewports (points)

Source: ios-resolution.com. Status: verified.

| Device | Viewport (pt) | Scale |
|---|---|---|
| iPhone 17 Pro Max | 440 × 956 | @3x |
| iPhone 16 Pro Max | 430 × 932 | @3x |
| iPhone 16 / 17 | 393 × 852 | @3x |
| iPad Pro 13" | 1032 × 1376 | @2x |
| iPad Pro 11" | 834 × 1194 | @2x |

## Rule
Mock up in the exact point dimensions above, not an arbitrary "mobile" breakpoint — iOS
layout is defined in points, and the mockup should read at 1:1 with what a developer sees
in an Xcode preview at that device.
