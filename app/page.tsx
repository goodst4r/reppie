import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { SupportedPlatforms } from "@/components/supported-platforms"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <SupportedPlatforms />
      <Footer />
    </main>
  )
}
