# Claude Code Model Effort Shortcuts

[![npm version](https://badgen.net/npm/v/claude-code-model-effort-shortcuts)](https://www.npmjs.com/package/claude-code-model-effort-shortcuts)
[![license](https://badgen.net/github/license/richkuo/claude-code-model-effort-shortcuts)](LICENSE)

A Claude Code plugin that changes the reasoning effort level and the model from the keyboard.

- **Cmd+E** (or Alt+E) steps the effort up: low, medium, high, xhigh, then back to low.
- **Cmd+Shift+E** (or Alt+Shift+E) steps it down, and wraps from low to xhigh.
- **Cmd+M** (or Alt+M) steps the model up: Haiku 4.5, Sonnet 5.5, Opus 5.5, Fable 5.1, then back to Haiku 4.5.
- **Cmd+Shift+M** (or Alt+Shift+M) steps the model down.
- The footer shows the model and level that the next request uses, for example `Sonnet 5.5 · effort: high`.
- The plugin saves your last model and your effort pick for each model. New sessions start with them.

The plugin sets the model and effort on each main-thread model request. It does not add rows to the transcript, and it does not run `/effort` or `/model`.

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
   /plugin marketplace add richkuo/claude-code-model-effort-shortcuts
   /plugin install model-effort-shortcuts@richkuo
   ```

2. Bind the keys in `~/.claude/keybindings.json`:

   ```json
   {
     "bindings": [
       {
         "context": "Global",
         "bindings": {
           "meta+e": "strip:jump9",
           "meta+shift+e": "strip:jump8",
           "meta+m": "strip:jump7",
           "meta+shift+m": "strip:jump6"
         }
       }
     ]
   }
   ```

   A plugin cannot own a key. It can only listen for Claude Code's own keybinding actions. The plugin listens for `strip:jump9` (effort up), `strip:jump8` (effort down), `strip:jump7` (next model), and `strip:jump6` (previous model). You can bind any modified key or chord to them.

3. Set up your terminal (next section), then restart Claude Code.

## Terminal setup

In Claude Code, `meta` is the Alt or Option key. Terminals keep Cmd shortcuts for themselves, so Cmd+E and Cmd+M must be sent as Meta+E and Meta+M.

**Ghostty** (tested). Add these lines to the Ghostty config, then reload it:

```
keybind = super+e=esc:e
keybind = super+shift+e=esc:E
keybind = super+m=esc:m
keybind = super+shift+m=esc:M
```

In Ghostty, these lines replace the macOS minimize shortcut (Cmd+M).

**Other terminals** (not tested). Use the Option keys in place of Cmd, and set Option to send Meta:

- Terminal.app: Settings, Profiles, Keyboard, turn on "Use Option as Meta key".
- iTerm2: Settings, Profiles, Keys, set "Left Option key" to "Esc+".

You can also map Cmd+E in your terminal to send `Esc` followed by `e`, as the Ghostty lines do. Do the same for the other keys.

## Settings

Run `/config` to change these settings:

- **Effort shortcut: lowest level** and **Effort shortcut: highest level**. The effort shortcuts cycle only through the levels between them. The default range is low to xhigh. Set the highest level to max to include max.
- **Model shortcut: include Haiku 4.5**, **Sonnet 5.5**, **Opus 5.5**, and **Fable 5.1**. The model shortcuts cycle only through the models that are on. All four are on by default. For example, turn off Haiku 4.5 and Fable 5.1 to cycle only between Sonnet 5.5 and Opus 5.5.

## How it works

- Before each main-thread request, the plugin replaces the request's model with your model pick, and the request's effort with your effort pick for that model.
- If Claude Code's own level for a model changes during the session, the plugin removes your effort pick for that model and follows Claude Code. This includes `/effort <level>` and the model picker.
- If Claude Code's own model changes during the session, the plugin removes your model pick and follows Claude Code. This includes `/model <name>` and the model picker.
- `/effort` without a level does not remove your pick unless you choose a new level.
- When the model shortcut reaches Claude Code's own model, the plugin removes the model pick.
- Each terminal keeps its own picks. The last picks are also saved, and new sessions start with them.

## Limits

- Claude Code's own displays show its own model and level. This includes the effort line near the prompt, the spinner, status line scripts, and the `CLAUDE_EFFORT` variable. Use the plugin's footer text to see the model and level that requests use.
- Subagents keep Claude Code's own model and level.
- Haiku 4.5 has no effort setting in Claude Code. When Haiku 4.5 is selected, the footer shows no level and the effort shortcuts do nothing.
- A model switch starts a new prompt cache, so the next request costs more.
- Models have different context windows. If the conversation is larger than the new model's window, the request fails. Switch back, or run `/compact`.
- In the agents view, the keys do the agents view's own jump actions.

## Check that it works

Claude Code writes the model and effort of each request to the session transcript under `~/.claude/projects/`. Set a model and level with the shortcuts, send a message, and then search the newest transcript file for `"model"` and `"effort"`. The values should match the footer.

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
