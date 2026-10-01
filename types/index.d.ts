declare module 'claude-code' {
  interface PluginState {
    'effort-shortcut': {
      pick: Record<string, 'low' | 'medium' | 'high' | 'xhigh' | 'max'>
      engine: Record<string, 'low' | 'medium' | 'high' | 'xhigh' | 'max'>
      label: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | null
    }
  }
}
