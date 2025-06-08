import { extendTheme } from 'native-base';

// CheckInBuddy Custom Pastel Theme
// Following DEVELOPMENT.md specifications for modern, clean, and friendly design
const theme = extendTheme({
  colors: {
    // Primary: Soft Blue
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main primary color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Secondary: Mint Green
    secondary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // Main secondary color
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    // Neutral grays for backgrounds and text
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Success: Light coral for positive actions
    success: {
      50: '#fef7f0',
      100: '#fef2e2',
      200: '#fde2c4',
      300: '#fdcf9b',
      400: '#fbb360',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Error: Soft red
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Warning: Soft orange
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
  fonts: {
    heading: 'System',
    body: 'System',
    mono: 'Courier',
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  space: {
    px: '1px',
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
    40: 160,
    48: 192,
    56: 224,
    64: 256,
  },
  radii: {
    none: 0,
    sm: 2,
    base: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'lg',
        _text: {
          fontWeight: 'semibold',
        },
      },
      variants: {
        solid: (props: any) => ({
          bg: `${props.colorScheme}.500`,
          _pressed: {
            bg: `${props.colorScheme}.600`,
          },
          _hover: {
            bg: `${props.colorScheme}.600`,
          },
        }),
        outline: (props: any) => ({
          borderColor: `${props.colorScheme}.500`,
          borderWidth: 2,
          _text: {
            color: `${props.colorScheme}.500`,
          },
          _pressed: {
            bg: `${props.colorScheme}.50`,
          },
        }),
        ghost: (props: any) => ({
          _text: {
            color: `${props.colorScheme}.500`,
          },
          _pressed: {
            bg: `${props.colorScheme}.50`,
          },
        }),
      },
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Input: {
      baseStyle: {
        rounded: 'lg',
        borderWidth: 2,
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
          bg: 'white',
        },
        _invalid: {
          borderColor: 'error.500',
        },
      },
    },
    FormControl: {
      baseStyle: {
        _invalid: {
          _text: {
            color: 'error.500',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        rounded: 'xl',
        bg: 'white',
        shadow: 2,
        p: 4,
      },
    },
    Heading: {
      baseStyle: {
        color: 'gray.800',
        fontWeight: 'bold',
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.700',
      },
    },
  },
});

export default theme; 