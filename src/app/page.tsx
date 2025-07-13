'use client'

import Link from 'next/link'
import { SERVICE_NAME } from '@/lib/constants'
import { useEffect, useState } from 'react'

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [currentSlide, setCurrentSlide] = useState(0)

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

  // Intersection Observer for section animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(prev).add(entry.target.id))
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    )

    // Observe all sections
    const sections = document.querySelectorAll('section[id]')
    sections.forEach(section => observer.observe(section))

    return () => {
      sections.forEach(section => observer.unobserve(section))
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const samplePosts = [
    {
      id: 1,
      user: 'あかりさん',
      userInitial: 'A',
      skinType: '乾燥肌',
      age: '20代',
      product: '無印良品 化粧水・敏感肌用・高保湿タイプ',
      review:
        '冬の乾燥がひどくて悩んでいた時に使い始めました。とろみのあるテクスチャーで、肌にしっかり浸透している感じ。朝起きた時の乾燥感が全然違います！',
      period: '3ヶ月',
      likes: 12,
    },
    {
      id: 2,
      user: 'まいさん',
      userInitial: 'M',
      skinType: '混合肌',
      age: '30代',
      product: 'キュレル 泡洗顔料',
      review:
        '敏感肌でも使える洗顔料を探していて試してみました。泡立ちがとても良くて、洗い上がりがしっとり。Tゾーンはすっきり、頬は乾燥しすぎずちょうど良いバランスです。',
      period: '2ヶ月',
      likes: 8,
    },
    {
      id: 3,
      user: 'さやかさん',
      userInitial: 'S',
      skinType: '脂性肌',
      age: '20代',
      product: 'ニベア クリーム（青缶）',
      review:
        '脂性肌なので重いクリームは避けていましたが、口コミが良くて試してみました。薄く伸ばすと意外とベタつかず、朝の化粧ノリが良くなりました。',
      period: '6ヶ月',
      likes: 15,
    },
    {
      id: 4,
      user: 'りえさん',
      userInitial: 'R',
      skinType: '敏感肌',
      age: '40代',
      product: 'ちふれ 美白美容液 W',
      review:
        'プチプラの美白美容液を探していて購入。さらっとしたテクスチャーで敏感肌でもピリピリしません。3ヶ月使って少しずつ肌のトーンが明るくなってきた気がします。',
      period: '4ヶ月',
      likes: 6,
    },
    {
      id: 5,
      user: 'かなさん',
      userInitial: 'K',
      skinType: '普通肌',
      age: '30代',
      product: 'オルビス クレンジングリキッド',
      review:
        '濡れた手でも使えるのが便利でリピート中。マスカラもしっかり落ちるのに、目元がつっぱりません。オイルフリーなので、まつエクをしていても安心して使えます。',
      period: '1年',
      likes: 18,
    },
  ]

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % samplePosts.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + samplePosts.length) % samplePosts.length)
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
                prefetch={true}
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
            onClick={() => scrollToSection('features')}
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
        <section
          id="features"
          className={`py-20 px-4 sm:px-6 lg:px-8 bg-white transition-all duration-1000 ${
            visibleSections.has('features')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              {SERVICE_NAME}の特徴
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div
                className={`text-center transform transition-all duration-500 hover:scale-105 ${
                  visibleSections.has('features') ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: '200ms' }}
              >
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
              <div
                className={`text-center transform transition-all duration-500 hover:scale-105 ${
                  visibleSections.has('features') ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: '400ms' }}
              >
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
              <div
                className={`text-center transform transition-all duration-500 hover:scale-105 ${
                  visibleSections.has('features') ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: '600ms' }}
              >
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
          {/* スクロールインジケーター */}
          <button
            onClick={() => scrollToSection('how-to-use')}
            className={`w-full flex justify-center py-4 transition-opacity duration-500 ${
              visibleSections.has('features') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="次のセクションへ"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce"
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
          </button>
        </section>

        {/* 使い方セクション */}
        <section
          id="how-to-use"
          className={`py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 transition-all duration-1000 ${
            visibleSections.has('how-to-use')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
              かんたん3ステップで始める
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-apple-600">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">会員登録</h3>
                <p className="text-gray-600 leading-relaxed">
                  メールアドレスで簡単に登録。肌質の情報を設定して、あなたに合った体験談を見つけやすく
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-apple-600">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">体験談を探す</h3>
                <p className="text-gray-600 leading-relaxed">
                  肌質、季節、年代などで絞り込んで、自分に近い人の体験談を効率的に見つけられます
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-apple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-apple-600">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">体験を共有</h3>
                <p className="text-gray-600 leading-relaxed">
                  使ってみた化粧品の感想を投稿。あなたの体験が誰かの参考になります
                </p>
              </div>
            </div>
          </div>
          {/* スクロールインジケーター */}
          <button
            onClick={() => scrollToSection('testimonials')}
            className={`w-full flex justify-center py-4 transition-opacity duration-500 ${
              visibleSections.has('how-to-use') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="次のセクションへ"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce"
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
          </button>
        </section>

        {/* ユーザーの声セクション */}
        <section
          id="testimonials"
          className={`py-20 px-4 sm:px-6 lg:px-8 bg-white transition-all duration-1000 ${
            visibleSections.has('testimonials')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">ユーザーの声</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-apple-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-apple-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-apple-700">M</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">みさきさん</p>
                    <p className="text-sm text-gray-500">乾燥肌・30代</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  「成分だけじゃなく、実際の使用感がわかるのが本当に助かります。同じ乾燥肌の方の体験談を参考に、やっと自分に合う化粧水を見つけられました！」
                </p>
              </div>
              <div className="bg-apple-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-apple-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-apple-700">Y</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">ゆりこさん</p>
                    <p className="text-sm text-gray-500">敏感肌・20代</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  「敏感肌で化粧品選びにいつも苦労していました。合わなかった体験談も参考になるので、失敗が減りました」
                </p>
              </div>
              <div className="bg-apple-50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-apple-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-apple-700">R</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">りなさん</p>
                    <p className="text-sm text-gray-500">混合肌・40代</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  「季節や体調による変化まで書いてくれる人が多くて、とても参考になります。コミュニティの温かさを感じます」
                </p>
              </div>
            </div>
          </div>
          {/* スクロールインジケーター */}
          <button
            onClick={() => scrollToSection('post-samples')}
            className={`w-full flex justify-center py-4 transition-opacity duration-500 ${
              visibleSections.has('testimonials') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="次のセクションへ"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce"
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
          </button>
        </section>

        {/* 投稿サンプルセクション */}
        <section
          id="post-samples"
          className={`py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 transition-all duration-1000 ${
            visibleSections.has('post-samples')
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              こんな体験談が投稿されています
            </h2>
            <p className="text-center text-gray-600 mb-12">
              このような体験談が日々投稿されています
            </p>

            {/* スライダーコンテナ */}
            <div className="relative">
              {/* 前へボタン */}
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="前のスライドへ"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* 次へボタン */}
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label="次のスライドへ"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* スライドコンテンツ */}
              <div className="mx-12 overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {samplePosts.map(post => (
                    <div key={post.id} className="w-full flex-shrink-0 px-4">
                      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-lg mx-auto">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 bg-apple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-apple-700">
                              {post.userInitial}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{post.user}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>{post.skinType}</span>
                              <span className="mx-1">•</span>
                              <span>{post.age}</span>
                            </div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm">{post.product}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          「{post.review}」
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>使用期間: {post.period}</span>
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 text-apple-500 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                            </svg>
                            <span>{post.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* インジケーター */}
              <div className="flex justify-center mt-6 space-x-2">
                {samplePosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSlide === index ? 'bg-apple-600' : 'bg-gray-300'
                    }`}
                    aria-label={`スライド${index + 1}へ`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/posts"
                className="inline-flex items-center text-apple-600 hover:text-apple-700 font-medium"
              >
                もっと体験談を見る
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
          {/* スクロールインジケーター */}
          <button
            onClick={() => scrollToSection('faq')}
            className={`w-full flex justify-center py-4 transition-opacity duration-500 ${
              visibleSections.has('post-samples') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="次のセクションへ"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce"
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
          </button>
        </section>

        {/* FAQセクション */}
        <section
          id="faq"
          className={`py-20 px-4 sm:px-6 lg:px-8 bg-white transition-all duration-1000 ${
            visibleSections.has('faq') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">よくある質問</h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">無料で利用できますか？</h3>
                <p className="text-gray-600 leading-relaxed">
                  はい、{SERVICE_NAME}
                  は完全無料でご利用いただけます。会員登録から投稿、閲覧まですべて無料です。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  どんな化粧品の体験談が投稿できますか？
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  スキンケア、メイクアップ、ボディケアなど、あらゆる化粧品・美容製品の体験談を投稿できます。良かった体験も、合わなかった体験も、どちらも大切な情報として歓迎しています。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">個人情報は安全ですか？</h3>
                <p className="text-gray-600 leading-relaxed">
                  はい、お客様の個人情報は厳重に管理しています。メールアドレスは他のユーザーには公開されず、肌質などのプロフィール情報も任意で設定できます。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  企業の宣伝や広告はありますか？
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {SERVICE_NAME}
                  は純粋にユーザーの体験談を共有する場です。企業による宣伝投稿は禁止しており、発見次第削除しています。
                </p>
              </div>
            </div>
          </div>
          {/* スクロールインジケーター */}
          <button
            onClick={() => scrollToSection('cta')}
            className={`w-full flex justify-center py-4 transition-opacity duration-500 ${
              visibleSections.has('faq') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="次のセクションへ"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce"
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
          </button>
        </section>

        {/* CTA セクション */}
        <section
          id="cta"
          className={`py-20 px-4 sm:px-6 lg:px-8 bg-apple-50 transition-all duration-1000 ${
            visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
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
          {/* トップへ戻るボタン */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`w-full flex flex-col items-center justify-center py-8 transition-opacity duration-500 ${
              visibleSections.has('cta') ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="トップへ戻る"
          >
            <svg
              className="w-6 h-6 text-gray-400 animate-bounce rotate-180"
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
            <p className="text-sm text-gray-500 mt-2">トップへ戻る</p>
          </button>
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

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
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

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
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
