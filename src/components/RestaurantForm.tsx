'use client'

import { useState } from 'react'

interface FormData {
  name: string
  cuisine: string
  address: string
  phone: string
  hours: string
  description: string
  priceRange: string
  seats: string
  googleMapsUrl: string
  tabelogUrl: string
}

export default function RestaurantForm() {
  const [form, setForm] = useState<FormData>({
    name: '', cuisine: '', address: '', phone: '',
    hours: '', description: '', priceRange: '', seats: '',
    googleMapsUrl: '', tabelogUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const hasUrl = form.tabelogUrl || form.googleMapsUrl

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResultUrl('')

    if (hasUrl) {
      setLoadingStep('URLから店舗情報を取得中...')
    } else {
      setLoadingStep('HPを生成中...')
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setLoadingStep('AIがHPをデザイン中...')
      const data = await res.json()
      if (data.slug) {
        const origin = window.location.origin
        const slugEnc = encodeURIComponent(data.slug)
        setResultUrl(`${origin}/site/${slugEnc}`)
        setEditUrl(`${origin}/site/${slugEnc}/edit`)
        setEditPassword(data.password || '')
      } else {
        setError(data.error || 'エラーが発生しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">

      {/* URL入力エリア */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-bold text-blue-800">
          URLを貼るだけで自動取得（推奨）
        </p>

        <div>
          <label className="block text-xs font-semibold text-blue-700 mb-1">食べログ URL</label>
          <input
            type="url"
            name="tabelogUrl"
            value={form.tabelogUrl}
            onChange={handleChange}
            placeholder="https://tabelog.com/..."
            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-blue-700 mb-1">Google Maps URL</label>
          <input
            type="url"
            name="googleMapsUrl"
            value={form.googleMapsUrl}
            onChange={handleChange}
            placeholder="https://maps.google.com/... または https://maps.app.goo.gl/..."
            className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        {hasUrl && (
          <p className="text-xs text-blue-600">
            ✓ URLから住所・電話・営業時間・説明文などを自動取得してHPに反映します
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-gray-400 text-sm">
        <div className="flex-1 border-t border-gray-200" />
        <span>追加情報（任意）</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* 手動入力フォーム */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            店名 {!hasUrl && <span className="text-red-500">*</span>}
            <span className="text-xs font-normal text-gray-400 ml-2">URL未入力時は必須</span>
          </label>
          <input
            type="text"
            name="name"
            required={!hasUrl}
            value={form.name}
            onChange={handleChange}
            placeholder="例: 鮨 さかもと"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">ジャンル</label>
          <input
            type="text"
            name="cuisine"
            value={form.cuisine}
            onChange={handleChange}
            placeholder="例: 寿司・和食"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">価格帯</label>
          <select
            name="priceRange"
            value={form.priceRange}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">選択してください</option>
            <option value="〜1,000円">〜1,000円</option>
            <option value="1,000〜3,000円">1,000〜3,000円</option>
            <option value="3,000〜5,000円">3,000〜5,000円</option>
            <option value="5,000〜10,000円">5,000〜10,000円</option>
            <option value="10,000円〜">10,000円〜</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">お店の説明・コンセプト</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="URLから自動取得されます。追記したい場合はこちらに入力"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {loadingStep || 'HP生成中...'}
          </>
        ) : (
          '✨ HPを自動生成する'
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {resultUrl && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
          <p className="text-green-800 font-bold text-lg text-center">HPが生成されました！</p>

          <a href={resultUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full">
            👁 生成されたHPを見る →
          </a>

          <div className="bg-white border border-orange-200 rounded-lg p-4 space-y-3">
            <p className="text-orange-800 font-bold text-sm">✏️ オーナー様向け編集情報</p>
            <div className="bg-orange-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500">編集URL</p>
              <p className="text-xs font-mono break-all text-gray-700">{editUrl}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-bold mb-1">🔑 ログインパスワード（一度だけ表示）</p>
              <p className="text-2xl font-mono font-bold text-red-700 tracking-widest text-center py-1">{editPassword}</p>
              <p className="text-xs text-red-400 text-center">必ずメモしてください。再表示できません。</p>
            </div>
            <a href={editUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm w-full">
              ✏️ 編集画面を開く
            </a>
            <button onClick={() => navigator.clipboard.writeText(`編集URL: ${editUrl}\nパスワード: ${editPassword}`)}
              className="w-full text-xs text-orange-600 hover:text-orange-800 py-1 border border-orange-200 rounded-lg">
              📋 URL・パスワードをまとめてコピー
            </button>
          </div>

          <p className="text-xs text-gray-400 break-all text-center">{resultUrl}</p>
        </div>
      )}
    </form>
  )
}
