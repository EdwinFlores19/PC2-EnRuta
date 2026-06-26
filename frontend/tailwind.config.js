/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        semaforo: {
          bg: "#0B0F19",       // Fondo base dark mode profesional
          card: "#161D30",     // Fondo de tarjetas y contenedores
          red: {
            DEFAULT: "#EF4444", // Alerta / Trabajo infantil / Riesgo
            bg: "rgba(239, 68, 68, 0.1)",
          },
          yellow: {
            DEFAULT: "#F59E0B", // En proceso / Formalización parcial
            bg: "rgba(245, 158, 11, 0.1)",
          },
          green: {
            DEFAULT: "#10B981", // Formalizado / Confiable
            bg: "rgba(16, 185, 129, 0.1)",
          },
        },
        brand: {
          blue: "#3B82F6",     // Color de acento primario (Confianza)
          purple: "#8B5CF6",   // Color institucional (MINTRA/MIMP)
        }
      },
      boxShadow: {
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.5)',
        'glow-yellow': '0 0 15px rgba(245, 158, 11, 0.5)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.5)',
      }
    },
  },
  plugins: [],
}
