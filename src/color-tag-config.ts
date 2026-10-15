import type { DeepPartial } from 'fvtt-types/utils';
import {
  DEFAULTS,
  MODULE_ID,
  getColorTag,
  log,
  getApplicableConditions,
  ApplicableConditions,
  applyTag,
  resolveTag,
} from './shared';

const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { fields } = foundry.data;

// The form fields for a color tag. The template renders each one with the {{formGroup}} helper.
// They aren't part of the Item schema, so the template passes each input's `name` and `value` itself.
const TAG_FIELDS = {
  color: new fields.ColorField({ required: true, nullable: false, initial: DEFAULTS.color }),
  intensity: new fields.NumberField({
    required: true,
    nullable: false,
    initial: DEFAULTS.intensity,
    integer: true,
    min: 0,
    max: 100,
    step: 1,
  }),
  style: new fields.StringField({
    required: true,
    nullable: false,
    initial: DEFAULTS.style,
    blank: false,
    choices: {
      solid: 'CC5e.ColorTagConfig.Fields.Style.Options.Solid',
      gradient: 'CC5e.ColorTagConfig.Fields.Style.Options.Gradient',
    },
  }),
  width: new fields.StringField({
    required: true,
    nullable: false,
    initial: DEFAULTS.width,
    blank: false,
    choices: {
      name: 'CC5e.ColorTagConfig.Fields.Width.Options.Name',
      full: 'CC5e.ColorTagConfig.Fields.Width.Options.Full',
    },
  }),
  addBorder: new fields.BooleanField({ initial: DEFAULTS.addBorder }),
  conditions: {
    equipped: new fields.StringField({
      required: true,
      nullable: false,
      initial: DEFAULTS.conditions.equipped,
      blank: false,
      choices: {
        ignored: 'CC5e.ColorTagConfig.Conditions.Ignored',
        required: 'CC5e.ColorTagConfig.Conditions.Required',
      },
    }),
    attuned: new fields.StringField({
      required: true,
      nullable: false,
      initial: DEFAULTS.conditions.attuned,
      blank: false,
      choices: {
        ignored: 'CC5e.ColorTagConfig.Conditions.Ignored',
        required: 'CC5e.ColorTagConfig.Conditions.Required',
      },
    }),
    prepared: new fields.StringField({
      required: true,
      nullable: false,
      initial: DEFAULTS.conditions.prepared,
      blank: false,
      choices: {
        ignored: 'CC5e.ColorTagConfig.Conditions.Ignored',
        required: 'CC5e.ColorTagConfig.Conditions.Required',
      },
    }),
  },
};

/**
 * One column in the preview row, mirroring a column next to the item on the dnd5e sheet. A column with neither
 * `text` nor `icon` is drawn empty, which dnd5e shows as a dash.
 */
interface PreviewColumn {
  /** dnd5e's column id. The template adds it as the `item-<id>` class so dnd5e's column styles apply. */
  id: string;
  /** Width in pixels, from dnd5e's InventoryElement.COLUMNS. */
  width: number;
  empty: boolean;
  text?: string;
  /** Class for the text span: dnd5e uses `value` for numbers and `condensed` for labels. */
  textClass?: string;
  /** Shown after the text as `text / max` (uses). */
  max?: string;
  /** Font Awesome icon shown before the text (weight). */
  faIcon?: string;
  /** Image or SVG path shown instead of text (spell school). */
  icon?: string;
  /** dnd5e currency key, shown as a coin after the text (price). */
  currency?: string;
}

// The dnd5e item data the preview columns read. fvtt-types doesn't know dnd5e's labels or system fields.
interface Dnd5eItemData {
  labels?: {
    recovery?: string;
    range?: string;
    target?: string;
    damages?: { formula?: string }[];
  };
  system: {
    quantity?: number;
    price?: { value?: number; denomination?: string };
    /** A Promise for containers, whose weight includes their contents. */
    totalWeight?: number | Promise<number>;
    uses?: { value?: number; max?: number | string };
    school?: string;
  };
}

// The dnd5e config isn't typed, so describe the one piece the preview reads from it.
interface Dnd5eSchoolConfig {
  DND5E?: { spellSchools?: Record<string, { icon?: string } | undefined> };
}

// Item types listed in the inventory tab. `backpack` is dnd5e's legacy name for containers.
const PHYSICAL_ITEM_TYPES = new Set(['weapon', 'equipment', 'consumable', 'tool', 'loot', 'container', 'backpack']);

type PreviewColumnInput = Omit<PreviewColumn, 'empty'>;

/**
 * The columns the sheet shows next to this item, filled with what the sheet would show where the item's own data has
 * it. Column sets and widths follow dnd5e 5.3.3 (InventoryElement.COLUMNS and the section definitions): inventory
 * items get price, weight and quantity, features get recovery, uses and formula, and spells get school, range and
 * target. The controls column is left out. Other item types (class, background, ...) aren't listed with columns.
 */
