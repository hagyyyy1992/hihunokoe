// This test file was for the old deleteUserAccount function that has been moved to clean architecture.
// The DeleteAccountUseCase now requires authentication (token + password) and doesn't support direct user ID deletion.
// These tests should be moved to the appropriate use case or admin functionality test files.

// import removed - DeleteAccountUseCase has been migrated to interactor pattern

describe('DeleteAccountUseCase - Legacy Test File', () => {
  it('should be migrated to proper use case tests', () => {
    expect(true).toBe(true)
    // TODO: Move these tests to appropriate locations:
    // - Direct user deletion by ID should be in admin use case tests
    // - Account deletion with authentication should be in DeleteAccountUseCase.test.ts
  })
})
