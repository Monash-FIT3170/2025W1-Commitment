# Contributing Guidelines

## Coding Style

### Svelte

For this project only Svelte 5 concepts should be used. This includes the use of
[Runes](https://svelte.dev/docs/svelte/what-are-runes) instead of Svelte 4's (and lower)
reactive statements with `$:`.

This project will use the [prescribed project layout for a SvelteKit project](https://svelte.dev/docs/kit/project-structure)
as recommend by the Svelte developers.

Svelte components and TypeScript types and named objects should be in _Pascal Case_ with
functions, type methods and variables being in _snake\_case_, imports should be ordered
alphabetically and code should have 4 space indenting.

### HTML and CSS

Although we use `.svelte` files in this project, we still write HTML-like mark-ups. Hence
HTML guidelines can be followed in this case.

HTML and CSS code should follow the
[Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html#CSS_Style_Rules).

For a responsive design, the CSS unit is `rem`, with the ratio between `rem` and `px`
being: `1rem = 16px`.

The `global.css` file is located under `static\` defining the fonts and colour theme used
in the project. Any styling relating colour and fonts should follow these pre-defined CSS
classes.

A component should determine its own styling, such as width, height. Apart from the
location, a parent component should not control the style of its children components
(e.g. height, widths, etc.) 

### Rust

Rust code should be styled according to the [Rust Style Guide](https://doc.rust-lang.org/nightly/style-guide/)
but the TL;DR is as follows:

Variables, functions and associated methods of structs should be in _snake\_case_ with
trait and struct names being in _Pascal Case_.

You can run `cargo fmt` to format the project correctly when in the `src-tauri` directory.

## Git Tracking

This document outlines the rules for contributing to the project. It covers the
required commit message format, how to name branches and how to create PRs.

In general, it is *highly recommended* that you use the terminal when interacting with
the repository through Git as this will provide a much more unified experience when
developing and contributing to the project.

1. Clone or fork the repository.
2. Create a new branch based on the `devel` branch.
   Branches must have a 'tag' to indicate the kind of change that is being made.
   The branch name is separated from the tag using a `/` with the name of the branch
   being in lower-kebab-case ie. `my-branch`. Keep branch names simple and indicative
   of changes that will be made on the branch.

   ```sh
   git checkout -b <tag>/<branch> devel
   ```

    Available tags include:

    - `feature` : New major feature
    - `bugfix`  : Bug fixes
    - `conf`    : Changes to internal documentation, configs etc.
    - `docs`    : Documentation changes
    - `ci`      : CI/CD changes
    - `hotfix`  : Fix that is to be fast-tracked into the project as a bug now breaks the project.

3. Make your changes, ensuring to commit frequently
4. When committing, add/stage your changes using `git add .` You can then make a commit
   using `git commit`. This will open the default editor set-up for Git allowing you to
   write your commit message. The `git-setup.sh` script will have injected a hook that
   provides a custom template for commit messages. The template is based on the below
   [guidelines](#commit-message-guidelines), which will help you to
5. If others need to contribute to your branch you can push it to the remote.

   ```sh
    git push -u origin <tag>/<branch>
   ```
   > Future pushes can omit the `-u` flag.

6. Once your change is ready, you must submit a 'Pull Request' (PR) on the remote
   repository. A variety of templates will be provided depending on the kind of change
   you a proposing. Select the most applicable one and fill in the template sections.
   Ensure your PR is being made against `devel` and not `main` otherwise it will not be
   approved.

   > You can begin a draft PR before you have finished your changes when using GitHub.
   > Future commits & pushes on the branch you're requesting be 'pulled' will stack into
   > PR automatically. Once you are done you can un-draft your PR for review.

7. Once your PR is ready, you can request a review from your team's Software Architect
   (SA). Your SA may request changes be made before accepting the PR.

   > Your changes will be validated using the CI/CD pipelines to ensure compliance with
   > existing code and to ensure your change works as expected.

8. Once the SA has approved the PR the merge will be issued resulting in your
   changes being visible on `devel`.
9. SA's will handle bundling changes made to `devel` into a release PR to `main`.

> ## Note
>
> If you are working on a separate branch but require changes merged into `devel`, you
> will need to either rebase your branch on the most recent version of `devel` or merge
> the changes from `devel` into your branch with either:
>
> ### Merge
>
> ```sh
> git fetch origin devel:devel
> git merge devel
> ```
>
> Merging will create a new commit where it will mix your changes with the pulled
> changes. If there are conflicts, these will have to be resolved before the merge can
> complete.
>
> ### Rebase
>
> ```sh
> git fetch origin devel:devel
> git rebase -i devel
> ```
>
> This will interactively apply the changes in `devel` through your branches existing
> history, therefore rewriting your branch's history as if the changes had always been a
> part of your branch's history.
>
> You are free to rebase from another branch that is not `devel` or `main` if said branch
> has new functionality you require for your changes and has not been approved to be
> merged into `devel` yet.
>
> Rebasing a public branch is not recommended ie. a branch that has been pushed to a
> remote repo; like GitHub, as the branch has likely been pulled down before the your
> rebase. This is because rebasing rewrites the history of a branch which then has to be
> force-pushed upstream and can affect other developers' copy of the branch. In this
> regard, only rebase a local branch unless you need to, otherwise, perform a merge.
>
> In this regard, only create an upstream ref of a branch if you need it to be shared
> with other developers ie. you are making a PR for the branch or collaboratively working
> on a change.

## Commit Message Guidelines

Ensuring your commit messages are of the expected format and style is of vital importance
to ensure your commits document your changes well. It also makes reviewing commits much
quicker and easier as we can accurately search through the history using identifiable
markers left in messages.

As a minimum, your commit message must have a 'summary' line and a 'description'
paragraph. The summary line is a simple one-line explanation of the changes made in the
commit. It must be a maximum of 72 characters long and must **not** be terminated by a
period. It must also use an imperative mood/language in the summary and descriptions ie.
as if you are giving orders to the codebase to change its behaviour.

If you have set up the `.githooks` folder correctly then each commit will have a template
you can fill out to guide you through making the commit message.

The important part of every commit is the tag which indicates the type of change made in
your commit.

- `feat` : You made progress towards implementing a feature
- `fix`  : Fixes were made that address a bug in the project
- `conf` : Updates to the configuration of the project like build scripts etc.
- `ci`   : Changes to the CI/CD pipelines and related configuration
- `docs` : Updated internal or external documentation of the project and app
- `wip`  : A work in progress commit. Tests may be broken but more changes are expected

You can also add a longer description below the summary title and a blank line. This
should be used to give more information on what the commit changes and possibly why
the change was made if clarity is needed. If multiple topics are covered then they
should be separated by a blank line with lines related to the same topic being adjacent.
As with the summary line, description lines should be a max of 72 characters long.

You can also add a trailer line; using the `scope: ` prefix, to indicate the 'scope' of
the change to aid in the lookup of the commit it relation to the scope. A scope is not
like a tag where it has to be one of a specific value but should be a single word or
short phrase to indicate what aspect of the project was changed ie. ui

> The scope word/phrase **must** be lower-case.

You can also reference a ClickUp task-ID in the `refs: ` line. Each task-ID **must** be
prefixed by `CU-` ie. `CU-abc123xyz` with multiple IDs being separated by a comma-space.
Like every other line, it should be at most 72 characters long. If this is exceeded you
can add another refs trailer on the line below.

Finally, you can indicate that a change breaks some expected behaviour of the project
or programmer contract (API changes) using the `BREAKING-CHANGE` trailer. This should
be followed by a description of what broke so it can be noted by developers who will
interact with this change. As always, lines should only be 72 characters long.
