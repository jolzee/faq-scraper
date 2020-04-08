<template>
  <v-expansion-panel v-if="config">
    <v-expansion-panel-header
      :disable-icon-rotate="isDirty ? true : false"
      :color="isDirty ? 'brown lighten-4' : ''"
      :hide-actions="hideIcon"
    >
      <v-row no-gutters>
        <v-col sm="4" xs="6">{{ `👨‍✈️ ${configCopy.parentKey}` }}</v-col>
        <v-col sm="8" xs="6">{{ `🦸‍♂️ ${configCopy.childKey} `}}</v-col>
      </v-row>
      <template v-if="isDirty" v-slot:actions>
        <v-icon color="brown darken-4">mdi-content-save-edit-outline</v-icon>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-row no-gutters class="mt-3">
        <v-col cols="6">
          <v-text-field
            v-model="configCopy.parentKey"
            :disabled="readOnlyKeys"
            label="Parent Key"
            class="mr-2"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="configCopy.childKey"
            :disabled="readOnlyKeys"
            label="Child Key"
            class="mr-2"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field v-model="configCopy.cron" label="Cron Expression" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="8" align="start" justify="bottom">
          <p class="text-left">
            <kbd>{{ cronForHumans }}</kbd>
          </p>
        </v-col>
        <v-col cols="8">
          <v-text-field v-model="configCopy.url" label="URL" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="configCopy.rules.iterSelector"
            label="Iteration Selector"
            class="mr-2"
          ></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-card class="elevation-2 pa-4 mr-4">
            <v-text-field
              v-model="configCopy.rules.question.selector"
              label="Question Selector"
              class="mr-2"
            ></v-text-field>
            <v-switch color="success" v-model="configCopy.rules.question.isHtml" :label="`HTML`"></v-switch>
          </v-card>
        </v-col>
        <v-col cols="6" class="mb-4">
          <v-card class="elevation-2 pa-4">
            <v-text-field
              v-model="configCopy.rules.answer.selector"
              :disabled="configCopy.rules.answer.adjacentToQuestion"
              label="Answer Selector"
              class="mr-2"
            ></v-text-field>
            <v-switch
              color="success"
              v-model="configCopy.rules.answer.adjacentToQuestion"
              :label="`Adjacent to Question?`"
            ></v-switch>
            <v-switch color="success" v-model="configCopy.rules.answer.isHtml" :label="`HTML`"></v-switch>
          </v-card>
        </v-col>
        <v-col cols="12" class="text-right">
          <v-btn v-if="isNew" small @click="close" color="blue white--text mr-2 mb-3">
            <span class="mr-2">Cancel</span>
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-btn small v-if="isDirty" @click="reset" color="blue lighten-4 mr-2 mb-3">
            <span class="mr-2">Reset</span>
            <v-icon>mdi-undo-variant</v-icon>
          </v-btn>
          <v-btn
            v-if="!isNew"
            small
            @click="deleteConfig"
            color="red darken-4 mr-2 mb-3 white--text"
          >
            <span class="mr-2">Delete</span>
            <v-icon>mdi-delete-sweep</v-icon>
          </v-btn>
          <!-- <v-btn small @click="showGroovyExample" color="blue-grey darken-2 mr-2 mb-3 white--text">
            <span class="mr-2">Groovy Example</span>
            <v-icon>mdi-code-braces-box</v-icon>
          </v-btn>-->
          <v-btn small @click="getTestResults" color="blue-grey darken-2 mr-2 mb-3 white--text">
            <span class="mr-2">Test</span>
            <v-icon>mdi-test-tube</v-icon>
          </v-btn>
          <v-btn
            v-if="!isNew"
            small
            @click="copyConfig"
            color="green darken-4 mr-2 mb-3 white--text"
          >
            <span class="mr-2">Clone</span>
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
          <!-- <v-btn small @click="copyCsvUrlToClipboard" color="indigo darken-4 mr-2 mb-3 white--text">
            <span class="mr-2">CSV URL</span>
            <v-icon>mdi-table-of-contents</v-icon>
          </v-btn>
          <v-btn
            small
            @click="copyExcelUrlToClipboard"
            color="green darken-4 mr-2 mb-3 white--text"
          >
            <span class="mr-2">EXCEL URL</span>
            <v-icon>mdi-microsoft-excel</v-icon>
          </v-btn>-->
          <v-btn
            v-if="!isNew"
            small
            @click="copyUrlToClipboard"
            color="indigo darken-4 mr-2 mb-3 white--text"
          >
            <span class="mr-2">JSON URL</span>
            <v-icon>mdi-link-box-variant</v-icon>
          </v-btn>
          <v-btn
            :disabled="isNotValid"
            small
            @click="saveConfig"
            color="green darken-4 mr-2 mb-3 white--text"
          >
            <span class="mr-2">Save & Refresh</span>
            <v-icon>mdi-content-save-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import copy from "copy-to-clipboard";
