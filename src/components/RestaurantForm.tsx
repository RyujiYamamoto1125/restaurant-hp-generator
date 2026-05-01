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
  const [resultUrl, setResultUrl] = useState('')
  const [error, setError] = useState('')
  const [fetchingPlaces, setFetchingPlaces] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const fetchFromGoogleMaps = async () => {
    if (!form.googleMapsUrl) return
    setFetchingPlaces(true)
    try {
      const res = await fetch(`/api/places?url=${encodeURIComponent(form.googleMapsUrl)}`)
      const data = await res.json()
      if (!data.error) {
        setForm(prev => ({ ...prev, ...data }))
      }
    } catch {
      // Places APIなしでも手動入力で続行
    } finally {
      setFetchingPlaces(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResultUrl('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.slug) {
        setResultUrl(`${window.location.origin}/site/${data.slug}`)
      } else {
        setError(data.error || 'エラーが発生しました')
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Google Maps URL */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <label className="block text-sm font-semibold text-blue-800 mb-2">
          Google Maps URL（貼るだけで自動入力）
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            name="googleMapsUrl"
            value={form.googleMapsUrl}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className="flex-1 rounded-lg border border-blue-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={fetchFromGoogleMaps}
            disabled={fetchingPlaces || !form.googleMapsUrl}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {fetchingPlaces ? '取得中...' : '自動入力'}
          </button>
        </div>
      </div>

      {/* 食べログURL */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">食べログ URL</label>
        <input
          type="url"
          name="tabelogUrl"
          value={form.tabelogUrl}
          onChange={handleChange}
          placeholder="https://tabelog.com/..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <hr className="border-gray-200" />

      {/* 店舗情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            店名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">住所</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="例: 東京都渋谷区道玄坂1-2-3"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">電話番号</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="例: 03-1234-5678"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">席数</label>
          <input
            type="text"
            name="seats"
            value={form.seats}
            onChange={handleChange}
            placeholder="例: 30席"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">営業時間</label>
          <textarea
            name="hours"
            value={form.hours}
            onChange={handleChange}
            rows={2}
            placeholder="例: 月〜金 11:30〜14:00 / 17:00〜22:00&#10;土日祝 定休日"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">お店の説明・コンセプト</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="例: 築地直送の新鮮なネタにこだわった本格江戸前寿司。..."
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
            HPを生成中...（30秒ほどお待ちください）
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-800 font-bold text-lg mb-3">HPが生成されました！</p>
          <a
            href={resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            生成されたHPを見る →
          </a>
          <p className="text-xs text-gray-500 mt-3 break-all">{resultUrl}</p>
        </div>
      )}
    </form>
  )
}
