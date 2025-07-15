const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// ステージング用のSVGロゴのテンプレート（STGバッジ付き）
const createStagingLogoSVG = (size, isSquare = false) => {
  const padding = size * 0.1
  const viewBox = `0 0 ${size} ${size}`

  // 背景の形状（丸い角丸または円）- オレンジ系の色に変更
  const background = isSquare
    ? `<rect width="${size}" height="${size}" rx="${size * 0.25}" ry="${size * 0.25}" fill="#FF8C42"/>`
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#FF8C42"/>`

  // 小さいサイズでも読みやすいように調整
  const isSmall = size < 128
  const fontSize = isSmall ? size * 0.18 : size * 0.13
  const fontWeight = isSmall ? '700' : '600'
  const textY = size * 0.48
  const leafY = size * 0.7
  const subTextY = size * 0.86

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
  ${background}
  
  <!-- STGバッジ（右上） -->
  <g transform="translate(${size * 0.75}, ${size * 0.25})">
    <rect x="-${size * 0.15}" y="-${size * 0.08}" width="${size * 0.3}" height="${size * 0.16}" 
          rx="${size * 0.02}" fill="#2D3748" opacity="0.9"/>
    <text x="0" y="${size * 0.02}" 
          font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
          font-size="${size * 0.08}" 
          font-weight="700" 
          text-anchor="middle" 
          fill="white">STG</text>
  </g>
  
  <!-- メインテキスト「ひふのこえ」 -->
  <text x="${size / 2}" y="${textY}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="${fontSize}" 
        font-weight="${fontWeight}" 
        text-anchor="middle" 
        fill="white">ひふのこえ</text>
  
  <!-- 葉っぱのアイコン（より太く、シンプルに） -->
  <g transform="translate(${size / 2}, ${leafY})">
    <path d="M -${size * 0.15} 0 
             Q -${size * 0.15} -${size * 0.12} 0 -${size * 0.12}
             Q ${size * 0.15} -${size * 0.12} ${size * 0.15} 0
             Q ${size * 0.08} 0 0 ${size * 0.08}
             Q -${size * 0.08} 0 -${size * 0.15} 0"
          fill="none" 
          stroke="white" 
          stroke-width="${size * (isSmall ? 0.025 : 0.018)}"
          opacity="0.95"/>
    
    <!-- 葉脈（太く） -->
    <line x1="0" y1="-${size * 0.1}" 
          x2="0" y2="${size * 0.06}" 
          stroke="white" 
          stroke-width="${size * (isSmall ? 0.018 : 0.012)}"
          opacity="0.8"/>
  </g>
  
  <!-- サブテキスト（小さい場合は非表示） -->
  ${
    !isSmall
      ? `<text x="${size / 2}" y="${subTextY}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="${size * 0.045}" 
        font-weight="400" 
        text-anchor="middle" 
        fill="white"
        opacity="0.9">【ステージング環境】</text>`
      : ''
  }
</svg>`
}

// ファビコン用の簡略版SVG（より太く、はっきり）
const createStagingFaviconSVG = size => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.3}" ry="${size * 0.3}" fill="#FF8C42"/>
  
  <!-- ひ の文字（太く、大きく） -->
  <text x="${size / 2}" y="${size * 0.68}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="${size * 0.55}" 
        font-weight="900" 
        text-anchor="middle" 
        fill="white">ひ</text>
  
  <!-- STG マーク（小さく右下に） -->
  <text x="${size * 0.85}" y="${size * 0.9}" 
        font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
        font-size="${size * 0.2}" 
        font-weight="700" 
        text-anchor="end" 
        fill="#2D3748">S</text>
</svg>`
}

async function generateStagingLogos() {
  const publicDir = path.join(__dirname, '..', 'public')
  const appDir = path.join(__dirname, '..', 'src', 'app')

  try {
    // メインロゴ（正方形版）
    const mainLogoSVG = createStagingLogoSVG(1024, true)
    await sharp(Buffer.from(mainLogoSVG))
      .png()
      .toFile(path.join(publicDir, 'logo-image-staging.png'))
    console.log('✓ Generated logo-image-staging.png')

    // Apple Touch Icon（180x180）
    await sharp(Buffer.from(createStagingLogoSVG(180)))
      .png()
      .toFile(path.join(publicDir, 'apple-icon-staging.png'))
    console.log('✓ Generated apple-icon-staging.png')

    // PWA Icons
    await sharp(Buffer.from(createStagingLogoSVG(192)))
      .png()
      .toFile(path.join(publicDir, 'icon-192-staging.png'))
    console.log('✓ Generated icon-192-staging.png')

    await sharp(Buffer.from(createStagingLogoSVG(512)))
      .png()
      .toFile(path.join(publicDir, 'icon-512-staging.png'))
    console.log('✓ Generated icon-512-staging.png')

    // Favicon生成（複数サイズ）
    const faviconSizes = [16, 32, 48]
    const faviconBuffers = await Promise.all(
      faviconSizes.map(size =>
        sharp(Buffer.from(createStagingFaviconSVG(size)))
          .png()
          .toBuffer()
      )
    )

    // 32x32のPNGファビコン
    const favicon32 = await sharp(Buffer.from(createStagingFaviconSVG(32)))
      .png()
      .toFile(path.join(publicDir, 'favicon-32-staging.png'))
    console.log('✓ Generated favicon-32-staging.png')

    // ICOファイルを生成（複数サイズ）
    const ico = require('ico-endec')
    const faviconIco = ico.encode([
      await sharp(Buffer.from(createStagingFaviconSVG(16)))
        .png()
        .toBuffer(),
      await sharp(Buffer.from(createStagingFaviconSVG(32)))
        .png()
        .toBuffer(),
      await sharp(Buffer.from(createStagingFaviconSVG(48)))
        .png()
        .toBuffer(),
    ])

    require('fs').writeFileSync(path.join(publicDir, 'favicon-staging.ico'), faviconIco)
    console.log('✓ Generated favicon-staging.ico')

    // OGP画像（1200x630）
    const ogSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FF8C42"/>
  
  <!-- STGバッジ -->
  <rect x="50" y="50" width="200" height="80" rx="10" fill="#2D3748" opacity="0.9"/>
  <text x="150" y="100" 
        font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
        font-size="40" 
        font-weight="700" 
        text-anchor="middle" 
        fill="white">STAGING</text>
  
  <!-- メインテキスト -->
  <text x="600" y="250" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="80" 
        font-weight="700" 
        text-anchor="middle" 
        fill="white">ひふのこえ</text>
  
  <!-- 葉っぱのデザイン -->
  <g transform="translate(600, 350)">
    <path d="M -100 0 Q -100 -80 0 -80 Q 100 -80 100 0 Q 50 0 0 50 Q -50 0 -100 0"
          fill="none" 
          stroke="white" 
          stroke-width="8"/>
    <line x1="0" y1="-70" x2="0" y2="40" stroke="white" stroke-width="5"/>
  </g>
  
  <!-- サブテキスト -->
  <text x="600" y="450" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="32" 
        font-weight="400" 
        text-anchor="middle" 
        fill="white">【ステージング環境】肌の声に耳をすませる、わたしの肌ログ</text>
</svg>`

    await sharp(Buffer.from(ogSVG)).png().toFile(path.join(publicDir, 'og-image-staging.png'))
    console.log('✓ Generated og-image-staging.png')

    console.log('\n✅ All staging logos generated successfully!')
  } catch (error) {
    console.error('Error generating staging logos:', error)
    process.exit(1)
  }
}

// 実行
generateStagingLogos()
