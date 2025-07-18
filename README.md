# Skiftappen – App Specification

## Overview
Skiftappen is a modern, secure, and user-friendly app for managing shift schedules and work passes for employees at Sweden's 20 largest companies (e.g., SSAB, Volvo, Scania). The app supports user registration, authentication (Google, Apple ID, email), company and shift selection, group chat, personal schedule management, and payment integration. It is designed for both employees and managers, with a guest mode for viewing schedules.

---

## Features & Flow

### 1. **Authentication & Onboarding**
- **Login Options:**
  - **Apple ID** (implemented/planned)
  - **Google** (implemented/planned)
  - Register with email (create new user)
- **Guest Mode:**
  - Can log in and view company schedules, but cannot join chats or edit personal schedule.
- **Onboarding Steps (after login/registration):**
  1. **Profile Setup:**
     - Enter name
     - (Optional) Choose/upload profile picture
     - Click "Next"
  2. **Company & Shift Selection:**
     - Select company (search or browse from top 20 list)
     - Select department/shift (if available)
     - Click "Next"
  3. **Schedule Overview:**
     - See current month's calendar with assigned shifts
     - Above calendar: three round info boxes showing:
       - Total hours worked
       - Next shift's day and time
       - Countdown to next shift
     - Can navigate 2 years forward/back in calendar

---

### 2. **Main App Navigation**
- **Sidebar (left menu):**
  - Top: Profile (round image)
    - Click to go to settings (change name, company, shift)
  - Below: "Välj företag" (Choose company)
    - Search field for company
    - Dropdown/popup with all companies (filter as you type)
    - Select company to see available shifts/departments
    - Select shift to view that schedule
  - "Personligt schema" (Personal schedule)
    - Edit your own shifts
    - Add absences (sick, leave, VAB, etc.) – only visible to you

---

### 3. **Schedule & Calendar**
- **Calendar View:**
  - Shows current month by default
  - Days with assigned shifts are highlighted
  - Can view 2 years forward/back
  - Above calendar: info boxes (hours worked, next shift, countdown)
  - Clicking a day shows shift details
  - If a shift is swapped, it changes color and shows who swapped

---

### 4. **Chat & Shift Swapping**
- **Group Chat:**
  - Each company/shift group has its own chat
  - Members can chat and propose shift swaps
  - When a shift is swapped, all group members see the update (color change on calendar)
- **Personal Schedule:**
  - Users can edit their own schedule (add sick days, leave, etc.)
  - These changes are private (not visible to others)

---

### 5. **User Roles**
- **Employee:**
  - Standard access to schedule, chat, and personal schedule
- **Manager (Chef):**
  - Can manage department/shift, approve swaps, and moderate chat
- **Guest:**
  - Can view schedules but not join chats or edit schedules

---

### 6. **AI Support**
- In-app AI assistant for help with:
  - Schedule questions
  - Company/shift info
  - App usage

---

### 7. **Payment & Subscription**
- **Free 14-day trial**
- After trial: 29kr/month
- Payment options:
  - Apple Pay
  - Google Pay
  - Stripe
- Subscription required for full access (chat, personal schedule, shift swap, etc.)

---

## **Technical Notes**
- **Authentication:**
  - Uses Expo AuthSession for Google/Apple login (see [Expo AuthSession docs](https://docs.expo.dev/versions/latest/sdk/auth-session/)).
  - Apple ID login requires Apple Developer setup and device testing (see [Expo Apple Authentication docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)).
  - Google login requires a Google Cloud OAuth Client ID (see [Expo Google Auth docs](https://docs.expo.dev/guides/authentication/#google)).
  - Custom backend or Firebase for email login.
- **Navigation:** Use Expo Router with file-based routing.
- **State Management:** Context API for auth/user, possibly Redux or Zustand for schedule/chat.
- **Calendar:** Use a calendar component (e.g., react-native-calendars).
- **Chat:** Use a real-time backend (e.g., Firebase, Supabase, or custom Node.js/Socket.io).
- **Payments:** Integrate Stripe, Apple Pay, Google Pay via Expo or webview.
- **AI:** Integrate with OpenAI API or similar for in-app support.

---

## **App Flow Summary**
1. **User opens app → sees login/registration/guest options (Apple ID, Google, email)**
2. **Onboarding:** Profile → Company/shift selection → Calendar overview
3. **Main app:** Sidebar navigation, calendar, chat, personal schedule
4. **User can swap shifts, chat, edit personal schedule, and manage profile**
5. **AI support and payment/subscription integrated throughout**

---

## **For Developers**
- Follow this flow for all new features.
- Use Context for authentication and user state.
- Keep UI modern, clean, and mobile-friendly.
- Ensure all sensitive actions are secure and require authentication.
- Use modular components for sidebar, calendar, chat, etc.

---

**Questions? See this README or ask the product owner for clarifications.**
