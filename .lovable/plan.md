

# 🦆 QuackWash — The Pond Dashboard

## Overview
A gamified, mobile-first laundry tracker themed around obnoxious rubber ducks. We'll start with the main dashboard page ("The Pond") using mock data.

## Color Theme
- **Primary Yellow:** Bright, obnoxious duck yellow
- **Pond Blue:** Vibrant water/pond blue for backgrounds
- **Accents:** Orange for alerts, red for maintenance, green for idle/available

## Page: The Pond Dashboard

### 1. Top Bar
- QuackWash logo with a rubber duck icon
- Breadcrumb balance display (🍞 counter chip)
- Notification bell icon with badge count

### 2. Status Summary Strip
- Three pill-shaped counters: "X Available" (green), "X Running" (blue), "X Down" (red)
- Quick glance at overall laundry room health

### 3. The Pond — Duck Grid
- A wavy blue "pond" background area containing 11 duck elements
- Two sections labeled "Washers" (5 ducks) and "Dryers" (6 ducks)
- Each duck is an interactive, animated card:
  - **Idle (Happy Duck):** Calm bobbing animation, green glow, "Available" label — tappable to see machine details
  - **Running (Spinning Duck):** CSS spin animation inside a whirlpool effect, countdown timer overlay showing minutes remaining, pulsing blue border
  - **Maintenance (Dead Duck):** Flipped upside-down, greyed/red-tinted, caution tape overlay, "Out of Order" label

### 4. Duck Tap Interaction (Bottom Sheet)
- Tapping any duck opens a drawer/bottom sheet with:
  - Machine name & type (Washer/Dryer)
  - Current status with icon
  - If Running: countdown timer, "Watch this Duck 🔔" button to set an alert
  - If Idle: "This duck is free!" message
  - If Maintenance: "This duck is broken 💀" message

### 5. "Empty Pond" Alert Toggle
- A floating action button or toggle at the bottom: "Alert me when any duck is free"
- Toggling shows a toast confirmation

### 6. Breadcrumb Economy Teaser
- A collapsible section or tab at bottom showing:
  - Current breadcrumb balance with a bread emoji counter
  - "Duck Shop 🔒" preview with 3-4 locked cosmetic duck cards (pirate, propeller hat, sunglasses, crown) — all shown as locked/coming soon

## Mock Data
- 11 machines with randomized states (mix of Idle, Running with various countdown times, and 1-2 in Maintenance)
- State can be toggled via a hidden dev panel for testing different scenarios

## Animations
- Idle ducks: gentle bobbing (CSS keyframe)
- Running ducks: spin + whirlpool ripple effect
- Maintenance ducks: slight wobble, desaturated
- Page load: ducks fade-in with staggered delay

