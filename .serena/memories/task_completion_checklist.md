# Task Completion Checklist

When a coding task is completed, run these checks before considering it done:

1. **Install dependencies** (if any were added): `vp install`
2. **Run quality checks**: `vp check` — this covers formatting, linting, and type checking
3. **Run tests**: `vp test` — ensures no regressions
4. **Fix issues**: If checks or tests fail, fix and re-run

The pre-commit hook (`vp check --fix`) will also catch issues on staged files, but it's better to catch problems before committing.
