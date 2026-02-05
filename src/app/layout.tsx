import "./globals.css"; 
import { Maitree } from "next/font/google";
import localFont from "next/font/local";

const maitree = Maitree({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-maitree",
});

const briemHand = localFont({
  src: "../../public/fonts/briem-hand.ttf",
  variable: "--font-briem-hand",
  weight: "100 900",
});

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${maitree.variable} ${briemHand.variable}`}>
      <body className="font-maitree">
        {children}
      </body>
    </html>
  );
}