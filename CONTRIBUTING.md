# Contributing to Policy-0

> Thank you for your interest in contributing! This document outlines the process for contributing to Policy-0.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors from all backgrounds.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/policy-0.git`
3. Install dependencies: `npm ci`
4. Setup environment: `npm run setup`
5. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

### Branch Naming
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `test/` — Test additions/improvements

### Commit Messages
Follow conventional commits:
```
feat: add policy export to ONNX format
fix: resolve rate limiting issue on login
docs: update API reference for evolution endpoints
test: add cassette tests for Isaac Sim integration
```

### Pull Request Process
1. Ensure all tests pass: `npm test`
2. Ensure typecheck passes: `npm run typecheck`
3. Update documentation if needed
4. Fill out the PR template
5. Request review from maintainers

## Code Style

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types on public functions
- Use `interface` for object shapes, `type` for unions

### React
- Functional components with hooks
- Props interfaces defined inline or in `types.ts`
- Use `React.forwardRef` for components that need refs
- Memoize expensive computations with `useMemo`

### CSS/Tailwind
- Use Tailwind utility classes
- Follow the design system colors (CSS variables)
- Mobile-first responsive design
- Use `clsx` for conditional classes

### File Organization
```
src/
  components/     # Reusable UI components
  pages/          # Page-level components
  hooks/          # Custom React hooks
  stores/         # Zustand stores
  lib/            # Utilities (API client, etc.)
  types/          # TypeScript types
```

## Testing

### Unit Tests
- Place tests next to the file: `foo.test.ts`
- Use Vitest as the test runner
- Mock external dependencies

### Integration Tests
- Place in `server/__tests__/`
- Use supertest for HTTP testing
- Mock NVIDIA services

### Running Tests
```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

## Documentation

- Update README.md for user-facing changes
- Update API.md for endpoint changes
- Update ARCHITECTURE.md for structural changes
- Add JSDoc comments to public APIs

## Security

- Never commit secrets or credentials
- Report security vulnerabilities to security@policy-0.com
- Follow the principle of least privilege

## License

By contributing, you agree that your contributions will be licensed under the MIT License.