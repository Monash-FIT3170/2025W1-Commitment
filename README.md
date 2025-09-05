# 2025W1-Commitment

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-12-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## Project Overview

**gitgauge** is a native desktop application built with **Tauri**, **Svelte**, and
**Rust**, designed to help teaching assistants holistically assess student contributions
within a Git repository.

### Key Features:
- Upload and parse Moodle-style grading sheets (`.csv`, `.tsv`)
- Automatically link student names/emails to Git commit data
- Scale and adjust grades based on contribution metrics
- Download a populated grading file with contribution-weighted scores
- Clean and responsive native UI powered by SvelteKit and Tailwind
- Automatically scale student based on different attributes (e.g. number of commits,
  lines of code (LOC), etc.)
- Fully cross-platform (macOS, Windows, Linux)

This app is designed for educational settings where group Git projects are assessed, and
where traditional peer review or manual weighting is too slow or inconsistent.


## Project Structure

```
gitgauge/
├── .gitgauge/                     # App cache (safe to delete)
├── .githooks/                     # Pre-commit hook scripts
├── .svelte-kit/                   # SvelteKit build cache
├── node_modules/                  # Node.js dependencies
├── src/
│   ├── lib/                       # Shared frontend logic
│   │   ├── components/            # Reusable UI components
│   │   │   ├── global/            # Global UI (e.g. buttons)
│   │   │   └── overview-page/     # UI for overview route
│   │   ├── stores/                # Global/local state stores
│   │   └── utils/                 # Helpers (CSV, grading, etc.)
│   ├── routes/                    # App pages (SvelteKit routing)
│   │   ├── overview-page/         # Contributor stats page
│   │   │   ├── +layout.svelte     # Route layout wrapper
│   │   │   └── +page.svelte       # Route content
│   │   ├── +layout.ts             # App-wide layout logic
│   │   └── +page.svelte           # Upload page
│   ├── app.html                   # Root HTML shell
│   └── ...                        # Other routes/config
├── src-tauri/                     # Rust backend for Tauri
│   ├── src/
│   │   ├── lib.rs                 # Shared Rust utils
│   │   └── main.rs                # Tauri backend entry
│   └── ...                        # Tauri configs/assets
├── package.json                   # Scripts + dependencies
└── README.md                      # Setup + handover docs
```

## Developer Setup

### Prerequisites

