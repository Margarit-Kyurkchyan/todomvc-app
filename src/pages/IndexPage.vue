<template>
  <q-page class="flex flex-center column">
    <!-- Welcome message -->
    <div class="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-5 q-mb-md text-center">
      <div class="text-h6 text-grey-8">
        Welcome {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
      </div>
    </div>

    <q-card class="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-5 q-pa-xs q-pa-md-sm">
      <q-card-section>
        <div class="text-h4 text-center text-weight-bold" style="color: #b83f45">todos</div>
      </q-card-section>

      <q-card-section>
        <!-- Add new task input -->
        <q-input
          v-model="newTaskTitle"
          placeholder="What needs to be done?"
          outlined
          class="q-mb-md"
          @keyup.enter="addTask"
          :loading="addingTask"
        >
          <template v-slot:prepend>
            <q-icon name="keyboard_arrow_down" />
          </template>
        </q-input>

        <!-- Tasks list -->
        <div v-if="loadingTasks" class="text-center q-pa-lg">
          <q-spinner color="primary" size="3em" />
        </div>

        <div v-else-if="filteredTasks.length === 0" class="text-center text-grey-6 q-pa-lg">
          <div v-if="tasks.length === 0">No tasks yet. Add one above!</div>
          <div v-else>No tasks match the current filter.</div>
        </div>

        <q-list v-else bordered separator>
          <q-item
            v-for="task in filteredTasks"
            :key="task.entity_id"
            clickable
            v-ripple
            class="task-item"
          >
            <q-item-section avatar>
              <q-checkbox
                :model-value="task.completed"
                @update:model-value="toggleTaskCompletion(task)"
                :loading="updatingTasks.has(task.entity_id)"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label
                v-if="editingTaskId !== task.entity_id"
                :class="{ 'text-strike text-grey-6': task.completed }"
                @dblclick="startEditingTask(task)"
                class="cursor-pointer"
              >
                {{ task.title }}
              </q-item-label>

              <q-input
                v-else
                v-model="editingTaskTitle"
                @blur="saveTaskEdit(task)"
                @keyup.enter="saveTaskEdit(task)"
                @keyup.esc="cancelTaskEdit"
                autofocus
                outlined
                dense
                class="task-edit-input"
              />
            </q-item-section>

            <q-item-section side>
              <q-btn
                flat
                dense
                round
                icon="close"
                color="negative"
                size="sm"
                class="delete-btn"
                @click.stop="deleteTask(task)"
                :loading="deletingTasks.has(task.entity_id)"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Footer with count and filters -->
        <div v-if="tasks.length > 0" class="row items-center q-mt-md q-pa-sm">
          <div class="col text-caption text-grey-7">
            {{ activeTasksCount }} {{ activeTasksCount === 1 ? 'item' : 'items' }} left!
          </div>

          <div class="col-auto">
            <q-btn-toggle
              v-model="filter"
              :options="filterOptions"
              toggle-color="primary"
              color="white"
              text-color="primary"
              unelevated
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth'
import taskService from 'services/task.service'

const authStore = useAuthStore()

const tasks = ref([])
const loadingTasks = ref(false)
const newTaskTitle = ref('')
const addingTask = ref(false)
const editingTaskId = ref(null)
const editingTaskTitle = ref('')
const updatingTasks = ref(new Set())
const deletingTasks = ref(new Set())
const filter = ref('all')

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
]

const activeTasksCount = computed(() => {
  return tasks.value.filter((task) => !task.completed).length
})

const filteredTasks = computed(() => {
  if (filter.value === 'active') {
    return tasks.value.filter((task) => !task.completed)
  }
  if (filter.value === 'completed') {
    return tasks.value.filter((task) => task.completed)
  }
  return tasks.value
})

async function loadTasks() {
  loadingTasks.value = true
  try {
    const tasksData = await taskService.getAllTasks()
    const activeTasks = tasksData.filter((task) => task.active !== false)
    tasks.value = activeTasks
  } catch (error) {
    Notify.create({
      message: error.message || 'Failed to load tasks',
      color: 'negative',
    })
  } finally {
    loadingTasks.value = false
  }
}

async function addTask() {
  const title = newTaskTitle.value.trim()
  if (!title) {
    return
  }

  addingTask.value = true
  try {
    const newTask = await taskService.createTask(title)
    tasks.value.push(newTask)
    newTaskTitle.value = ''
    Notify.create({
      message: 'Task added successfully',
      color: 'positive',
      timeout: 2000,
    })
  } catch (error) {
    Notify.create({
      message: error.message || 'Failed to add task',
      color: 'negative',
    })
  } finally {
    addingTask.value = false
  }
}

function startEditingTask(task) {
  editingTaskId.value = task.entity_id
  editingTaskTitle.value = task.title
}

function cancelTaskEdit() {
  editingTaskId.value = null
  editingTaskTitle.value = ''
}

async function saveTaskEdit(task) {
  const newTitle = editingTaskTitle.value.trim()
  if (!newTitle) {
    cancelTaskEdit()
    return
  }

  if (newTitle === task.title) {
    cancelTaskEdit()
    return
  }

  updatingTasks.value.add(task.entity_id)
  try {
    const updatedTask = await taskService.updateTask(task.entity_id, newTitle, undefined)
    const taskIndex = tasks.value.findIndex((t) => t.entity_id === task.entity_id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = updatedTask
    }
    cancelTaskEdit()
    Notify.create({
      message: 'Task updated successfully',
      color: 'positive',
      timeout: 2000,
    })
  } catch (error) {
    Notify.create({
      message: error.message || 'Failed to update task',
      color: 'negative',
    })
  } finally {
    updatingTasks.value.delete(task.entity_id)
  }
}

async function toggleTaskCompletion(task) {
  const newCompletedStatus = !task.completed
  updatingTasks.value.add(task.entity_id)
  try {
    const updatedTask = await taskService.updateTask(task.entity_id, undefined, newCompletedStatus)
    const taskIndex = tasks.value.findIndex((t) => t.entity_id === task.entity_id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = updatedTask
    }
  } catch (error) {
    Notify.create({
      message: error.message || 'Failed to update task',
      color: 'negative',
    })
  } finally {
    updatingTasks.value.delete(task.entity_id)
  }
}

async function deleteTask(task) {
  deletingTasks.value.add(task.entity_id)
  try {
    await taskService.deleteTask(task.entity_id)
    const taskIndex = tasks.value.findIndex((t) => t.entity_id === task.entity_id)
    if (taskIndex !== -1) {
      tasks.value.splice(taskIndex, 1)
    }
    Notify.create({
      message: 'Task deleted successfully',
      color: 'positive',
      timeout: 2000,
    })
  } catch (error) {
    Notify.create({
      message: error.message || 'Failed to delete task',
      color: 'negative',
    })
  } finally {
    deletingTasks.value.delete(task.entity_id)
  }
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-item {
  min-height: 60px;
}

.task-item .delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .delete-btn {
  opacity: 1;
}

.task-edit-input {
  width: 100%;
}
</style>
