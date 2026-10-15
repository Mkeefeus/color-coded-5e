export const MODULE_ID = 'color-coded-5e';

// Console logging prefixed with the module id so our messages are easy to filter.
// `debug` goes to console.debug, which browsers only show when the console's Verbose level is enabled.
export const log = {
  debug: (...args: unknown[]) => console.debug(`${MODULE_ID} |`, ...args),
  info: (...args: unknown[]) => console.info(`${MODULE_ID} |`, ...args),
  warn: (...args: unknown[]) => console.warn(`${MODULE_ID} |`, ...args),
  error: (...args: unknown[]) => console.error(`${MODULE_ID} |`, ...args),
};

export const DEFAULTS: ColorTag = {
  color: '#ff25b0',
  intensity: 25,
  width: 'full',
  style: 'gradient',
  addBorder: false,
  conditions: {
    attuned: 'ignored',
    equipped: 'ignored',
    prepared: 'ignored',
  },
};

// Fill in any keys missing from stored (or submitted) tag data from the defaults.
export const resolveTag = (flags: ItemColorFlags): ColorTag => ({
  ...DEFAULTS,
  ...flags,
  conditions: {
    ...DEFAULTS.conditions,
    ...flags.conditions,
  },
});

// The item's color tag with defaults filled in, or undefined when the item isn't tagged (no color set).
export const getColorTag = (item: Item.Implementation): ColorTag | undefined => {
  const flags = item.flags[MODULE_ID];
  if (!flags?.color) {
    return undefined;
  }
  return resolveTag(flags);
};

// The dnd5e system data isn't typed, so describe the fields the conditions read. All are optional because which
// ones exist depends on the item type.
interface Dnd5eItemSystem {
  /** Equippable items only (weapon, equipment, consumable, tool, container). */
  equipped?: boolean;
  attuned?: boolean;
  /** Getter: true when the item's attunement is "required" or "optional". */
  canAttune?: boolean;
  /** Spells only. */
  level?: number;
  /** Spells only: key into CONFIG.DND5E.spellcasting. */
  method?: string;
  /** Spells only: 0 when unprepared. */
  prepared?: number;
}

// The dnd5e config isn't typed, so describe the one piece we read from it.
interface Dnd5eConfig {
  DND5E?: {
    spellcasting?: Record<string, { prepares?: boolean } | undefined>;
  };
}

type ConditionKey = keyof ColorTag['conditions'];

/** Which conditions apply to an item. A condition that doesn't apply is never shown and counts as satisfied. */
export type ApplicableConditions = Record<ConditionKey, boolean>;

const itemSystem = (item: Item.Implementation) => item.system as unknown as Dnd5eItemSystem;

// Whether a spell has to be prepared at all. Cantrips, and spells whose casting method doesn't prepare
// (at-will, innate, ritual), are always usable.
const needsPreparation = (system: Dnd5eItemSystem) => {
  const { level = 0, method = '' } = system;
  if (level === 0) {
    return false;
  }
  return !!(CONFIG as unknown as Dnd5eConfig).DND5E?.spellcasting?.[method]?.prepares;
};

export const getApplicableConditions = (item: Item.Implementation): ApplicableConditions => {
  const system = itemSystem(item);
  return {
    equipped: typeof system.equipped === 'boolean',
    attuned: system.canAttune === true,
    // fvtt-types doesn't know dnd5e's item types, hence the cast.
    prepared: (item.type as string) === 'spell' && needsPreparation(system),
  };
};

// The required conditions that apply to the item but don't currently hold. Empty when the tag should show.
export const getUnmetConditions = (item: Item.Implementation, tag: ColorTag): ConditionKey[] => {
  const applicable = getApplicableConditions(item);
  const system = itemSystem(item);
  const state: Record<ConditionKey, boolean> = {
    equipped: system.equipped === true,
    attuned: system.attuned === true,
    prepared: (system.prepared ?? 0) > 0,
  };
  return (Object.keys(state) as ConditionKey[]).filter(
    (key) => tag.conditions[key] === 'required' && applicable[key] && !state[key]
  );
};

// Whether every required condition that applies to the item currently holds, i.e. whether its tag should show.
export const conditionsMet = (item: Item.Implementation, tag: ColorTag) => getUnmetConditions(item, tag).length === 0;

export const applyTag = (element: HTMLElement, tag: ColorTag) => {
  element.setAttribute('data-cc5e', 'true');
  element.setAttribute('data-cc5e-style', tag.style);
  element.setAttribute('data-cc5e-width', tag.width);
  element.setAttribute('data-cc5e-add-border', tag.addBorder.toString());
  element.style.setProperty('--cc5e-color', tag.color);
  element.style.setProperty('--cc5e-intensity', `${tag.intensity.toString()}%`);
};
