interface Spell {
  id: string;
  name: string;
  type: string;
  system: {
    school?: string;
    level?: number;
    method?: string;
    prepared?: number;
  };
}

// The dnd5e config isn't typed, so describe the one piece we read from it.
interface Dnd5eConfig {
  DND5E?: {
    spellcasting?: Record<string, { prepares?: boolean } | undefined>;
  };
}

type ActorSheetV2 = foundry.applications.sheets.ActorSheetV2.Any;

const MODULE_ID = 'color-coded-5e';

const DEFAULT_COLORS = {
  abj: '#00FFFF',
  con: '#FF00FF',
  div: '#FFFF00',
  enc: '#FF69B4',
  evo: '#FFA500',
  ill: '#800080',
  nec: '#000000',
  trs: '#008000',
};

type SchoolKey = keyof typeof DEFAULT_COLORS;
const SCHOOL_KEYS = Object.keys(DEFAULT_COLORS) as SchoolKey[];

// Re-render open actor sheets so the spell rows get re-tagged.
const rerenderSheets = () => {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof foundry.applications.sheets.ActorSheetV2) void app.render();
  }
};

// Root attributes that the stylesheet keys off. The value of each is the setting with the same key.
const ROOT_ATTRIBUTES = {
  style: 'data-cc5e-style',
  width: 'data-cc5e-width',
  addBorder: 'data-cc5e-add-border',
} as const;

const applySettings = () => {
  if (!game.settings) {
    return;
  }
  const { settings } = game;
  const root = document.documentElement;

  for (const school of SCHOOL_KEYS) {
    root.style.setProperty(`--cc5e-color-${school}`, settings.get(MODULE_ID, school).css);
  }
  root.style.setProperty('--cc5e-color-intensity', `${settings.get(MODULE_ID, 'intensity')}%`);

  for (const [key, attribute] of Object.entries(ROOT_ATTRIBUTES) as [keyof typeof ROOT_ATTRIBUTES, string][]) {
    root.setAttribute(attribute, String(settings.get(MODULE_ID, key)));
  }

  // When disabled, switch off every mode the stylesheet knows about.
  if (!settings.get(MODULE_ID, 'enabled')) {
    root.setAttribute(ROOT_ATTRIBUTES.style, 'none');
    root.setAttribute(ROOT_ATTRIBUTES.addBorder, 'false');
  }
};

// Cantrips and spells that don't use preparation (innate, at-will, pact) count as prepared.
const isPrepared = (spell: Spell) => {
  const { level = 0, method = '', prepared = 0 } = spell.system;
  if (level === 0) {
    return true;
  }
  const prepares = (CONFIG as unknown as Dnd5eConfig).DND5E?.spellcasting?.[method]?.prepares;
  if (!prepares) {
    return true;
  }
  return prepared > 0;
};

const applyDataSchoolAttributes = (app: ActorSheetV2, element: HTMLElement) => {
  console.log(app, element);
  const spellElements = element.querySelectorAll('[data-item-list="spells"] li.item[data-item-id]');
  console.log(spellElements);
  const onlyPrepared = game.settings?.get(MODULE_ID, 'onlyPrepared');
  spellElements.forEach((spellElement) => {
    const spellId = spellElement.getAttribute('data-item-id');
    if (!spellId) {
      spellElement.removeAttribute('data-school');
      return;
    }
    const spell = app.actor.items.get(spellId) as Spell | undefined;
    if (!spell || spell.type !== 'spell') {
      spellElement.removeAttribute('data-school');
      return;
    }
    const school = spell.system.school;
    if (!school) {
      spellElement.removeAttribute('data-school');
      return;
    }
    if (!DEFAULT_COLORS[school as SchoolKey]) {
      console.warn(`Unknown spell school: ${school}`);
      spellElement.removeAttribute('data-school');
      return;
    }
    if (onlyPrepared && !isPrepared(spell)) {
      spellElement.removeAttribute('data-school');
      return;
    }
    spellElement.setAttribute('data-school', school);
  });
};

const registerSettings = () => {
  if (!game.settings) {
    return;
  }
  const { settings } = game;

  settings.register(MODULE_ID, 'enabled', {
    scope: 'client',
    name: 'CC5e.Settings.Enabled.Name',
    hint: 'CC5e.Settings.Enabled.Hint',
    config: true,
    type: Boolean,
    default: false,
    onChange: applySettings,
  });

  settings.register(MODULE_ID, 'onlyPrepared', {
    scope: 'client',
    name: 'CC5e.Settings.OnlyPrepared.Name',
    hint: 'CC5e.Settings.OnlyPrepared.Hint',
    config: true,
    type: Boolean,
    default: false,
    onChange: rerenderSheets,
  });

  settings.register(MODULE_ID, 'addBorder', {
    scope: 'client',
    name: 'CC5e.Settings.AddBorder.Name',
    hint: 'CC5e.Settings.AddBorder.Hint',
    config: true,
    type: Boolean,
    default: true,
    onChange: applySettings,
  });

  settings.register(MODULE_ID, 'style', {
    scope: 'client',
    name: 'CC5e.Settings.Style.Name',
    hint: 'CC5e.Settings.Style.Hint',
    config: true,
    type: String,
    choices: {
      solid: 'CC5e.Settings.Style.Choices.Solid',
      gradient: 'CC5e.Settings.Style.Choices.Gradient',
    },
    default: 'gradient',
    onChange: applySettings,
  });

  settings.register(MODULE_ID, 'width', {
    scope: 'client',
    name: 'CC5e.Settings.Width.Name',
    hint: 'CC5e.Settings.Width.Hint',
    config: true,
    type: String,
    choices: {
      name: 'CC5e.Settings.Width.Choices.Name',
      full: 'CC5e.Settings.Width.Choices.Full',
    },
    default: 'name',
    onChange: applySettings,
  });

  settings.register(MODULE_ID, 'intensity', {
    scope: 'client',
    name: 'CC5e.Settings.Intensity.Name',
    hint: 'CC5e.Settings.Intensity.Hint',
    config: true,
    type: Number,
    range: { min: 0, max: 100, step: 1 },
    default: 25,
    onChange: applySettings,
  });

  for (const school of SCHOOL_KEYS) {
    settings.register(MODULE_ID, school, {
      scope: 'client',
      name: `CC5e.Settings.Color.${school}`,
      hint: 'CC5e.Settings.Color.Hint',
      config: true,
      type: new foundry.data.fields.ColorField({ required: true, nullable: false, initial: DEFAULT_COLORS[school] }),
      onChange: applySettings,
    });
  }
};

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | init`);
  registerSettings();
  applySettings();
  Hooks.on('renderCharacterActorSheet', applyDataSchoolAttributes);
  Hooks.on('dnd5e.getItemContextOptions', (item, menuItems) => {
    console.log('CC5e: Context menu hook fired');
  });
});

Hooks.once('ready', () => {
  console.log(`${MODULE_ID} | ready`);
});
