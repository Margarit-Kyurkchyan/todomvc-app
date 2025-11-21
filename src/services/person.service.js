import apiClient from 'config/axios'

class PersonService {
  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile data
   */
  async getCurrentUser() {
    const response = await apiClient.get('/person/me')

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to fetch user profile')
      error.response = response
      throw error
    }

    return response.data.person || response.data
  }

  /**
   * Update current user profile
   * @param {string} firstName - User's first name
   * @param {string} lastName - User's last name
   * @returns {Promise<Object>} Updated user profile data
   */
  async updateCurrentUser(firstName, lastName) {
    const payload = {
      first_name: firstName,
      last_name: lastName,
    }
    const response = await apiClient.put('/person/me', payload)

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to update profile')
      error.response = response
      throw error
    }

    return response.data.person || response.data
  }
}

export default new PersonService()
