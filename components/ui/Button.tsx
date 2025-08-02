import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];
    if (disabled) {
      baseStyle.push(styles.button_disabled);
    }
    if (style) {
      baseStyle.push(style);
    }
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`text_${variant}`], styles[`text_${size}`]];
    if (disabled) {
      baseStyle.push(styles.text_disabled);
    }
    if (textStyle) {
      baseStyle.push(textStyle);
    }
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  button_primary: {
    backgroundColor: '#007AFF',
  },
  button_secondary: {
    backgroundColor: '#6C757D',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  button_destructive: {
    backgroundColor: '#DC3545',
  },
  button_disabled: {
    backgroundColor: '#E9ECEF',
    borderColor: '#E9ECEF',
  },
  button_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  button_md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button_lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: '#007AFF',
  },
  text_destructive: {
    color: '#FFFFFF',
  },
  text_disabled: {
    color: '#ADB5BD',
  },
  text_sm: {
    fontSize: 14,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 18,
  },
});