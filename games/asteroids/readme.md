# GSX Asteroids

The classic Asteroids game with a few additions.

## Keyboard Controls

| Action | Keys |
|--------|------|
| Rotate Left | `←` / `A` |
| Rotate Right | `→` / `D` |
| Thrust / Move Forward | `↑` / `W` |
| Fire Missile | `Space` |
| Pause / Resume | `P` |
| Teleport / Reset Position | `Q` |

## Development

### Running Tests
Because we are using `@shared` and `@engine` we need to run vitest through node with its own vitest config. This is handled within the deno tasks. Available tasks can be seen below.

```bash
# Run all tests
deno task test

# Run tests in watch mode (auto-rerun on file changes)
deno task test:watch

# Run performance benchmarks
deno task test:performance
```
