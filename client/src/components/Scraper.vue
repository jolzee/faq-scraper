<template>
  <v-expansion-panel v-if="config">
    <v-expansion-panel-header
      :disable-icon-rotate="isDirty ? true : false"
      :color="isDirty ? 'brown lighten-4' : !isValidConfig ? 'red lighten-4' : 'grey lighten-3'"
      :hide-actions="hideIcon && !isDirty"
    >
      <v-row no-gutters>
        <v-col sm="4" xs="6">
          <kbd
            v-if="hasModule"
            class="pa-1 elevation-2"
            style="background:green"
          >{{ `🐱‍👤 ${configCopy.parentKey}` }}</kbd>
          <kbd v-else class="pa-1 parent elevation-2">{{ `👨‍✈️ ${configCopy.parentKey}` }}</kbd>
        </v-col>
        <v-col sm="8" xs="6">
          <kbd class="pa-1 child elevation-2">{{ `🦸‍♂️ ${configCopy.childKey} `}}</kbd>
        </v-col>
      </v-row>
      <template v-if="isDirty" v-slot:actions>
        <v-icon color="brown darken-4">mdi-content-save-edit-outline</v-icon>
      </template>
    </v-expansion-panel-header>
    <v-divider></v-divider>
    <v-expansion-panel-content color="#FCFCFC">
      <v-row no-gutters class="mt-3">
        <template v-if="!readOnlyKeys">
          <v-col cols="6">
            <v-text-field
              v-model="configCopy.parentKey"
              solo
              dense
              :disabled="readOnlyKeys"
              label="Parent Key"
              class="mr-2"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="configCopy.childKey"
              solo
              dense
              :disabled="readOnlyKeys"
              label="Child Key"
              class="mr-2"
            ></v-text-field>
          </v-col>
        </template>
        <v-col cols="8">
          <v-text-field
            v-model="configCopy.url"
            dense
            prepend-icon="mdi-link-box-variant"
            label="URL"
            class="mr-2"
          ></v-text-field>
        </v-col>
        <v-col cols="4">
          <v-text-field
            v-model="configCopy.cron"
            dense
            prepend-icon="mdi-clock-outline"
            label="Cron Expression"
            class="mr-2"
          ></v-text-field>
          <p class="text-left">
            <kbd class="px-3 elevation-2 human-cron">{{ cronForHumans }}</kbd>
          </p>
        </v-col>

        <v-col cols="12" class="mb-5">
          <v-card>
            <v-toolbar flat color="secondary" dark dense>
              <v-toolbar-title>Rules</v-toolbar-title>
            </v-toolbar>
            <v-tabs v-model="ruleTabs" icons-and-text vertical>
              <v-tab>
                <v-icon left>mdi-bullseye-arrow</v-icon>Simple
              </v-tab>
              <v-tab>
                <v-icon left>mdi-ninja</v-icon>Ninja!
              </v-tab>
              <v-tab-item>
                <v-card v-if="hasModule" flat>
                  <v-card-text>
                    <kbd
                      class="pa-1 child elevation-2 black--text"
                      style="background: #0FC0FC"
                    >Delete your "ninja" module if you would like to specify some simple scrape rules.</kbd>
                  </v-card-text>
                </v-card>
                <v-card v-else flat>
                  <v-card-text class="pt-0 mt-0">
                    <v-col cols="12" class="pa-0 my-0">
                      <v-text-field
                        v-model="configCopy.rules.iterSelector"
                        prepend-icon="mdi-group"
                        label="Iteration Selector"
                        class="mr-2"
                      ></v-text-field>
                    </v-col>
                    <v-row no-gutters>
                      <v-col cols="6" class="py-0 my-0">
                        <v-hover v-slot:default="{ hover }" open-delay="200">
                          <v-card :elevation="hover ? 5 : 2" class="pa-4 mr-4">
                            <v-text-field
                              v-model="configCopy.rules.question.selector"
                              label="Question Selector"
                              prepend-icon="mdi-crosshairs-question"
                              class="mr-2 my-0 py-0"
                            ></v-text-field>
                            <v-row justify="start">
                              <v-switch
                                dense
                                class="ml-10 my-0 py-0"
                                color="primary"
                                v-model="configCopy.rules.question.isHtml"
                                :label="`HTML`"
                              ></v-switch>
                            </v-row>
                          </v-card>
                        </v-hover>
                      </v-col>
                      <v-col cols="6" class="py-0 my-0">
                        <v-hover v-slot:default="{ hover }" open-delay="200">
                          <v-card :elevation="hover ? 5 : 2" class="pa-4">
                            <v-text-field
                              v-model="configCopy.rules.answer.selector"
                              prepend-icon="mdi-target"
                              :disabled="configCopy.rules.answer.adjacentToQuestion"
                              label="Answer Selector"
                              class="mr-2 my-0 py-0"
                            ></v-text-field>
                            <v-row justify="space-around">
                              <v-switch
                                dense
                                color="primary"
                                class="my-0 py-0"
                                v-model="configCopy.rules.answer.adjacentToQuestion"
                                :label="`Next to Q?`"
                              ></v-switch>
                              <v-switch
                                dense
                                color="primary"
                                class="my-0 py-0"
                                v-model="configCopy.rules.answer.isHtml"
                                :label="`HTML`"
                              ></v-switch>
                            </v-row>
                          </v-card>
                        </v-hover>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-tab-item>
              <v-tab-item>
                <v-card flat>
                  <v-card-text v-if="hasModule">
                    <v-row class="mb-3">
                      <v-btn @click="editModule" class="mx-2" small tile outlined color="success">
                        <v-icon left>mdi-pencil</v-icon>Edit
                      </v-btn>
                      <v-btn @click="deleteModule" small tile outlined color="error">
                        <v-icon left>mdi-delete-sweep</v-icon>Delete Code
                      </v-btn>
                    </v-row>
                    <vue-static-highlight
                      v-if="configCopy.module"
                      theme="chrome"
                      class="code-highlight mb-5 elevation-2"
                      ref="highlightExistingModule"
                      fontSize="18"
                      :content="getModule()"
                      lang="javascript"
                      :height="`250px`"
                      style="overflow:auto"
                    ></vue-static-highlight>
                  </v-card-text>
                  <v-card-text v-else>
                    <template v-if="!isValidConfigForModuleCreation">
                      <kbd
                        class="pa-1 child elevation-2 black--text"
                        style="background: #0FC0FC"
                      >Please provide a valid configuration before trying to create a module.</kbd>
                    </template>
                    <v-row v-else justify="space-around">
                      <v-btn large color="success" dark @click="createModule">
                        <span class="mr-2">Create Module</span>
                        <v-icon>mdi-code-json</v-icon>
                      </v-btn>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-tab-item>
            </v-tabs>
          </v-card>
        </v-col>

        <Dialog title="Scrape Ninja 🐱‍👤" :show="goCowboy" width="80%" @close="closeModule">
          <v-row no-gutters>
            <v-col>
              <vue-ace-editor
                class="elevation-2 mb-5"
                height="500px"
                ref="editor"
                :content="getModule(this.content)"
                :options="{
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        tabSize:2,
        showPrintMargin:false
    }"
                :fontSize="14"
                :lang="'javascript'"
                :theme="'chrome'"
                @onChange="editorChange"
                @init="editorInit"
              ></vue-ace-editor>
            </v-col>
            <v-col cols="6" v-if="responseJson || responseLogging" class="ml-5">
              <vue-static-highlight
                v-if="responseJson"
                theme="chrome"
                class="mb-5 elevation-2"
                ref="editorJson"
                :fontSize="16"
                :content="responseJsonComp"
                lang="json"
                :height="responseLogging && responseJson ? `230px` : responseJsonComp ? `500px` : `0px`"
                style="overflow:auto"
              ></vue-static-highlight>

              <vue-static-highlight
                v-if="responseLogging"
                class="mb-5 elevation-2"
                ref="editorLogging"
                :height="responseLogging && responseJson ? `250px` : responseLogging ? `500px` : `0px`"
                :content="responseLoggingComp"
                :fontSize="16"
                lang="text"
                theme="chrome"
                style="overflow:auto"
              ></vue-static-highlight>
            </v-col>
          </v-row>
          <template slot="buttons">
            <v-btn small text color="secondary white--text" @click="closeModule">Close</v-btn>
            <v-btn small color="green white--text" @click="testModule">
              <span class="mr-2">Test</span>
              <v-icon>mdi-test-tube</v-icon>
            </v-btn>
            <v-btn
              :disabled="!isModuleValid"
              small
              color="secondary white--text"
              @click="saveModule"
            >
              <span class="mr-2">Save</span>
              <v-icon>mdi-content-save-outline</v-icon>
            </v-btn>
          </template>
        </Dialog>

        <v-col cols="12" class="text-right scraper-actions">
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

          <v-menu open-on-hover top offset-y>
            <template v-slot:activator="{ on }">
              <v-btn
                :disabled="!isValidConfig"
                small
                v-on="on"
                color="blue-grey darken-2 mr-2 mb-3 white--text"
              >
                <span class="mr-2">Test</span>
                <v-icon>mdi-test-tube</v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="(testItem, index) in testItems"
                :key="index"
                @click="testItem.clickAction"
              >
                <v-list-item-title>{{ testItem.title}}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

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
            :disabled="!isValidConfig"
            small
            @click="saveConfig()"
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
import Dialog from "./Dialog";
import { VueAceEditor, VueStaticHighlight } from "vue2x-ace-editor";
// eslint-disable-next-line no-unused-vars
import ace from "brace";
import "brace/ext/language_tools";
import "brace/mode/javascript";
import "brace/snippets/javascript";
import "brace/theme/monokai";
import "brace/theme/chrome";

