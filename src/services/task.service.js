import apiClient from 'config/axios'

class TaskService {
  /**
   * Get all tasks for the current authenticated user
   * @returns {Promise<Array>} List of tasks
   */
  async getAllTasks() {
    const response = await apiClient.get('/tasks')

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to fetch tasks')
      error.response = response
      throw error
    }

    return response.data.tasks || []
  }

  /**
   * Create a new task
   * @param {string} title - Title of the task
   * @returns {Promise<Object>} Created task data
   */
  async createTask(title) {
    const payload = {
      title: title,
    }
    const response = await apiClient.post('/tasks', payload)

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to create task')
      error.response = response
      throw error
    }

    return response.data.task || response.data
  }

  /**
   * Update an existing task
   * @param {string} taskId - ID of the task to update
   * @param {string} title - New title for the task (optional)
   * @param {boolean} completed - New completion status for the task (optional)
   * @returns {Promise<Object>} Updated task data
   */
  async updateTask(taskId, title, completed) {
    const payload = {}
    
    if (title !== undefined && title !== null) {
      payload.title = title
    }
    
    if (completed !== undefined && completed !== null) {
      payload.completed = completed
    }

    const response = await apiClient.put(`/tasks/${taskId}`, payload)

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to update task')
      error.response = response
      throw error
    }

    return response.data.task || response.data
  }

  /**
   * Delete an existing task
   * @param {string} taskId - ID of the task to delete
   * @returns {Promise<Object>} Success response
   */
  async deleteTask(taskId) {
    const response = await apiClient.delete(`/tasks/${taskId}`)

    if (!response.data?.success) {
      const error = new Error(response.data?.message || 'Failed to delete task')
      error.response = response
      throw error
    }

    return response.data
  }
}

export default new TaskService()

