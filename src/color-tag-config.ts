import type { DeepPartial } from 'fvtt-types/utils';
import { DEFAULTS, MODULE_ID, getColorTag, log, getApplicableConditions, ApplicableConditions } from './shared';

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
    position: { width: 480 },
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
      buttons.push({
        type: 'button',
        icon: 'fa-solid fa-trash',
        label: 'CC5e.ColorTagConfig.Remove',
        action: 'remove',
      });
    }
    return Object.assign(context, {
      tag: tag ?? DEFAULTS,
      tagFields: TAG_FIELDS,
      buttons,
      hasConditions,
      applicableConditions,
    });
  }

  protected override async _onRender(context: DeepPartial<RenderContext>, options: DeepPartial<RenderOptions>) {
    await super._onRender(context, options);
    // TODO: listen for `input` on this.form so the preview follows the color picker while dragging.
    //  `_onChangeForm` only runs on `change`, which the color picker fires once a color is picked.
  }

  protected override _onChangeForm(formConfig: foundry.applications.api.ApplicationV2.FormConfiguration, event: Event) {
    super._onChangeForm(formConfig, event);
    // TODO: read the form and apply the values to the preview row.
  }

  // Remove button in the footer.
  static async #onRemove(this: ColorTagConfig) {
    // TODO: unset the tag flags on this.document, then close.
    log.debug('remove clicked', this.document.name);
  }
}

// Open the color tag window for an item, reusing its window if one is already open.
export const openColorTagConfig = (item: Item.Implementation) => {
  const existing = Object.values(item.apps).find((app) => app instanceof ColorTagConfig);
  const app = existing ?? new ColorTagConfig({ document: item });
  void app.render({ force: true });
};
