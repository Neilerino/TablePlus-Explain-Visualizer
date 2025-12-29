# TablePlus Plugin API Type Definitions

This directory contains TypeScript definition files (`.d.ts`) that document the TablePlus plugin API.

## Purpose

These type definitions serve multiple purposes:

1. **Documentation** - Comprehensive reference for available APIs
2. **IDE Support** - Enable IntelliSense/autocomplete in VS Code and other editors
3. **Type Safety** - Catch errors early with JSDoc type hints

## How They Were Created

These types were reverse-engineered through:

- Runtime inspection using `Object.getOwnPropertyNames()`
- Analysis of the [diagram-plugin](https://github.com/TablePlus/diagram-plugin) reference implementation
- Testing and observation of API behavior
- Trial and error with the TablePlus plugin environment

## Files

- `tableplus.d.ts` - Complete TablePlus plugin API definitions
