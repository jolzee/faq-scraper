<template>
  <Dialog
    title="Convert QnA export to Teneo Bulk Import CSV"
    :show="goCowboy"
    width="80%"
    @close="close"
  >
    <v-row no-gutters>
      <v-col>
        <vue-ace-editor
          class="elevation-2 mb-5"
          height="500px"
          ref="editor"
          content=""
          :options="{
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            tabSize: 2,
            showPrintMargin: false,
          }"
          :fontSize="14"
          :lang="'javascript'"
          :theme="'chrome'"
          @onChange="editorChange"
          @init="editorInit"
        ></vue-ace-editor>
      </v-col>
    </v-row>
    <template slot="buttons">
      <v-btn small text color="secondary white--text" @click="close"
        >Close</v-btn
      >
      <v-btn small color="secondary white--text" @click="generateCsv">
        <span class="mr-2">Convert</span>
        <v-icon>mdi-content-save-outline</v-icon>
      </v-btn>
    </template>
  </Dialog>
</template>

<script>
import Dialog from "./Dialog";
import { VueAceEditor } from "vue2x-ace-editor";
// eslint-disable-next-line no-unused-vars
import ace from "brace";
import "brace/ext/language_tools";
import "brace/mode/javascript";
import "brace/snippets/javascript";
import "brace/theme/monokai";
import "brace/theme/chrome";

// import { mapGetters } from "vuex";
export default {
  name: "QnA",
  props: [],
  data: function () {
    return {
      fromQnA: "",
      isDirty: false,
      goCowboy: true,
    };
  },
  components: {
    Dialog,
    VueAceEditor,
  },
  computed: {},
  watch: {},
  methods: {
    editorChange(editor) {
      this.fromQnA = editor.getValue();
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
    generateCsv() {
      this.$toasted
        .info(`Converting...`, {
          position: "bottom-right",
          iconPack: "mdi",
          icon: "code-json",
        })
        .goAway(1500);
      this.$store.dispatch("getQnAConversion", this.fromQnA).then(() => {
        this.close()
      }).catch(err => console.log(err));
    },
    close() {
      this.$emit("close");
    },
    downloadCsv() {
      const url = `${process.env.VUE_APP_SERVER_URL}/results/csv/${this.configCopy.parentKey}/${this.configCopy.childKey}`;
      let link = document.createElement("a");
      link.download = `teneo-bulk-import-from-QnA.csv`;
      link.href = url;
      link.click();
    },
  },
  mounted() {},
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