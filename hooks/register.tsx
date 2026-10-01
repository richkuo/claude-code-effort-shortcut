import type { EngineInterface as Engine, PluginOptions, Register } from 'claude-code'

type Level = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

const ORDER: readonly Level[] = ['low', 'medium', 'high', 'xhigh', 'max']
const FALLBACK: Level = 'high'
const SAVED = 'savedPicks'

const pickRef = { plugin: 'effort-shortcut', key: 'pick' } as const
const engineRef = { plugin: 'effort-shortcut', key: 'engine' } as const
const labelRef = { plugin: 'effort-shortcut', key: 'label' } as const

const isLevel = (value: unknown): value is Level => typeof value === 'string' && (ORDER as readonly string[]).includes(value)

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await $.state.set(pickRef, await loadSaved($))
    await refreshLabel($)
    return result
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined || !isLevel(e.effort)) return yield* next(e)
    const engine = (await $.state.get(engineRef)).value ?? {}
    const previous = engine[e.model]
    if (previous !== e.effort) {
      await $.state.set(engineRef, { ...engine, [e.model]: e.effort })
      if (previous !== undefined) await clearPick($, e.model)
    }
    const pick = (await $.state.get(pickRef)).value?.[e.model]
    const level = isLevel(pick) ? pick : e.effort
    await setLabel($, level)
    return yield* next(level === e.effort ? e : { ...e, effort: level })
  })

  on('command.run', { command: 'effort' }, async ($, e, next) => {
    const result = await next(e)
    if (e.args.trim() !== '') {
      await clearPick($, await $.session.model())
      await refreshLabel($)
    }
    return result
  })

  on('command.run', { command: 'model' }, async ($, e, next) => {
    const result = await next(e)
    await refreshLabel($)
    return result
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e) => {
    const label = (await $.state.get(labelRef)).value
    const parts = label ? [...e.props.modes, `effort: ${label}`] : [...e.props.modes]
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box marginRight={2}>
        <Text dimColor> {parts.join(' · ')}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e) => {
    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box display="none">
        <Button key="effort-shortcut-up" label="raise effort" action="strip:jump9" onPress={() => shift($, options, 'up')} />
        <Button key="effort-shortcut-down" label="lower effort" action="strip:jump8" onPress={() => shift($, options, 'down')} />
      </Box>
    )
  })
}

function range(options: PluginOptions): Level[] {
  const lowest = isLevel(options.lowest) ? ORDER.indexOf(options.lowest) : 0
  const highest = isLevel(options.highest) ? ORDER.indexOf(options.highest) : ORDER.indexOf('xhigh')
  return ORDER.slice(Math.min(lowest, highest), Math.max(lowest, highest) + 1)
}

async function shift($: Engine, options: PluginOptions, direction: 'up' | 'down') {
  const model = await $.session.model()
  const rank = ORDER.indexOf(await currentLevel($, model))
  const levels = range(options)
  const target =
    direction === 'up'
      ? levels.find(level => ORDER.indexOf(level) > rank) ?? levels[0]
      : [...levels].reverse().find(level => ORDER.indexOf(level) < rank) ?? levels[levels.length - 1]
  const picks = (await $.state.get(pickRef)).value ?? {}
  await $.state.set(pickRef, { ...picks, [model]: target })
  await $.store.set(SAVED, { ...(await loadSaved($)), [model]: target })
  await setLabel($, target)
}

async function currentLevel($: Engine, model: string): Promise<Level> {
  const pick = (await $.state.get(pickRef)).value?.[model]
  if (isLevel(pick)) return pick
  const engine = (await $.state.get(engineRef)).value?.[model]
  if (isLevel(engine)) return engine
  const settings = await $.settings.read()
  const perModel = settings.modelSettings as Record<string, { effortLevel?: unknown } | undefined> | undefined
  const configured = perModel?.[model]?.effortLevel ?? settings.effortLevel
  return isLevel(configured) ? configured : FALLBACK
}

async function clearPick($: Engine, model: string) {
  const { [model]: _live, ...picks } = (await $.state.get(pickRef)).value ?? {}
  await $.state.set(pickRef, picks)
  const { [model]: _saved, ...saved } = await loadSaved($)
  await $.store.set(SAVED, saved)
}

async function loadSaved($: Engine): Promise<Record<string, Level>> {
  const raw = await $.store.get(SAVED)
  if (!raw || typeof raw !== 'object') return {}
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, Level] => isLevel(entry[1])))
}

async function refreshLabel($: Engine) {
  await setLabel($, await currentLevel($, await $.session.model()))
}

async function setLabel($: Engine, level: Level) {
  if ((await $.state.get(labelRef)).value !== level) await $.state.set(labelRef, level)
}