const getPreviewColumns = async (item: Item.Implementation): Promise<PreviewColumn[]> => {
  const { labels, system } = item as unknown as Dnd5eItemData;
  const type = item.type as string;
  let columns: PreviewColumnInput[] = [];

  if (PHYSICAL_ITEM_TYPES.has(type)) {
    // The sheet shows the stack's total weight rounded to 0.1.
    const weight = await system.totalWeight;
    const price = system.price?.value ? system.price : undefined;
    columns = [
      { id: 'price', width: 80, text: price ? String(price.value) : undefined, currency: price?.denomination },
      {
        id: 'weight',
        width: 60,
        text: weight ? String(Math.round(weight * 10) / 10) : undefined,
        faIcon: 'fa-solid fa-weight-hanging',
      },
      { id: 'quantity', width: 70, text: String(system.quantity ?? 0), textClass: 'value' },
    ];
  } else if (type === 'feat') {
    const uses = system.uses?.max ? system.uses : undefined;
    columns = [
      { id: 'recovery', width: 60, text: labels?.recovery || undefined, textClass: 'condensed' },
      {
        id: 'uses',
        width: 70,
        text: uses ? String(uses.value ?? 0) : undefined,
        textClass: 'value',
        max: uses ? String(uses.max) : undefined,
      },
      { id: 'formula', width: 80, text: labels?.damages?.[0]?.formula || undefined, textClass: 'formula' },
    ];
  } else if (type === 'spell') {
    const schools = (CONFIG as unknown as Dnd5eSchoolConfig).DND5E?.spellSchools;
    columns = [
      { id: 'school', width: 40, icon: system.school ? schools?.[system.school]?.icon : undefined },
      { id: 'range', width: 50, text: labels?.range || undefined, textClass: 'condensed' },
      { id: 'target', width: 80, text: labels?.target || undefined, textClass: 'condensed' },
    ];
  }

  return columns.map((column) => ({ ...column, empty: !column.text && !column.icon }));
};

interface RenderContext
  extends
    foundry.applications.api.HandlebarsApplicationMixin.RenderContext,
    foundry.applications.api.DocumentSheetV2.RenderContext<Item.Implementation> {
  /** The item's tag with defaults filled in, or the defaults when the item isn't tagged yet. */
  tag: ColorTag;
  tagFields: typeof TAG_FIELDS;
  buttons: foundry.applications.api.ApplicationV2.FormFooterButton[];
  /** Which conditions apply to this item. The template only shows a condition's field when it applies. */
  applicableConditions: ApplicableConditions;
  /** Whether any condition applies, so the conditions section can be hidden when none do. */
  hasConditions: boolean;
  /** Columns after the name in the preview row, so a "name" width fill looks different from "full". */
  previewColumns: PreviewColumn[];
}

interface Configuration
  extends
    foundry.applications.api.HandlebarsApplicationMixin.Configuration,
    foundry.applications.api.DocumentSheetV2.Configuration<Item.Implementation> {}

interface RenderOptions
  extends
    foundry.applications.api.HandlebarsApplicationMixin.RenderOptions,
    foundry.applications.api.DocumentSheetV2.RenderOptions {}

/**
 * Window for editing an item's color tag. It's a DocumentSheetV2 bound to the item, so submitting the form
 * updates the item with the form data: inputs named `flags.color-coded-5e.<key>` are written to the tag flags.
 */
// At runtime this is the Handlebars mixin applied to DocumentSheetV2. For TypeScript it's cast to a
// DocumentSheetV2 of Item plus the mixin's static PARTS: with the mixin's own types and Item.Implementation, any
// class with members fails with "Excessive stack depth" (an fvtt-types limitation). If you need other mixin members
// (`parts`, `_configureRenderParts`, `_preparePartContext`, ...), add them to this cast.
const ItemSheetBase = HandlebarsApplicationMixin(DocumentSheetV2) as unknown as typeof DocumentSheetV2<
  Item.Implementation,
  RenderContext,
  Configuration,
  RenderOptions
> & {
  PARTS: Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart>;
};

export class ColorTagConfig extends ItemSheetBase {
  static override DEFAULT_OPTIONS = {
    classes: ['cc5e-color-tag-config'],
    sheetConfig: false,
    // Wide enough for the preview's name plus up to three columns.
    position: { width: 560 },
    window: {
      contentClasses: ['standard-form'],
      icon: 'fa-solid fa-palette',
    },
    form: {
      closeOnSubmit: true,
    },
    actions: {
      remove: ColorTagConfig.#onRemove,
    },
  };

  static override PARTS = {
    form: { template: `modules/${MODULE_ID}/templates/color-tag-config.hbs` },
    footer: { template: 'templates/generic/form-footer.hbs' },
  };

  override get title() {
    return `${game.i18n?.localize('CC5e.ColorTagConfig.Title')}: ${this.document.name}`;
  }

