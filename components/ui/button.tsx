import { cn } from '@/lib/utils';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  onPress,
  style,
  textStyle,
  className,
  testID,
  accessibilityLabel,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-12 px-8 text-lg'
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 32 : 16,
      paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 12 : 10,
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'outline':
        return { ...baseStyle, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: 'transparent' };
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' };
      case 'destructive':
        return { ...baseStyle, backgroundColor: '#ef4444' };
      default:
        return { ...baseStyle, backgroundColor: '#3b82f6' };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '500',
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
    };

    switch (variant) {
      case 'outline':
      case 'ghost':
        return { ...baseTextStyle, color: '#374151' };
      case 'destructive':
        return { ...baseTextStyle, color: '#ffffff' };
      default:
        return { ...baseTextStyle, color: '#ffffff' };
    }
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      {...props}
    >
      <Text style={[getTextStyle(), textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}; 