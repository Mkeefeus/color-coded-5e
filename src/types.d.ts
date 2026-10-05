type ColorSetting = foundry.data.fields.ColorField<{ required: true; nullable: false; initial: string }>;

declare module 'fvtt-types/configuration' {
  namespace Hooks {
    interface ApplicationV2Config {
      CharacterActorSheet: foundry.applications.sheets.ActorSheetV2.Any;
    }
  }

  interface SettingConfig {
    'color-coded-spells-5e.enabled': boolean;
    'color-coded-spells-5e.onlyPrepared': boolean;
    'color-coded-spells-5e.addBorder': boolean;
    'color-coded-spells-5e.style': 'solid' | 'gradient';
    'color-coded-spells-5e.width': 'name' | 'full';
    'color-coded-spells-5e.intensity': number;
    'color-coded-spells-5e.abj': ColorSetting;
    'color-coded-spells-5e.con': ColorSetting;
    'color-coded-spells-5e.div': ColorSetting;
    'color-coded-spells-5e.enc': ColorSetting;
    'color-coded-spells-5e.evo': ColorSetting;
    'color-coded-spells-5e.ill': ColorSetting;
    'color-coded-spells-5e.nec': ColorSetting;
    'color-coded-spells-5e.trs': ColorSetting;
  }
}

export {};
