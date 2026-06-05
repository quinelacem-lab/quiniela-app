import './globals.css'

export const metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Quiniela de fútbol para la oficina',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}