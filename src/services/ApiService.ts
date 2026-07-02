import { BaseService } from "./BaseService"

export class ApiService extends BaseService {
  private static instance: ApiService

  private constructor() {
    super()
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // Generic request wrapper to backend or third-party APIs
  public async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      this.handleError(error)
    }
  }

  public async post<T>(url: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      this.handleError(error)
    }
  }
}

export const apiService = ApiService.getInstance()
