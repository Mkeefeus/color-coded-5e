declare global {
  /**
   * Whether a state of the item has to hold for its color tag to show.
   * `required`: the tag only shows while the state is true. `ignored`: the state doesn't matter.
   * A condition that doesn't apply to the item (e.g. `prepared` on a sword) counts as satisfied.
   */
  type ColorTagCondition = 'required' | 'ignored';

  /** An item's color tag with every missing key filled in from the defaults. */
  type ColorTag = Required<Omit<ItemColorFlags, 'conditions'>> & {
    conditions: Required<NonNullable<ItemColorFlags['conditions']>>;
  };

  /**
   * Data this module stores on an item under `flags.color-coded-5e`.
   * The item is color tagged when `color` is set. Any other missing key falls back to a default when read.
   */
  interface ItemColorFlags {
    /** CSS color of the tag. Unset when the item isn't color tagged. */
    color?: string;
    /** How strong the fill is, 0 (invisible) to 100 (opaque). */
    intensity?: number;
    /** Whether the fill covers only the item name or the whole row. */
    width?: 'name' | 'full';
    /** Whether the fill is a flat color or fades out. */
    style?: 'solid' | 'gradient';
    /** Draw a solid border in the tag color on the left edge of the row. */
    addBorder?: boolean;
    /** States of the item that have to hold for the tag to show. */
    conditions?: {
      /** Applies to items that can be equipped. */
      equipped?: ColorTagCondition;
      /** Applies to items that can be attuned. */
      attuned?: ColorTagCondition;
      /** Applies to spells. */
      prepared?: ColorTagCondition;
    };
  }

  /**
   * An entry in an application's header (three dot) menu. Foundry 13.351 calls `onClick` when the entry is clicked
   * (ApplicationV2#_renderHeaderControl), but fvtt-types doesn't declare it.
   */
  type HeaderControl = foundry.applications.api.ApplicationV2.HeaderControlsEntry & {
    onClick?: (event: PointerEvent) => void | Promise<void>;
  };

  /** An entry in a dnd5e item context menu. dnd5e builds these menus with `jQuery: false`, so targets are elements. */
  type ItemContextMenuEntry = foundry.applications.ux.ContextMenu.Entry<HTMLElement>;
}

declare module 'fvtt-types/configuration' {
  namespace Hooks {
    interface ApplicationV2Config {
      /** dnd5e's base actor sheet. Every dnd5e actor sheet (character, NPC, vehicle, group, encounter) extends it. */
      BaseActorSheet: foundry.applications.sheets.ActorSheetV2.Any;
      /** dnd5e's item sheet. Also the base of `ContainerSheet`, so its hooks fire for containers. */
      ItemSheet5e: foundry.applications.sheets.ItemSheetV2.Any;
    }

    interface HookConfig {
      /**
       * Fired by dnd5e (inventory element, `_onOpenContextMenu`) each time an item's context menu opens.
       * `menuItems` is the live array the menu renders from, so push entries onto it.
       */
      'dnd5e.getItemContextOptions': (item: Item.Implementation, menuItems: ItemContextMenuEntry[]) => void;
      /**
       * Fired when an item sheet builds its header (three dot) menu. fvtt-types types `controls` as a single entry,
       * but at runtime it is the array to push onto.
       */
      getHeaderControlsItemSheet5e: (
        app: foundry.applications.sheets.ItemSheetV2.Any,
        controls: HeaderControl[]
      ) => void;
    }
  }

  interface FlagConfig {
    Item: {
      'color-coded-5e': ItemColorFlags;
    };
  }
}

export {};