const clonedeep = require("lodash/cloneDeep");
import cronstrue from "cronstrue";
var isEqual = require("lodash/isEqual");
// import { mapGetters } from "vuex";
export default {
  name: "Scraper",
  props: ["config", "hideIcon", "expand", "readOnlyKeys", "isNew"],
  components: {},
  data: function() {
    return {
      configCopy: clonedeep(this.config),
      isDirty: false
    };
  },
  computed: {
    isNotValid() {
      if (
        !this.configCopy.parentKey ||
        !this.configCopy.childKey ||
        !this.configCopy.url ||
        !this.configCopy.rules.iterSelector ||
        !this.configCopy.rules.question.selector ||
        !this.configCopy.rules.answer.selector
      ) {
        return true;
      } else {
        return false;
      }
    },
    cronForHumans() {
      try {
        return cronstrue.toString(this.configCopy.cron);
      } catch (e) {
        return "Not a Valid Cron Expression";
      }
    }
    // ...mapGetters(["someGetter"]),
    // myComputedMethod() {}
  },
  watch: {
    configCopy: {
      handler(newVal) {
        let isEqualObjs = isEqual(newVal, this.config);
        this.isDirty = !isEqualObjs;
      },
      deep: true
    }
  },
  methods: {
    changeCron(result) {
      this.copyConfig.cron = result;
    },
    showGroovyExample() {},
    copyConfig() {
      let copiedConfig = clonedeep(this.config);
      copiedConfig.parentKey = copiedConfig.parentKey + "-copy";
      copiedConfig.childKey = copiedConfig.childKey + "-copy";
      this.$store.commit("SHOW_NEW_CONFIG_DIALOG", copiedConfig);
    },
    copyCsvUrlToClipboard() {},
    copyExcelUrlToClipboard() {},
    close() {
      this.$emit("close");
    },
    reset() {
      this.configCopy = clonedeep(this.config);
    },
    saveConfig() {
      this.$toasted
        .info("Saving new config...", {
          position: "bottom-right",
          iconPack: "mdi",
          icon: "check"
        })
        .goAway(2000);
      this.$store.dispatch("saveConfig", this.configCopy);
      this.isDirty = false;
      this.$emit("close");
    },
    getTestResults() {
      this.$toasted
        .info("Getting Test Results...", {
          position: "bottom-right",
          iconPack: "mdi",
          icon: "check"
        })
        .goAway(2000);
      this.$store.dispatch("getTestConfigResults", this.configCopy);
    },
    copyUrlToClipboard() {
      const url = `${process.env.VUE_APP_SERVER_URL}/results/${this.configCopy.parentKey}/${this.configCopy.childKey}`;
      copy(url);
      window.open(url, "_blank");
      this.$toasted
        .success("URL Copied to Clipboard", {
          position: "bottom-right",
          iconPack: "mdi",
          icon: "check"
        })
        .goAway(3000);
    },
    deleteConfig() {
      this.$toasted
        .info(
          `Deleting Config / 👨‍✈️ ${this.configCopy.parentKey} / 🦸‍♂️ ${this.configCopy.childKey}`,
          {
            position: "bottom-right",
            iconPack: "mdi",
            icon: "delete-sweep"
          }
        )
        .goAway(2000);
      this.$store.dispatch("deleteConfig", this.configCopy);
    }
  },
  mounted() {}
};
</script>
<style>
button.v-btn--disabled {
  margin-bottom: 12px;
}
</style>