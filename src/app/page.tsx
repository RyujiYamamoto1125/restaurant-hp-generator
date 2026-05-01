import RestaurantForm from '@/components/RestaurantForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            レストランHP自動生成
          </h1>
          <p className="text-gray-600 text-lg">
            お店の情報を入力するだけで、プロ品質のHPが完成します
          </p>
          <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500 flex-wrap">
            <span>Google Maps連携</span>
            <span>食べログ対応</span>
            <span>AIで自動生成</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <RestaurantForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by Claude AI · Next.js · MongoDB
        </p>
      </div>
    </main>
  )
}
