/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#4f46e5", // indigo-600
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe", // indigo-200
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca", // indigo-700
          800: "#3730a3",
          900: "#312e81",
        },
        accent: {
          DEFAULT: "#059669", // emerald-600
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0", // emerald-200
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          DEFAULT: "#d97706", // amber-600
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a", // amber-200
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          DEFAULT: "#dc2626", // red-600
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca", // red-200
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};