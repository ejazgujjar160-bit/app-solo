export const metadata = {
  title: 'F16 Jet Pro',
  description: 'Flight Simulation Game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
