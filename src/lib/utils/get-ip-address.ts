import { headers } from 'next/headers'

export async function getClientIpAddress(): Promise<string | null> {
  const headersList = await headers()

  // Check various headers for IP address
  // The order matters - more specific/reliable headers first
  const ipHeaders = [
    'x-real-ip',
    'x-forwarded-for',
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip', // Cloudflare Enterprise
    'x-cluster-client-ip',
  ]

  for (const header of ipHeaders) {
    const value = headersList.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim()
      if (isValidIpAddress(ip)) {
        return ip
      }
    }
  }

  // Fallback - in development, this might be null
  return null
}

function isValidIpAddress(ip: string): boolean {
  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  // Basic IPv6 validation
  const ipv6Regex = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/
  return ipv6Regex.test(ip)
}
