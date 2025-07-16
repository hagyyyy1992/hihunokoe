const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

// SVGロゴのテンプレート（小さい画面でも見やすい）
const createLogoSVG = (size, isSquare = false) => {
  const padding = size * 0.1
  const viewBox = `0 0 ${size} ${size}`

  // 背景の形状（丸い角丸または円）
  const background = isSquare
    ? `<rect width="${size}" height="${size}" rx="${size * 0.25}" ry="${size * 0.25}" fill="#A8D5A8"/>`
    : `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#A8D5A8"/>`

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
        opacity="0.9">肌の声に耳をすませる</text>`
      : ''
  }
</svg>`
}

// ファビコン用の簡略版SVG（より太く、はっきり）
const createFaviconSVG = size => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.3}" ry="${size * 0.3}" fill="#A8D5A8"/>
  
  <!-- ひ の文字（太く、大きく） -->
  <text x="${size / 2}" y="${size * 0.68}" 
        font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Yu Gothic', sans-serif" 
        font-size="${size * 0.55}" 
        font-weight="900" 
        text-anchor="middle" 
        fill="white">ひ</text>
</svg>`
}

async function generateLogos() {
  const publicDir = path.join(__dirname, '..', 'public')
  const appDir = path.join(__dirname, '..', 'src', 'app')

  try {
    // メインロゴ（正方形版）
    const mainLogoSVG = createLogoSVG(1024, true)
    await sharp(Buffer.from(mainLogoSVG)).png().toFile(path.join(publicDir, 'logo-image.png'))
    console.log('✓ Generated logo-image.png')

    // Apple Touch Icon（180x180）
    await sharp(Buffer.from(createLogoSVG(180)))
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'))
    console.log('✓ Generated apple-icon.png')

    // PWA Icons
    await sharp(Buffer.from(createLogoSVG(192)))
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'))
    console.log('✓ Generated icon-192.png')

    await sharp(Buffer.from(createLogoSVG(512)))
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'))
    console.log('✓ Generated icon-512.png')

    // Favicon生成（複数サイズ）
    const faviconSizes = [16, 32, 48]
    const faviconBuffers = await Promise.all(
      faviconSizes.map(size =>
        sharp(Buffer.from(createFaviconSVG(size)))
          .png()
          .toBuffer()
      )
    )

    // 32x32のPNGファビコン
    const favicon32 = await sharp(Buffer.from(createFaviconSVG(32)))
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'))
    console.log('✓ Generated favicon-32.png')

    // ICOファイルを生成（複数サイズ）
    const ico = require('ico-endec')
    const faviconIco = ico.encode([
      await sharp(Buffer.from(createFaviconSVG(16)))
        .png()
        .toBuffer(),
      await sharp(Buffer.from(createFaviconSVG(32)))
        .png()
        .toBuffer(),
      await sharp(Buffer.from(createFaviconSVG(48)))
        .png()
        .toBuffer(),
    ])

    require('fs').writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco)
    console.log('✓ Generated favicon.ico')

    // OGP画像（1200x630）
    const ogSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#A8D5A8"/>
  
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
        fill="white">肌の声に耳をすませる、わたしの肌ログ</text>
</svg>`

    await sharp(Buffer.from(ogSVG)).png().toFile(path.join(publicDir, 'og-image.png'))
    console.log('✓ Generated og-image.png')

    console.log('\n✅ All logos generated successfully!')
  } catch (error) {
    console.error('Error generating logos:', error)
    process.exit(1)
  }
}

// 実行
generateLogos()
