# Color Coded 5e

A Foundry VTT module for the D&D 5e system that lets you color tag individual items, so they stand out on actor sheets. Tag a weapon, a feature or a spell with a color, choose how the highlight looks, and optionally only show it while the item is equipped, attuned or prepared.

## Requirements

- Foundry VTT v13 (verified on 13.351)
- D&D 5e system 5.3 or later (verified on 5.3.3)

## Tagging an item

Open the color tag window in either of these ways:

- Right-click an item on an actor sheet and choose **Add Color Tag**, or **Edit Color Tag** if it's already tagged.
- Open the item's own sheet and choose **Add Color Tag** from the three-dot menu in its title bar.

The window has three sections:

- **Preview**: a copy of the item's row as it appears on the sheet, which updates lives as you change the settings.
- **Appearance**:
  - **Color**: the highlight color.
  - **Intensity**: how strong the fill is, from 0 (invisible) to 100 (opaque).
  - **Style**: a solid fill, or a gradient that fades out.
  - **Width**: fill only the item's name, or the whole row.
  - **Add Border**: draw a solid border in the tag color on the row's left edge.
- **Conditions**: only show the tag while the item is in a certain state. Each condition is shown only for items it applies to:
  - **Equipped**: items that can be equipped, such as weapons and armor.
  - **Attuned**: items that require or allow attunement.
  - **Prepared**: spells that need to be prepared. Cantrips and spells that are always available don't have this option.

Click **Save** to apply the tag, or **Remove Tag** to clear it.

## Things to know

- Tags are stored on the item. Everyone who can see the item sees the same colors, and the tag stays with the item when it's copied or moved to another actor.
- You can only tag items you own. Items in locked compendiums can't be tagged.
- Tags show on every D&D 5e actor sheet: characters, NPCs, vehicles and groups.

### Firefox users

Firefox uses your operating system's color dialog, which only reports a color once you confirm it. The preview therefore updates when you click **Select**, not while you're picking. To get a live preview, install the [Better Color Picker](https://addons.mozilla.org/en-US/firefox/addon/better-color-picker/) add-on, which replaces Firefox's color dialog with one that updates as you go.

## Troubleshooting

The module logs to the console. It's messages start with `color-coded-5e |`. When opening an issue, pelase include these logs. Open your browser's developer console (F12) and filter on `color-coded-5e`. Enable **Verbose** or **Debug** to get additional detail, and include those messages in the issue.
