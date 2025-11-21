<template>
  <q-page class="flex row flex-center">
    <q-card class="col-11 col-sm-8 col-md-6 col-lg-4 col-xl-3 q-pa-xs q-pa-md-sm q-mb-xl">
      <q-card-section>
        <div class="text-h6 text-center">Edit Profile</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="full-width">
          <!-- First name -->
          <q-input v-model="firstName" type="text" label="First name" outlined class="q-mb-lg" />

          <!-- Last name -->
          <q-input v-model="lastName" type="text" label="Last name" outlined class="q-mb-lg" />

          <!-- Update Button -->
          <q-btn label="Update Profile" color="primary" type="submit" class="full-width" :loading="updateLoading" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'

const authStore = useAuthStore()

const firstName = ref(authStore.user?.first_name || '')
const lastName = ref(authStore.user?.last_name || '')
const updateLoading = ref(false)
const loadingProfile = ref(false)

async function loadUserProfile() {
  loadingProfile.value = true
  try {
    const userData = await authStore.fetchUserProfile()
    if (userData && userData.first_name !== undefined) {
      firstName.value = userData.first_name || ''
      lastName.value = userData.last_name || ''
    } else if (authStore.user) {
      firstName.value = authStore.user.first_name || ''
      lastName.value = authStore.user.last_name || ''
    }
  } catch (error) {
    console.error('Error loading user profile:', error)
    if (authStore.user) {
      firstName.value = authStore.user.first_name || ''
      lastName.value = authStore.user.last_name || ''
    }
  } finally {
    loadingProfile.value = false
  }
}

async function onSubmit() {
  updateLoading.value = true

  await authStore.updateUserProfile(firstName.value, lastName.value)

  updateLoading.value = false
}

onMounted(() => {
  loadUserProfile()
})
</script>
