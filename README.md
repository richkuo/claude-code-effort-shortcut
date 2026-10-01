# Claude Code Effort Shortcut

A Claude Code plugin that changes the reasoning effort level from the keyboard.

- **Cmd+E** (or Alt+E) steps the effort up: low, medium, high, xhigh, then back to low.
- **Cmd+Shift+E** (or Alt+Shift+E) steps it down, and wraps from low to xhigh.
- The footer shows the level that the next request uses, for example `effort: high`.
- Each pick is saved for each model, and new sessions start with it.

The plugin sets the effort on each main-thread model request. It does not add rows to the transcript, and it does not run `/effort`.

## Requirements

- Claude Code with plugin hook modules. This plugin uses an early-access plugin API that can change between releases. It was built and tested on Claude Code 2.1.286.
- Hook modules must be turned on. If they are off for your account, add this to the `env` block of `~/.claude/settings.json`:

  ```json
  "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1"
  ```

  This setting also lets hook modules from your other installed plugins run.

## Install

1. Add the marketplace and install the plugin in Claude Code:

   ```
   /plugin marketplace add richkuo/claude-code-effort-shortcut
   /plugin install effort-shortcut@richkuo
   ```

   Or install it from npm:

   ```
   /plugin install claude-code-effort-shortcut@npm
   ```

2. Bind the keys in `~/.claude/keybindings.json`:

   ```json
   {
     "bindings": [
       { "context": "Global", "bindings": { "meta+e": "strip:jump9", "meta+shift+e": "strip:jump8" } }
     ]
   }
   ```

   A plugin cannot own a key. It can only listen for one of Claude Code's own keybinding actions, so the plugin listens for `strip:jump9` (up) and `strip:jump8` (down). You can bind any modified key or chord to them.

3. Set up your terminal (next section), then restart Claude Code.

## Terminal setup

In Claude Code, `meta` is the Alt or Option key. Terminals keep Cmd shortcuts for themselves, so Cmd+E must be sent as Meta+E.

**Ghostty** (tested). Add these lines to the Ghostty config, then reload it:

```
keybind = super+e=esc:e
keybind = super+shift+e=esc:E
```

**Other terminals** (not tested). Use Option+E and Option+Shift+E, and set Option to send Meta:

- Terminal.app: Settings, Profiles, Keyboard, turn on "Use Option as Meta key".
- iTerm2: Settings, Profiles, Keys, set "Left Option key" to "Esc+".

You can also map Cmd+E in your terminal to send `Esc` followed by `e`, as the Ghostty lines do.

## Settings

Run `/config` and find **Effort shortcut: lowest level** and **Effort shortcut: highest level**. The shortcuts cycle only through the levels between them. The default range is low to xhigh. Set the highest level to max to include max.

## How it works

- Before each main-thread request, the plugin replaces the request's effort with your pick for that model.
- If Claude Code's own level for that model changes after the session starts, the plugin removes your pick and follows Claude Code. This includes `/effort <level>` and the model picker.
- `/effort` without a level does not remove your pick unless you choose a new level.
- Each terminal keeps its own pick. The last pick is also saved, and new sessions on that model start with it.

## Limits

- Claude Code's own displays show its own level. This includes the effort line near the prompt, the spinner, status line scripts, and the `CLAUDE_EFFORT` variable. Use the plugin's footer text to see the level that requests use.
- Subagents keep Claude Code's own level.
- Models without an effort setting are not changed.
- In the agents view, the keys do the agents view's own jump actions.

## Check that it works

Claude Code writes the effort of each request to the session transcript under `~/.claude/projects/`. Set a level with the shortcut, send a message, and then search the newest transcript file for `"effort"`. The value should match the footer.

## Development

```sh
claude plugin validate .
claude --plugin-dir .
```

To load a local copy in every session, set `CLAUDE_CODE_PLUGIN_DIRS` to the folder in the `env` block of `~/.claude/settings.json`.

## License

MIT

---
Created with LLM: Opus 5.5 | high | Harness: Claude Code
