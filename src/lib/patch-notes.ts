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
    version: '0.14.0',
    date: '2026-03-21',
    title: 'Guild Join Overhaul, Nav Improvements & Unlinked Player Management',
    changes: [
      { type: 'improved', text: 'Guild join flow now requires in-game name before applying — officers can verify players immediately' },
      { type: 'improved', text: 'Removed guest role — non-members are redirected to the join page instead of getting auto-created as guests' },
      { type: 'added', text: 'Delete unlinked players — officers can remove orphaned balance/energy entries from the players list' },
      { type: 'added', text: 'Discord bot install button added directly to the How To guide — no need to navigate to settings' },
      { type: 'added', text: 'How To link added to the right side of the nav bar for officers and owners' },
    ],
  },
  {
    version: '0.13.0',
    date: '2026-03-21',
    title: 'Full UI Redesign with Animations & Glass Morphism',
    changes: [
      { type: 'added', text: 'Framer Motion animations across all pages — smooth page transitions, staggered reveals, and micro-interactions' },
      { type: 'added', text: 'Reusable motion components — AnimatedPage, AnimatedCard, AnimatedList, ScrollReveal, and AnimatedNumber for consistent animations' },
      { type: 'added', text: 'Glass morphism design system — new .glass-card, .text-gradient, .border-glow, and .hover-lift utility classes' },
      { type: 'improved', text: 'Landing page redesigned — hero with floating logo, scroll-triggered feature cards, and hover parallax on app showcase cards' },
      { type: 'improved', text: 'Navigation redesigned — glass morphism dropdowns with animated enter/exit on both NavBar and GuildNavBar' },
      { type: 'improved', text: 'Sign-in page — glass card with animated shield icon and ambient background orbs' },
      { type: 'improved', text: 'Crafting calculator — glass-panel containers, sticky header with animated refresh, modernized table styling' },
      { type: 'improved', text: 'All guild admin pages now use ScrollReveal animations with cascading delays' },
      { type: 'improved', text: 'Ambient background radials added to root layout for depth' },
    ],
  },
  {
    version: '0.12.0',
    date: '2026-03-17',
    title: 'Permanent Discord Links, Balance Import & Bug Fixes',
    changes: [
      { type: 'added', text: 'Permanent Discord event links — players always get the same reusable URL from the bot, with full feature parity (edit/withdraw signup, regear requests, signups list, status badges)' },
      { type: 'added', text: 'Silver balance import from external systems — officers can bulk-import player balances via TSV paste' },
      { type: 'added', text: 'Discord signup slots now show assigned player names directly in the embed' },
      { type: 'added', text: 'Officers can setup the Discord bot and manage guild settings from the app' },
      { type: 'fixed', text: 'Edit Event page crash — server-side exception when clicking Edit on a published event' },
      { type: 'fixed', text: 'Crafting calculator profit calculation when sell price is overridden with transmute alternative' },
      { type: 'fixed', text: 'Removed duplicate API route that could cause conflicts' },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-03-15',
    title: 'Discord Signup, Admin Stats & Crafting Polish',
    changes: [
      { type: 'added', text: 'Discord event signup — officers can post events with /post-event, players click Sign Up to get a private link (no login required)' },
      { type: 'added', text: 'Admin stats dashboard — monitor total users, guilds, events, signups, and growth metrics' },
      { type: 'added', text: 'Auto-popup signup modal — when players visit an event page, the signup form opens immediately' },
      { type: 'improved', text: 'Crafting calculator: Sell Instantly now correctly applies 4% market tax to profit calculations' },
      { type: 'added', text: 'Crafting calculator: sell price can now be overridden (skips tax when manually set)' },
      { type: 'improved', text: 'Crafting calculator: city selection panel moved below Settings for better UX' },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-03-13',
    title: 'Role Build Setups & Guild Nav Overhaul',
    changes: [
      { type: 'added', text: 'Build Setups per role — officers can pre-define multiple gear configurations for each weapon role' },
      { type: 'added', text: 'Build Setup Picker in comps and events — load a predefined setup when assigning a role' },
      { type: 'added', text: 'Guild homepage with member list, upcoming events, weekly attendance leaderboard, and activity feed' },
      { type: 'added', text: 'Patch Notes page — viewable without sign-in' },
      { type: 'added', text: 'Optional auto-notify checkbox on siphoned energy import to DM players in debt' },
      { type: 'added', text: '"Notify All In Debt" button on siphoned energy admin page' },
      { type: 'added', text: 'Step-by-step instructions for copying siphoned energy logs from game' },
      { type: 'improved', text: 'Guild nav restructured — Builds and Contents are now dropdowns with sub-links' },
      { type: 'improved', text: 'Global NavBar cleaned up — My Guilds, Crafting, and Patch Notes links' },
      { type: 'improved', text: 'Removed min IP requirement from event/content creation' },
    ],
  },
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
