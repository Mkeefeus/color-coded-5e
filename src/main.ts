import { openColorTagConfig } from './color-tag-config';
import { conditionsMet, getColorTag, log } from './shared';

type ItemSheetV2 = foundry.applications.sheets.ItemSheetV2.Any;

const addContextMenuEntry = (item: Item.Implementation, menuItems: ItemContextMenuEntry[]) => {
  menuItems.push({
    name: 'CC5e.ContextMenu.ColorTag',
    icon: '<i class="fa-solid fa-palette fa-fw"></i>',
    condition: () => item.isOwner,
    callback: () => openColorTagConfig(item),
  });
};

const addControlHeaderMenuEntry = (app: ItemSheetV2, controls: HeaderControl[]) => {
  controls.push({
    icon: 'fa-solid fa-palette', // class string, not HTML like the other menu
    label: 'CC5e.ContextMenu.ColorTag',
    action: 'cc5eColorTag',
    visible: () => app.document.isOwner,
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
      itemElement.setAttribute('data-cc5e', 'true');
      itemElement.setAttribute('data-cc5e-style', colorTag.style);
      itemElement.setAttribute('data-cc5e-width', colorTag.width);
      itemElement.setAttribute('data-cc5e-add-border', colorTag.addBorder.toString());
      itemElement.style.setProperty('--cc5e-color', colorTag.color);
      itemElement.style.setProperty('--cc5e-intensity', `${colorTag.intensity.toString()}%`);
    });
  });
});

Hooks.once('ready', () => {
  log.info('ready');
});
