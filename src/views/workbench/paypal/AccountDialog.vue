<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElDialog } from 'element-plus'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { workbench, type Row } from '@/api/workbench'
import { localizePageMessage } from '@/lang/page-message'
import { money, useWorkbench } from '../shared/useWorkbench'
import { accountName } from './account'

const props = defineProps<{ action: string; account?: Row }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const { can, loading, error, run } = useWorkbench('paypal')
const action = ref(props.action)
const today = dayjs().format('YYYY-MM-DD')
const form = ref<Row>({
  accountName: '', email: '', addedDate: today, balance: 0, reviews: 0,
  amount: props.account?.balance || 0, date: today, source: '', version: props.account?.version,
})
const titleKeys: Record<string, string> = {
  create: 'addPaypalAccountTitle', choose: 'balanceActionTitle',
  withdrawal: 'withdrawlAmountTitle', balance: 'correctionAmountTitle',
}
const title = computed(() => t(`paypal.${titleKeys[action.value]}`))

function selectAction(value: string) {
  action.value = value
  form.value.amount = value === 'balance' ? props.account?.balance || 0 : ''
}
async function save() {
  if (loading.value) return
  if (action.value === 'withdrawal' && Number(form.value.amount) > Number(props.account?.balance)) {
    error.value = t('paypal.withdrawlAmountTooHigh')
    return
  }
  await run(() => action.value === 'create'
    ? workbench.post('/paypal', form.value)
    : workbench.post(`/paypal/${props.account!.id}/${action.value}`, form.value), () => emit('saved'))
}
</script>

<template>
  <ElDialog :model-value="true" :title="title" width="560px" align-center class="legacy-workbench paypal-account-dialog" :close-on-click-modal="false" :close-on-press-escape="!loading" :show-close="!loading" @close="emit('close')">
    <p v-if="account" class="muted">{{ accountName(account.accountName) }} · {{ account.email }}</p>
    <p v-if="error" class="error" role="alert">{{ localizePageMessage(error) }}</p>
    <div v-if="action === 'choose'" class="balance-choices">
      <button v-if="can('withdrawal')" class="primary" @click="selectAction('withdrawal')">{{ t('paypal.balanceActionWithdrawl') }}</button>
      <button v-if="can('balance')" @click="selectAction('balance')">{{ t('paypal.balanceActionCorrection') }}</button>
    </div>
    <form v-else @submit.prevent="save">
      <div v-if="action === 'create'" class="form-grid">
        <label>{{ t('paypal.paypalAccountDateCreated') }}<input v-model="form.addedDate" type="date" required /></label>
        <label>{{ t('paypal.paypalAccountEmail') }}<input v-model.trim="form.email" type="email" maxlength="255" required /></label>
        <label class="wide">{{ t('paypal.paypalAccountName') }}<input v-model.trim="form.accountName" maxlength="255" required /></label>
        <label>{{ t('paypal.paypalAccountReviews') }}<input v-model.number="form.reviews" type="number" min="0" max="1000000" step="1" required /></label>
        <label>{{ t('paypal.paypalAccountCurrentBalance') }}<input v-model.number="form.balance" type="number" min="0" max="10000000" step="0.01" required /></label>
      </div>
      <div v-else class="form-grid">
        <p class="wide muted">{{ t('paypal.balance') }}: {{ money(account?.balance) }} USD</p>
        <label class="wide">{{ t(action === 'withdrawal' ? 'paypal.withdrawlAmountPlaceholder' : 'paypal.correctionAmountPlaceholder') }}
          <input v-model="form.amount" type="number" :min="action === 'withdrawal' ? 0.01 : 0" :max="action === 'withdrawal' ? account?.balance : 10000000" step="0.01" required autofocus />
        </label>
        <template v-if="action === 'withdrawal'">
          <label class="wide">{{ t('pages.withdrawalDate') }}<input v-model="form.date" type="date" :max="today" required /></label>
          <label class="wide">{{ t('pages.notesWithdrawalChannel') }}<textarea v-model="form.source" maxlength="2000" rows="2" /></label>
        </template>
      </div>
      <div class="dialog-footer"><button type="button" :disabled="loading" @click="emit('close')">{{ t('pages.cancel') }}</button><button class="primary" :disabled="loading">{{ t('paypal.withdrawlAmountConfirm') }}</button></div>
    </form>
  </ElDialog>
</template>

<style>
.paypal-account-dialog.legacy-workbench { min-height: 0; max-width: calc(100vw - 32px); padding: 24px; background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 14px; }
.paypal-account-dialog .el-dialog__title { color: var(--text); font-weight: 700; }
.paypal-account-dialog .el-dialog__body { color: var(--text); }
.paypal-account-dialog.legacy-workbench .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.paypal-account-dialog.legacy-workbench .form-grid input { width: 100%; }
.paypal-account-dialog .balance-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
.paypal-account-dialog .balance-choices button { padding: 22px; }
.paypal-account-dialog .dialog-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
@media (max-width: 540px) { .paypal-account-dialog.legacy-workbench .form-grid { grid-template-columns: 1fr; } }
</style>
