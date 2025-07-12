const fs = require('fs')
const path = require('path')

// SVGテンプレート
const svgTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景の円 -->
  <circle cx="50" cy="50" r="50" fill="#A8D5A8" />
  
  <!-- 葉っぱのパス -->
  <path
    d="M30 65 C30 35, 50 25, 70 25 C70 25, 75 30, 75 35 C75 35, 65 35, 55 45 C45 55, 35 65, 30 65 Z"
    stroke="white"
    strokeWidth="3"
    fill="none"
    strokeLinecap="round"
  />
  
  <!-- 花の中心 -->
  <g transform="translate(55, 40)">
    <path
      d="M0 -8 L5 -2.5 L8 0 L5 2.5 L0 8 L-5 2.5 L-8 0 L-5 -2.5 Z"
      fill="#F4B4A0"
    />
    <circle cx="0" cy="-8" r="3" fill="#F4B4A0" />
    <circle cx="8" cy="0" r="3" fill="#F4B4A0" />
    <circle cx="0" cy="8" r="3" fill="#F4B4A0" />
    <circle cx="-8" cy="0" r="3" fill="#F4B4A0" />
    <circle cx="5.7" cy="-5.7" r="3" fill="#F4B4A0" />
    <circle cx="5.7" cy="5.7" r="3" fill="#F4B4A0" />
    <circle cx="-5.7" cy="5.7" r="3" fill="#F4B4A0" />
    <circle cx="-5.7" cy="-5.7" r="3" fill="#F4B4A0" />
  </g>
</svg>`

// OG画像用のSVGテンプレート
const ogSvgTemplate = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="1200" height="630" fill="#F5F5F5"/>
  
  <!-- ロゴ部分 -->
  <g transform="translate(600, 200)">
    <circle cx="0" cy="0" r="100" fill="#A8D5A8" />
    
    <!-- 葉っぱのパス -->
    <path
      d="M-50 30 C-50 -50, -10 -70, 50 -70 C50 -70, 60 -60, 60 -50 C60 -50, 40 -50, 20 -10 C0 30, -30 30, -50 30 Z"
      stroke="white"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    
    <!-- 花の中心 -->
    <g transform="translate(20, -20)">
      <path
        d="M0 -16 L10 -5 L16 0 L10 5 L0 16 L-10 5 L-16 0 L-10 -5 Z"
        fill="#F4B4A0"
      />
      <circle cx="0" cy="-16" r="6" fill="#F4B4A0" />
      <circle cx="16" cy="0" r="6" fill="#F4B4A0" />
      <circle cx="0" cy="16" r="6" fill="#F4B4A0" />
      <circle cx="-16" cy="0" r="6" fill="#F4B4A0" />
      <circle cx="11.4" cy="-11.4" r="6" fill="#F4B4A0" />
      <circle cx="11.4" cy="11.4" r="6" fill="#F4B4A0" />
      <circle cx="-11.4" cy="11.4" r="6" fill="#F4B4A0" />
      <circle cx="-11.4" cy="-11.4" r="6" fill="#F4B4A0" />
    </g>
  </g>
  
  <!-- テキスト -->
  <text x="600" y="400" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="#333">ひふのこえ</text>
  <text x="600" y="450" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#666">肌の声に耳をすませる、わたしの肌ログ</text>
</svg>`

// publicディレクトリのパスを取得
const publicDir = path.join(__dirname, '..', 'public')

// アイコンのサイズと名前の定義
const icons = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-icon.png' },
]

// SVGファイルを作成
icons.forEach(({ size, name }) => {
  const svgContent = svgTemplate(size)
  const svgPath = path.join(publicDir, name.replace('.png', '.svg'))
  fs.writeFileSync(svgPath, svgContent)
  console.log(`Created ${svgPath}`)
})

// OG画像用SVGを作成
const ogSvgPath = path.join(publicDir, 'og-image.svg')
fs.writeFileSync(ogSvgPath, ogSvgTemplate)
console.log(`Created ${ogSvgPath}`)

console.log('\n注意: SVGファイルが生成されました。')
console.log('PNGに変換するには、以下のようなツールを使用してください:')
console.log('- オンラインコンバーター')
console.log('- ImageMagick: convert icon-192.svg icon-192.png')
console.log('- rsvg-convert: rsvg-convert -w 192 -h 192 icon-192.svg -o icon-192.png')