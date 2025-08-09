export class Post {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string | null,
    public readonly content: string,
    public readonly productName: string | null,
    public readonly brandName: string | null,
    public readonly imageUrl: string | null,
    public readonly category: string | null,
    public readonly isPublished: boolean,
    public readonly publishedAt: Date | null, // Added for compatibility
    public readonly status: string, // Added for database compatibility
    public readonly cosmeticName: string, // Alias for productName
    public readonly cosmeticCategory: string | null, // Alias for category
    public readonly skinType: string | null,
    public readonly moodTag: string | null,
    public readonly viewCount: number,
    public readonly empathyCount: number,
    public readonly commentCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt?: Date | null,
    public readonly usageSituation?: any | null,
    public readonly experienceDetails?: any | null,
    public readonly user?: {
      id: string
      userName: string
    } | null,
    // Additional properties for test compatibility
    public readonly fragranceType?: string | null,
    public readonly fragranceIntensity?: string | null,
    public readonly textureType?: string | null,
    public readonly finishType?: string | null,
    public readonly applicationEase?: string | null,
    public readonly longevity?: string | null,
    public readonly valueForMoney?: string | null,
    public readonly overallRating?: number | null,
    public readonly repurchaseIntention?: boolean | null
  ) {}

  get isValid(): boolean {
    return this.content.trim().length > 0
  }

  get excerpt(): string {
    return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content
  }
}
