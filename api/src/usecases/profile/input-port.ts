import { GetProfileOutputPort, UpdateProfileOutputPort } from '@api/usecases/profile/output-port'

export abstract class IProfileUseCase {
  abstract getProfile(inputPort: GetProfileInputPort): Promise<GetProfileOutputPort>
  abstract updateProfile(inputPort: UpdateProfileInputPort): Promise<UpdateProfileOutputPort>
}

export type GetProfileInputPort = {
  userId: string
}

export type UpdateProfileInputPort = {
  userId: string
  userName?: string
  skinType?: string | null
  birthDate?: string | null
  gender?: string | null
  allergies?: string[] | null
  allergiesOther?: string | null
  profileImageUrl?: string | null
}