function slugify(string) {
  const a =
    "àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;";
  const b =
    "aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}
// import { mapGetters } from "vuex";
export default {
  name: "Scraper",
  props: ["config", "hideIcon", "expand", "readOnlyKeys", "isNew"],
  data: function() {
    return {
      ruleTabs: {},
      content: `// https://cheerio.js.org/ and JavaScript
// Must be a module with a getAll function that
// returns and array of objects having "question" and "answer"
// properties

module.exports = {
  getAll: function ($) {

    const finalResults = [];
    const questions = [];
    const answers = [];

    console.log("Yes you can debug your work");

    // $("div.show-more table tr").each(function (index, elem) {
    //   $(elem)
    //     .find("td[width='561']")
    //     .each(function (qaIndex, elem) {
    //       if (index % 2 === 0) {
    //         questions.push($(elem).text().trim());
    //       } else {
    //         answers.push($(elem).find("span").html());
    //       }
    //     });
    // });

    // for (let index = 0; index < questions.length; index++) {
    //   const question = questions[index];
    //   const answer = answers[index];
    //   finalResults.push({
    //     question: question,
    //     answer: answer,
    //   });
    // }

    let aQuestionAndAnswer = {
      question: "What is your name?",
      answer: "Peter"
    };

    finalResults.push(aQuestionAndAnswer);

    return finalResults;
  }
};`,
      responseLogging: "",
      responseJson: "",
      lastValidModuleConfig: "",
      configCopy: clonedeep(this.config),
      isDirty: false,
      goCowboy: false,
      testItems: [
        { title: "JSON Results", clickAction: this.showResultsInJson },
        { title: "Table Results", clickAction: this.showResultsInTable }
      ]
    };
  },
  components: {
    Dialog,
    VueAceEditor,
    VueStaticHighlight
  },
  computed: {
    hasModule() {
      if (this.configCopy.module) {
        return true;
      }
      return false;
    },
    isModuleValid() {
      let isValid = false;
      try {
        if (this.responseJson) {
          let currResults = JSON.parse(this.responseJson);
          isValid = currResults.length > 0 ? true : false;
        }
      } catch (e) {
        console.error(e);
        return isValid;
      }
      return isValid;
    },
    responseJsonComp() {
      return this.responseJson;
    },
    responseLoggingComp() {
      return this.responseLogging;
    },
    isValidConfigForModuleCreation() {
      if (
        this.configCopy.parentKey &&
        this.configCopy.childKey &&
        this.configCopy.url
      ) {
        return true;
      } else {
        return false;
      }
    },
    isValidConfig() {
      if (
        this.configCopy.parentKey &&
        this.configCopy.childKey &&
        this.configCopy.url &&
        (this.configCopy.module ||
          (this.configCopy.rules.iterSelector &&
            this.configCopy.rules.question.selector &&
            (this.configCopy.rules.answer.adjacentToQuestion ||
              this.configCopy.rules.answer.selector)))
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
  },
  watch: {
    configCopy: {
      handler(newVal) {
        newVal.parentKey = slugify(newVal.parentKey);
        newVal.childKey = slugify(newVal.childKey);
        let isEqualObjs = isEqual(newVal, this.config);
        this.isDirty = !isEqualObjs;
      },
      deep: true
    }
  },
  methods: {
    getModule(fallback = "") {
      return this.configCopy.module ? atob(this.configCopy.module) : fallback;
    },
    createModule() {
      this.content = this.getModule(this.content);
      this.moduleCode = this.content;
      this.goCowboy = true;
    },
    deleteModule() {
      this.configCopy.module = "";
      this.saveConfig(this.configCopy);

      setTimeout(() => {
        this.ruleTabs = 0; // jump to first tab
        this.isDirty = false;
      }, 700);
    },
    editModule() {
      this.content = this.getModule();
      this.goCowboy = true;
    },
    saveModule() {
      let tempMod = this.lastValidModuleConfig.module;
      this.configCopy = clonedeep(this.lastValidModuleConfig);
      this.configCopy.module = "";
      let that = this;
      setTimeout(() => {
        that.configCopy.module = tempMod;
        that.goCowboy = false;
        that.isDirty = false;
      }, 700);
      this.saveConfig(this.lastValidModuleConfig);
    },
    closeModule() {
      this.goCowboy = false;
    },
    testModule() {
      let tempConfig = clonedeep(this.configCopy);
      if (this.moduleCode) {
        tempConfig.module = btoa(this.moduleCode);
      }

      this.responseJson = "";
      this.responseLogging = "";
      this.$store
        .dispatch("getTestModuleConfigResults", tempConfig)
        .then(results => {
          this.lastValidModuleConfig =
            results.results.length > 0 ? tempConfig : "";
          console.log(`Test Module Results`, results);
          this.responseJson =
            results.results.length > 0
              ? JSON.stringify(results.results, null, 2)
              : "";
          this.responseLogging = results.logResults.join("");
        })
        .catch(err => {
          console.error(err.message);
        });
    },
    editorChange(editor) {
      this.moduleCode = editor.getValue();
    },
    editorInit() {
      require("brace/ext/language_tools");
      require("brace/ext/beautify");
      require("brace/ext/searchbox");
      require("brace/mode/javascript"); //language
      require("brace/mode/json");
      require("brace/mode/cirru");
      require("brace/theme/monokai");
      require("brace/snippets/javascript"); //snippet
    },
    showTestResults(mode) {
      this.$toasted
        .info(`Getting Test Results...`, {
          position: "bottom-right",
          iconPack: "mdi",
          icon: mode === "table" ? "table-large" : "code-json"
        })
        .goAway(1500);
      this.$store.dispatch("getTestConfigResults", {
        config: this.configCopy,
        mode: mode
      });
    },
    showResultsInTable() {
      this.showTestResults("table");
    },
    showResultsInJson() {
      this.showTestResults("json");
    },
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
    saveConfig(targetConfig = null) {
      this.$toasted
        .info("Saving...", {
          position: "bottom-right",
          iconPack: "mdi",
          icon: "check"
        })
        .goAway(1500);
      this.$store.dispatch(
        "saveConfig",
        targetConfig ? targetConfig : this.configCopy
      );
      this.isDirty = false;
      this.$emit("close");
    },

    copyUrlToClipboard() {
      const url = `${process.env.VUE_APP_SERVER_URL}/results/${this.configCopy.parentKey}/${this.configCopy.childKey}`;
      copy(url);
      window.open(url, "_blank");
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
        .goAway(4000);
      this.$store.dispatch("deleteConfig", this.configCopy);
    }
  },
  mounted() {
    if (this.configCopy.module) {
      this.ruleTabs = 1;
    }
  }
};
</script>
<style>
.ace_static_highlight {
  font-size: 14px !important;
}
.static-highlight-editor {
  line-height: initial !important;
  font-size: initial !important;
  font-weight: initial !important;
}
/* .ace_line {
  line-height: initial !important;
  font-size: initial !important;
} */

.scraper-actions button.v-btn--disabled {
  margin-bottom: 12px;
  margin-right: 8px;
}

kbd.parent {
  background: #ef4b59 !important;
}

.ace_invalid {
  background-color: initial !important;
}

kbd.human-cron {
  background: #2e2866 !important;
}

body .ace_scrollbar {
  -webkit-transition: opacity 0.3s ease-in-out;
  -moz-transition: opacity 0.3s ease-in-out;
  -ms-transition: opacity 0.3s ease-in-out;
  -o-transition: opacity 0.3s ease-in-out;
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
}
body .ace_editor:hover .ace_scrollbar {
  opacity: 1;
}

button.v-btn--disabled {
  margin-bottom: 0px;
}
</style>