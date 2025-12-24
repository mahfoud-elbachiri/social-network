import "./globals.css";

export const metadata = {
  title: "Nexus Network",
  description: "Modern Social Network",
  icons: {
    icon: '/nexus-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
