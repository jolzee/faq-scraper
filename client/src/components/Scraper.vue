<template>
  <v-expansion-panel>
    <v-expansion-panel-header
      :hide-actions="hideIcon"
    >{{ `/ 👨‍✈️ ${config.parentKey} / 🦸‍♂️ ${config.childKey} `}}</v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-row no-gutters>
        <v-col cols="4">
          <v-text-field v-model="config.parentKey" label="Parent Key" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field v-model="config.childKey" label="Child Key" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field v-model="config.cron" label="Cron Expression" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="8">
          <v-text-field v-model="config.url" label="URL" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field v-model="config.rules.iterSelector" label="Iteration Selector" class="mr-2"></v-text-field>
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="config.rules.question.selector"
            label="Question Selector"
            class="mr-2"
          ></v-text-field>
          <v-switch v-model="config.rules.question.isHtml" :label="`HTML`"></v-switch>
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="config.rules.answer.selector" label="Answer Selector" class="mr-2"></v-text-field>
          <v-switch v-model="config.rules.answer.isHtml" :label="`HTML`"></v-switch>
        </v-col>
        <v-col cols="12" class="text-right">
          <v-spacer></v-spacer>
          <v-btn color="red darken-4 mr-2 white--text">
            <span class="mr-2">Delete</span>
            <v-icon>mdi-delete-sweep</v-icon>
          </v-btn>
          <v-btn color="blue-grey darken-2 mr-2 white--text">
            <span class="mr-2">Test</span>
            <v-icon>mdi-test-tube</v-icon>
          </v-btn>
          <v-btn color="indigo darken-4 mr-2 white--text">
            <span class="mr-2">Copy URL</span>
            <v-icon>mdi-link-box-variant</v-icon>
          </v-btn>
          <v-btn color="green darken-4 mr-2 white--text">
            <span class="mr-2">Save</span>
            <v-icon>mdi-content-save-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
// import { mapGetters } from "vuex";
export default {
  name: "Scraper",
  props: ["config", "hideIcon", "expand"],
  data: () => ({
    configs: []
  }),
  computed: {
    // ...mapGetters(["someGetter"]),
    // myComputedMethod() {}
  },
  methods: {
    getAllConfigs() {},
    addNewConfig() {}
  },
  mounted() {
    this.getAllConfigs();
  }
};
</script>
<style>
</style>