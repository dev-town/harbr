# Harbr for Herdr

Open [Harbr](https://github.com/dev-town/harbr) as a named popup inside Herdr.

## Requirements

- Herdr 0.8.2 or newer.
- `harbr` available on `PATH`.

Install Harbr with Homebrew:

```sh
brew install dev-town/tap/harbr
```

Alternatively, install the current beta on macOS or Linux:

```sh
curl -fsSL https://dev-town.com/labs/harbr/install.sh |
  HARBR_VERSION=0.1.0-beta.5 sh
```

## Install

```sh
herdr plugin install dev-town/harbr/herdr-plugin
```

Add a keybinding to `~/.config/herdr/config.toml`:

```toml
[[keys.command]]
key = "prefix+shift+h"
type = "plugin_action"
command = "dev-town.harbr.open"
description = "Open Harbr"
```

Reload Herdr after editing the configuration:

```sh
herdr server reload-config
```

Herdr plugins cannot install keybindings. Replace `prefix+shift+h` if another
key is a better fit for your configuration.

## Manage

```sh
# Inspect the installed plugin
herdr plugin list

# Update from GitHub
herdr plugin uninstall dev-town.harbr
herdr plugin install dev-town/harbr/herdr-plugin

# Remove the plugin
herdr plugin uninstall dev-town.harbr
```

If the popup reports that `harbr` is missing, confirm the executable is on the
`PATH` inherited by Herdr and reload or restart Herdr.
