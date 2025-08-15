import Link from "next/link"

interface FooterProps {
  locale?: "en" | "ja"
}

const content = {
  en: {
    description: "Professional video player with AB repeat functionality",
    links: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
    copyright: "© 2024 reppie. All rights reserved.",
  },
  ja: {
    description: "ABリピート機能付きプロフェッショナル動画プレイヤー",
    links: {
      privacy: "プライバシーポリシー",
      terms: "利用規約",
    },
    copyright: "© 2024 reppie. All rights reserved.",
  },
}

export function Footer({ locale = "en" }: FooterProps) {
  const t = content[locale]
  const basePath = locale === "ja" ? "/jp" : ""

  return (
    <footer className="bg-muted/50 border-t py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">reppie</h3>
            <p className="text-muted-foreground">{t.description}</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <div className="space-y-2">
              <Link
                href={`${basePath}/legal/privacy`}
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.links.privacy}
              </Link>
              <Link
                href={`${basePath}/legal/terms`}
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.links.terms}
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Open Source</h4>
            <p className="text-sm text-muted-foreground">Built with Next.js, React Player, and Tailwind CSS</p>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
