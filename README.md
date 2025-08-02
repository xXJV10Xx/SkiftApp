# 🚀 Skiftappen - Team Chat App

A modern React Native mobile application for team communication with real-time chat, authentication, and multi-language support.

## ⭐ Features

- **Shift Management** - View and manage work shifts
- **Team Communication** - Real-time chat with colleagues  
- **Company Integration** - Multi-company support
- **Calendar Integration** - Export shifts to Google & Apple Calendar (Premium)
- **Stripe Payments** - Secure payment processing for premium features
- **Supabase Authentication** with email/password
- **Real-time Updates** - Live synchronization across devices

## 💳 Premium Features

### Calendar Export (99 SEK)
- Export your shifts to Google Calendar
- Apple Calendar integration
- Automatic synchronization
- Works across all devices

To enable calendar export:
1. Use the payment button in the app
2. Complete payment via Stripe
3. Calendar export will be automatically activated

## 🛠 Tech Stack

- **React Native** with Expo
- **TypeScript** - Type-safe development
- **Supabase** - Backend as a Service
- **Stripe** - Payment processing
- **Real-time messaging** with Supabase
- **Push Notifications** with Expo
- **Modern UI** with custom components

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/skiftappen.git
cd skiftappen
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk
```

### 4. Set up Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing
3. Run the SQL commands from `DATABASE_SETUP.md`
4. Configure Google OAuth (optional)

### 5. Start development server
```bash
npx expo start
```

### 6. Test on device
- Install **Expo Go** app on your phone
- Scan the QR code from terminal
- Test all features

## 🗄️ Database Setup

### 1. Run SQL commands
Copy and paste the SQL commands from `DATABASE_SETUP.md` into your Supabase SQL Editor.

### 2. Enable real-time
In Supabase Dashboard:
- Go to **Database** → **Replication**
- Enable real-time for all tables

### 3. Test data
Add some test companies and teams to test the chat functionality.

## 📱 App Structure

```
skiftappen/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── chat.tsx       # Chat screen
│   │   ├── profile.tsx    # Profile screen
│   │   └── settings.tsx   # Settings screen
│   ├── auth/              # Authentication
│   │   ├── login.tsx      # Login screen
│   │   └── forgot-password.tsx
│   └── _layout.tsx        # Root layout
├── context/               # React Context providers
│   ├── AuthContext.tsx    # Authentication state
│   ├── ChatContext.tsx    # Chat functionality
│   ├── LanguageContext.tsx # Internationalization
│   └── ThemeContext.tsx   # Theme management
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   ├── i18n.ts           # Translations
│   └── notifications.ts   # Push notifications
└── components/            # Reusable components
```

## 🌍 Internationalization

The app supports Swedish and English. To add more languages:

1. Add translations to `lib/i18n.ts`
2. Update the `Language` type
3. Add language options to settings

## 🎨 Theming

The app supports three theme modes:
- **Light** - Bright theme
- **Dark** - Dark theme  
- **System** - Follows device settings

Colors are defined in `context/ThemeContext.tsx`.

## 📱 Building for Production

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure build
```bash
eas build:configure
```

### 4. Build for platforms
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

## 🚀 Deployment

### Android (Google Play Store)
1. Create Google Play Console account
2. Upload AAB file from EAS build
3. Fill in app information
4. Submit for review

### iOS (App Store)
1. Create Apple Developer account
2. Upload IPA file to App Store Connect
3. Fill in app information
4. Submit for review

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🔧 Configuration

### Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

### App Configuration
- `app.json` - Expo configuration
- `eas.json` - EAS build configuration

## 📊 Features in Detail

### Authentication
- Email/password registration and login
- Google OAuth integration
- Password reset via email
- Secure session management
- Automatic login state persistence

### Chat System
- Real-time messaging with Supabase
- Team-based chat rooms
- Online status indicators
- Message history
- Team member management

### User Interface
- Modern, responsive design
- Dark/light theme support
- Multi-language interface
- Intuitive navigation
- Loading states and error handling

### Performance
- Optimized for mobile
- Efficient real-time updates
- Minimal network usage
- Smooth animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Check the [Supabase documentation](https://supabase.com/docs)
3. Create an issue on GitHub
4. Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`

## 🗺️ Roadmap

- [ ] Voice messages
- [ ] File sharing
- [ ] Video calls
- [ ] Advanced team management
- [ ] Analytics dashboard
- [ ] Custom themes
- [ ] Offline message sync
- [ ] Message reactions
- [ ] User profiles with avatars

## 📞 Contact

For questions or support, please create an issue on GitHub or contact the development team.

---

**Made with ❤️ using React Native, Expo, and Supabase**