- Git
- Rust v1.84.0
- Tauri v2.4.0 ([Tauri prereqs](https://v2.tauri.app/start/prerequisites/))
- Node.js v20+
- Use `npm` for install speed and consistency

To set up your device for developing gitgauge:

```sh
git clone https://github.com/Monash-FIT3170/2025W1-Commitment.git gitgauge
cd gitgauge
```

Install dependencies:

```sh
npm i
```

Then set up Git hooks:

macOS and Linux:

```sh
sh git-hooks.sh -l
```

Windows PowerShell:

```ps
.\git-hooks.ps1 -Link
```

> Note: The PowerShell script may require an Admin shell.

To run the app:

```sh
npm run tauri dev
```

### Debugging & Clean Reinstall

If you're running into persistent bugs, corrupted builds, or broken state, try a clean reinstall.

#### Symptoms this fixes

- Vite hangs or never finishes compiling
- Plugin errors, missing module warnings
- App doesn't load or WebView is blank
- `npm run tauri dev` just exits or does nothing

#### Full clean reinstall steps

```sh
rm -rf node_modules .gitgauge .svelte-kit src-tauri/target
npm i
npm run tauri dev
```

This removes:

- Node packages
- gitgauge cache
- SvelteKit builds
- Rust/Tauri target cache

Then reinstalls everything from scratch.

If this doesn't work, check:

- You’re using Node v20+: `node -v`
- You have Rust installed correctly: `rustup show`
- You have Tauri CLI installed: `cargo tauri --version`

## Troubleshooting FAQ

Common bugs and fixes during setup, development, and merge workflows.

### Setup & Build Issues

| Issue | Symptoms | Fix |
|-------|----------|-----|
| **Vite hangs or blank WebView** | - App stuck compiling<br>- White screen on load<br>- `npm run tauri dev` exits silently | `rm -rf node_modules .gitgauge .svelte-kit src-tauri/target`<br>`npm i`<br>`npm run tauri dev`<br> |
| **`cargo` or `tauri` not found** | - Build fails on backend step<br>- Commands not recognised | - Check Rust: `rustup show`<br>- Install Tauri: `cargo install tauri-cli`<br>- Confirm you're in the project folder |
| **Pre-commit hook isn’t firing** | - You can commit code that violates formatting or lint rules | - Run the correct Git hooks setup:<br>`sh git-hooks.sh -l`<br>`# or`<br>`.\git-hooks.ps1 -Link`<br> |
| **Svelte reactivity isn't working** | - `$state` or `$store` values don’t update<br>- Derived values don't recompute<br>- `writable()` from older Svelte versions causes errors | - Only use **Svelte 5 Runes syntax**:<br>`let x = $state(0)` instead of `writable()`<br>- Use `$derived()` instead of `$:`<br>- Avoid mixing legacy and modern syntax in the same file |


---


### Merging & Branch Sync Issues

| Issue | Symptoms | Fix |
|-------|----------|-----|
| **Working on stale branches** | - PRs show lots of unrelated diffs<br>- Functionality is mysteriously broken | - Always pull `devel` before starting new work:<br>`git checkout devel`<br>`git pull origin devel`<br>`git checkout your-branch`<br>`git merge devel`<br> |
| **Merge conflicts everywhere** | - Even minor changes cause big conflicts | - Merge `devel` into your branch frequently, not just at the end<br>- Consider rebasing if you're confident: `git rebase devel` |
| **Rebasing is confusing** | - Unsure how to safely update your branch<br>- Afraid of breaking commit history | - Use VS Code GitLens to visualise<br>- Ask a teammate to pair with you<br>- Use merge instead of rebase if unsure |
| **Conflicting Svelte syntax** | - Some files use `runes`, others don’t<br>- `$state`, `store`, and `writable` cause confusion | - Stick to the syntax used in `devel`<br>- Don’t mix `runes` and `$store` reactivity<br>- If unsure, ask before adding new state logic |

---

### Tips for Avoiding Merge Issues

- Start each day by pulling the latest `devel`
- Merge `devel` into your feature branch *frequently* (every few hours if active)
- Prefer small, focused PRs to large multi-feature branches
- Keep component code modular to reduce merge conflicts
- Communicate with your team before resolving merge conflicts solo

---

## Contributing and Licensing

Before contributing to the project, **please read** [CONTRIBUTING.md](./CONTRIBUTING.md).  
It includes:

- Our naming conventions for structs, files, components, variables, etc.
- Coding style and commit guidelines
- Component structure and documentation expectations

Following these guidelines keeps the codebase consistent and easy to maintain.

This project is licensed under **GPLv3**, with the license located at the root of the repo: [LICENSE](./LICENSE).

## Releases

Check out our official releases on the releases tab of GitHub!

## Team Information

| Name                   | Email                       | Role             |
| ---------------------- | --------------------------- | ---------------- |
| Harshath Muruganantham | hmur0018@student.monash.edu | Product Manager  |
| James Nguyen           | pngu0045@student.monash.edu | System Architect |
| Georgia Kanellis       | gkan0011@student.monash.edu | RTE              |
| Ayani Wickramaratne    | awic0008@student.monash.edu | RTE              |
| Tyler Swann            | tswa0006@student.monash.edu | System Architect |
| Darcy Bystersky        | dbys0001@student.monash.edu | System Architect |
| Yali John Lin          | jlin0110@student.monash.edu | Product Manager  |
| Audrey Phommasone      | apho0008@student.monash.edu | Product Manager  |
| Jamie Nguyen           | angu0105@student.monash.edu | Product Manager  |
| Massimo Nodin          | mnod0001@student.monash.edu | RTE              |
| Prisha Verma           | pver0009@student.monash.edu | RTE              |
| Mai Thao Hoang         | mhoa0013@student.monash.edu | RTE              |

---

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

## Contributors

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Hersheys2604"><img src="https://avatars.githubusercontent.com/u/126170367?v=4?s=100" width="100px;" alt="Harshath Muruganantam"/><br /><sub><b>Harshath Muruganantam</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=Hersheys2604" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JohnYaliLin"><img src="https://avatars.githubusercontent.com/u/110228962?v=4?s=100" width="100px;" alt="JohnYaliLin"/><br /><sub><b>JohnYaliLin</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=JohnYaliLin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pver0009"><img src="https://avatars.githubusercontent.com/u/140368460?v=4?s=100" width="100px;" alt="pver0009"/><br /><sub><b>pver0009</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=pver0009" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jme-nguyen"><img src="https://avatars.githubusercontent.com/u/104990720?v=4?s=100" width="100px;" alt="jme-nguyen"/><br /><sub><b>jme-nguyen</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=jme-nguyen" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ayaniw"><img src="https://avatars.githubusercontent.com/u/202867363?v=4?s=100" width="100px;" alt="ayaniw"/><br /><sub><b>ayaniw</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=ayaniw" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chicomonster03"><img src="https://avatars.githubusercontent.com/u/126570929?v=4?s=100" width="100px;" alt="gkan0011"/><br /><sub><b>gkan0011</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=chicomonster03" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/audreypho"><img src="https://avatars.githubusercontent.com/u/111032067?v=4?s=100" width="100px;" alt="audrey"/><br /><sub><b>audrey</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=audreypho" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/oraqlle"><img src="https://avatars.githubusercontent.com/u/41113853?v=4?s=100" width="100px;" alt="Tyler Swann"/><br /><sub><b>Tyler Swann</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=oraqlle" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/npnquang"><img src="https://avatars.githubusercontent.com/u/73055557?v=4?s=100" width="100px;" alt="James Nguyen"/><br /><sub><b>James Nguyen</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=npnquang" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MassimoNodin"><img src="https://avatars.githubusercontent.com/u/37238696?v=4" width="100px;" alt="Massimo Nodin"/><br /><sub><b>Massimo Nodin</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=MassimoNodin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thahoa021"><img src="https://avatars.githubusercontent.com/u/202866735?v=4?s=100" width="100px;" alt="thahoa021"/><br /><sub><b>thahoa021</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=thahoa021" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dBystersky"><img src="https://avatars.githubusercontent.com/u/100546893?v=4?s=100" width="100px;" alt="dBystersky"/><br /><sub><b>dBystersky</b></sub></a><br /><a href="https://github.com/Monash-FIT3170/2025W1-Commitment/commits?author=dBystersky" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

