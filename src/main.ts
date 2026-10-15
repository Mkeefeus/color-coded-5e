import { openColorTagConfig } from './color-tag-config';
import { MODULE_ID, applyTag, getColorTag, getUnmetConditions, log } from './shared';

type ItemSheetV2 = foundry.applications.sheets.ItemSheetV2.Any;

const addContextMenuEntry = (item: Item.Implementation, menuItems: ItemContextMenuEntry[]) => {
  const tag = getColorTag(item);
  menuItems.push({
    name: tag ? 'CC5e.ContextMenu.EditColorTag' : 'CC5e.ContextMenu.AddColorTag',
    icon: '<i class="fa-solid fa-palette fa-fw"></i>',
    condition: () => item.isOwner && !item.compendium?.locked,
    callback: () => openColorTagConfig(item),
  });
};

const addControlHeaderMenuEntry = (app: ItemSheetV2, controls: HeaderControl[]) => {
  const item = app.item;
  const tag = getColorTag(item);
  controls.push({
    icon: 'fa-solid fa-palette', // class string, not HTML like the other menu
    label: tag ? 'CC5e.ContextMenu.EditColorTag' : 'CC5e.ContextMenu.AddColorTag',
    action: 'cc5eColorTag',
    visible: () => app.isEditable,
    onClick: () => openColorTagConfig(app.document),
  });
};

const clearRow = (row: HTMLElement) => {
  for (const attr of ['data-cc5e', 'data-cc5e-style', 'data-cc5e-width', 'data-cc5e-add-border'])
    row.removeAttribute(attr);
  row.style.removeProperty('--cc5e-color');
  row.style.removeProperty('--cc5e-intensity');
};

Hooks.once('init', () => {
  log.info('init');
  Hooks.on('dnd5e.getItemContextOptions', addContextMenuEntry);
  Hooks.on('getHeaderControlsItemSheet5e', addControlHeaderMenuEntry);
  Hooks.on('renderBaseActorSheet', (app, element) => {
    const itemElements = element.querySelectorAll<HTMLElement>('li.item[data-item-id]');
    // Collected for one summary per render rather than a line per row.
    const colored: string[] = [];
    const hidden: string[] = [];
    itemElements.forEach((itemElement) => {
      const itemId = itemElement.getAttribute('data-item-id');
      if (!itemId) {
        log.warn('Item row has an empty data-item-id', itemElement);
        clearRow(itemElement);
        return;
      }
      const item = app.actor.items.get(itemId);
      if (!item) {
        log.warn(`Item row ${itemId} on ${app.actor.name}'s sheet has no matching item`, itemElement);
        clearRow(itemElement);
        return;
      }
      const colorTag = getColorTag(item);
      if (!colorTag) {
        clearRow(itemElement);
        return;
      }
      const unmet = getUnmetConditions(item, colorTag);
      if (unmet.length) {
        hidden.push(`${item.name} (${unmet.join(', ')})`);
        clearRow(itemElement);
        return;
      }
      applyTag(itemElement, colorTag);
      colored.push(item.name);
    });
    log.debug(`Rendered ${app.actor.name}'s sheet: ${itemElements.length} item rows`, {
      colored,
      hiddenByConditions: hidden,
    });
  });
});

Hooks.once('ready', () => {
  // The version helps match a bug report to a release.
  log.info(`ready (v${game.modules?.get(MODULE_ID)?.version ?? 'unknown'})`);
});
