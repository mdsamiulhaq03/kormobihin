import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Outfit: geometric, rounded headings. Plus Jakarta Sans: legible body text. Both are
// variable fonts, so one file each covers every weight. Code/CV text uses a system mono.
const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Bangla text (lang="bn") gets a real Bengali face instead of a system fallback.
// Bengali subset only, so Latin pages download nothing extra.
const bangla = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KormoBihin — Job Application Tracker",
    template: "%s · KormoBihin",
  },
  description:
    "Track every job you apply to, move applications through hiring stages, and check how well your CV matches a job with AI.",
};

// viewport-fit=cover lets the phone bottom bar sit above the home indicator (safe area).
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${bangla.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
        {/* On phones toasts drop below the sticky header instead of covering Log out. */}
        <Toaster richColors position="top-right" mobileOffset={{ top: 76 }} />
      </body>
    </html>
  );
}
