# ISMP team workflow

The project is split into independently owned areas that communicate through
documented APIs rather than source-code imports.

| Area | Primary paths | Required verification |
| --- | --- | --- |
| Edge camera and YOLO | `detector/**` | Python unit tests and a real camera smoke test |
| Website UI | `frontend/**`, `webpack.config.js` | `npm run build` |
| Central API and data | `backend/**` | backend tests plus the frontend build |

The edge/frontend boundary is documented in `detector/API.md` and the central
camera control plane in `backend/CAMERA_API.md`. Frontend work
must not import Python files, and edge work must not import website files.

## Branches

- `main` contains integrated, working code.
- Edge work uses branches such as `feature/edge-stream-*`.
- Frontend work uses branches such as `feature/frontend-*`.
- Backend work uses branches such as `feature/backend-*`.
- Do not let an AI tool rewrite unrelated areas of the repository.

Start new work from the latest `main`:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/frontend-short-description
```

Before publishing, run the checks for the paths changed. Stage explicit paths,
commit one logical change, and push the feature branch:

```bash
git add -- frontend
git commit -m "feat(frontend): describe the change"
git push -u origin feature/frontend-short-description
```

Open a pull request into `main`. Another team member should review it before
merge. Direct pushes to `main` make concurrent AI-generated changes harder to
review and recover.

## Staying synchronized

Fetching never overwrites local work:

```bash
git fetch origin
git log --oneline --decorate --all -10
```

After another pull request is merged, update `main` before starting the next
task. If a long-running feature branch needs the new changes, merge or rebase
`origin/main` only after committing its current work.

## Google AI Studio guardrails

Give the tool a narrow path scope and require it to preserve unrelated files.
For frontend tasks, explicitly say:

1. Do not modify `detector/**` or the `/api/v1` edge contract.
2. Keep camera access behind `frontend/src/services/detectorApi.js`.
3. Run `npm run build` and report warnings separately from errors.
4. Show the exact changed-file list before committing.
5. Work on a `feature/frontend-*` branch, not directly on `main`.
