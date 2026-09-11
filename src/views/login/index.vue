<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 左侧装饰 -->
      <div class="login-left">
        <div class="login-intro">
          <h1>SAVEB ERP</h1>
          <p>{{ t('login.brandSlogan') }}</p>
          <ul class="feature-list">
            <li>
              <el-icon><Check /></el-icon>
              {{ t('login.features.order') }}
            </li>
            <li>
              <el-icon><Check /></el-icon>
              {{ t('login.features.procurement') }}
            </li>
            <li>
              <el-icon><Check /></el-icon>
              {{ t('login.features.invoice') }}
            </li>
            <li>
              <el-icon><Check /></el-icon>
              {{ t('login.features.influencer') }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form">
        <div class="form-header">
          <h2>{{ t('login.welcome') }}</h2>
          <p>{{ t('login.subtitle') }}</p>
        </div>

        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="form-content"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :placeholder="t('login.username')"
              size="large"
              prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              :placeholder="t('login.password')"
              size="large"
              prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item>
            <el-checkbox v-model="loginForm.remember">
              {{ t('login.remember') }}
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              {{ loading ? t('login.submitting') : t('login.submit') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
})

// 表单验证规则（动态 i18n）— 为支持 locale 切换后及时更新
const loginRules = computed(() => ({
  username: [
    { required: true, message: t('login.validation.usernameRequired'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('login.validation.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('login.validation.passwordMinLength'), trigger: 'blur' },
  ],
}))

async function handleLogin() {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true

    const result = await userStore.login(loginForm.username, loginForm.password)

    if (result.success) {
      ElMessage.success(t('login.success'))

      const redirect = (route.query.redirect as string) || userStore.homePath
      router.push(redirect)
    } else {
      ElMessage.error(result.message || t('login.failed'))
    }

    loading.value = false
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background: var(--workbench-page-background);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 900px;
  height: 540px;
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  box-shadow: 0 20px 60px hsl(0 0% 0% / 0.5);
  display: flex;
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, hsl(212 100% 45%) 0%, hsl(255 82% 67%) 100%);
  padding: 60px 40px;
  color: #fff;
  display: flex;
  align-items: center;

  .login-intro {
    h1 {
      font-size: 36px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    > p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        font-size: 16px;

        .el-icon {
          font-size: 20px;
        }
      }
    }
  }
}

:global(html:not(.light) .login-left) {
  background: var(--workbench-card-background);
  color: var(--workbench-text);
  border-right: 1px solid var(--workbench-line);
}

.login-form {
  width: 400px;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: hsl(var(--card));

  .form-header {
    margin-bottom: 40px;
    text-align: center;

    h2 {
      font-size: 28px;
      color: hsl(var(--foreground));
      margin-bottom: 8px;
    }

    p {
      color: hsl(var(--muted-foreground));
      font-size: 14px;
    }
  }

  .form-content {
    .login-button {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }
  }
}

@media (max-width: 768px) {
  .login-box {
    width: 100%;
    height: 100%;
    flex-direction: column;
    border-radius: 0;
  }

  .login-left {
    padding: 40px 20px;

    .login-intro h1 {
      font-size: 28px;
    }
  }

  .login-form {
    width: 100%;
    padding: 40px 20px;
  }
}
</style>
