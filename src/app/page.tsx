'use client'

import Link from 'next/link'
import { SERVICE_NAME } from '@/lib/constants'
import { useEffect, useState } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)

      // スクロール進捗の計算
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollableHeight = documentHeight - windowHeight
      const progress = (currentScrollY / scrollableHeight) * 100
      setScrollProgress(Math.min(progress, 100))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* スクロール進捗バー */}
      <div
        className="fixed top-0 left-0 h-1 bg-apple-600 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="bg-gradient-to-b from-apple-50 to-white">
        {/* ヒーローセクション */}
        <section className="min-h-screen flex flex-col justify-center relative px-4 sm:px-6 lg:px-8">
          <div
            className="max-w-4xl mx-auto text-center transform transition-transform duration-300"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              化粧品の
              <span className="text-apple-600">リアルな体験</span>
              を共有しよう
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in animation-delay-200">
              成分や評価ではなく、実際の使い心地から「自分に合うかも」を見つける新しいコミュニティ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in animation-delay-400">
              <Link
                href="/posts"
                className="bg-apple-600 text-white hover:bg-apple-700 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center transform hover:scale-105"
              >
                体験談を見る
              </Link>
              <Link
                href="/posts/new"
                className="border border-apple-600 text-apple-600 hover:bg-apple-50 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center transform hover:scale-105"
              >
                体験を投稿する
              </Link>
            </div>
          </div>

          {/* スクロールダウンインジケーター */}
          <button
            onClick={scrollToFeatures}
            className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-500 ${
              scrollY > 50 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            aria-label="下にスクロール"
          >
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-2">スクロールして詳細を見る</p>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full relative">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full absolute left-1/2 transform -translate-x-1/2 animate-scroll-down" />
              </div>
              <svg
                className="w-6 h-6 text-gray-400 mt-2 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </button>
        </section>

        {/* 特徴セクション */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              {SERVICE_NAME}の特徴
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-16 h-16 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-apple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">体験重視の投稿</h3>
                <p className="text-gray-600 leading-relaxed">
                  成分表や点数評価ではなく、実際の使用感や肌の変化に焦点を当てた体験談を共有
                </p>
              </div>
              <div className="text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-16 h-16 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-apple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">安心して投稿</h3>
                <p className="text-gray-600 leading-relaxed">
                  「合わなかった」体験も大切な情報として受け入れる、優しいコミュニティ環境
                </p>
              </div>
              <div className="text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-16 h-16 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-apple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">肌質別検索</h3>
                <p className="text-gray-600 leading-relaxed">
                  肌タイプや季節、体調に合わせて、自分に近い状況での体験談を効率的に発見
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-apple-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              あなたの体験が、誰かの参考になる
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              化粧品選びで迷っている人のために、あなたのリアルな体験談を共有してみませんか？
            </p>
            <Link
              href="/auth/register"
              className="bg-apple-600 text-white hover:bg-apple-700 px-8 py-4 rounded-full text-lg font-medium transition-colors inline-flex items-center justify-center transform hover:scale-105"
            >
              今すぐ始める
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scroll-down {
          0% {
            top: 4px;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 20px;
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }

        .animate-scroll-down {
          animation: scroll-down 2s infinite;
        }
      `}</style>
    </>
  )
}
