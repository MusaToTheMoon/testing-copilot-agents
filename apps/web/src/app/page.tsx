import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Nav */}
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📝</span>
            <span className="font-bold text-xl text-gray-900">EssayAI</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Write academic essays
            <br />
            <span className="text-primary-600">with AI assistance</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            EssayAI guides you through every stage of the essay writing process — from research
            and thesis development to drafting, revision, and export.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
          >
            Start writing for free
            <span>→</span>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "🔍",
              title: "Smart Research",
              description:
                "AI-powered source discovery finds relevant academic papers, books, and articles for your essay topic.",
            },
            {
              icon: "💡",
              title: "Thesis Generation",
              description:
                "Generate compelling, well-structured thesis statements with supporting arguments and counterarguments.",
            },
            {
              icon: "✍️",
              title: "Section-by-Section Drafting",
              description:
                "Draft each section with word budget tracking to ensure your essay hits the target word count.",
            },
            {
              icon: "🔄",
              title: "AI Revision",
              description:
                "Automated structural, style, and citation revision passes improve your writing quality.",
            },
            {
              icon: "📊",
              title: "Word Budget Tracking",
              description:
                "Real-time word count monitoring with per-section targets keeps your essay on track.",
            },
            {
              icon: "📤",
              title: "Export to DOCX & PDF",
              description:
                "Export your finished essay in multiple formats ready for submission.",
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