  protected override async _prepareContext(
    options: DeepPartial<RenderOptions> & { isFirstRender: boolean }
  ): Promise<RenderContext> {
    const context = await super._prepareContext(options);
    const tag = getColorTag(this.document);
    const applicableConditions = getApplicableConditions(this.document);
    const hasConditions = Object.values(applicableConditions).some(Boolean);
    const buttons: RenderContext['buttons'] = [
      { type: 'submit', icon: 'fa-solid fa-floppy-disk', label: 'CC5e.ColorTagConfig.Save' },
    ];
    if (tag) {
      buttons.unshift({
        type: 'button',
        icon: 'fa-solid fa-trash',
        label: 'CC5e.ColorTagConfig.Remove',
        action: 'remove',
      });
    }
    const previewColumns = await getPreviewColumns(this.document);
    log.debug(`Preparing color tag window for ${this.document.name} (${this.document.type})`, {
      savedTag: tag ?? 'none (showing defaults)',
      applicableConditions,
      previewColumns,
    });
    return Object.assign(context, {
      tag: tag ?? DEFAULTS,
      tagFields: TAG_FIELDS,
      buttons,
      hasConditions,
      applicableConditions,
      previewColumns,
    });
  }

  // The preview row in the template, or null if it isn't rendered.
  #previewRow() {
    return this.element.querySelector<HTMLElement>('[data-cc5e-preview]');
  }

  // The tag the form currently describes, including changes that haven't been saved yet.
  #tagFromForm(): ColorTag {
    if (!this.form) {
      return DEFAULTS;
    }
    const formData = new foundry.applications.ux.FormDataExtended(this.form);
    const expanded = foundry.utils.expandObject(formData.object) as {
      flags?: { [MODULE_ID]?: ItemColorFlags };
    };
    const tag = resolveTag(expanded.flags?.[MODULE_ID] ?? {});
    // A cleared color text box submits '', which would make --cc5e-color invalid and hide the fill.
    if (!tag.color) {
      log.debug('Color field is empty, previewing the default color');
      return { ...tag, color: DEFAULTS.color };
    }
    return tag;
  }

  protected override async _onRender(context: DeepPartial<RenderContext>, options: DeepPartial<RenderOptions>) {
    await super._onRender(context, options);
    // Applies the tag or defaults to the preview on open
    const row = this.#previewRow();
    if (!row) {
      log.warn('Color tag window has no preview row; check templates/color-tag-config.hbs');
      return;
    }
    applyTag(row, getColorTag(this.document) ?? DEFAULTS);
  }

  protected override async _onFirstRender(context: DeepPartial<RenderContext>, options: DeepPartial<RenderOptions>) {
    await super._onFirstRender(context, options);
    this.form?.addEventListener('input', (event) => {
      // Handle color intensity live as its moving
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }
      const input = event.target;
      if (input.type === 'range') {
        this.#previewRow()?.style.setProperty('--cc5e-intensity', `${input.valueAsNumber}%`);
      } else if (input.type === 'color') {
        this.#previewRow()?.style.setProperty('--cc5e-color', input.value);
      }
    });
  }

  protected override _onChangeForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event) {
    super._onChangeForm(formConfig, event);
    const element = this.#previewRow();
    if (!element) {
      return;
    }
    const tag = this.#tagFromForm();
    this.#logPreviewChange(tag);
    applyTag(element, tag);
  }

  // Changes can arrive many times a second while adjusting the color or intensity. Log only once they've settled,
  // with the final tag. The preview itself still updates on every change.
  #logPreviewChange = foundry.utils.debounce((tag: ColorTag) => log.debug('Form changed, updating preview', tag), 300);

  // Runs on Save, after DocumentSheetV2 has turned the form into update data. fvtt-types calls the third argument
  // formData, but at runtime it's that update data (e.g. { flags: { 'color-coded-5e': {...} } }).
  protected override async _processSubmitData(
    event: SubmitEvent,
    form: HTMLFormElement,
    submitData: foundry.applications.ux.FormDataExtended,
    options?: unknown
  ) {
    log.debug(`Saving color tag for ${this.document.name}`, submitData);
    await super._processSubmitData(event, form, submitData, options);
    log.info(`Saved color tag for ${this.document.name}`, this.document.flags[MODULE_ID]);
  }

  static async #onRemove(this: ColorTagConfig) {
    try {
      await this.document.update({ [`flags.-=${MODULE_ID}`]: null } as Item.UpdateData);
    } catch (error) {
      // Keep the window open so the user can see nothing was removed.
      log.error(`Failed to remove color tag from ${this.document.name}`, error);
      return;
    }
    log.info(`Removed color tag from ${this.document.name}`);
    await this.close();
  }
}

// Open the color tag window for an item, reusing its window if one is already open.
export const openColorTagConfig = (item: Item.Implementation) => {
  const existing = Object.values(item.apps).find((app) => app instanceof ColorTagConfig);
  log.debug(`${existing ? 'Focusing the open' : 'Opening a'} color tag window for ${item.name}`);
  const app = existing ?? new ColorTagConfig({ document: item });
  void app.render({ force: true });
};
