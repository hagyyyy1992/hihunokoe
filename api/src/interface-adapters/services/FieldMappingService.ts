import { IFieldMappingService } from '@api/domain/services/FieldMappingService'

export class FieldMappingServiceImpl implements IFieldMappingService {
  mapLegacyPostFields(body: any): any {
    // レガシーAPIとの互換性のため、旧フィールド名を新フィールド名にマッピング
    return {
      ...body,
      productName: body.productName || body.cosmeticName,
      category: body.category || body.cosmeticCategory,
    }
  }
}
