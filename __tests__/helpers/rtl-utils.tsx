import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Custom render function with default providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {
    // wrapper: ({ children }) => <Provider>{children}</Provider>, // 必要に応じてプロバイダーを追加
    ...options,
  })
}

// Create user event instance
export const createUser = () => userEvent.setup()

// Utility functions for common testing patterns
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Helper to find elements by test id
export const findByTestId = (container: HTMLElement, testId: string) => {
  return container.querySelector(`[data-testid="${testId}"]`)
}

// Helper to check if element has specific class
export const hasClass = (element: HTMLElement, className: string) => {
  return element.classList.contains(className)
}

// Helper to get form data
export const getFormData = (form: HTMLFormElement) => {
  const formData = new FormData(form)
  const data: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    data[key] = value.toString()
  }
  return data
}

// Helper for async form submission testing
export const submitForm = async (
  user: ReturnType<typeof userEvent.setup>,
  form: HTMLFormElement
) => {
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
  if (submitButton) {
    await user.click(submitButton)
  }
}

// Helper for input field testing
export const fillInput = async (
  user: ReturnType<typeof userEvent.setup>,
  input: HTMLInputElement,
  value: string
) => {
  await user.clear(input)
  await user.type(input, value)
}

// Helper for select field testing
export const selectOption = async (
  user: ReturnType<typeof userEvent.setup>,
  select: HTMLSelectElement,
  value: string
) => {
  await user.selectOptions(select, value)
}

// Custom matchers for common assertions
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

export const expectElementToHaveAttribute = (
  element: HTMLElement,
  attribute: string,
  value?: string
) => {
  expect(element).toBeInTheDocument()
  if (value !== undefined) {
    expect(element).toHaveAttribute(attribute, value)
  } else {
    expect(element).toHaveAttribute(attribute)
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'

// Override render method
export { customRender as render }
