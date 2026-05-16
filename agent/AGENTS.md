# Harbour Agents

Repo-local guidance for Harbour changes.

## Boundaries

- Prefer public package boundaries that expose services, programs, and layer factories.
- Treat repos, clients, low-level helpers, and implementation wiring as internal unless deliberately documented as public.
- Other packages should import from a package's public exports, not its internal folders.

## Layout

- Keep `index.ts` export-only.
- Prefer:

```text
services/*.service.ts
services/*.live.ts
repos/*.repo.ts
*.errors.ts
*.types.ts
```

- Use `*Client` for low-level resource/access boundaries when `*Service` would imply a broader capability.

## App entrypoints

- App code should prefer exported programs or small collections of programs for user-facing functionality.
- App code should compose public layer factories from packages.
- Keep runtime boot details flexible. The stable convention is clean package boundaries, not one required runtime helper.

## Package layering

- Inside a package, prefer this shape when needed:

```text
public programs/services
-> services
-> repos
-> clients/adapters/resources
```

- Not every package needs every layer. Use the shallowest correct shape.
