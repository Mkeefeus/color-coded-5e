type ColorSetting = foundry.data.fields.ColorField<{ required: true; nullable: false; initial: string }>;

declare global {
  /** Data this module stores on an item under `flags.color-coded-5e`. */
  interface ItemColorFlags {
    /** CSS color picked for this item through its context menu. Unset when the item isn't color tagged. */
    color?: string;
  }

  /** An entry in a dnd5e item context menu. dnd5e builds these menus with `jQuery: false`, so targets are elements. */
  type ItemContextMenuEntry = foundry.applications.ux.ContextMenu.Entry<HTMLElement>;
}

declare module 'fvtt-types/configuration' {
  namespace Hooks {
    interface ApplicationV2Config {
      CharacterActorSheet: foundry.applications.sheets.ActorSheetV2.Any;
    }

    interface HookConfig {
      /**
       * Fired by dnd5e (inventory element, `_onOpenContextMenu`) each time an item's context menu opens.
       * `menuItems` is the live array the menu renders from, so push entries onto it.
       */
      'dnd5e.getItemContextOptions': (item: Item.Implementation, menuItems: ItemContextMenuEntry[]) => void;
    }
  }

  interface FlagConfig {
    Item: {
      'color-coded-5e': ItemColorFlags;
    };
  }

  interface SettingConfig {
    'color-coded-5e.enabled': boolean;
    'color-coded-5e.onlyPrepared': boolean;
    'color-coded-5e.addBorder': boolean;
    'color-coded-5e.style': 'solid' | 'gradient';
    'color-coded-5e.width': 'name' | 'full';
    'color-coded-5e.intensity': number;
    'color-coded-5e.abj': ColorSetting;
    'color-coded-5e.con': ColorSetting;
    'color-coded-5e.div': ColorSetting;
    'color-coded-5e.enc': ColorSetting;
    'color-coded-5e.evo': ColorSetting;
    'color-coded-5e.ill': ColorSetting;
    'color-coded-5e.nec': ColorSetting;
    'color-coded-5e.trs': ColorSetting;
  }
}

export {};
