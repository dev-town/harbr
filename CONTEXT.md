# Harbr

Harbr models development contexts independently from the Git and terminal tools that back them.

## Language

**Project**:
A configured source repository whose development contexts Harbr coordinates.

**Workspace**:
A named working copy of a project. Its checkout path identifies the concrete working copy; its name is a human-facing label and need not be unique.

**Checkout path**:
The filesystem location that uniquely identifies a workspace within Harbr's observed project state.
_Avoid_: Workspace name, branch name

**Git worktree**:
A Git-managed checkout that may back a workspace. It is infrastructure observed by Harbr, not a synonym for the Harbr workspace.

**Workspace provider**:
The tool or origin responsible for a workspace's location convention, such as Harbr, Codex, or Claude. It describes provenance rather than identity.

**Runtime**:
An active terminal environment attached to a project, workspace, or module.
