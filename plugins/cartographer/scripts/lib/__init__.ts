#!/usr/bin/env bun
import { join, dirname, basename } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

/* Cartographer lib — shared utilities for plugin scanning && tree generation. */

