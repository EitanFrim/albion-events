export interface PatchChange {
  type: 'added' | 'fixed' | 'improved'
  text: string
}

export interface PatchNote {
  version: string
  date: string
  title: string
  changes: PatchChange[]
}

export const patchNotes: PatchNote[] = [
  {
    version: '0.9.0',
    date: '2026-03-12',
    title: 'Siphoned Energy & Discord DMs',
    changes: [
      { type: 'added', text: 'Siphoned Energy balance system — track energy per guild member via TSV log imports' },
      { type: 'added', text: 'Discord DM notifications for players with negative siphoned energy debt' },
      { type: 'added', text: 'Admin page for importing siphoned energy logs and viewing all transactions' },
      { type: 'added', text: 'Personal siphoned energy page for players to view their own balance and history' },
      { type: 'added', text: 'Energy column in player roster with sort and manual adjust' },
      { type: 'added', text: 'Orphaned energy transactions auto-link when players set their IGN' },
    ],
  },
  {
    version: '0.8.2',
    date: '2026-03-12',
    title: 'Crafting & QoL Fixes',
    changes: [
      { type: 'improved', text: 'Focus Efficiency tooltip now shows the full calculation breakdown' },
      { type: 'fixed', text: 'Focus Efficiency used base profit instead of transmute-adjusted profit' },
      { type: 'added', text: 'IGN "not set" banner always visible for players who haven\'t set their in-game name' },
      { type: 'fixed', text: 'Event edit page now imports existing role notes correctly' },
      { type: 'fixed', text: 'Discord link previews now show proper OG images with absolute URLs' },
      { type: 'fixed', text: 'Public event signup broken for new guests due to race condition' },
    ],
  },
  {
    version: '0.8.1',
    date: '2026-03-11',
    title: 'Crafting Calculator Improvements',
    changes: [
      { type: 'improved', text: 'Bigger popup fonts in the crafting calculator for easier reading' },
      { type: 'improved', text: 'Transmute From/To split into separate sortable columns' },
      { type: 'fixed', text: 'x.4 refined materials (4.4–8.4) no longer incorrectly require hearts' },
      { type: 'added', text: 'Regear deduction option in loot split form' },
      { type: 'added', text: 'Inline editing for loot tab sales (title, price, repair cost, silver bags)' },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-03-11',
    title: 'Guild Customization & Landing Page',
    changes: [
      { type: 'added', text: 'Public landing page with app overview and feature cards' },
      { type: 'added', text: 'Guild appearance customization — banner image and accent color' },
      { type: 'added', text: 'Banner/logo position and zoom controls' },
      { type: 'improved', text: 'Refining table UI improvements and empty state illustrations' },
      { type: 'fixed', text: 'Transparent tooltip in crafting calculator' },
    ],
  },
  {
    version: '0.7.0',
    date: '2026-02-28',
    title: 'Public Events & Loot Tab Improvements',
    changes: [
      { type: 'added', text: 'Guest role and event visibility settings (public/members-only)' },
      { type: 'improved', text: 'Drawn sales stay in Active section until split is completed' },
      { type: 'added', text: 'Sell loot tab to guild when no signups instead of cancelling' },
      { type: 'improved', text: 'Loot split link shown directly for drawn sales' },
    ],
  },
  {
    version: '0.6.0',
    date: '2026-02-26',
    title: 'Officer Signups & Navbar Refresh',
    changes: [
      { type: 'added', text: 'Officers can sign up guild members and assign roles on their behalf' },
      { type: 'added', text: 'Always-visible refresh button in navbar' },
      { type: 'improved', text: 'Silver bag icon for silver displays in app and Discord' },
    ],
  },
  {
    version: '0.5.0',
    date: '2026-02-25',
    title: 'Loot Tab Sales & Tag System',
    changes: [
      { type: 'added', text: 'Tag players to loot tab sales via Discord !tag command' },
      { type: 'added', text: 'Loot split feature for loot tab sales with Discord breakdown notification' },
      { type: 'added', text: 'Delete option for loot tab sales with confirmation' },
      { type: 'added', text: 'How-to guide for loot tab sales and loot split' },
      { type: 'fixed', text: 'Unknown button interaction error from gateway bot select menus' },
      { type: 'improved', text: 'Number-based sale picker in !tag command replaces select menu' },
    ],
  },
]
