<!--
   The MIT License
   Copyright (c) 2019- Nordic Institute for Interoperability Solutions (NIIS)
   Copyright (c) 2018 Estonian Information System Authority (RIA),
   Nordic Institute for Interoperability Solutions (NIIS), Population Register Centre (VRK)
   Copyright (c) 2015-2017 Estonian Information System Authority (RIA), Population Register Centre (VRK)

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 -->
<template>
  <div class="step-content-wrapper">
    <ValidationObserver ref="form1" v-slot="{ invalid }">
      <div class="wizard-step-form-content">
        {{ $t('initialConfiguration.pin.info1') }}
        <div class="mt-6 mb-4">
          <ValidationProvider
            name="pin"
            rules="required|password:@confirmPin"
            v-slot="{ errors }"
          >
            <v-text-field
              class="form-input"
              name="pin"
              autofocus
              :label="$t('initialConfiguration.pin.pin')"
              type="password"
              v-model="pin"
              :error-messages="errors"
              data-test="pin-input"
            ></v-text-field>
          </ValidationProvider>
        </div>

        <div class="mb-6">
          <ValidationProvider
            name="confirmPin"
            rules="required"
            v-slot="{ errors }"
          >
            <v-text-field
              class="form-input"
              name="confirmPin"
              :label="$t('initialConfiguration.pin.confirmPin')"
              type="password"
              v-model="pinConfirm"
              :error-messages="errors"
              data-test="confirm-pin-input"
            ></v-text-field>
          </ValidationProvider>
        </div>
        {{ $t('initialConfiguration.pin.info2') }}
        <br />
        <br />
        {{ $t('initialConfiguration.pin.info3') }}
      </div>
      <div class="button-footer">
        <v-spacer></v-spacer>
        <div>
          <xrd-button
            @click="previous"
            outlined
            class="previous-button"
            data-test="previous-button"
            >{{ $t('action.previous') }}</xrd-button
          >
          <xrd-button
            :disabled="invalid"
            :loading="saveBusy"
            @click="done"
            data-test="save-button"
            >{{ $t('action.submit') }}</xrd-button
          >
        </div>
      </div>
    </ValidationObserver>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { ValidationProvider, ValidationObserver } from 'vee-validate';
import { extend } from 'vee-validate';
import i18n from '@/i18n';

const PASSWORD_MATCH_ERROR: string = i18n.t(
  'initialConfiguration.pin.pinMatchError',
) as string;

extend('password', {
  params: ['target'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate(value, { target }: Record<string, any>) {
    return value === target;
  },
  message: PASSWORD_MATCH_ERROR,
});

export default Vue.extend({
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  props: {
    saveBusy: {
      type: Boolean,
    },
  },
  data() {
    return {
      pin: '' as string,
      pinConfirm: '' as string,
    };
  },

  methods: {
    done(): void {
      this.$emit('done', this.pin);
    },
    previous(): void {
      this.$emit('previous');
    },
  },
});
</script>

<style lang="scss" scoped>
@import '../../assets/wizards';

.readonly-info-field {
  max-width: 300px;
  height: 60px;
  padding-top: 12px;
}
</style>
