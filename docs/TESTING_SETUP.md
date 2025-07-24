# Testing Setup Guide för Skiftappen

## Installation och Konfiguration

Jest och React Native Testing Library är redan installerade och konfigurerade i projektet.

### Installerade paket:
- `jest` - Test framework
- `@testing-library/react-native` - Testing utilities för React Native
- `jest-expo` - Jest preset för Expo
- `react-test-renderer` - För rendering av komponenter i tester
- `@types/jest` - TypeScript-typer för Jest

## Konfiguration

### Jest Config (`jest.config.js`)
```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'context/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  }
};
```

### Test Scripts i package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Skriva Tester

### Grundläggande komponenttest

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test Title" />);
    
    expect(screen.getByText('Test Title')).toBeTruthy();
  });

  it('handles press events', () => {
    const mockOnPress = jest.fn();
    render(<MyComponent onPress={mockOnPress} />);
    
    const button = screen.getByRole('button');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

### Test av hooks

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from '../useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Test av asynkrona operationer

```typescript
import { render, screen, waitFor } from '@testing-library/react-native';
import { AsyncComponent } from '../AsyncComponent';

// Mock API calls
jest.mock('../api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test data' }))
}));

describe('AsyncComponent', () => {
  it('loads and displays data', async () => {
    render(<AsyncComponent />);
    
    // Vänta på att data laddas
    await waitFor(() => {
      expect(screen.getByText('test data')).toBeTruthy();
    });
  });
});
```

## Mockning

### Mock av externa moduler

```typescript
// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: { name: 'test-app' }
}));

// Mock navigation
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}));
```

### Mock av egna moduler

```typescript
// Mock utility functions
jest.mock('@/lib/utils', () => ({
  formatDate: jest.fn(() => '2023-01-01'),
  validateEmail: jest.fn(() => true)
}));
```

## Teststrategier

### 1. Enhetstester (Unit Tests)
Testa enskilda komponenter och funktioner isolerat.

```typescript
describe('Button Component', () => {
  it('applies correct styles for variant', () => {
    render(<Button variant="outline">Test</Button>);
    const button = screen.getByRole('button');
    
    expect(button.props.style).toMatchObject({
      borderWidth: 1,
      backgroundColor: 'transparent'
    });
  });
});
```

### 2. Integrationstester
Testa hur komponenter fungerar tillsammans.

```typescript
describe('Login Flow', () => {
  it('logs in user successfully', async () => {
    render(<LoginScreen />);
    
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByText('Welcome!')).toBeTruthy();
    });
  });
});
```

### 3. Snapshot-tester
Fånga visuella regressioner.

```typescript
import renderer from 'react-test-renderer';

describe('Component Snapshots', () => {
  it('matches snapshot', () => {
    const tree = renderer
      .create(<MyComponent prop="value" />)
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
```

## Testning av Context och Providers

```typescript
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../context/ThemeContext';
import { ComponentUsingTheme } from '../ComponentUsingTheme';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ComponentUsingTheme', () => {
  it('uses theme correctly', () => {
    renderWithTheme(<ComponentUsingTheme />);
    // Test theme-related functionality
  });
});
```

## Accessibility Testing

```typescript
describe('Accessibility', () => {
  it('has proper accessibility labels', () => {
    render(<Button accessibilityLabel="Submit form">Submit</Button>);
    
    const button = screen.getByLabelText('Submit form');
    expect(button).toBeTruthy();
  });

  it('has correct accessibility role', () => {
    render(<CustomButton>Click me</CustomButton>);
    
    const button = screen.getByRole('button');
    expect(button.props.accessibilityRole).toBe('button');
  });
});
```

## Köra Tester

### Alla tester
```bash
npm test
```

### Tester i watch-läge
```bash
npm run test:watch
```

### Täckningsrapport
```bash
npm run test:coverage
```

### Specifika tester
```bash
npm test -- Button.test.tsx
npm test -- --testNamePattern="renders correctly"
```

## Best Practices

### 1. Beskrivande testnamn
```typescript
// Bra
it('shows error message when email is invalid', () => {});

// Dåligt  
it('tests email', () => {});
```

### 2. Arrange, Act, Assert pattern
```typescript
it('increments counter when button is pressed', () => {
  // Arrange
  render(<Counter initialValue={0} />);
  
  // Act
  fireEvent.press(screen.getByText('Increment'));
  
  // Assert
  expect(screen.getByText('1')).toBeTruthy();
});
```

### 3. Testa beteende, inte implementation
```typescript
// Bra - testar vad användaren ser
expect(screen.getByText('Loading...')).toBeTruthy();

// Dåligt - testar intern state
expect(component.state.isLoading).toBe(true);
```

### 4. Använd data-testid för komplexa selektorer
```typescript
// I komponenten
<View testID="user-profile">
  <Text>{user.name}</Text>
</View>

// I testet
const profile = screen.getByTestId('user-profile');
```

## Felsökning

### Vanliga problem och lösningar

1. **"Cannot find module" fel**
   - Kontrollera moduleNameMapper i jest.config.js
   - Verifiera att importpaths är korrekta

2. **Timeout-fel i asynkrona tester**
   ```typescript
   // Öka timeout för specifika tester
   it('loads data', async () => {
     // test code
   }, 10000); // 10 sekunder timeout
   ```

3. **Mock fungerar inte**
   - Placera mocks före imports
   - Använd jest.clearAllMocks() i beforeEach

4. **Expo-relaterade fel**
   - Kontrollera att alla Expo-moduler är mockade i jest-setup.js
   - Använd jest-expo preset

## Exempel på komplett testfil

Se `components/ui/__tests__/button.test.tsx` för ett komplett exempel på hur man testar en React Native-komponent med olika varianter, storlekar, tillstånd och interaktioner.