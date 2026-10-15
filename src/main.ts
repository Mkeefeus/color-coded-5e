import { openColorTagConfig } from './color-tag-config';
import { applyTag, conditionsMet, getColorTag, log } from './shared';

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
    itemElements.forEach((itemElement) => {
      const itemId = itemElement.getAttribute('data-item-id');
      if (!itemId) {
        log.warn('itemElement has no item id');
        clearRow(itemElement);
        return;
      }
      const item = app.actor.items.get(itemId);
      if (!item) {
        clearRow(itemElement);
        return;
      }
      const colorTag = getColorTag(item);
      if (!colorTag) {
        clearRow(itemElement);
        return;
      }
      if (!conditionsMet(item, colorTag)) {
        clearRow(itemElement);
        return;
      }
      applyTag(itemElement, colorTag);
    });
  });
});

Hooks.once('ready', () => {
  log.info('ready');
});
