import { event } from './config'

export const trackEvent = {
  auth: {
    login: () => event({ action: 'login', category: 'auth' }),
    register: () => event({ action: 'register', category: 'auth' }),
    logout: () => event({ action: 'logout', category: 'auth' }),
    passwordReset: () => event({ action: 'password_reset', category: 'auth' }),
    emailVerified: () => event({ action: 'email_verified', category: 'auth' }),
    accountDeleted: () => event({ action: 'account_deleted', category: 'auth' }),
  },
  post: {
    create: () => event({ action: 'create', category: 'post' }),
    update: () => event({ action: 'update', category: 'post' }),
    delete: () => event({ action: 'delete', category: 'post' }),
    view: (postId: string) => event({ action: 'view', category: 'post', label: postId }),
    empathy: (postId: string) => event({ action: 'empathy', category: 'post', label: postId }),
    removeEmpathy: (postId: string) =>
      event({ action: 'remove_empathy', category: 'post', label: postId }),
  },
  comment: {
    create: (postId: string) => event({ action: 'create', category: 'comment', label: postId }),
    delete: (postId: string) => event({ action: 'delete', category: 'comment', label: postId }),
  },
  search: {
    perform: (query: string) => event({ action: 'perform', category: 'search', label: query }),
    filter: (filterType: string) =>
      event({ action: 'filter', category: 'search', label: filterType }),
  },
  user: {
    updateProfile: () => event({ action: 'update_profile', category: 'user' }),
    viewProfile: (userId: string) =>
      event({ action: 'view_profile', category: 'user', label: userId }),
  },
  error: {
    apiError: (endpoint: string, statusCode: number) =>
      event({ action: 'api_error', category: 'error', label: endpoint, value: statusCode }),
    pageError: (page: string) => event({ action: 'page_error', category: 'error', label: page }),
  },
}
